import { NeoButton, NeoCard, Badge, Pill } from "@/components/ui";
import { HERO_PILLS, MINE_TILES, LEADERS } from "@/lib/landing";

export function Hero() {
  return (
    <section
      id="product"
      className="mx-auto grid max-w-[1440px] items-center gap-12 px-6 py-16 md:px-12 lg:grid-cols-[1.05fr_.95fr] lg:py-24"
    >
      <div>
        <Badge className="mb-6">⚡ RAMP HACKATHON 2026</Badge>
        <h1 className="mb-6 font-display text-[44px] uppercase leading-[1.02] md:text-[64px]">
          Corporate spend, but make it{" "}
          <span className="inline-block -rotate-2 rounded-[10px] bg-night px-3 text-acid">
            PvP.
          </span>
        </h1>
        <p className="mb-8 max-w-[560px] text-[18px] font-medium leading-relaxed">
          Rampage turns company-funded perks into multiplayer challenges. Coworkers duel over
          dinners, outings, and team allowances through skill-based games, while Ramp keeps budgets,
          approvals, receipts, and controls intact.
        </p>
        <div className="mb-7 flex flex-wrap gap-3.5">
          <NeoButton href="/game/new?game=mines" size="lg">
            Start a Duel ▸
          </NeoButton>
          <NeoButton href="#how" size="lg" variant="ghost">
            Watch Demo
          </NeoButton>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {HERO_PILLS.map((p) => (
            <Pill key={p}>{p}</Pill>
          ))}
        </div>
      </div>

      {/* product stack — three scattered cards */}
      <div className="relative flex flex-col items-stretch">
        <div className="pointer-events-none absolute -inset-x-16 -inset-y-10 bg-[radial-gradient(circle_at_60%_40%,rgba(255,255,255,.55),transparent_60%)]" />

        {/* slackbot setup card */}
        <NeoCard tilt={-2} className="relative z-[1] w-[min(400px,100%)] self-start bg-white p-5">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="grid h-[34px] w-[34px] place-items-center rounded-[9px] bg-night font-display text-[15px] text-acid">
              R
            </div>
            <div>
              <div className="text-[14px] font-bold">
                rampage{" "}
                <span className="rounded bg-black/10 px-1.5 py-0.5 text-[10px] font-medium">APP</span>
              </div>
              <div className="text-[11px] text-black/50">#intern-chaos · Slack</div>
            </div>
          </div>
          <div className="mb-2.5 font-display text-[13px]">⚔ DUEL PROPOSED</div>
          <div className="grid gap-1.5 text-[13px]">
            {[
              ["Challenge", "Most PRs merged this week"],
              ["Stake", "Friday intern dinner · $480"],
              ["Odds", "0.5× / 1.5×"],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between rounded-[9px] border-2 border-night px-3 py-2"
              >
                <span className="text-black/50">{k}</span>
                <b>{v}</b>
              </div>
            ))}
          </div>
        </NeoCard>

        {/* live duel card */}
        <NeoCard
          tilt={2}
          shadow="rgba(10,10,10,.35)"
          className="animate-floaty relative z-[2] -mt-7 w-[min(340px,100%)] self-end bg-night p-5 text-white"
        >
          <div className="mb-3.5 flex items-center justify-between">
            <span className="font-display text-[13px] text-acid">MINES DUEL · LIVE</span>
            <span className="rounded-full bg-hot px-2.5 py-0.5 text-[11px] font-bold text-white">
              ● 14 watching
            </span>
          </div>
          <div className="mb-3.5 grid grid-cols-5 gap-1.5">
            {MINE_TILES.map((t, i) => (
              <div
                key={i}
                className="grid aspect-square place-items-center rounded-[7px] border-2 text-[15px]"
                style={{ background: t.bg, borderColor: t.border }}
              >
                {t.icon}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[12px]">
            <span>
              <b className="text-acid">@nyan</b> placing mines
            </span>
            <span>
              <b className="text-amber">@dev</b> revealing · 7 safe
            </span>
          </div>
        </NeoCard>

        {/* leaderboard card */}
        <NeoCard
          tilt={-1}
          shadow="#F2216E"
          className="relative z-[1] -mt-6 ml-6 w-[min(360px,100%)] self-start bg-white p-5"
        >
          <div className="mb-2.5 font-display text-[13px]">🏆 OFFICE LEADERBOARD</div>
          {LEADERS.map((l) => (
            <div
              key={l.rank}
              className="flex items-center gap-2.5 border-t-2 border-black/10 py-1.5 text-[13px]"
            >
              <span className="w-[22px] font-display text-[12px]">{l.rank}</span>
              <span
                className="h-[26px] w-[26px] rounded-full border-2 border-night"
                style={{ background: l.color }}
              />
              <b>{l.name}</b>
              <span className="ml-auto font-bold text-acid-ink">{l.won}</span>
            </div>
          ))}
        </NeoCard>
      </div>
    </section>
  );
}
