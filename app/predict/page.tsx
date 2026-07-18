"use client";

// Predict — the LIVE market. Not a 1v1 duel and no QR: everyone opens this same
// page, joins one shared Supabase realtime channel, and bets their bonus chips on
// hardcoded PUBLIC / EXTERNAL events. Pools + implied odds move live for every
// viewer (presence = "N live"). Positive-sum: chips are house-granted bonus
// credit — a personal allowance is never at stake — and events settle on public
// data, never on a coworker's output. See CLAUDE.md product frame.

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { joinRoom, sendEvent } from "@/lib/supabase";
import { PREDICT_EVENTS } from "@/lib/data";
import type { Player, PredictBet, PredictSide } from "@/lib/types";

const MARKET_ROOM = "predict-market-live";
const START_CHIPS = 50000; // ◆500 house-granted wallet
const STAKES = [10, 25, 50]; // chips per click
const chips = (c: number) => `◆${(c / 100).toFixed(0)}`;

// Ambient coworkers so the board visibly moves even before a second human joins
// (CLAUDE.md: seed fake data, never an empty demo). Local-only — real human bets
// broadcast and sync across browsers.
const CROWD = ["maya_k", "demo_dan", "rachel_o", "sam_dev", "priya", "leo_ops", "tess"];

export default function PredictMarket() {
  const [name, setName] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [wallet, setWallet] = useState(START_CHIPS);
  const [stake, setStake] = useState(25);
  const [bets, setBets] = useState<PredictBet[]>([]);
  const [viewers, setViewers] = useState<Player[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    setName(sessionStorage.getItem("rampage_name"));
    const saved = Number(localStorage.getItem("rampage_chips"));
    if (saved > 0) setWallet(saved);
  }, []);

  // one shared channel for the whole market
  useEffect(() => {
    if (!name) return;
    const ch = joinRoom(MARKET_ROOM, name, {
      onEvent: (raw) => {
        const b = raw as PredictBet;
        if (b?.eventId && (b.side === "yes" || b.side === "no")) setBets((p) => [...p, b]);
      },
      onPlayers: setViewers,
    });
    channelRef.current = ch;
    return () => {
      ch.unsubscribe();
    };
  }, [name]);

  useEffect(() => {
    if (name) localStorage.setItem("rampage_chips", String(wallet));
  }, [wallet, name]);

  // ambient crowd — a coworker drips a small bet every ~2.6s (local only)
  useEffect(() => {
    if (!name) return;
    const t = setInterval(() => {
      const ev = PREDICT_EVENTS[Math.floor(Math.random() * PREDICT_EVENTS.length)];
      const bet: PredictBet = {
        eventId: ev.id,
        side: Math.random() < 0.5 ? "yes" : "no",
        amountCents: (1 + Math.floor(Math.random() * 5)) * 500, // ◆5–◆25
        by: CROWD[Math.floor(Math.random() * CROWD.length)],
        at: Date.now(),
      };
      setBets((p) => [...p.slice(-120), bet]);
    }, 2600);
    return () => clearInterval(t);
  }, [name]);

  // pools = seed + every bet
  const pools = useMemo(() => {
    const map: Record<string, { yes: number; no: number }> = {};
    for (const e of PREDICT_EVENTS) map[e.id] = { yes: e.seedYesCents, no: e.seedNoCents };
    for (const b of bets) {
      const p = map[b.eventId];
      if (p) p[b.side] += b.amountCents;
    }
    return map;
  }, [bets]);

  const myPos = useMemo(() => {
    const map: Record<string, { yes: number; no: number }> = {};
    for (const b of bets) {
      if (b.by !== name) continue;
      (map[b.eventId] ??= { yes: 0, no: 0 })[b.side] += b.amountCents;
    }
    return map;
  }, [bets, name]);

  const feed = useMemo(() => [...bets].reverse().slice(0, 7), [bets]);

  function bet(eventId: string, side: PredictSide) {
    if (!name) return;
    const cents = stake * 100;
    if (cents > wallet) {
      flash("Out of chips — top up from the house pot 👇");
      return;
    }
    const b: PredictBet = { eventId, side, amountCents: cents, by: name, at: Date.now() };
    setWallet((w) => w - cents);
    setBets((p) => [...p, b]); // self:false → won't echo back; apply locally
    if (channelRef.current) sendEvent(channelRef.current, b);
    flash(`You bet ${chips(cents)} on ${side.toUpperCase()}`);
  }

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 1800);
  }

  function enter() {
    const n = draft.trim();
    if (!n) return;
    sessionStorage.setItem("rampage_name", n);
    setName(n);
  }

  // ---------- name gate ----------
  if (!name)
    return (
      <main className="grid min-h-screen place-items-center bg-night px-6 font-body">
        <div className="w-full max-w-[440px] text-center">
          <div className="mb-2 font-display text-[12px] uppercase tracking-widest text-hot">
            ● Live market
          </div>
          <h1 className="mb-2 font-display text-[34px] uppercase text-acid">Predict</h1>
          <p className="mb-5 text-[13px] text-white/60">
            Bet house-granted bonus chips on public events. Your allowance is never at stake.
          </p>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && enter()}
            placeholder="your display name"
            autoFocus
            className="mb-4 w-full rounded-2xl border-[3px] border-acid bg-night px-5 py-4 text-center font-mono text-[18px] text-acid outline-none placeholder:text-acid/35 shadow-[6px_6px_0_#e4f222]"
          />
          <button
            onClick={enter}
            disabled={!draft.trim()}
            className="w-full rounded-2xl border-[3px] border-night bg-acid py-4 font-display text-[18px] uppercase text-night shadow-[6px_6px_0_#0a0a0a] transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            Enter the market 📈
          </button>
        </div>
      </main>
    );

  // ---------- live market ----------
  return (
    <main className="flex min-h-screen justify-center bg-acid font-body text-night">
      <div className="relative flex min-h-screen w-full max-w-[560px] flex-col gap-4 border-x-4 border-night bg-white px-5 pb-28 pt-6">
        {/* top bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            aria-label="Back to the arena"
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-night bg-white transition hover:bg-acid"
          >
            ←
          </Link>
          <span className="flex items-center gap-1.5 rounded-full border-2 border-night bg-hot px-2.5 py-1 font-mono text-[11px] font-bold text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            {viewers.length || 1} LIVE
          </span>
        </div>

        <div>
          <h1 className="font-display text-[30px] uppercase leading-none">
            Predict<span className="text-hot">.</span>
          </h1>
          <p className="mt-1 text-[12px] font-medium text-night/55">
            The whole office bets on public events — pools move live. Chips are house-granted;
            nobody&apos;s allowance is on the line.
          </p>
        </div>

        {/* live ticker */}
        <div className="overflow-hidden rounded-xl border-[2.5px] border-night bg-cream">
          <div className="flex flex-col divide-y-2 divide-night/10">
            <AnimatePresence initial={false}>
              {feed.slice(0, 3).map((b) => {
                const ev = PREDICT_EVENTS.find((e) => e.id === b.eventId);
                return (
                  <motion.div
                    key={`${b.by}-${b.at}-${b.eventId}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 px-3 py-1.5 text-[11px]"
                  >
                    <span className="font-mono font-bold">{b.by === name ? "you" : b.by}</span>
                    <span className="text-night/50">bet</span>
                    <span className="font-mono font-bold text-hot">{chips(b.amountCents)}</span>
                    <span
                      className={`rounded px-1.5 font-display text-[9px] uppercase ${
                        b.side === "yes" ? "bg-acid text-night" : "bg-hot text-white"
                      }`}
                    >
                      {b.side}
                    </span>
                    <span className="truncate text-night/45">· {ev?.category}</span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* events */}
        <div className="flex flex-col gap-3">
          {PREDICT_EVENTS.map((e) => {
            const pool = pools[e.id];
            const total = pool.yes + pool.no;
            const yesPct = total ? Math.round((pool.yes / total) * 100) : 50;
            const mine = myPos[e.id];
            return (
              <div
                key={e.id}
                className="rounded-2xl border-[3px] border-night bg-white p-4 shadow-[6px_6px_0_#0a0a0a]"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full border-2 border-night bg-cream px-2 py-0.5 font-display text-[9px] uppercase">
                    {e.category}
                  </span>
                  <span className="font-mono text-[10px] text-night/45">{e.closesLabel}</span>
                </div>
                <p className="mt-2 font-display text-[15px] uppercase leading-tight">{e.question}</p>
                <p className="mt-1 flex items-start gap-1 text-[10.5px] font-medium leading-snug text-night/50">
                  <span>🔗</span>
                  <span>{e.source}</span>
                </p>

                {/* live odds bar */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="w-9 font-mono text-[12px] font-bold text-acid-ink">{yesPct}%</span>
                  <div className="flex h-3 flex-1 overflow-hidden rounded-full border-2 border-night">
                    <motion.div
                      className="h-full bg-acid"
                      animate={{ width: `${yesPct}%` }}
                      transition={{ type: "spring", stiffness: 120, damping: 20 }}
                    />
                    <div className="h-full flex-1 bg-hot" />
                  </div>
                  <span className="w-9 text-right font-mono text-[12px] font-bold text-hot">
                    {100 - yesPct}%
                  </span>
                </div>
                <div className="mt-1 flex justify-between font-mono text-[10px] text-night/45">
                  <span>YES {chips(pool.yes)}</span>
                  <span>POOL {chips(total)}</span>
                  <span>NO {chips(pool.no)}</span>
                </div>

                {/* bet buttons */}
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => bet(e.id, "yes")}
                    className="rounded-xl border-[3px] border-night bg-acid py-2.5 font-display text-[14px] uppercase text-night shadow-[3px_3px_0_#0a0a0a] transition hover:-translate-y-0.5"
                  >
                    Bet YES
                  </button>
                  <button
                    onClick={() => bet(e.id, "no")}
                    className="rounded-xl border-[3px] border-night bg-hot py-2.5 font-display text-[14px] uppercase text-white shadow-[3px_3px_0_#0a0a0a] transition hover:-translate-y-0.5"
                  >
                    Bet NO
                  </button>
                </div>
                {mine && (mine.yes > 0 || mine.no > 0) && (
                  <p className="mt-2 text-center font-mono text-[10px] text-night/55">
                    your position:{" "}
                    {mine.yes > 0 && <b className="text-acid-ink">{chips(mine.yes)} YES</b>}
                    {mine.yes > 0 && mine.no > 0 && " · "}
                    {mine.no > 0 && <b className="text-hot">{chips(mine.no)} NO</b>}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-1 flex items-start gap-1.5 rounded-xl border-[2.5px] border-night bg-cream px-3.5 py-2.5 text-[11px] font-medium leading-snug">
          <span>🛡</span>
          <span>
            Every event settles on public data — markets, weather, public leaderboards — never on a
            coworker&apos;s work or reactions. Correct side splits the pool from the house bonus fund.
          </span>
        </p>

        {/* sticky wallet + stake bar */}
        <div className="fixed inset-x-0 bottom-0 z-20 flex justify-center">
          <div className="flex w-full max-w-[560px] items-center gap-3 border-t-4 border-night bg-night px-5 py-3">
            <div className="flex flex-col">
              <span className="font-mono text-[9px] uppercase tracking-wider text-white/45">
                Your chips
              </span>
              <span className="font-display text-[18px] text-acid">{chips(wallet)}</span>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              {STAKES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStake(s)}
                  className={`rounded-lg border-2 px-2.5 py-1.5 font-mono text-[12px] font-bold transition ${
                    stake === s
                      ? "border-acid bg-acid text-night"
                      : "border-white/30 text-white/70 hover:border-acid"
                  }`}
                >
                  ◆{s}
                </button>
              ))}
              {wallet < 5000 && (
                <button
                  onClick={() => {
                    setWallet((w) => w + 20000);
                    flash("+◆200 from the house pot 🎁");
                  }}
                  className="rounded-lg border-2 border-hot bg-hot px-2.5 py-1.5 font-display text-[10px] uppercase text-white"
                >
                  Top up
                </button>
              )}
            </div>
          </div>
        </div>

        {/* toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="fixed bottom-20 left-1/2 z-30 -translate-x-1/2 rounded-full border-2 border-night bg-white px-4 py-2 font-mono text-[12px] font-bold shadow-[4px_4px_0_#0a0a0a]"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
