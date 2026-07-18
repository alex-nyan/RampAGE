"use client";

// Predict — the LIVE market. Not a 1v1 duel and no QR: everyone opens this same
// page, joins one shared Supabase realtime channel, and places house-backed wagers on
// hardcoded PUBLIC / EXTERNAL events. Pools + implied odds move live for every
// viewer (presence = "N live"). Positive-sum: balances are house-funded
// credit — a personal allowance is never at stake — and events settle on public
// data, never on a coworker's output. See CLAUDE.md product frame.

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { joinRoom, sendEvent } from "@/lib/supabase";
import { PREDICT_EVENTS } from "@/lib/data";
import { Ticker } from "@/components/ui";
import { TICKER_TWO } from "@/lib/landing";
import type { Player, PredictBet, PredictSide } from "@/lib/types";

const MARKET_ROOM = "predict-market-live";
const REQUIRED_ORG_ID = process.env.NEXT_PUBLIC_RAMP_ORG_ID?.trim() || "RAMP-DEMO-2026";
const START_BALANCE_CENTS = 50000;
const WAGER_AMOUNTS = [10, 25, 50];
const money = (c: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);

// Ambient coworkers so the board visibly moves even before a second human joins
// (CLAUDE.md: seed fake data, never an empty demo). Local-only — real human bets
// broadcast and sync across browsers.
const CROWD = ["maya_k", "demo_dan", "rachel_o", "sam_dev", "priya", "leo_ops", "tess"];

