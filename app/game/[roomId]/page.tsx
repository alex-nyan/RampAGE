"use client";

// Shared room shell: join + presence + stakes + invite. Mounts the game from the
// registry (hard rule 5 — do NOT fork this page per game). Payout via lib/ramp.ts.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { joinRoom, sendEvent, getRoomState } from "@/lib/supabase";
import { awardBonusCredit } from "@/lib/ramp";
import { supabase } from "@/lib/supabase";
import { getGame } from "@/lib/games/registry";
import { DEFAULT_STAKE_CENTS, potCents, oddsLabel } from "@/lib/wager";
import type { GameEvent, Player } from "@/lib/types";

const chips = (c: number) => `◆${(c / 100).toFixed(0)}`;

export default function GameRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const [name, setName] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameId, setGameId] = useState<string>("receipt-blitz");
  const [stakes, setStakes] = useState<Record<string, number>>({});
  const [myStake, setMyStake] = useState(DEFAULT_STAKE_CENTS / 100);
  const [phase, setPhase] = useState<"pending" | "active" | "finished">("pending");
  const [initialState, setInitialState] = useState<unknown>(null);
  const [lastMove, setLastMove] = useState<{ by: string; data: unknown } | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [awardMsg, setAwardMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [roomUrl, setRoomUrl] = useState("");
  const channelRef = useRef<RealtimeChannel | null>(null);
  const stakesRef = useRef(stakes);
  stakesRef.current = stakes;

  useEffect(() => {
    setName(sessionStorage.getItem("rampage_name"));
    setRoomUrl(window.location.href);
    getRoomState(roomId).then((room) => room?.game && setGameId(room.game));
  }, [roomId]);

  useEffect(() => {
    if (!name || !roomId) return;
    const channel = joinRoom(roomId, name, {
      onEvent: (e: GameEvent) => {
        if (e.type === "stake") setStakes((s) => ({ ...s, [e.by]: e.amountCents }));
        if (e.type === "start") {
          setGameId(e.gameId);
          setStakes(e.stakes);
          setInitialState(e.state);
          setPhase("active");
        }
        if (e.type === "move") setLastMove({ by: e.by, data: e.data });
        if (e.type === "finish") {
          setWinner(e.winner);
          setScores(e.scores);
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

  // Broadcast my stake whenever it changes (pending phase only).
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
      sendEvent(channelRef.current, { type: "start", gameId: gameId as never, state, stakes: s });
    supabase.from("rooms").update({ stakes: s, status: "active" }).eq("id", roomId).then();
  }

  function handleFinish(w: string, sc: Record<string, number>) {
    if (phase === "finished") return;
    setWinner(w);
    setScores(sc);
    setPhase("finished");
    if (channelRef.current)
      sendEvent(channelRef.current, { type: "finish", winner: w, scores: sc });
    if (w === name) {
      const pot = potCents(stakesRef.current) || DEFAULT_STAKE_CENTS * 2;
      awardBonusCredit({ roomId, userName: w, amountCents: pot, memo: `${getGame(gameId).name} W` }).then(
        (r) => r.ok && setAwardMsg(`+${chips(pot)} house bonus credited`)
      );
    }
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
  const shell = "relative flex w-full max-w-[430px] flex-col gap-3.5 bg-paper px-5 pb-6 pt-14";

  if (!name)
    return (
      <main className="flex min-h-screen justify-center bg-page">
        <div className={shell}>
          <h1 className="text-[22px] font-extrabold tracking-tight">Join · {mod.name}</h1>
          <p className="text-[13px] text-ink/60">
            Stakes come from the house bonus pool — your allowance is never at stake.
          </p>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && enter()}
            placeholder="display name"
            className="rounded-xl border border-line bg-card px-4 py-3 text-center text-[15px] outline-none focus:border-brand"
          />
          <button
            onClick={enter}
            disabled={!draft.trim()}
            className="rounded-xl bg-brand px-4 py-3 text-[15px] font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-40"
          >
            Enter room ⚔️
          </button>
        </div>
      </main>
    );

  return (
    <main className="flex min-h-screen justify-center bg-page">
      <div className={shell}>
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-card text-ink/60 transition-colors hover:border-brand hover:text-brand"
            aria-label="Back to lobby"
          >
            ←
          </Link>
          <div className="flex gap-1.5">
            {players.map((p) => (
              <span
                key={p.name}
                className="rounded-full bg-brand-soft px-2.5 py-1 font-mono text-[11px] font-semibold text-brand"
              >
                {p.name}
                {stakes[p.name] ? ` · ${chips(stakes[p.name])}` : ""}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-baseline justify-between">
          <h1 className="text-[22px] font-extrabold tracking-tight">{mod.name}</h1>
          {pot > 0 && <span className="font-mono text-[11px] text-gold-ink">pot {chips(pot)}</span>}
        </div>

        {phase === "pending" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
            <p className="text-center text-[13px] leading-relaxed text-ink/60">
              {players.length < 2 ? "Waiting for your opponent to join…" : "Both players in!"}
              <br />
              {mod.description}
            </p>

            {/* wager layer — shared by all games */}
            <div className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-4">
              <span className="text-[10px] font-semibold tracking-[0.08em] text-ink/45">
                YOUR STAKE (BONUS-POOL CHIPS)
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={myStake}
                  onChange={(e) => setMyStake(Number(e.target.value))}
                  className="flex-1 accent-[#12805c]"
                />
                <span className="w-14 text-right font-mono text-[15px] font-semibold text-gold-ink">
                  ◆{myStake}
                </span>
              </div>
              {name && stakes[name] && pot > stakes[name] ? (
                <span className="font-mono text-[10px] text-ink/45">{oddsLabel(stakes, name)}</span>
              ) : null}
              <p className="text-[10px] text-ink/40">
                Uneven stakes? Odds auto-adjust so the match stays fair.
              </p>
            </div>

            {players.length < 2 && roomUrl && (
              <div className="flex w-full flex-col items-center gap-2.5 rounded-2xl border border-line bg-card p-4">
                <span className="text-[10px] font-semibold tracking-[0.08em] text-ink/45">
                  INVITE YOUR OPPONENT
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(roomUrl)}`}
                  alt="Scan to join"
                  width={140}
                  height={140}
                  className="rounded-lg border border-line"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                />
                <button
                  onClick={copyLink}
                  className="w-full rounded-xl border border-line bg-page px-3 py-2.5 font-mono text-[11px] text-ink/70 transition-colors hover:border-brand"
                >
                  {copied ? "✓ Copied — paste it to them" : `${roomUrl.slice(0, 38)}… (tap to copy)`}
                </button>
              </div>
            )}

            <button
              onClick={start}
              className="rounded-xl bg-brand px-6 py-3 text-[15px] font-bold text-white transition-colors hover:bg-brand-dark"
            >
              Start ⚡️ {pot > 0 ? `— winner takes ${chips(pot)}` : ""}
            </button>
          </motion.div>
        )}

        {phase === "active" && initialState != null && (
          <mod.Component
            roomId={roomId}
            me={name}
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
              className="flex flex-col items-center gap-3 py-14 text-center"
            >
              <div className="text-6xl">🏆</div>
              <h2 className="text-[26px] font-extrabold tracking-tight">{winner} wins!</h2>
              {Object.keys(scores).length > 0 && (
                <p className="font-mono text-[12px] text-ink/55">
                  {Object.entries(scores)
                    .map(([n, s]) => `${n} ${s}`)
                    .join(" · ")}
                </p>
              )}
              {awardMsg && (
                <span className="rounded-full bg-gold-soft px-4 py-1.5 font-mono text-[12px] font-semibold text-gold-ink">
                  {awardMsg}
                </span>
              )}
              <p className="text-[11px] text-ink/45">
                Paid from the house bonus pot — nobody&apos;s allowance was touched.
              </p>
              <Link href="/" className="text-[13px] font-semibold text-brand hover:underline">
                Back to lobby →
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
