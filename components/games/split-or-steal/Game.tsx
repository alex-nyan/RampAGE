"use client";

// Split or Steal — 1v1 trust game, ported from the standalone page into the
// registry. Both secretly pick; reveal together. Palette nods to the
// neo-brutalist standalone version (yellow/pink/gold on ink).
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { GameProps } from "@/lib/games/registry";
import { potCents } from "@/lib/wager";

const YELLOW = "#E4F222";
const PINK = "#F2216E";
const INK = "#0A0A0A";
type Choice = "split" | "steal";

export function initialSplitState(roomId: string) {
  return { roomId };
}

export default function SplitOrStealGame({ me, stakes, lastEvent, send, onFinish }: GameProps) {
  const [mine, setMine] = useState<Choice | null>(null);
  const [theirs, setTheirs] = useState<Choice | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const pot = potCents(stakes);
  const opponent = Object.keys(stakes).find((n) => n !== me) ?? "opponent";

  useEffect(() => {
    if (!lastEvent || lastEvent.by === me) return;
    const d = lastEvent.data as { choice?: Choice };
    if (d?.choice) setTheirs(d.choice);
  }, [lastEvent, me]);

  const outcome = useMemo(() => {
    if (!mine || !theirs) return null;
    if (mine === "split" && theirs === "split")
      return { winner: "Both split 🤝", payouts: { [me]: pot / 2, [opponent]: pot / 2 } };
    if (mine === "steal" && theirs === "split")
      return { winner: me, payouts: { [me]: pot, [opponent]: 0 } };
    if (mine === "split" && theirs === "steal")
      return { winner: opponent, payouts: { [me]: 0, [opponent]: pot } };
    return { winner: "Nobody — the house keeps it 😈", payouts: {} };
  }, [mine, theirs, me, opponent, pot]);

  // Reveal choreography once both have picked: 3 · 2 · 1 · settle.
  useEffect(() => {
    if (!outcome) return;
    setCount(3);
    const t = [
      setTimeout(() => setCount(2), 800),
      setTimeout(() => setCount(1), 1600),
      setTimeout(
        () =>
          onFinish(
            outcome.winner,
            Object.fromEntries(Object.entries(outcome.payouts).map(([n, c]) => [n, c > 0 ? 1 : 0])),
            outcome.payouts
          ),
        2500
      ),
    ];
    return () => t.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outcome]);

  function pick(c: Choice) {
    if (mine) return;
    setMine(c);
    send({ choice: c });
  }

  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div
        className="w-full rounded-2xl border-4 p-4 font-mono text-[13px] font-bold"
        style={{ background: YELLOW, borderColor: INK, color: INK }}
      >
        POT ◆{(pot / 100).toFixed(0)} — split it 50/50, steal it all, or both steal and the
        house keeps it. Company-funded; nobody&apos;s allowance moves.
      </div>

      {count !== null ? (
        <motion.div
          key={count}
          initial={{ scale: 2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="py-10 text-7xl font-extrabold"
          style={{ color: PINK }}
        >
          {count}
        </motion.div>
      ) : mine ? (
        <p className="py-10 text-[13px] text-ink/60">
          You locked in <b className="uppercase">{mine}</b>. Waiting for {opponent}…
        </p>
      ) : (
        <div className="grid w-full grid-cols-2 gap-3">
          <button
            onClick={() => pick("split")}
            className="rounded-2xl border-4 py-8 text-xl font-extrabold transition-transform hover:scale-[1.03]"
            style={{ borderColor: INK, background: "#fff", color: INK }}
          >
            🤝 SPLIT
          </button>
          <button
            onClick={() => pick("steal")}
            className="rounded-2xl border-4 py-8 text-xl font-extrabold text-white transition-transform hover:scale-[1.03]"
            style={{ borderColor: INK, background: PINK }}
          >
            😈 STEAL
          </button>
        </div>
      )}

      <p className="text-[10px] text-ink/40">Choices are secret until both lock in.</p>
    </div>
  );
}
