"use client";

// The Price Is Ramp — 1v1 guess-the-spend. Both players eyeball a real-ish
// company expense and guess the total; closest WITHOUT going over takes the
// round (the Price-Is-Right rule). Best of 3; the higher round score takes the
// house pot. Positive-sum: it's a skill/vibes guess for a slice of the bonus
// pool — nobody's own allowance is ever at stake. Deterministic like Predict:
// the deck is seeded once + broadcast, both guesses ride the shared channel,
// and both clients converge on the identical result.
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { GameProps } from "@/lib/games/registry";
import type { PriceItem, PriceState } from "@/lib/types";
import { PRICE_ITEMS } from "@/lib/data";
import { potCents } from "@/lib/wager";

const ROUNDS = 3;

// Creator seeds a shuffled few at start; broadcast so both clients share the
// same deck (and hidden totals) and converge on the same result.
export function initialPriceIsRampState(roomId: string): PriceState {
  const deck = [...PRICE_ITEMS];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return { roomId, items: deck.slice(0, Math.min(ROUNDS, deck.length)) };
}

const chips = (c: number) => `◆${(c / 100).toFixed(0)}`;
const usd = (c: number) =>
  `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const usd0 = (c: number) => `$${Math.round(c / 100).toLocaleString("en-US")}`;

type Guesses = Record<number, Record<string, number>>;
type RoundRes =
  | { kind: "win"; winner: string }
  | { kind: "tie" }
  | { kind: "push" };

// Pure scoring — closest guess WITHOUT going over takes the round. Both clients
// run this over the shared deck + shared guesses, so they never disagree.
function roundResult(actualCents: number, entries: [string, number][]): RoundRes {
  const valid = entries.filter(([, g]) => g <= actualCents);
  if (valid.length === 0) return { kind: "push" }; // both overbid
  const best = Math.max(...valid.map(([, g]) => g));
  const winners = valid.filter(([, g]) => g === best).map(([n]) => n);
  return winners.length > 1 ? { kind: "tie" } : { kind: "win", winner: winners[0] };
}

export default function PriceIsRampGame({ me, stakes, state, lastEvent, send, onFinish }: GameProps) {
  const items = (state as PriceState).items;
  const pot = potCents(stakes);
  const opp = Object.keys(stakes).find((n) => n !== me) ?? "opponent";

  const [guesses, setGuesses] = useState<Guesses>({});
  const [viewRound, setViewRound] = useState(0);
  const [draft, setDraft] = useState("");
  const [shown, setShown] = useState(0);
  const finishedRef = useRef(false);

  const item = items[Math.min(viewRound, items.length - 1)];
  const bothIn = (r: number) => guesses[r]?.[me] != null && guesses[r]?.[opp] != null;
  const iLocked = guesses[viewRound]?.[me] != null;
  const revealNow = bothIn(viewRound);
  const isFinalRound = viewRound >= ROUNDS - 1;

  // Opponent's per-round guess rides the shared broadcast channel.
  useEffect(() => {
    if (!lastEvent || lastEvent.by === me) return;
    const d = lastEvent.data as { round?: number; guessCents?: number };
    if (typeof d.round === "number" && typeof d.guessCents === "number") {
      setGuesses((g) => ({ ...g, [d.round!]: { ...g[d.round!], [lastEvent.by]: d.guessCents! } }));
    }
  }, [lastEvent, me]);

  // Running score through a given round (inclusive).
  const scoreThrough = useMemo(
    () => (upTo: number) => {
      let mine = 0;
      let theirs = 0;
      for (let r = 0; r <= upTo; r++) {
        if (!bothIn(r)) continue;
        const res = roundResult(items[r].actualCents, [
          [me, guesses[r][me]],
          [opp, guesses[r][opp]],
        ]);
        if (res.kind === "win") {
          if (res.winner === me) mine++;
          else theirs++;
        } else if (res.kind === "tie") {
          mine++;
          theirs++;
        }
      }
      return { mine, theirs };
    },
    [guesses, items, me, opp]
  );

  const score = scoreThrough(revealNow ? viewRound : viewRound - 1);
  const roundRes = revealNow
    ? roundResult(item.actualCents, [
        [me, guesses[viewRound][me]],
        [opp, guesses[viewRound][opp]],
      ])
    : null;

  // Reveal count-up: tick the real total up from $0 when both guesses land.
  useEffect(() => {
    if (!revealNow || !item) return;
    setShown(0);
    const target = item.actualCents;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1000);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [revealNow, viewRound, item]);

  // Once every round is in AND we're on the final reveal, settle — on BOTH
  // clients, each of which credits only its own cut via onFinish.
  useEffect(() => {
    if (finishedRef.current) return;
    if (!isFinalRound || !items.every((_, r) => bothIn(r))) return;
    finishedRef.current = true;
    const t = setTimeout(() => {
      const { mine, theirs } = scoreThrough(ROUNDS - 1);
      if (mine === theirs) {
        onFinish("Dead heat — split! 🤝", { [me]: 1, [opp]: 1 }, { [me]: pot / 2, [opp]: pot / 2 });
      } else {
        const w = mine > theirs ? me : opp;
        const l = w === me ? opp : me;
        onFinish(w, { [w]: 1, [l]: 0 }, { [w]: pot, [l]: 0 });
      }
    }, 2600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guesses, viewRound]);

  function lockIn() {
    if (iLocked) return;
    const cents = Math.round(parseFloat(draft.replace(/[^0-9.]/g, "")) * 100);
    if (!draft.trim() || isNaN(cents) || cents < 0) return;
    setGuesses((g) => ({ ...g, [viewRound]: { ...g[viewRound], [me]: cents } }));
    send({ round: viewRound, guessCents: cents });
    setDraft("");
  }

  // ---------------- reveal screen ----------------
  if (revealNow && roundRes) {
    const settled = shown >= item.actualCents;
    const banner =
      roundRes.kind === "push"
        ? "Both overbid — nobody takes the round 😬"
        : roundRes.kind === "tie"
        ? "Dead-on tie — you both take it 🤝"
        : roundRes.winner === me
        ? "Closest without going over — the round is yours 🎯"
        : `${opp} was closer — get the next one.`;

    return (
      <div className="flex flex-col gap-4 py-2">
        <RoundBar round={viewRound} score={score} me={me} opp={opp} />

        <div className="flex flex-col items-center gap-1 rounded-2xl border-[3px] border-night bg-cream px-4 py-5 text-center shadow-brut-md">
          <span className="text-4xl">{item.emoji}</span>
          <span className="font-mono text-[10px] font-bold tracking-[0.08em] text-night/50">
            THE REAL TOTAL
          </span>
          <motion.span
            key="ticker"
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            className="font-display text-5xl text-hot"
          >
            {settled ? usd(item.actualCents) : usd0(shown)}
          </motion.span>
          <span className="font-mono text-[11px] font-bold uppercase text-night/45">
            {item.merchant}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <GuessTag
            who="You"
            guess={guesses[viewRound][me]}
            actual={item.actualCents}
            won={roundRes.kind === "win" ? roundRes.winner === me : roundRes.kind === "tie"}
          />
          <GuessTag
            who={opp}
            guess={guesses[viewRound][opp]}
            actual={item.actualCents}
            won={roundRes.kind === "win" ? roundRes.winner === opp : roundRes.kind === "tie"}
          />
        </div>

        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="rounded-xl border-[2.5px] border-night bg-white px-3.5 py-3 text-center font-display text-[15px] uppercase text-night"
        >
          {banner}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="text-center text-[12px] italic leading-snug text-night/55"
        >
          “{item.zinger}”
        </motion.p>

        {isFinalRound ? (
          <p className="pt-1 text-center font-mono text-[11px] font-bold uppercase text-night/40">
            Tallying the match…
          </p>
        ) : (
          <motion.button
            type="button"
            onClick={() => setViewRound((v) => v + 1)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="w-full rounded-2xl border-[3px] border-night bg-hot py-4 font-display text-[16px] uppercase text-white shadow-brut transition"
          >
            Next expense → (round {viewRound + 2}/{ROUNDS})
          </motion.button>
        )}
      </div>
    );
  }

  // ---------------- guess screen ----------------
  return (
    <div className="flex flex-col gap-4 py-2">
      <RoundBar round={viewRound} score={score} me={me} opp={opp} />

      <div className="rounded-2xl border-[3px] border-night bg-white p-4 shadow-brut-md">
        <div className="flex items-center gap-2">
          <span className="text-3xl">{item.emoji}</span>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-night/50">
            {item.merchant}
          </span>
        </div>
        <p className="mt-2 font-display text-[17px] uppercase leading-tight text-night">
          {item.blurb}
        </p>
      </div>

      <div className="flex items-center justify-between rounded-xl border-[2.5px] border-night bg-cream px-3.5 py-2.5">
        <span className="font-mono text-[11px] font-bold text-night/60">POT — WINNER TAKES IT</span>
        <span className="font-display text-[15px] text-hot">{chips(pot)}</span>
      </div>

      {iLocked ? (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <p className="text-[13px] text-night/70">
            Locked <b className="font-display">{usd0(guesses[viewRound][me])}</b>. Waiting for{" "}
            {opp}…
          </p>
          <span className="font-mono text-[11px] text-night/40">No takebacks · no peeking</span>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 rounded-2xl border-[3px] border-night bg-white px-4 py-3 shadow-brut-md focus-within:-translate-y-0.5 focus-within:shadow-brut transition">
            <span className="font-display text-3xl text-night">$</span>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value.replace(/[^0-9.]/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && lockIn()}
              placeholder="0"
              inputMode="decimal"
              autoFocus
              className="w-full bg-transparent font-display text-3xl text-night outline-none placeholder:text-night/25"
            />
          </div>
          <motion.button
            type="button"
            onClick={lockIn}
            disabled={!draft.trim()}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="w-full rounded-2xl border-[3px] border-night bg-acid py-4 font-display text-[16px] uppercase text-night shadow-brut transition disabled:opacity-40"
          >
            Lock in the guess ⚡
          </motion.button>
          <p className="text-center text-[11px] font-medium text-night/50">
            Closest <b>without going over</b> takes the round. Overbid and you’re out.
          </p>
        </>
      )}

      <p className="flex items-start gap-1.5 rounded-xl border-[2.5px] border-night bg-white px-3.5 py-2.5 text-[11px] font-medium leading-snug text-night">
        <span>🛡</span>
        <span>
          Stakes are house-funded bonus chips — your allowance is never on the line. The winner
          takes the pot from the company pool.
        </span>
      </p>
    </div>
  );
}

function RoundBar({
  round,
  score,
  me,
  opp,
}: {
  round: number;
  score: { mine: number; theirs: number };
  me: string;
  opp: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: ROUNDS }).map((_, i) => (
          <span
            key={i}
            className={`h-2.5 w-2.5 rounded-full border-2 border-night ${
              i < round ? "bg-night" : i === round ? "bg-hot" : "bg-white"
            }`}
          />
        ))}
        <span className="ml-1 font-mono text-[10px] font-bold uppercase text-night/50">
          Round {Math.min(round + 1, ROUNDS)}/{ROUNDS}
        </span>
      </div>
      <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-night">
        <span className="rounded-full border-2 border-night bg-acid px-2 py-0.5">
          You {score.mine}
        </span>
        <span className="rounded-full border-2 border-night bg-white px-2 py-0.5">
          {opp} {score.theirs}
        </span>
      </div>
    </div>
  );
}

function GuessTag({
  who,
  guess,
  actual,
  won,
}: {
  who: string;
  guess: number;
  actual: number;
  won: boolean;
}) {
  const over = guess > actual;
  const delta = Math.abs(actual - guess);
  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 240, damping: 16, delay: 0.5 }}
      className={`flex flex-col items-center gap-0.5 rounded-xl border-[2.5px] border-night py-3 ${
        won ? "bg-acid" : over ? "bg-white opacity-70" : "bg-white"
      }`}
    >
      <span className="w-full truncate px-1 text-center font-display text-[10px] uppercase text-night">
        {who}
      </span>
      <span className="font-mono text-[15px] font-bold text-night">{usd0(guess)}</span>
      <span className={`font-mono text-[10px] font-bold uppercase ${over ? "text-hot" : "text-night/55"}`}>
        {over ? "OVER 💥" : `−${usd0(delta)} under`}
      </span>
    </motion.div>
  );
}
