import Link from "next/link";
import { Section, NeoCard } from "@/components/ui";
import { GAME_MODES } from "@/lib/landing";

const toneClass: Record<string, string> = {
  night: "bg-slate text-white",
  acid: "bg-acid text-night",
  white: "bg-white text-night",
  hot: "bg-hot text-white",
};

const chipOnTone: Record<string, string> = {
  night: "border-white/40 bg-white/10 text-white",
  acid: "border-night/30 bg-night/10 text-night",
  white: "border-night/25 bg-night/5 text-night",
  hot: "border-white/40 bg-white/15 text-white",
};

export function GameModes() {
  return (
    <Section id="games" tone="night">
      <div className="mb-9 flex flex-wrap items-baseline gap-4">
        <h2 className="font-display text-[32px] uppercase md:text-[38px]">Game Modes</h2>
        <span className="text-[15px] font-medium text-white/50">
          Pick your weapon. Live games launch a duel — the rest are coming soon.
        </span>
      </div>
      <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
        {GAME_MODES.map((g) => {
          const playable = "href" in g && Boolean(g.href);
          const span = g.span === 2 ? "sm:col-span-2" : "";
          const card = (
            <NeoCard
              shadowSize={6}
              className={`${toneClass[g.tone]} flex h-full flex-col gap-2.5 p-5 ${
                playable
                  ? "transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
                  : "opacity-55"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-[30px]" aria-hidden>
                  {g.icon}
                </div>
                <span
                  className={`shrink-0 rounded-md border-2 px-2 py-1 font-display text-[10px] uppercase tracking-wide ${chipOnTone[g.tone]}`}
                >
                  {playable ? "Play ▸" : "Soon"}
                </span>
              </div>
              <div className="font-display text-[15px] leading-tight">{g.title}</div>
              <p className="text-[13px] leading-relaxed opacity-85">{g.body}</p>
            </NeoCard>
          );

          if (playable) {
            return (
              <Link
                key={g.title}
                href={g.href!}
                className={`${span} min-h-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acid`}
              >
                {card}
              </Link>
            );
          }

          return (
            <div
              key={g.title}
              className={`${span} cursor-default`}
              aria-disabled="true"
              title="Coming soon"
            >
              {card}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
