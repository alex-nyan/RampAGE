"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bungee, Space_Grotesk } from "next/font/google";

// Fonts loaded locally so this game matches the Rampage landing aesthetic
// without depending on shared layout/globals (which is mid-refactor).
const bungee = Bungee({ subsets: ["latin"], weight: "400", variable: "--font-bungee" });
const space = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-space",
});

// Rampage palette (from Rampage Landing.dc.html)
const INK = "#0A0A0A";
const YELLOW = "#E4F222";
const PINK = "#F2216E";
const GOLD = "#FDB515";

// Bungee heading font — applied inline so we never miss the family.
const bng = { fontFamily: "var(--font-bungee)" } as const;

type Choice = "split" | "steal";
type Phase = "choose" | "reveal" | "result";

// The pot is a COMPANY-FUNDED bonus — Thursday's team-lunch budget, in chips.
// Positive-sum: your own allowance never moves. Worst case the bonus goes
// unclaimed back to the house. Nobody's lunch money is ever at stake.
const POT = 480;

// Seeded opponent so the demo never shows an empty state.
const OPPONENT = {
  handle: "@maya",
  color: GOLD,
  plea: "Let's both split — easy money for us both 🤝",
  stealRate: 0.5, // hidden bias; decided at lock-in, on-device
};

const fmt = (n: number) => n.toLocaleString("en-US");

