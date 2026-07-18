"use client";

// Duel room — shared shell (join, presence, stakes, invite) in the Rampage
// neubrutalist chrome. Mounts the game from the registry (hard rule 5:
// do NOT fork this page per game). Payout via lib/ramp.ts.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { joinRoom, sendEvent, getRoomState, supabase } from "@/lib/supabase";
import { awardBonusCredit } from "@/lib/ramp";
import { getGame } from "@/lib/games/registry";
import { DEFAULT_STAKE_CENTS, potCents } from "@/lib/wager";
import type { GameEvent, Player } from "@/lib/types";

const chips = (c: number) => `◆${(c / 100).toFixed(0)}`;
const neoCard = "rounded-2xl border-[3px] border-night bg-white p-4 shadow-[6px_6px_0_#0A0A0A]";
const neoBtn =
  "rounded-2xl border-[3px] border-night font-display uppercase tracking-wide transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_#0A0A0A] shadow-[6px_6px_0_#0A0A0A] disabled:opacity-50";

export default function DuelRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const [name, setName] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameId, setGameId] = useState<string>("receipt-blitz");
  const [stakes, setStakes] = useState<Record<string, number>>({});
  const [myStake, setMyStake] = useState(DEFAULT_STAKE_CENTS / 100);
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
        if (e.type === "stake") setStakes((s) => ({ ...s, [e.by]: e.amountCents }));
        if (e.type === "start") {
          setGameId(e.gameId);
          setStakes(e.stakes);
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
    const cents = Math.max(100, Math.round(myStake * 100));
    setStakes((s) => ({ ...s, [name]: cents }));
    sendEvent(channelRef.current, { type: "stake", by: name, amountCents: cents });
  }, [myStake, name, phase]);

  function start() {
    const mod = getGame(gameId);
    const state = mod.initialState(roomId);
    const s = stakesRef.current;
    setInitialState(state);
    setPhase("active");
    if (channelRef.current)
      sendEvent(channelRef.current, { type: "start", gameId, state, stakes: s });
    supabase.from("rooms").update({ stakes: s, status: "active" }).eq("id", roomId).then();
  }

  function handleFinish(w: string, sc: Record<string, number>, payouts?: Record<string, number>) {
    if (phase === "finished") return;
    setWinner(w);
    setPhase("finished");
    if (channelRef.current) sendEvent(channelRef.current, { type: "finish", winner: w, scores: sc });
    // Each client credits only ITS OWN payout — no double-pays.
    const pot = potCents(stakesRef.current) || DEFAULT_STAKE_CENTS * 2;
    const myCut = payouts ? Math.round(payouts[name!] ?? 0) : w === name ? pot : 0;
    if (myCut > 0 && name)
      awardBonusCredit({ roomId, userName: name, amountCents: myCut, memo: `${getGame(gameId).name} payout` }).then(
        (r) => r.ok && setAwardMsg(`+${chips(myCut)} house bonus credited`)
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

  if (!name)
    return (
      <main className="grid min-h-screen place-items-center bg-night px-6 font-body">
        <div className="w-full max-w-[440px]">
          <h1 className="mb-2 text-center font-display text-[34px] uppercase text-acid">
            {mod.name}
          </h1>
          <p className="mb-5 text-center text-[13px] text-white/60">
            Stakes come from the house bonus pot — your allowance is never at stake.
          </p>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && enter()}
            placeholder="your display name"
            autoFocus
            className="mb-4 w-full rounded-2xl border-[3px] border-acid bg-night px-5 py-4 text-center font-mono text-[18px] text-acid outline-none placeholder:text-acid/35 shadow-[6px_6px_0_#e4f222]"
          />
          <button
            onClick={enter}
            disabled={!draft.trim()}
            className={`${neoBtn} w-full bg-acid py-4 text-[18px] text-night`}
          >
            Enter duel ⚔️
          </button>
        </div>
      </main>
    );

  return (
    <main className="flex min-h-screen justify-center bg-acid font-body text-night">
      <div className="relative flex min-h-screen w-full max-w-[480px] flex-col gap-4 border-x-4 border-night bg-white px-5 pb-8 pt-6">
        {/* top bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            aria-label="Back to landing"
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-night bg-white transition hover:bg-acid"
          >
            ←
          </Link>
          <div className="flex gap-1.5">
            {players.map((p) => (
              <span
                key={p.name}
                className="rounded-full border-2 border-night bg-acid px-2.5 py-1 font-mono text-[11px] font-bold"
              >
                {p.name}
                {stakes[p.name] ? ` · ${chips(stakes[p.name])}` : ""}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-baseline justify-between">
          <h1 className="font-display text-[26px] uppercase">{mod.name}</h1>
          {pot > 0 && (
            <span className="font-mono text-[12px] font-bold text-hot">POT {chips(pot)}</span>
          )}
        </div>

        {phase === "pending" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
            <p className="text-center text-[13px] text-night/60">
              {players.length < 2 ? "Waiting for your opponent…" : "Both players in!"} {mod.description}
            </p>

            {/* wager layer — shared by all games */}
            <div className={neoCard}>
              <span className="font-mono text-[10px] font-bold tracking-[0.08em] text-night/50">
                YOUR STAKE (BONUS-POOL CHIPS)
              </span>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={myStake}
                  onChange={(e) => setMyStake(Number(e.target.value))}
                  className="flex-1 accent-[#F2216E]"
                />
                <span className="w-14 text-right font-mono text-[17px] font-bold text-hot">◆{myStake}</span>
              </div>
              <p className="mt-1 text-[10px] text-night/45">
                Uneven stakes? Odds auto-adjust so the match stays EV-fair.
              </p>
            </div>

            {players.length < 2 && roomUrl && (
              <div className={`${neoCard} flex flex-col items-center gap-2.5`}>
                <span className="font-mono text-[10px] font-bold tracking-[0.08em] text-night/50">
                  INVITE YOUR OPPONENT
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(roomUrl)}`}
                  alt="Scan to join"
                  width={140}
                  height={140}
                  className="rounded-lg border-2 border-night"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                />
                <button
                  onClick={copyLink}
                  className="w-full rounded-xl border-2 border-night bg-cream px-3 py-2.5 font-mono text-[11px] transition hover:bg-acid"
                >
                  {copied ? "✓ Copied — paste it to them" : `${roomUrl.slice(0, 40)}… (tap to copy)`}
                </button>
              </div>
            )}

            <button onClick={start} className={`${neoBtn} bg-hot py-4 text-[17px] text-white`}>
              Start ⚡ {pot > 0 ? `— winner takes ${chips(pot)}` : ""}
            </button>
          </motion.div>
        )}

        {phase === "active" && initialState != null && (
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
        )}

        <AnimatePresence>
          {phase === "finished" && winner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 py-12 text-center"
            >
              <div className="text-6xl">🏆</div>
              <h2 className="font-display text-[28px] uppercase">
                {winner.includes(" ") ? winner : `${winner} wins!`}
              </h2>
              {awardMsg && (
                <span className="rounded-full border-2 border-night bg-acid px-4 py-1.5 font-mono text-[12px] font-bold">
                  {awardMsg}
                </span>
              )}
              <p className="text-[11px] text-night/50">
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
      </div>
    </main>
  );
}
