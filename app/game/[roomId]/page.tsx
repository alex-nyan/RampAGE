"use client";

// Duel room — shared shell (join, presence, stakes, invite) in the Rampage
// neubrutalist chrome. Mounts the game from the registry (hard rule 5:
// do NOT fork this page per game). Payout via lib/ramp.ts.

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { joinRoom, sendEvent, getRoomState, supabase } from "@/lib/supabase";
import { awardBonusCredit } from "@/lib/ramp";
import { getGame } from "@/lib/games/registry";
import { potCents } from "@/lib/wager";
import { Ticker } from "@/components/ui";
import { TICKER_TWO } from "@/lib/landing";
import type { GameEvent, Player } from "@/lib/types";

const money = (c: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
const neoCard =
  "rounded-2xl border-[3px] border-acid bg-slate p-4 text-white shadow-[6px_6px_0_#e4f222]";
const neoBtn =
  "rounded-2xl border-[3px] border-acid font-display uppercase tracking-wide transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_#e4f222] shadow-[6px_6px_0_#e4f222] disabled:opacity-50";

export default function DuelRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const [name, setName] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameId, setGameId] = useState<string>("receipt-blitz");
  const [stakes, setStakes] = useState<Record<string, number>>({});
  const [stakeLabels, setStakeLabels] = useState<Record<string, string>>({});
  const [stakeLabel, setStakeLabel] = useState("");
  const [myStake, setMyStake] = useState("");
  const [phase, setPhase] = useState<"pending" | "active" | "finished">("pending");
  const [initialState, setInitialState] = useState<unknown>(null);
  const [lastMove, setLastMove] = useState<{ by: string; data: unknown; seq: number } | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [awardMsg, setAwardMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [roomUrl, setRoomUrl] = useState("");
  const channelRef = useRef<RealtimeChannel | null>(null);
  const stakesRef = useRef(stakes);
  const moveSeqRef = useRef(0);
  stakesRef.current = stakes;

  useEffect(() => {
    setName(sessionStorage.getItem("rampage_name"));
    setRoomUrl(window.location.href);
    getRoomState(roomId).then((room) => room?.game && setGameId(room.game));
  }, [roomId]);

  useEffect(() => {
    if (!name || !roomId) return;
    const channel = joinRoom(roomId, name, {
      onEvent: (raw: unknown) => {
        const e = raw as GameEvent;
        if (e.type === "stake") {
          setStakes((s) => ({ ...s, [e.by]: e.amountCents }));
          setStakeLabels((labels) => ({ ...labels, [e.by]: e.label ?? "" }));
        }
        if (e.type === "start") {
          setGameId(e.gameId);
          setStakes(e.stakes);
          setStakeLabels(e.stakeLabels ?? {});
          setInitialState(e.state);
          setPhase("active");
        }
        if (e.type === "move") {
          moveSeqRef.current += 1;
          setLastMove({ by: e.by, data: e.data, seq: moveSeqRef.current });
        }
        if (e.type === "finish") {
          setWinner(e.winner);
          setPhase("finished");
        }
      },
      onPlayers: setPlayers,
    });
    channelRef.current = channel;
    return () => {
      channel.unsubscribe();
    };
  }, [name, roomId]);

  useEffect(() => {
    if (!name || phase !== "pending" || !channelRef.current) return;
    const amount = Number(myStake);
    if (!Number.isFinite(amount) || amount <= 0) return;
    const cents = Math.round(amount * 100);
    setStakes((s) => ({ ...s, [name]: cents }));
    setStakeLabels((labels) => ({ ...labels, [name]: stakeLabel.trim() }));
    sendEvent(channelRef.current, {
      type: "stake",
      by: name,
      label: stakeLabel.trim(),
      amountCents: cents,
    });
  }, [myStake, name, phase, stakeLabel]);

  function start() {
    const distinctPlayers = new Set(players.map((player) => player.name));
    if (
      distinctPlayers.size < 2 ||
      !stakeLabel.trim() ||
      !Number.isFinite(Number(myStake)) ||
      Number(myStake) <= 0
    )
      return;
    const mod = getGame(gameId);
    const state = mod.initialState(roomId);
    const s = stakesRef.current;
    setInitialState(state);
    setPhase("active");
    if (channelRef.current)
      sendEvent(channelRef.current, { type: "start", gameId, state, stakes: s, stakeLabels });
    supabase.from("rooms").update({ stakes: s, status: "active" }).eq("id", roomId).then();
  }

  function handleFinish(w: string, sc: Record<string, number>, payouts?: Record<string, number>) {
    if (phase === "finished") return;
    setWinner(w);
    setPhase("finished");
    if (channelRef.current) sendEvent(channelRef.current, { type: "finish", winner: w, scores: sc });
    // Each client credits only ITS OWN payout — no double-pays.
    const pot = potCents(stakesRef.current);
    const myCut = payouts ? Math.round(payouts[name!] ?? 0) : w === name ? pot : 0;
    if (myCut > 0 && name)
      awardBonusCredit({ roomId, userName: name, amountCents: myCut, memo: `${getGame(gameId).name} payout` }).then(
        (r) => r.ok && setAwardMsg(`${money(myCut)} payout credited`)
      );
    // Post the result back to the Slack channel the challenge came from
    // (no-op for web-created rooms). Only the winner's client fires it.
    if (w === name || (payouts && Object.keys(payouts)[0] === name))
      fetch(`/api/rooms/${roomId}/finish`, {
        method: "POST",
        body: JSON.stringify({ winner: w, potCents: pot, gameName: getGame(gameId).name }),
      }).catch(() => {});
  }

  function copyLink() {
    navigator.clipboard?.writeText(roomUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function enter() {
    if (!draft.trim()) return;
    sessionStorage.setItem("rampage_name", draft.trim());
    setName(draft.trim());
  }

  const mod = getGame(gameId);
  const pot = potCents(stakes);

  return (
    <main className="flex min-h-dvh min-w-0 flex-col overflow-hidden bg-night font-body text-acid">
      <nav className="relative z-20 flex items-center gap-2.5 border-b-4 border-acid bg-night px-5 py-2 sm:px-12">
        <Link href="/" className="flex items-center gap-2.5 text-acid">
          <Image
            src="/logo.png"
            alt="Rampage logo"
            width={40}
            height={40}
            priority
            className="h-10 w-10 rounded-[10px] border-[3px] border-acid object-cover"
          />
          <span className="font-display text-[18px] tracking-wide sm:text-[20px]">RAMPAGE</span>
        </Link>
        <span className="ml-auto rounded-full bg-acid px-3 py-1.5 font-display text-[9px] text-night sm:px-4 sm:text-[10px]">
          ⚔ DUEL ROOM
        </span>
      </nav>

      <section className="relative flex flex-1 justify-center overflow-y-auto px-5 py-7 sm:px-12 sm:py-9">
        <Image
          src="/background.png"
          alt=""
          fill
          priority
          aria-hidden="true"
          sizes="100vw"
          className="object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(10,10,10,.5) 0%, rgba(10,10,10,.7) 33.333%, rgba(10,10,10,1) 100%)",
          }}
        />

        <div className="relative flex w-full max-w-[720px] flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-acid/35 pb-3">
            <div>
              <div className="mb-1 font-mono text-[10px] uppercase tracking-[.16em] text-acid/55">
                Room · {roomId}
              </div>
              <h1 className="font-display text-[26px] uppercase text-acid sm:text-[32px]">
                {mod.name}
              </h1>
            </div>
            {name && pot > 0 && (
              <span className="rounded-full border-2 border-hot bg-hot/15 px-3 py-1.5 font-mono text-[12px] font-bold text-hot">
                POT {money(pot)}
              </span>
            )}
          </div>

          <>
              {name && <div className="flex flex-wrap gap-1.5">
                {players.map((p) => (
                  <span
                    key={p.name}
                    className="rounded-full border-2 border-acid bg-night/85 px-2.5 py-1 font-mono text-[11px] font-bold text-acid"
                  >
                    {p.name}
                    {stakeLabels[p.name] ? ` · ${stakeLabels[p.name]}` : ""}
                    {stakes[p.name] ? ` · ${money(stakes[p.name])}` : ""}
                  </span>
                ))}
              </div>}

              {phase === "pending" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-4"
                >
                  <p className="text-center text-[13px] text-white/60">
                    {!name
                      ? "Enter your name and wager to join this room."
                      : players.length < 2
                        ? "Waiting for your opponent…"
                        : "Both players in!"}{" "}
                    {mod.description}
                  </p>

                  <div className={neoCard}>
                    <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
                      {!name && (
                        <label className="block sm:col-span-2">
                          <span className="mb-1.5 block font-mono text-[10px] font-bold tracking-[0.08em] text-white/50">
                            YOUR DISPLAY NAME
                          </span>
                          <input
                            type="text"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            placeholder="e.g. carrie"
                            autoFocus
                            maxLength={40}
                            className="w-full rounded-xl border-2 border-acid bg-night px-3 py-3 text-[14px] text-acid outline-none placeholder:text-acid/30 focus:shadow-[3px_3px_0_#e4f222]"
                          />
                        </label>
                      )}
                      <label className="block">
                        <span className="mb-1.5 block font-mono text-[10px] font-bold tracking-[0.08em] text-white/50">
                          YOUR STAKE
                        </span>
                        <input
                          type="text"
                          value={stakeLabel}
                          onChange={(e) => setStakeLabel(e.target.value)}
                          placeholder="e.g. Friday dinner"
                          maxLength={80}
                          className="w-full rounded-xl border-2 border-acid bg-night px-3 py-3 text-[14px] text-acid outline-none placeholder:text-acid/30 focus:shadow-[3px_3px_0_#e4f222]"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block font-mono text-[10px] font-bold tracking-[0.08em] text-white/50">
                          VALUE TO WAGER
                        </span>
                        <div className="flex rounded-xl border-2 border-acid bg-night focus-within:shadow-[3px_3px_0_#e4f222]">
                          <span className="grid place-items-center border-r-2 border-acid px-3 font-mono font-bold text-acid">
                            $
                          </span>
                          <input
                            type="number"
                            min="1"
                            step="0.01"
                            inputMode="decimal"
                            value={myStake}
                            onChange={(e) => setMyStake(e.target.value)}
                            aria-label="Dollar value to wager"
                            className="min-w-0 flex-1 rounded-r-xl bg-night px-3 py-3 font-mono text-[14px] text-acid outline-none"
                          />
                        </div>
                      </label>
                    </div>
                    <p className="mt-2 text-[10px] text-white/45">
                      Name the real perk or item at stake and enter its actual dollar value.
                    </p>
                  </div>

                  {name && players.length < 2 && roomUrl && (
                    <div className={`${neoCard} flex flex-col items-center gap-2.5`}>
                      <span className="font-mono text-[10px] font-bold tracking-[0.08em] text-white/50">
                        INVITE YOUR OPPONENT
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(roomUrl)}`}
                        alt="Scan to join"
                        width={140}
                        height={140}
                        className="rounded-lg border-2 border-acid bg-white p-1"
                        onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                      />
                      <button
                        onClick={copyLink}
                        className="w-full rounded-xl border-2 border-acid bg-night px-3 py-2.5 font-mono text-[11px] text-acid transition hover:bg-acid hover:text-night"
                      >
                        {copied ? "✓ Copied — paste it to them" : `${roomUrl.slice(0, 40)}… (tap to copy)`}
                      </button>
                    </div>
                  )}

                  <button
                    onClick={name ? start : enter}
                    disabled={
                      (!name && !draft.trim()) ||
                      (!!name && new Set(players.map((player) => player.name)).size < 2) ||
                      !stakeLabel.trim() ||
                      !Number.isFinite(Number(myStake)) ||
                      Number(myStake) <= 0
                    }
                    className={`${neoBtn} bg-hot py-4 text-[17px] text-white`}
                  >
                    {name
                      ? new Set(players.map((player) => player.name)).size < 2
                        ? "Waiting for opponent…"
                        : "Start game ⚡"
                      : "Join room ⚔️"}{" "}
                    {name && pot > 0 ? `— ${money(pot)} total value` : ""}
                  </button>
                </motion.div>
              )}

              {name && phase === "active" && initialState != null && (
                <div className="rounded-2xl border-[3px] border-acid bg-night/90 p-3 text-night shadow-[6px_6px_0_#e4f222] sm:p-5">
                  <mod.Component
                    roomId={roomId}
                    me={name}
                    players={players}
                    stakes={stakes}
                    state={initialState}
                    lastEvent={lastMove}
                    send={(data) =>
                      channelRef.current && sendEvent(channelRef.current, { type: "move", by: name, data })
                    }
                    onFinish={handleFinish}
                  />
                </div>
              )}

              <AnimatePresence>
                {phase === "finished" && winner && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-3 rounded-2xl border-[3px] border-acid bg-slate px-5 py-12 text-center text-white shadow-[6px_6px_0_#e4f222]"
                  >
                    <div className="text-6xl">🏆</div>
                    <h2 className="font-display text-[28px] uppercase text-acid">
                      {winner.includes(" ") ? winner : `${winner} wins!`}
                    </h2>
                    {awardMsg && (
                      <span className="rounded-full border-2 border-acid bg-acid px-4 py-1.5 font-mono text-[12px] font-bold text-night">
                        {awardMsg}
                      </span>
                    )}
                    <p className="text-[11px] text-white/50">
                      Paid from the house bonus pot — nobody&apos;s allowance was touched.
                      <br />
                      Redeemable on food orders (DoorDash, UberEats) via a Ramp merchant-locked card 🍜
                    </p>
                    <Link href="/" className="font-mono text-[13px] font-bold text-hot underline">
                      Back to the arena →
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
        </div>
      </section>

      <Ticker text={TICKER_TWO} speed={40} tone="acid" className="relative z-20 border-t-2 border-[#333]" />
    </main>
  );
}
