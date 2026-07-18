"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
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
    <main className="flex min-h-screen justify-center bg-acid text-noir lg:items-start">
      <div className="relative flex w-full max-w-[480px] flex-col gap-3.5 px-5 pb-8 pt-12 lg:my-10 lg:max-w-[600px] lg:gap-4 lg:rounded-2xl lg:border-[3px] lg:border-noir lg:bg-cream lg:px-9 lg:pb-9 lg:pt-10 lg:shadow-brut-lg">
        {/* top bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            aria-label="Back to lobby"
            className="grid h-10 w-10 place-items-center rounded-xl border-[3px] border-noir bg-white text-lg font-bold shadow-brut transition-transform hover:-translate-y-0.5"
          >
            ←
          </Link>
          <span className="rounded-full border-[2.5px] border-noir bg-noir px-3 py-1 font-mono text-[11px] font-bold text-acid">
            #214 · JUL 18
          </span>
        </div>

        {/* title */}
        <div>
          <h1 className="font-display text-[38px] uppercase leading-[0.95]">
            Frau<span className="text-hot">dle</span>
          </h1>
          <p className="mt-2 max-w-[360px] text-[13.5px] font-medium leading-snug">
            One of these 9 transactions violates policy. Sniff out the fraud in
            3 guesses.
          </p>
        </div>

        {/* grid */}
        <div className="grid grid-cols-3 gap-2.5 lg:gap-3.5">
          {deck.map((t) => {
            const isElim = eliminated.includes(t.id);
            const isSel = selected === t.id;
            const isFraudReveal = reveal && t.fraud;

            let cls = "bg-white shadow-brut"; // default
            if (isFraudReveal) cls = "bg-hot text-white shadow-brut";
            else if (isElim) cls = "bg-cream opacity-60";
            else if (isSel) cls = "bg-sun -translate-y-0.5 shadow-brut-md";

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
                className={`flex flex-col gap-0.5 rounded-2xl border-[3px] border-noir p-2.5 text-left transition lg:p-4 ${cls}`}
              >
                <span
                  className={`font-mono text-[13px] font-bold ${
                    isElim ? "line-through opacity-60" : ""
                  }`}
                >
                  ${t.amount.toFixed(2)}
                </span>
                <span
                  className={`text-[10px] font-semibold ${
                    isFraudReveal ? "" : isElim ? "opacity-60" : "text-noir/70"
                  }`}
                >
                  {t.label}
                </span>
                <span
                  className={`font-display text-[8.5px] uppercase ${
                    isFraudReveal ? "" : isSel ? "text-noir" : "text-noir/45"
                  }`}
                >
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
        <div className="mt-auto flex items-center justify-center gap-2 pt-1">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`h-3.5 w-3.5 rounded-full border-[2.5px] border-noir ${
                n < guess
                  ? "bg-noir"
                  : n === guess && !reveal
                    ? "blink bg-sun"
                    : "bg-white"
              }`}
            />
          ))}
          <span className="ml-1.5 font-display text-[10px] uppercase text-acid-deep">
            {reveal ? "Round over" : `Guess ${guess} of 3`}
          </span>
        </div>

        {/* lock in */}
        <button
          type="button"
          onClick={lockIn}
          disabled={!selected || reveal}
          className="rounded-xl border-[3px] border-noir bg-noir py-4 text-center font-display text-[15px] uppercase text-acid shadow-brut transition enabled:hover:-translate-y-0.5 enabled:hover:bg-hot enabled:hover:text-white disabled:opacity-40"
        >
          Lock it in
        </button>
        <p className="text-center text-[11px] font-medium text-acid-deep">
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
    </main>
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
      className="absolute inset-0 z-30 flex items-center justify-center bg-noir/50 px-5 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="flex w-full max-w-[400px] flex-col gap-4 rounded-2xl border-[3px] border-noir bg-white p-6 shadow-brut-lg"
      >
        <div
          className={`rounded-xl border-[3px] border-noir px-4 py-3 text-center ${
            won ? "bg-sun text-noir" : "bg-hot text-white"
          }`}
        >
          <div className="font-display text-[24px] uppercase leading-tight">
            {won ? "Caught it! ✓" : "Out of guesses"}
          </div>
        </div>

        <p className="text-center text-[13px] font-medium leading-snug">
          {won
            ? `Nailed the violation in ${chips === 100 ? "one" : chips === 60 ? "two" : "three"}.`
            : "The fraud slipped through this round."}
        </p>

        <div className="rounded-xl border-[3px] border-noir bg-cream p-4 text-center">
          <div className="font-display text-[11px] uppercase text-noir">
            {fraud.label} ·{" "}
            <span className="font-mono">${fraud.amount.toFixed(2)}</span>
          </div>
          <p className="mt-1.5 text-[12px] font-medium leading-relaxed text-noir/75">
            {fraud.reason}
          </p>
        </div>

        <div className="flex items-center justify-between rounded-xl border-[2.5px] border-dashed border-noir px-4 py-3">
          <span className="font-display text-[12px] uppercase text-acid-deep">
            Chips from house pot
          </span>
          <motion.span
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
            className="font-mono text-[22px] font-bold text-acid-deep"
          >
            +◆ {chips}
          </motion.span>
        </div>

        <p className="text-center text-[11px] font-medium leading-relaxed text-noir/60">
          Chips are house-sponsored bonus credit.
          <br />
          Nobody&apos;s lunch money was harmed.
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onReplay}
            className="rounded-xl border-[3px] border-noir bg-noir py-4 text-center font-display text-[15px] uppercase text-acid shadow-brut transition hover:-translate-y-0.5 hover:bg-hot hover:text-white"
          >
            Play again
          </button>
          <Link
            href="/"
            className="rounded-xl border-[3px] border-noir bg-white py-3.5 text-center font-display text-[13px] uppercase text-noir transition hover:bg-sun"
          >
            Back to lobby
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
