"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { APP_NAME, type GameMeta } from "@/lib/types";
import { GAMES, HOUSE_POT, YOU } from "@/lib/data";

const fmt = (n: number) => n.toLocaleString("en-US");

export default function Lobby() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  // The web challenge path — same room-creation code Slack hits. Slack is icing.
  async function startChallenge(gameId: string) {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        body: JSON.stringify({
          challengerName: sessionStorage.getItem("rampage_name") ?? "challenger",
          gameId,
        }),
      });
      const { room, error } = await res.json();
      if (error || !room) throw new Error(error ?? "no room");
      router.push(`/game/${room.id}`);
    } catch {
      alert("Couldn't create a room — is Supabase env set?");
      setCreating(false);
    }
  }

  return (
    <main className="flex min-h-screen justify-center bg-page">
      <div className="flex w-full max-w-[430px] flex-col gap-4 bg-paper px-5 pb-7 pt-16">
        {/* header */}
        <div className="flex items-center justify-between">
          <div className="text-[19px] font-extrabold tracking-tight">
            {APP_NAME}
            <span className="text-brand">.</span>
          </div>
          <div className="text-[11px] text-ink/45">powered by Ramp</div>
        </div>

        {/* house pot */}
        <div className="potpulse flex flex-col gap-1.5 rounded-2xl bg-ink p-[18px] text-white">
          <div className="text-[11px] font-semibold tracking-[0.08em] text-gold-deep">
            HOUSE BONUS POT
          </div>
          <div className="font-mono text-[30px] font-semibold text-gold">
            ◆ {fmt(HOUSE_POT)}
          </div>
          <div className="text-[11px] text-white/55">
            Sponsored chips — your allowance is never at stake.
          </div>
        </div>

        {/* games */}
        <div className="flex flex-1 flex-col gap-3">
          {GAMES.map((g, i) => (
            <GameCard
              key={g.id}
              game={g}
              index={i}
              onLaunch={g.live && !g.href ? () => startChallenge(g.id) : undefined}
              busy={creating && g.live && !g.href}
            />
          ))}
        </div>

        {/* footer stats */}
        <div className="flex items-center justify-between border-t border-line pt-3.5 text-[12px] text-ink/55">
          <span className="font-mono">You: ◆ {fmt(YOU.chips)}</span>
          <span>
            Rank #{YOU.rank} / {YOU.of}
          </span>
          <span className="font-semibold text-brand">+◆ {YOU.today} today</span>
        </div>
      </div>
    </main>
  );
}

function GameCard({
  game,
  index,
  onLaunch,
  busy,
}: {
  game: GameMeta;
  index: number;
  onLaunch?: () => void;
  busy?: boolean;
}) {
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index + 0.1, duration: 0.35 }}
      whileHover={game.live ? { y: -2 } : undefined}
      className={`group flex items-center justify-between rounded-2xl border border-line bg-card p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-colors ${
        game.live
          ? "cursor-pointer hover:border-brand"
          : "cursor-default opacity-[0.72]"
      }`}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-bold">{game.name}</span>
          {game.badge && (
            <span
              className={`rounded-full px-[7px] py-0.5 text-[10px] font-semibold ${
                game.badge.tone === "green"
                  ? "bg-brand-soft text-brand"
                  : "bg-gold-soft text-gold-ink"
              }`}
            >
              {game.badge.label}
            </span>
          )}
          {!game.live && (
            <span className="rounded-full bg-ink/[0.06] px-[7px] py-0.5 text-[10px] font-semibold text-ink/45">
              SOON
            </span>
          )}
        </div>
        <div className="text-[12px] text-ink/55">{busy ? "Opening room…" : game.blurb}</div>
      </div>
      <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-brand text-[13px] text-white transition-transform group-hover:translate-x-0.5">
        →
      </div>
    </motion.div>
  );

  if (game.live && game.href) {
    return <Link href={game.href}>{inner}</Link>;
  }
  if (game.live && onLaunch) {
    return (
      <button onClick={onLaunch} disabled={busy} className="text-left disabled:opacity-70">
        {inner}
      </button>
    );
  }
  return <div title="Coming soon">{inner}</div>;
}
