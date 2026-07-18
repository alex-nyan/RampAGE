"use client";

// Flip — the simplest wager demo. Stake-weighted coin: P(you win) = your stake / pot,
// so expected value is fair for ANY stake split (the odds auto-adjust mechanic).
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { GameProps } from "@/lib/games/registry";
import type { FlipState } from "@/lib/types";
import { pickWinner, potCents, winProbability } from "@/lib/wager";

export function initialFlipState(roomId: string): FlipState {
  return { roomId };
}

export default function FlipGame({ me, stakes, lastEvent, send, onFinish }: GameProps) {
  const [spinning, setSpinning] = useState(false);
  const pot = potCents(stakes);
  const myP = winProbability(stakes[me] ?? 0, pot);

  // Both clients converge on the broadcast roll.
  useEffect(() => {
    if (!lastEvent) return;
    const data = lastEvent.data as { roll?: number };
    if (typeof data?.roll === "number") settle(data.roll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastEvent]);

  function settle(roll: number) {
    setSpinning(true);
    const winner = pickWinner(stakes, roll);
    setTimeout(() => {
      const scores = Object.fromEntries(Object.keys(stakes).map((n) => [n, n === winner ? 1 : 0]));
      onFinish(winner, scores);
    }, 1400);
  }

  function flip() {
    if (spinning) return;
    const roll = Math.random();
    send({ roll });
    settle(roll);
  }

  return (
    <div className="flex flex-col items-center gap-5 py-10 text-center">
      <div className="flex w-full flex-col gap-2 rounded-2xl border border-line bg-card p-4">
        <span className="text-[10px] font-semibold tracking-[0.08em] text-ink/45">AUTO-ADJUSTED ODDS</span>
        {Object.entries(stakes).map(([n, s]) => (
          <div key={n} className="flex items-center gap-2">
            <span className="w-20 truncate text-left text-[12px] font-semibold">{n}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-page">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${winProbability(s, pot) * 100}%` }}
              />
            </div>
            <span className="font-mono text-[11px] text-ink/55">
              {(winProbability(s, pot) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
        <p className="text-[10px] text-ink/45">
          Bigger stake → better odds, same expected value. Nobody&apos;s EV is negative.
        </p>
      </div>

      <motion.div
        animate={spinning ? { rotateX: 1440 } : { rotateX: 0 }}
        transition={{ duration: 1.3, ease: "easeOut" }}
        className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-gold-deep bg-gold-wash text-4xl"
      >
        ◆
      </motion.div>

      <button
        onClick={flip}
        disabled={spinning}
        className="rounded-xl bg-brand px-8 py-3 text-[15px] font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
      >
        {spinning ? "Flipping…" : `Flip for ◆${(pot / 100).toFixed(0)} 🪙`}
      </button>
    </div>
  );
}
