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
      <section className="flex min-w-0 flex-col gap-2">
        <h2 className="flex h-5 items-center font-display text-[10px] uppercase tracking-wide text-noir">
          🧾 Receipts
        </h2>
        {game.receipts.map((r) => {
          const owner = game.matched[r.id];
          return (
            <button
              key={r.id}
              disabled={!!owner}
              onClick={() => setPicked(r.id)}
              className={`flex h-[62px] w-full flex-col justify-center rounded-xl border-[3px] border-noir p-2.5 text-left text-[12px] font-semibold transition ${
                owner
                  ? "bg-cream text-noir/50 shadow-none"
                  : picked === r.id
                    ? "bg-sun text-noir shadow-brut hover:-translate-y-0.5"
                    : "bg-white text-noir shadow-brut hover:-translate-y-0.5 hover:bg-acid"
              }`}
            >
              <span className="block truncate">
                {r.emoji} {r.merchant}
              </span>
              <span className="block font-mono text-[11px] font-normal text-noir/60">
                {usd(r.amountCents)}{" "}
                {owner && (
                  <span className="font-display text-[9px] uppercase text-acid-deep">
                    ✓ {owner}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </section>
      <section className="flex min-w-0 flex-col gap-2">
        <h2 className="flex h-5 items-center font-display text-[10px] uppercase tracking-wide text-noir">
          💳 Transactions
        </h2>
        {game.txns.map((t) => (
          <button
            key={t.id}
            disabled={!!game.matched[t.id] || !picked}
            onClick={() => tryMatch(t.id)}
            className={`flex h-[62px] w-full flex-col justify-center rounded-xl border-[3px] border-noir p-2.5 text-left font-mono text-[11px] transition ${
              game.matched[t.id]
                ? "bg-cream text-noir/50 shadow-none"
                : "bg-white text-noir shadow-brut enabled:hover:-translate-y-0.5 enabled:hover:bg-hot enabled:hover:text-white disabled:opacity-50"
            }`}
          >
            <span className="block truncate">{t.merchant}</span>
            <span className="block text-noir/60">
              {usd(t.amountCents)} · {t.date}
            </span>
          </button>
        ))}
      </section>
    </div>
  );
}
