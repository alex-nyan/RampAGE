"use client";

// Receipt Blitz — 1v1 room. Realtime broadcast + presence per supabase-realtime skill;
// Perkade design tokens per shared-ui-components; 430px column per responsive-cross-device.

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { joinRoom, sendEvent } from "@/lib/supabase";
import { awardBonusCredit } from "@/lib/ramp";
import {
  type GameEvent,
  type GameState,
  type Player,
  RECEIPTS_PER_ROUND,
  DEFAULT_BONUS_POOL_CENTS,
} from "@/lib/types";

const MERCHANTS: [string, string, number][] = [
  ["Blue Bottle", "SQ *BLUE BOTTLE", 675],
  ["Sweetgreen", "SWEETGREEN #402", 1450],
  ["Uber", "UBER *TRIP", 2320],
  ["Chipotle", "CHIPOTLE 1188", 1185],
  ["Equinox", "EQX*MONTHLY", 9900],
  ["Amazon", "AMZN MKTP US", 3499],
  ["Doordash", "DD *DOORDASH", 2860],
  ["Delta", "DELTA AIR 0062", 24500],
];
const EMOJI = ["☕️", "🥗", "🚗", "🌯", "🏋️", "📦", "🍜", "✈️"];
const usd = (c: number) => `$${(c / 100).toFixed(2)}`;

function freshState(roomId: string): GameState {
  const idx = Array.from({ length: RECEIPTS_PER_ROUND }, (_, i) => i);
  return {
    roomId,
    status: "pending",
    round: 1,
    receipts: idx.map((i) => ({
      id: `r${i}`,
      merchant: MERCHANTS[i][0],
      amountCents: MERCHANTS[i][2],
      emoji: EMOJI[i],
    })),
    txns: [...idx]
      .sort(() => Math.random() - 0.5)
      .map((i) => ({ id: `r${i}`, merchant: MERCHANTS[i][1], amountCents: MERCHANTS[i][2], date: "Jul 18" })),
    matched: {},
    scores: {},
    bonusPoolCents: DEFAULT_BONUS_POOL_CENTS,
  };
}

