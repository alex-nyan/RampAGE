"use client";

// Receipt Match Blitz — skeleton game room.
// Presence + broadcast wiring is real; game loop is a working v0 for M3 to juice up.

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
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

// Seeded demo cards — no empty states, ever.
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
      .map((i) => ({
        id: `r${i}`, // matching txn shares the receipt id — correctness check is id equality
        merchant: MERCHANTS[i][1],
        amountCents: MERCHANTS[i][2],
        date: "Jul 18",
      })),
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
  const [pickedReceipt, setPickedReceipt] = useState<string | null>(null);
  const [awardMsg, setAwardMsg] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    setName(sessionStorage.getItem("rampage_name"));
  }, []);

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

  const done = useMemo(
    () => !!game && Object.keys(game.matched).length >= game.receipts.length,
    [game]
  );

  useEffect(() => {
    if (!done || !game || game.status === "finished" || !name) return;
    const winner = Object.entries(game.scores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? name;
    const ev: GameEvent = { type: "finish", winner, scores: game.scores };
    if (channelRef.current) sendEvent(channelRef.current, ev);
    setGame({ ...game, status: "finished", winner });
    if (winner === name)
      awardBonusCredit({
        roomId: game.roomId,
        userName: winner,
        amountCents: game.bonusPoolCents,
        memo: "Receipt Match Blitz W",
      }).then((r) => r.ok && setAwardMsg(`+$${(game.bonusPoolCents / 100).toFixed(2)} bonus credit (tx ${r.txId})`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  function start() {
    const state = { ...freshState(roomId), status: "active" as const };
    setGame(state);
    if (channelRef.current) sendEvent(channelRef.current, { type: "start", state });
  }

  function tryMatch(txnId: string) {
    if (!game || !name || !pickedReceipt || game.matched[pickedReceipt]) return;
    const correct = pickedReceipt === txnId;
    const attempt = { receiptId: pickedReceipt, txnId, by: name, at: Date.now(), correct };
    if (channelRef.current) sendEvent(channelRef.current, { type: "match", attempt });
    if (correct)
      setGame({
        ...game,
        matched: { ...game.matched, [pickedReceipt]: name },
        scores: { ...game.scores, [name]: (game.scores[name] ?? 0) + 1 },
      });
    setPickedReceipt(null);
  }

  if (!name)
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6">
        <h1 className="text-2xl font-bold">Join the room</h1>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              sessionStorage.setItem("rampage_name", draft.trim());
              setName(draft.trim());
            }
          }}
          placeholder="your display name"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-center outline-none focus:border-amber-400"
        />
        <button
          onClick={() => {
            if (draft.trim()) {
              sessionStorage.setItem("rampage_name", draft.trim());
              setName(draft.trim());
            }
          }}
          className="w-full rounded-xl bg-amber-400 px-4 py-3 font-bold text-zinc-950"
        >
          Enter ⚔️
        </button>
      </main>
    );

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-4 sm:p-6">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-black">
          RAMP<span className="text-amber-400">AGE</span> · Receipt Match Blitz
        </h1>
        <div className="flex gap-2 text-sm">
          {players.map((p) => (
            <span key={p.name} className="rounded-full bg-zinc-800 px-3 py-1">
              {p.name} {game ? `· ${game.scores[p.name] ?? 0}` : ""}
            </span>
          ))}
        </div>
      </header>

      {!game && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-zinc-400">
            {players.length < 2 ? "Waiting for your opponent…" : "Both players in!"} Winner grabs a{" "}
            <b className="text-amber-400">${(DEFAULT_BONUS_POOL_CENTS / 100).toFixed(0)} slice of the bonus pool</b> 🎁
          </p>
          <button onClick={start} className="rounded-xl bg-amber-400 px-6 py-3 text-lg font-bold text-zinc-950">
            Start the Blitz ⚡️
          </button>
        </div>
      )}

      {game && game.status !== "finished" && (
        <div className="grid grid-cols-2 gap-4">
          <section>
            <h2 className="mb-2 text-sm font-bold uppercase text-zinc-500">Receipts</h2>
            <div className="grid gap-2">
              {game.receipts.map((r) => {
                const owner = game.matched[r.id];
                return (
                  <button
                    key={r.id}
                    disabled={!!owner}
                    onClick={() => setPickedReceipt(r.id)}
                    className={`rounded-lg border p-2 text-left text-sm transition ${
                      owner
                        ? "border-emerald-700 bg-emerald-950 opacity-60"
                        : pickedReceipt === r.id
                          ? "border-amber-400 bg-zinc-800"
                          : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"
                    }`}
                  >
                    {r.emoji} {r.merchant} — ${(r.amountCents / 100).toFixed(2)}
                    {owner && <span className="ml-1 text-emerald-400">✓ {owner}</span>}
                  </button>
                );
              })}
            </div>
          </section>
          <section>
            <h2 className="mb-2 text-sm font-bold uppercase text-zinc-500">Transactions</h2>
            <div className="grid gap-2">
              {game.txns.map((t) => (
                <button
                  key={t.id}
                  disabled={!!game.matched[t.id] || !pickedReceipt}
                  onClick={() => tryMatch(t.id)}
                  className={`rounded-lg border p-2 text-left font-mono text-xs transition ${
                    game.matched[t.id]
                      ? "border-emerald-700 bg-emerald-950 opacity-60"
                      : "border-zinc-700 bg-zinc-900 hover:border-amber-400 disabled:hover:border-zinc-700"
                  }`}
                >
                  {t.merchant} · ${(t.amountCents / 100).toFixed(2)} · {t.date}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {game?.status === "finished" && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="text-6xl">🏆</div>
          <h2 className="text-3xl font-black">{game.winner} wins!</h2>
          <p className="text-zinc-400">
            {Object.entries(game.scores)
              .map(([n, s]) => `${n}: ${s}`)
              .join(" · ")}
          </p>
          {awardMsg && <p className="rounded-full bg-emerald-950 px-4 py-2 text-emerald-400">{awardMsg}</p>}
          <p className="text-xs text-zinc-500">Paid from the company bonus pool — nobody&apos;s allowance was harmed 🎁</p>
        </div>
      )}
    </main>
  );
}
