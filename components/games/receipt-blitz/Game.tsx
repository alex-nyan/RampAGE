"use client";

// Receipt Blitz game module — pure gameplay. Room shell owns join/stakes/finish.
import { useEffect, useState } from "react";
import type { GameProps } from "@/lib/games/registry";
import type { GameState } from "@/lib/types";
import { RECEIPTS_PER_ROUND, DEFAULT_BONUS_POOL_CENTS } from "@/lib/types";

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

export function initialReceiptBlitzState(roomId: string): GameState {
  const idx = Array.from({ length: RECEIPTS_PER_ROUND }, (_, i) => i);
  return {
    roomId,
    status: "active",
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

type Move = { receiptId: string; by: string };

export default function ReceiptBlitzGame({ me, state, lastEvent, send, onFinish }: GameProps) {
  const [game, setGame] = useState<GameState>(state as GameState);
  const [picked, setPicked] = useState<string | null>(null);

  // Apply opponent moves.
  useEffect(() => {
    if (!lastEvent || lastEvent.by === me) return;
    const move = lastEvent.data as Move;
    if (!move?.receiptId) return;
    setGame((g) => ({
      ...g,
      matched: { ...g.matched, [move.receiptId]: move.by },
      scores: { ...g.scores, [move.by]: (g.scores[move.by] ?? 0) + 1 },
    }));
  }, [lastEvent, me]);

  // Win check.
  useEffect(() => {
    if (Object.keys(game.matched).length >= game.receipts.length) {
      const winner = Object.entries(game.scores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? me;
      onFinish(winner, game.scores);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.matched]);

  function tryMatch(txnId: string) {
    if (!picked || game.matched[picked]) return;
    if (picked === txnId) {
      send({ receiptId: picked, by: me });
      setGame((g) => ({
        ...g,
        matched: { ...g.matched, [picked]: me },
        scores: { ...g.scores, [me]: (g.scores[me] ?? 0) + 1 },
      }));
    }
    setPicked(null);
  }

  return (
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
  );
}