export default function PredictMarket() {
  const [name, setName] = useState<string | null>(null);
  const [wallet, setWallet] = useState(START_BALANCE_CENTS);
  const [stake, setStake] = useState(25);
  const [bets, setBets] = useState<PredictBet[]>([]);
  const [viewers, setViewers] = useState<Player[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [orgId, setOrgId] = useState("");
  const [orgDraft, setOrgDraft] = useState("");
  const [orgError, setOrgError] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const orgConnected = Boolean(orgId && (!REQUIRED_ORG_ID || orgId === REQUIRED_ORG_ID));

  useEffect(() => {
    const savedName = sessionStorage.getItem("rampage_name");
    const marketName = savedName ?? `guest-${crypto.randomUUID().slice(0, 6)}`;
    sessionStorage.setItem("rampage_name", marketName);
    setName(marketName);
    const saved = Number(localStorage.getItem("rampage_market_balance"));
    if (saved > 0) setWallet(saved);
    const savedOrgId = sessionStorage.getItem("rampage_org_id") ?? "";
    setOrgId(savedOrgId);
    setOrgDraft(savedOrgId);
  }, []);

  // one shared channel for the whole market
  useEffect(() => {
    if (!name || !orgConnected) return;
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
  }, [name, orgConnected]);

  useEffect(() => {
    if (name) localStorage.setItem("rampage_market_balance", String(wallet));
  }, [wallet, name]);

  // ambient crowd — a coworker drips a small bet every ~2.6s (local only)
  useEffect(() => {
    if (!name || !orgConnected) return;
    const t = setInterval(() => {
      const ev = PREDICT_EVENTS[Math.floor(Math.random() * PREDICT_EVENTS.length)];
      const bet: PredictBet = {
        eventId: ev.id,
        side: Math.random() < 0.5 ? "yes" : "no",
        amountCents: (1 + Math.floor(Math.random() * 5)) * 500, // $5–$25
        by: CROWD[Math.floor(Math.random() * CROWD.length)],
        at: Date.now(),
      };
      setBets((p) => [...p.slice(-120), bet]);
    }, 2600);
    return () => clearInterval(t);
  }, [name, orgConnected]);

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
      flash("Insufficient balance — top up from the house fund 👇");
      return;
    }
    const b: PredictBet = { eventId, side, amountCents: cents, by: name, at: Date.now() };
    setWallet((w) => w - cents);
    setBets((p) => [...p, b]); // self:false → won't echo back; apply locally
    if (channelRef.current) sendEvent(channelRef.current, b);
    flash(`You wagered ${money(cents)} on ${side.toUpperCase()}`);
  }

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 1800);
  }

  function connectOrg(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextOrgId = orgDraft.trim();
    if (!nextOrgId || (REQUIRED_ORG_ID && nextOrgId !== REQUIRED_ORG_ID)) {
      setOrgError(true);
      return;
    }
    sessionStorage.setItem("rampage_org_id", nextOrgId);
    setOrgId(nextOrgId);
    setOrgError(false);
  }

  // ---------- live market ----------
  return (
    <main className="flex h-dvh min-w-0 flex-col overflow-hidden bg-night font-body text-acid">
      <nav className="relative z-20 flex items-center gap-2.5 border-b-4 border-acid bg-night px-5 py-2 sm:px-12">
        <Link href="/" className="flex items-center gap-2.5 text-acid">
          <Image
            src="/logo.png"
            alt="Rampage logo"
            width={40}
            height={40}
            priority
            className="h-10 w-10 rounded-[10px] border-[3px] border-acid object-cover"
          />
          <span className="font-display text-[18px] tracking-wide sm:text-[20px]">RAMPAGE</span>
        </Link>
        <span className="ml-auto flex items-center gap-1.5 rounded-full border-2 border-hot bg-hot/15 px-3 py-1.5 font-mono text-[10px] font-bold text-hot">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-hot" />
          {viewers.length || 1} LIVE
        </span>
      </nav>

      <section className="relative flex min-h-0 flex-1 items-start justify-center overflow-hidden px-5 py-4 sm:px-12 sm:py-5">
        <Image
          src="/background.png"
          alt=""
          fill
          priority
          aria-hidden="true"
          sizes="100vw"
          className="object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(10,10,10,.65) 0%, rgba(10,10,10,.82) 33.333%, rgba(10,10,10,1) 100%)",
          }}
        />

        <div className="relative flex w-full max-w-[680px] flex-col gap-2.5 pb-20">
          <div className="flex items-end justify-between gap-4 border-b-2 border-acid/35 pb-3">
            <div>
              <div className="mb-1 font-mono text-[10px] uppercase tracking-[.16em] text-acid/55">
                Live market
              </div>
              <h1 className="font-display text-[30px] uppercase leading-none text-acid">
                Predict<span className="text-hot">.</span>
              </h1>
            </div>
            <Link href="/game/new" className="font-mono text-[11px] font-bold text-acid/70 hover:text-acid">
              Other games →
            </Link>
          </div>
          <p className="text-[12px] font-medium text-white/60">
            The whole office wagers on public events and the pools move live. Every balance is
            house-funded; nobody&apos;s allowance is on the line.
          </p>

        {!orgConnected ? (
          <div className="mt-2 rounded-2xl border-[3px] border-acid bg-slate p-5 text-center text-white shadow-[6px_6px_0_rgba(228,242,34,.3)] sm:p-6">
            <div className="mb-2 text-[28px]" aria-hidden>🔒</div>
            <h2 className="font-display text-[18px] uppercase text-acid sm:text-[21px]">
              Connect your org-id to view open markets
            </h2>
            <p className="mx-auto mt-2 max-w-[480px] text-[12px] text-white/55">
              Open markets are available only to members of a connected organization.
            </p>
            <form onSubmit={connectOrg} className="mx-auto mt-4 flex max-w-[480px] flex-col gap-2 sm:flex-row">
              <input
                value={orgDraft}
                onChange={(event) => {
                  setOrgDraft(event.target.value);
                  setOrgError(false);
                }}
                placeholder="ENTER ORG ID"
                aria-label="Organization ID"
                autoComplete="off"
                className="min-w-0 flex-1 rounded-xl border-2 border-acid bg-night px-4 py-2.5 text-center font-mono text-[12px] uppercase tracking-wider text-acid outline-none placeholder:text-acid/30"
              />
              <button
                type="submit"
                className="rounded-xl border-2 border-acid bg-acid px-5 py-2.5 font-display text-[10px] uppercase text-night transition hover:bg-hot hover:text-white"
              >
                Connect ▸
              </button>
            </form>
            {orgError && (
              <p className="mt-3 font-mono text-[11px] font-bold text-hot">Invalid organization ID</p>
            )}
          </div>
        ) : (
          <>
        {/* live ticker */}
        <div className="overflow-hidden rounded-xl border-[2.5px] border-acid bg-slate text-white">
          <div className="flex flex-col divide-y-2 divide-white/10">
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
                    <span className="text-white/50">bet</span>
                    <span className="font-mono font-bold text-hot">{money(b.amountCents)}</span>
                    <span
                      className={`rounded px-1.5 font-display text-[9px] uppercase ${
                        b.side === "yes" ? "bg-acid text-night" : "bg-hot text-white"
                      }`}
                    >
                      {b.side}
                    </span>
                    <span className="truncate text-white/45">· {ev?.category}</span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* events */}
        <div className="no-scrollbar max-h-[430px] overflow-y-auto overscroll-contain pr-1">
          <div className="flex flex-col gap-2.5 pb-2">
          {PREDICT_EVENTS.map((e) => {
            const pool = pools[e.id];
            const total = pool.yes + pool.no;
            const yesPct = total ? Math.round((pool.yes / total) * 100) : 50;
            const mine = myPos[e.id];
            return (
              <div
                key={e.id}
                className="rounded-2xl border-[3px] border-acid bg-slate p-3 text-white shadow-[5px_5px_0_rgba(228,242,34,.3)]"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full border-2 border-acid bg-night px-2 py-0.5 font-display text-[9px] uppercase text-acid">
                    {e.category}
                  </span>
                  <span className="font-mono text-[10px] text-white/45">{e.closesLabel}</span>
                </div>
                <p className="mt-1.5 font-display text-[14px] uppercase leading-tight">{e.question}</p>
                <p className="mt-1 flex items-start gap-1 text-[10.5px] font-medium leading-snug text-white/50">
                  <span>🔗</span>
                  <span>{e.source}</span>
                </p>

                {/* live odds bar */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="w-9 font-mono text-[12px] font-bold text-acid">{yesPct}%</span>
                  <div className="flex h-3 flex-1 overflow-hidden rounded-full border-2 border-acid">
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
                <div className="mt-1 flex justify-between font-mono text-[10px] text-white/45">
                  <span>YES {money(pool.yes)}</span>
                  <span>POOL {money(total)}</span>
                  <span>NO {money(pool.no)}</span>
                </div>

                {/* bet buttons */}
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => bet(e.id, "yes")}
                    className="rounded-xl border-[3px] border-acid bg-acid py-2 font-display text-[13px] uppercase text-night shadow-[3px_3px_0_rgba(228,242,34,.3)] transition hover:-translate-y-0.5"
                  >
                    Bet YES
                  </button>
                  <button
                    onClick={() => bet(e.id, "no")}
                    className="rounded-xl border-[3px] border-hot bg-hot py-2 font-display text-[13px] uppercase text-white shadow-[3px_3px_0_rgba(242,33,110,.35)] transition hover:-translate-y-0.5"
                  >
                    Bet NO
                  </button>
                </div>
                {mine && (mine.yes > 0 || mine.no > 0) && (
                  <p className="mt-2 text-center font-mono text-[10px] text-white/55">
                    your position:{" "}
                    {mine.yes > 0 && <b className="text-acid">{money(mine.yes)} YES</b>}
                    {mine.yes > 0 && mine.no > 0 && " · "}
                    {mine.no > 0 && <b className="text-hot">{money(mine.no)} NO</b>}
                  </p>
                )}
              </div>
            );
          })}
          </div>
        </div>

        <p className="flex items-start gap-1.5 rounded-xl border-2 border-acid bg-slate px-3 py-2 text-[10px] font-medium leading-snug text-white/70">
          <span>🛡</span>
          <span>
            Every event settles on public data — markets, weather, public leaderboards — never on a
            coworker&apos;s work or reactions. Correct side splits the pool from the house bonus fund.
          </span>
        </p>
          </>
        )}

        {/* sticky wallet + stake bar */}
        {orgConnected && <div className="fixed inset-x-0 bottom-[26px] z-20 flex justify-center px-3">
          <div className="flex w-full max-w-[680px] items-center gap-3 rounded-t-xl border-x-[3px] border-t-[3px] border-acid bg-night px-4 py-2">
            <div className="flex flex-col">
              <span className="font-mono text-[9px] uppercase tracking-wider text-white/45">
                Your balance
              </span>
              <span className="font-display text-[16px] text-acid">{money(wallet)}</span>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              {WAGER_AMOUNTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStake(s)}
                  className={`rounded-lg border-2 px-2.5 py-1 font-mono text-[11px] font-bold transition ${
                    stake === s
                      ? "border-acid bg-acid text-night"
                      : "border-white/30 text-white/70 hover:border-acid"
                  }`}
                >
                  ${s}
                </button>
              ))}
              {wallet < 5000 && (
                <button
                  onClick={() => {
                    setWallet((w) => w + 20000);
                    flash("$200 added from the house fund 🎁");
                  }}
                  className="rounded-lg border-2 border-hot bg-hot px-2.5 py-1 font-display text-[9px] uppercase text-white"
                >
                  Top up
                </button>
              )}
            </div>
          </div>
        </div>}

        {/* toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="fixed bottom-24 left-1/2 z-30 -translate-x-1/2 rounded-full border-2 border-acid bg-slate px-4 py-2 font-mono text-[12px] font-bold text-white shadow-[4px_4px_0_rgba(228,242,34,.3)]"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </section>
      <Ticker text={TICKER_TWO} speed={40} tone="acid" className="relative z-20 border-t-2 border-[#333]" />
    </main>
  );
}
