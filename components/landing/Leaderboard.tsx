import Image from "next/image";
import { Section, NeoCard } from "@/components/ui";
import { LEADERBOARD_ROWS, LEADERBOARD_STATS } from "@/lib/landing";

const medal = ["🥇", "🥈", "🥉"];

export function Leaderboard() {
  return (
    <Section id="leaderboard" tone="night">
      <div className="mb-9 flex flex-wrap items-baseline gap-4">
        <h2 className="font-display text-[32px] uppercase md:text-[38px]">Office Leaderboard</h2>
        <span className="text-[15px] font-medium text-white/50">
          This week&apos;s highest-rated duelists.
        </span>
      </div>

      {/* headline stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {LEADERBOARD_STATS.map((s) => (
          <NeoCard key={s.label} shadowSize={6} className="bg-slate p-5 text-white">
            <div className="font-display text-[28px] text-acid md:text-[32px]">{s.value}</div>
            <div className="text-[12px] uppercase tracking-wide text-white/55">{s.label}</div>
          </NeoCard>
        ))}
      </div>

      {/* the board */}
      <NeoCard shadow="#F2216E" className="overflow-hidden bg-white text-night">
        {LEADERBOARD_ROWS.map((l, i) => (
          <div
            key={l.rank}
            className={`flex items-center gap-3 border-t-2 border-black/10 px-4 py-3.5 first:border-t-0 sm:gap-4 sm:px-6 ${
              l.you ? "bg-acid" : ""
            }`}
          >
            <span className="grid w-[34px] shrink-0 place-items-center font-display text-[18px]">
              {medal[i] ?? l.rank}
            </span>
            <Image
              src={l.avatar}
              alt={`${l.name} profile`}
              width={32}
              height={32}
              className="h-[32px] w-[32px] shrink-0 rounded-full border-2 border-night object-cover"
            />
            <div className="min-w-0">
              <b className="block truncate text-[15px]">
                {l.name}
                {l.you && <span className="ml-2 text-[11px] font-bold text-acid-ink">YOU</span>}
              </b>
              <div className="text-[11.5px] text-black/50">{l.streak}</div>
            </div>
            <div className="ml-auto shrink-0 text-right">
              <div className="font-display text-[18px] leading-none">
                {l.elo.toLocaleString()} <span className="text-[12px]">ELO</span>
              </div>
              <div className="text-[11.5px] text-black/50">🎁 {l.prize}</div>
            </div>
          </div>
        ))}
      </NeoCard>
    </Section>
  );
}