export default function GameRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const [name, setName] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [game, setGame] = useState<GameState | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [awardMsg, setAwardMsg] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => setName(sessionStorage.getItem("rampage_name")), []);

  useEffect(() => {
    if (!name || !roomId) return;
    const channel = joinRoom(roomId, name, {
      onEvent: (e: GameEvent) => {
        if (e.type === "start") setGame(e.state);
        if (e.type === "match" && e.attempt.correct)
          setGame((g) =>
            g
              ? {
                  ...g,
                  matched: { ...g.matched, [e.attempt.receiptId]: e.attempt.by },
                  scores: { ...g.scores, [e.attempt.by]: (g.scores[e.attempt.by] ?? 0) + 1 },
                }
              : g
          );
        if (e.type === "finish")
          setGame((g) => (g ? { ...g, status: "finished", winner: e.winner, scores: e.scores } : g));
      },
      onPlayers: setPlayers,
    });
    channelRef.current = channel;
    return () => {
      channel.unsubscribe();
    };
  }, [name, roomId]);

  const done = useMemo(() => !!game && Object.keys(game.matched).length >= game.receipts.length, [game]);

  useEffect(() => {
    if (!done || !game || game.status === "finished" || !name) return;
    const winner = Object.entries(game.scores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? name;
    if (channelRef.current)
      sendEvent(channelRef.current, { type: "finish", winner, scores: game.scores });
    setGame({ ...game, status: "finished", winner });
    if (winner === name)
      awardBonusCredit({
        roomId: game.roomId,
        userName: winner,
        amountCents: game.bonusPoolCents,
        memo: "Receipt Blitz W",
      }).then((r) => r.ok && setAwardMsg(`+${usd(game.bonusPoolCents)} house bonus credited`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  function start() {
    const state = { ...freshState(roomId), status: "active" as const };
    setGame(state);
    if (channelRef.current) sendEvent(channelRef.current, { type: "start", state });
  }

  function tryMatch(txnId: string) {
    if (!game || !name || !picked || game.matched[picked]) return;
    const correct = picked === txnId;
    if (channelRef.current)
      sendEvent(channelRef.current, {
        type: "match",
        attempt: { receiptId: picked, txnId, by: name, at: Date.now(), correct },
      });
    if (correct)
      setGame({
        ...game,
        matched: { ...game.matched, [picked]: name },
        scores: { ...game.scores, [name]: (game.scores[name] ?? 0) + 1 },
      });
    setPicked(null);
  }

  function enter() {
    if (!draft.trim()) return;
    sessionStorage.setItem("rampage_name", draft.trim());
    setName(draft.trim());
  }

  const shell = "relative flex w-full max-w-[430px] flex-col gap-3.5 bg-paper px-5 pb-6 pt-14";

  if (!name)
    return (
      <main className="flex min-h-screen justify-center bg-page">
        <div className={shell}>
          <h1 className="text-[22px] font-extrabold tracking-tight">Join the Blitz</h1>
          <p className="text-[13px] text-ink/60">
            Winner takes a <span className="font-semibold text-gold-ink">{usd(DEFAULT_BONUS_POOL_CENTS)}</span> slice
            of the house pot. Your allowance is never at stake.
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
        {/* top bar */}
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
              <span key={p.name} className="rounded-full bg-brand-soft px-2.5 py-1 font-mono text-[11px] font-semibold text-brand">
                {p.name}
                {game ? ` · ${game.scores[p.name] ?? 0}` : ""}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-baseline justify-between">
          <h1 className="text-[22px] font-extrabold tracking-tight">Receipt Blitz</h1>
          <span className="font-mono text-[11px] text-gold-ink">pot {usd(DEFAULT_BONUS_POOL_CENTS)}</span>
        </div>

        {!game && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-4 py-14 text-center">
            <p className="text-[13px] leading-relaxed text-ink/60">
              {players.length < 2 ? "Waiting for your opponent to join…" : "Both players in!"}
              <br />
              Match receipts to card transactions faster than they do.
            </p>
            <button
              onClick={start}
              className="rounded-xl bg-brand px-6 py-3 text-[15px] font-bold text-white transition-colors hover:bg-brand-dark"
            >
              Start the Blitz ⚡️
            </button>
          </motion.div>
        )}

        {game && game.status !== "finished" && (
          <div className="grid grid-cols-2 gap-3">
            <section className="flex flex-col gap-1.5">
              <h2 className="text-[10px] font-semibold tracking-[0.08em] text-ink/45">RECEIPTS</h2>
              {game.receipts.map((r) => {
                const owner = game.matched[r.id];
                return (
                  <button
                    key={r.id}
                    disabled={!!owner}
                    onClick={() => setPicked(r.id)}
                    className={`rounded-xl border p-2.5 text-left text-[12px] font-semibold transition-colors ${
                      owner
                        ? "border-brand-soft bg-brand-soft/60 text-ink/40"
                        : picked === r.id
                          ? "border-gold-deep bg-gold-wash"
                          : "border-line bg-card hover:border-brand"
                    }`}
                  >
                    {r.emoji} {r.merchant}
                    <span className="block font-mono text-[11px] font-normal text-ink/55">
                      {usd(r.amountCents)} {owner && <span className="text-brand">✓ {owner}</span>}
                    </span>
                  </button>
                );
              })}
            </section>
            <section className="flex flex-col gap-1.5">
              <h2 className="text-[10px] font-semibold tracking-[0.08em] text-ink/45">TRANSACTIONS</h2>
              {game.txns.map((t) => (
                <button
                  key={t.id}
                  disabled={!!game.matched[t.id] || !picked}
                  onClick={() => tryMatch(t.id)}
                  className={`rounded-xl border p-2.5 text-left font-mono text-[11px] transition-colors ${
                    game.matched[t.id]
                      ? "border-brand-soft bg-brand-soft/60 text-ink/40"
                      : "border-line bg-card enabled:hover:border-gold-deep disabled:opacity-60"
                  }`}
                >
                  {t.merchant}
                  <span className="block text-ink/55">
                    {usd(t.amountCents)} · {t.date}
                  </span>
                </button>
              ))}
            </section>
          </div>
        )}

        <AnimatePresence>
          {game?.status === "finished" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 py-14 text-center"
            >
              <div className="text-6xl">🏆</div>
              <h2 className="text-[26px] font-extrabold tracking-tight">{game.winner} wins!</h2>
              <p className="font-mono text-[12px] text-ink/55">
                {Object.entries(game.scores)
                  .map(([n, s]) => `${n} ${s}`)
                  .join(" · ")}
              </p>
              {awardMsg && (
                <span className="rounded-full bg-gold-soft px-4 py-1.5 font-mono text-[12px] font-semibold text-gold-ink">
                  {awardMsg}
                </span>
              )}
              <p className="text-[11px] text-ink/45">Paid from the house bonus pot — nobody&apos;s allowance was touched.</p>
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
