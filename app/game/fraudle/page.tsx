"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import PhoneShell from "@/components/PhoneShell";
import { FRAUDLE_REWARD, FRAUDLE_TXNS } from "@/lib/data";
import type { Txn } from "@/lib/types";

type Status = "playing" | "won" | "lost";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Fraudle() {
  // Reshuffle positions each mount so the answer isn't just memorized.
  const [deck, setDeck] = useState<Txn[]>(() => shuffle(FRAUDLE_TXNS));
  const fraud = useMemo(() => deck.find((t) => t.fraud)!, [deck]);

  const [selected, setSelected] = useState<string | null>(null);
  const [eliminated, setEliminated] = useState<string[]>([]);
  const [guess, setGuess] = useState(1); // 1..3
  const [status, setStatus] = useState<Status>("playing");
  const [shakeId, setShakeId] = useState<string | null>(null);

  const chips = status === "won" ? FRAUDLE_REWARD[guess] : 0;

  function lockIn() {
    if (!selected || status !== "playing") return;
    if (selected === fraud.id) {
      setStatus("won");
      return;
    }
    // wrong guess — eliminate + shake, advance or bust
    setEliminated((e) => [...e, selected]);
    setShakeId(selected);
    setSelected(null);
    window.setTimeout(() => setShakeId(null), 450);
    if (guess >= 3) setStatus("lost");
    else setGuess((g) => g + 1);
  }

  function reset() {
    setDeck(shuffle(FRAUDLE_TXNS));
    setSelected(null);
    setEliminated([]);
    setGuess(1);
    setStatus("playing");
    setShakeId(null);
  }

  const reveal = status !== "playing";

  return (
    <PhoneShell>
      <div className="relative flex min-h-full flex-col gap-3.5 px-5 pb-6 pt-14">
        {/* top bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-card text-ink/60 transition-colors hover:border-brand hover:text-brand"
            aria-label="Back to lobby"
          >
            ←
          </Link>
          <div className="font-mono text-[11px] text-ink/45">#214 · Jul 18</div>
        </div>

        <div className="flex items-baseline justify-between">
          <h1 className="text-[22px] font-extrabold tracking-tight">Fraudle</h1>
        </div>
        <p className="text-[13px] leading-relaxed text-ink/60">
          One of these 9 transactions violates policy. Find it in 3 guesses.
        </p>

        {/* grid */}
        <div className="grid grid-cols-3 gap-2">
          {deck.map((t) => {
            const isElim = eliminated.includes(t.id);
            const isSel = selected === t.id;
            const isFraudReveal = reveal && t.fraud;

            let cls =
              "border-line bg-card"; // default
            if (isFraudReveal)
              cls =
                "border-gold-mid bg-gold-wash shadow-[0_2px_10px_rgba(201,138,46,0.25)]";
            else if (isElim) cls = "border-line bg-page opacity-55";
            else if (isSel)
              cls =
                "border-gold-mid bg-gold-wash shadow-[0_2px_10px_rgba(201,138,46,0.25)]";

            return (
              <motion.button
                key={t.id}
                type="button"
                disabled={isElim || reveal}
                onClick={() => setSelected(t.id)}
                animate={
                  shakeId === t.id ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }
                }
                transition={{ duration: 0.4 }}
                whileTap={!isElim && !reveal ? { scale: 0.96 } : undefined}
                className={`flex flex-col gap-0.5 rounded-[10px] border-2 p-2.5 text-left ${cls}`}
              >
                <span
                  className={`font-mono text-[12px] font-semibold ${
                    isElim ? "text-ink/50 line-through" : ""
                  } ${isFraudReveal || isSel ? "text-gold-ink" : ""}`}
                >
                  ${t.amount.toFixed(2)}
                </span>
                <span
                  className={`text-[10px] ${
                    isFraudReveal || isSel ? "text-gold-ink" : "text-ink/50"
                  }`}
                >
                  {t.label}
                </span>
                <span className="text-[9px] font-semibold text-ink/35">
                  {isFraudReveal
                    ? "⚠ FRAUD"
                    : isElim
                      ? "✕ CLEAN"
                      : isSel
                        ? "? SELECTED"
                        : t.time}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* guess dots */}
        <div className="mt-auto flex items-center justify-center gap-2">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`h-3 w-3 rounded-full ${
                n < guess
                  ? "bg-ink/30"
                  : n === guess && !reveal
                    ? "blink bg-gold-mid"
                    : "border-2 border-line"
              }`}
            />
          ))}
          <span className="ml-1.5 text-[11px] text-ink/50">
            {reveal ? "Round over" : `Guess ${guess} of 3`}
          </span>
        </div>

        {/* lock in */}
        <button
          type="button"
          onClick={lockIn}
          disabled={!selected || reveal}
          className="rounded-xl bg-ink py-[15px] text-center text-[15px] font-bold text-white transition-colors enabled:hover:bg-ink-4 disabled:opacity-40"
        >
          Lock it in
        </button>
        <p className="text-center text-[10px] text-ink/40">
          Solve in 1 = ◆ 100 · in 2 = ◆ 60 · in 3 = ◆ 30 (house pot)
        </p>

        {/* result overlay */}
        <AnimatePresence>
          {reveal && (
            <ResultOverlay
              won={status === "won"}
              chips={chips}
              fraud={fraud}
              onReplay={reset}
            />
          )}
        </AnimatePresence>
      </div>
    </PhoneShell>
  );
}

function ResultOverlay({
  won,
  chips,
  fraud,
  onReplay,
}: {
  won: boolean;
  chips: number;
  fraud: Txn;
  onReplay: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex items-center justify-center bg-ink/45 px-5 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="flex w-full flex-col gap-4 rounded-2xl border border-line bg-paper p-6"
      >
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="text-[26px] font-extrabold tracking-tight">
            {won ? "Caught it! ✓" : "Out of guesses"}
          </div>
          <div className="text-[13px] text-ink/50">
            {won
              ? `Nailed the violation in ${chips === 100 ? "one" : chips === 60 ? "two" : "three"}.`
              : "The fraud slipped through this round."}
          </div>
        </div>

        <div className="rounded-xl border border-line bg-card p-4 text-center">
          <div className="text-[11px] font-semibold text-ink/45">
            {fraud.label} · ${fraud.amount.toFixed(2)}
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-ink/65">
            {fraud.reason}
          </p>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-dashed border-line px-4 py-3">
          <span className="text-[13px] font-semibold text-gold-ink">
            Chips from house pot
          </span>
          <motion.span
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
            className="font-mono text-[20px] font-semibold text-gold-mid"
          >
            +◆ {chips}
          </motion.span>
        </div>

        <p className="text-center text-[11px] leading-relaxed text-ink/45">
          Chips are house-sponsored bonus credit.
          <br />
          Nobody&apos;s lunch money was harmed.
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onReplay}
            className="rounded-xl bg-brand py-[15px] text-center text-[15px] font-bold text-white transition-colors hover:bg-brand-dark"
          >
            Play again
          </button>
          <Link
            href="/"
            className="rounded-xl border border-line bg-card py-[15px] text-center text-[15px] font-semibold text-ink/70 transition-colors hover:bg-page"
          >
            Back to lobby
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
