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
    <div className="flex flex-col items-center gap-5 py-8 text-center">
      {/* auto-adjusted odds card */}
      <div className="flex w-full flex-col gap-3 rounded-2xl border-[3px] border-noir bg-white p-4 shadow-brut-md">
        <div className="flex items-center justify-between">
          <span className="font-display text-[11px] uppercase text-noir">
            Auto-Adjusted Odds
          </span>
          <span className="rounded-full border-[2px] border-noir bg-acid px-2 py-0.5 font-display text-[9px] uppercase text-noir">
            EV Fair
          </span>
        </div>
        {Object.entries(stakes).map(([n, s]) => {
          const mine = n === me;
          return (
            <div key={n} className="flex items-center gap-2.5">
              <span className="w-20 truncate text-left font-display text-[11px] uppercase text-noir">
                {mine ? "You" : n}
              </span>
              <div className="h-3 flex-1 overflow-hidden rounded-full border-[2px] border-noir bg-cream">
                <div
                  className={`h-full ${mine ? "bg-hot" : "bg-sun"}`}
                  style={{ width: `${winProbability(s, pot) * 100}%` }}
                />
              </div>
              <span className="w-10 text-right font-mono text-[12px] font-bold text-noir">
                {(winProbability(s, pot) * 100).toFixed(0)}%
              </span>
            </div>
          );
        })}
        <p className="text-left text-[11px] font-medium leading-snug text-acid-deep">
          Bigger stake &rarr; better odds, same expected value. Nobody&apos;s EV is negative.
        </p>
      </div>

      {/* positive-sum reassurance */}
      <div className="flex w-full items-start gap-2 rounded-xl border-[2.5px] border-noir bg-white px-3.5 py-2.5 text-left text-[11.5px] font-medium leading-snug text-noir">
        <span>🛡</span>
        <span>
          Your own allowance is <b>never</b> at stake. You&apos;re flipping for a slice
          of the house-funded bonus pot — nobody&apos;s lunch money moves.
        </span>
      </div>

      {/* the coin */}
      <div className="grid h-32 w-full place-items-center">
        <motion.div
          animate={spinning ? { rotateX: 1440, scale: [1, 1.06, 1] } : { rotateX: 0, scale: 1 }}
          transition={{ duration: 1.3, ease: "easeOut" }}
          className="grid h-28 w-28 place-items-center rounded-full border-[4px] border-noir bg-sun font-display text-5xl text-noir shadow-brut-lg"
        >
          🪙
        </motion.div>
      </div>

      {/* flip button */}
      <motion.button
        type="button"
        onClick={flip}
        disabled={spinning}
        whileHover={spinning ? undefined : { y: -2 }}
        whileTap={spinning ? undefined : { scale: 0.97 }}
        className="w-full rounded-xl border-[3px] border-noir bg-noir px-8 py-4 font-display text-[16px] uppercase text-acid shadow-brut transition hover:bg-hot hover:text-white disabled:opacity-50 disabled:hover:bg-noir disabled:hover:text-acid"
      >
        {spinning ? "Flipping…" : `Flip for ◆${(pot / 100).toFixed(0)}`}
      </motion.button>

      <p className="font-mono text-[11px] font-bold text-acid-deep">
        Your odds this flip: {(myP * 100).toFixed(0)}%
      </p>
    </div>
  );
}