export default function SplitOrSteal() {
  const [phase, setPhase] = useState<Phase>("choose");
  const [you, setYou] = useState<Choice | null>(null);
  const [opp, setOpp] = useState<Choice | null>(null);
  const [count, setCount] = useState(3);
  const [flipped, setFlipped] = useState(false);

  function choose(c: Choice) {
    if (phase !== "choose") return;
    setYou(c);
    // Opponent decides simultaneously & hidden — randomized on this click
    // (client event, so no SSR/hydration surprises).
    setOpp(Math.random() < OPPONENT.stealRate ? "steal" : "split");
    setPhase("reveal");
  }

  // Reveal choreography: 3 · 2 · 1 · FLIP · settle.
  useEffect(() => {
    if (phase !== "reveal") return;
    setCount(3);
    setFlipped(false);
    const timers = [
      setTimeout(() => setCount(2), 850),
      setTimeout(() => setCount(1), 1700),
      setTimeout(() => setFlipped(true), 2550),
      setTimeout(() => setPhase("result"), 3650),
    ];
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  const outcome = useMemo(() => {
    if (!you || !opp) return null;
    if (you === "split" && opp === "split")
      return { youWin: POT / 2, oppWin: POT / 2, key: "both-split" as const };
    if (you === "steal" && opp === "split")
      return { youWin: POT, oppWin: 0, key: "you-steal" as const };
    if (you === "split" && opp === "steal")
      return { youWin: 0, oppWin: POT, key: "they-steal" as const };
    return { youWin: 0, oppWin: 0, key: "both-steal" as const };
  }, [you, opp]);

  function reset() {
    setYou(null);
    setOpp(null);
    setFlipped(false);
    setCount(3);
    setPhase("choose");
  }

  return (
    <main
      className={`${bungee.variable} ${space.variable} flex min-h-screen justify-center overflow-hidden`}
      style={{ background: YELLOW, color: INK, fontFamily: "var(--font-space)" }}
    >
      <div className="relative flex w-full max-w-[680px] flex-col gap-4 px-5 pb-8 pt-12">
        {/* top bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            aria-label="Back to lobby"
            className="grid h-10 w-10 place-items-center rounded-xl border-[3px] text-lg font-bold transition-transform hover:-translate-y-0.5"
            style={{ borderColor: INK, background: "#fff", boxShadow: `3px 3px 0 ${INK}` }}
          >
            ←
          </Link>
          <span
            className="rounded-full px-3 py-1.5 text-[11px]"
            style={{ ...bng, background: INK, color: YELLOW }}
          >
            ⚔ TEAM-LUNCH DUEL
          </span>
        </div>

        {/* title */}
        <div>
          <h1
            className="text-[38px] uppercase leading-[0.95]"
            style={{ ...bng }}
          >
            Split or <span style={{ color: PINK }}>Steal</span>
          </h1>
          <p className="mt-2 max-w-[360px] text-[13.5px] font-medium leading-snug">
            The classic trust game — but the pot is the company&apos;s bonus
            lunch budget. Split it fair, or gamble for the whole slice.
          </p>
        </div>

        {/* pot */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between rounded-2xl border-[3.5px] p-5"
          style={{ borderColor: INK, background: INK, color: "#fff", boxShadow: `7px 7px 0 ${INK}` }}
        >
          <div>
            <div className="text-[11px]" style={{ ...bng, color: YELLOW }}>
              BONUS POT
            </div>
            <div className="mt-1 text-[11px] text-white/55">
              Thursday · Ramp NYC team lunch
            </div>
          </div>
          <motion.div
            className="text-[34px]"
            style={{ ...bng, color: YELLOW }}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          >
            ◆ {fmt(POT)}
          </motion.div>
        </motion.div>

        {/* positive-sum reassurance */}
        <div
          className="flex items-start gap-2 rounded-xl border-[2.5px] px-3.5 py-2.5 text-[11.5px] font-medium leading-snug"
          style={{ borderColor: INK, background: "#fff" }}
        >
          <span>🛡</span>
          <span>
            Your own allowance is <b>never</b> at stake. You&apos;re competing
            for a slice of house-funded bonus credit — worst case, the pot goes
            back to the company unclaimed.
          </span>
        </div>

        <AnimatePresence mode="wait">
          {phase === "choose" && (
            <ChoosePhase key="choose" onChoose={choose} />
          )}
          {phase !== "choose" && you && opp && (
            <RevealPhase
              key="reveal"
              you={you}
              opp={opp}
              count={count}
              flipped={flipped}
            />
          )}
        </AnimatePresence>

        {/* result overlay */}
        <AnimatePresence>
          {phase === "result" && outcome && you && opp && (
            <ResultOverlay
              you={you}
              opp={opp}
              outcome={outcome}
              onReplay={reset}
            />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

/* ---------------- Choose phase ---------------- */

function ChoosePhase({ onChoose }: { onChoose: (c: Choice) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex flex-col gap-4"
    >
      {/* opponent + plea */}
      <div
        className="flex items-center gap-3 rounded-2xl border-[3px] p-3.5"
        style={{ borderColor: INK, background: "#fff", boxShadow: `5px 5px 0 ${PINK}` }}
      >
        <span
          className="grid h-11 w-11 flex-none place-items-center rounded-xl border-[2.5px] text-lg"
          style={{ borderColor: INK, background: OPPONENT.color }}
        >
          🎭
        </span>
        <div className="min-w-0">
          <div className="text-[13px]" style={{ ...bng }}>
            {OPPONENT.handle}{" "}
            <span
              className="ml-1 rounded-full px-2 py-0.5 text-[9px] align-middle"
              style={{ ...bng, background: PINK, color: "#fff" }}
            >
              LOCKED IN
            </span>
          </div>
          <div className="truncate text-[12px] italic text-ink/70" style={{ color: "#555" }}>
            &ldquo;{OPPONENT.plea}&rdquo;
          </div>
        </div>
      </div>

      {/* payoff matrix */}
      <div className="grid grid-cols-2 gap-2">
        <Payoff label="BOTH SPLIT" value="◆240 each" tone="good" />
        <Payoff label="YOU STEAL · THEY SPLIT" value="you take ◆480" tone="greed" />
        <Payoff label="YOU SPLIT · THEY STEAL" value="they take ◆480" tone="greed" />
        <Payoff label="BOTH STEAL" value="pot expires ◆0" tone="bad" />
      </div>

      {/* choice buttons */}
      <div className="grid grid-cols-2 gap-3">
        <ChoiceButton
          onClick={() => onChoose("split")}
          emoji="🤝"
          label="SPLIT"
          sub="Play fair"
          bg={YELLOW}
          fg={INK}
        />
        <ChoiceButton
          onClick={() => onChoose("steal")}
          emoji="😈"
          label="STEAL"
          sub="Go for it all"
          bg={PINK}
          fg="#fff"
        />
      </div>
      <p className="text-center text-[11px] font-medium" style={{ color: "#5B6000" }}>
        Both players choose at the same time. No takebacks.
      </p>
    </motion.div>
  );
}

function Payoff({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "greed" | "bad";
}) {
  const bg = tone === "good" ? YELLOW : tone === "greed" ? "#fff" : INK;
  const fg = tone === "bad" ? "#fff" : INK;
  return (
    <div
      className="flex flex-col gap-1 rounded-xl border-[2.5px] px-3 py-2.5"
      style={{ borderColor: INK, background: bg, color: fg }}
    >
      <span className="text-[9.5px]" style={{ ...bng }}>
        {label}
      </span>
      <span className="text-[12px] font-bold">{value}</span>
    </div>
  );
}

function ChoiceButton({
  onClick,
  emoji,
  label,
  sub,
  bg,
  fg,
}: {
  onClick: () => void;
  emoji: string;
  label: string;
  sub: string;
  bg: string;
  fg: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -3, boxShadow: `8px 10px 0 ${INK}` }}
      whileTap={{ scale: 0.96 }}
      className="flex flex-col items-center gap-1.5 rounded-2xl border-[3.5px] py-6"
      style={{ borderColor: INK, background: bg, color: fg, boxShadow: `6px 6px 0 ${INK}` }}
    >
      <span className="text-[34px] leading-none">{emoji}</span>
      <span className="text-[20px]" style={{ ...bng }}>
        {label}
      </span>
      <span className="text-[11px] font-semibold opacity-80">{sub}</span>
    </motion.button>
  );
}

/* ---------------- Reveal phase ---------------- */

function RevealPhase({
  you,
  opp,
  count,
  flipped,
}: {
  you: Choice;
  opp: Choice;
  count: number;
  flipped: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-5 pt-2"
    >
      <div className="text-[13px]" style={{ ...bng }}>
        {flipped ? "REVEAL!" : "LOCKING IN…"}
      </div>

      {/* countdown */}
      <div className="grid h-[92px] place-items-center">
        <AnimatePresence mode="popLayout">
          {!flipped ? (
            <motion.div
              key={count}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 2.2, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="text-[80px] leading-none"
              style={{ ...bng, color: INK }}
            >
              {count}
            </motion.div>
          ) : (
            <motion.div
              key="vs"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-[40px]"
              style={{ ...bng, color: PINK }}
            >
              ✦
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* the two hands */}
      <div className="grid w-full grid-cols-2 gap-3">
        <RevealCard who="YOU" choice={you} flipped={flipped} accent={YELLOW} />
        <RevealCard
          who={OPPONENT.handle}
          choice={opp}
          flipped={flipped}
          accent={OPPONENT.color}
        />
      </div>
    </motion.div>
  );
}

function RevealCard({
  who,
  choice,
  flipped,
  accent,
}: {
  who: string;
  choice: Choice;
  flipped: boolean;
  accent: string;
}) {
  const isSteal = choice === "steal";
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[12px]" style={{ ...bng }}>
        {who}
      </span>
      <motion.div
        className="relative grid h-[120px] w-full place-items-center rounded-2xl border-[3.5px]"
        style={{
          borderColor: INK,
          background: flipped ? (isSteal ? PINK : YELLOW) : INK,
          color: flipped && isSteal ? "#fff" : INK,
          boxShadow: `6px 6px 0 ${INK}`,
        }}
        animate={flipped ? { rotateY: [90, 0], scale: [0.9, 1] } : { rotateY: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        {flipped ? (
          <div className="flex flex-col items-center gap-1">
            <span className="text-[36px] leading-none">{isSteal ? "😈" : "🤝"}</span>
            <span className="text-[16px]" style={{ ...bng }}>
              {isSteal ? "STEAL" : "SPLIT"}
            </span>
          </div>
        ) : (
          <motion.span
            className="text-[40px]"
            style={{ color: accent }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.1, repeat: Infinity }}
          >
            🔒
          </motion.span>
        )}
      </motion.div>
    </div>
  );
}

/* ---------------- Result overlay ---------------- */

const RESULT_COPY: Record<
  string,
  { title: string; sub: string; tone: string }
> = {
  "both-split": {
    title: "SPLIT! 🤝",
    sub: "You both trusted — the bonus splits clean down the middle.",
    tone: YELLOW,
  },
  "you-steal": {
    title: "YOU SWIPED IT 😈",
    sub: `${OPPONENT.handle} played fair. You took the whole slice this round.`,
    tone: PINK,
  },
  "they-steal": {
    title: "OUTPLAYED 😬",
    sub: `${OPPONENT.handle} stole the pot. You walk away even — no allowance lost.`,
    tone: GOLD,
  },
  "both-steal": {
    title: "POT EXPIRED 💥",
    sub: "You both grabbed — so nobody claims it. The bonus rolls back to the house.",
    tone: "#fff",
  },
};

function ResultOverlay({
  you,
  opp,
  outcome,
  onReplay,
}: {
  you: Choice;
  opp: Choice;
  outcome: { youWin: number; oppWin: number; key: string };
  onReplay: () => void;
}) {
  const copy = RESULT_COPY[outcome.key];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex items-center justify-center px-5"
      style={{ background: "rgba(10,10,10,0.55)", backdropFilter: "blur(3px)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="flex w-full max-w-[400px] flex-col gap-4 rounded-2xl border-[3.5px] p-6"
        style={{ borderColor: INK, background: "#fff", boxShadow: `10px 10px 0 ${INK}` }}
      >
        <div
          className="rounded-xl border-[3px] px-4 py-3 text-center"
          style={{ borderColor: INK, background: copy.tone, color: INK }}
        >
          <div className="text-[24px] uppercase leading-tight" style={{ ...bng }}>
            {copy.title}
          </div>
        </div>

        <p className="text-center text-[13px] font-medium leading-snug">{copy.sub}</p>

        {/* payouts */}
        <div className="grid grid-cols-2 gap-2.5">
          <PayoutCard who="YOU" chips={outcome.youWin} choice={you} highlight />
          <PayoutCard who={OPPONENT.handle} chips={outcome.oppWin} choice={opp} />
        </div>

        <div
          className="rounded-xl border-[2.5px] border-dashed px-3.5 py-2.5 text-center text-[11px] font-medium leading-snug"
          style={{ borderColor: INK, color: "#555" }}
        >
          Chips are house-sponsored bonus credit. Ramp keeps every budget,
          receipt, and approval intact — nobody&apos;s lunch money moved.
        </div>

        <div className="flex flex-col gap-2.5">
          <motion.button
            type="button"
            onClick={onReplay}
            whileTap={{ scale: 0.97 }}
            className="rounded-xl border-[3px] py-4 text-center text-[15px]"
            style={{ ...bng, borderColor: INK, background: INK, color: YELLOW }}
          >
            RUN IT BACK ⚔
          </motion.button>
          <Link
            href="/"
            className="rounded-xl border-[3px] py-3.5 text-center text-[13px] font-bold"
            style={{ borderColor: INK, background: "#fff", color: INK }}
          >
            Back to lobby
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PayoutCard({
  who,
  chips,
  choice,
  highlight,
}: {
  who: string;
  chips: number;
  choice: Choice;
  highlight?: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center gap-1 rounded-xl border-[2.5px] px-3 py-3"
      style={{
        borderColor: INK,
        background: highlight ? YELLOW : "#fff",
      }}
    >
      <span className="text-[11px]" style={{ ...bng }}>
        {who}
      </span>
      <span className="text-[10px] font-semibold opacity-70">
        {choice === "steal" ? "😈 stole" : "🤝 split"}
      </span>
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
        className="text-[22px]"
        style={{ ...bng, color: chips > 0 ? "#5B6000" : "#999" }}
      >
        +◆{chips}
      </motion.span>
    </div>
  );
}
