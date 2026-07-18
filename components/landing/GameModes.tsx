import Link from "next/link";
import { Section, NeoCard } from "@/components/ui";
import { GAME_MODES } from "@/lib/landing";

const toneClass: Record<string, string> = {
  night: "bg-night text-white",
  acid: "bg-acid text-night",
  white: "bg-white text-night",
  hot: "bg-hot text-white",
};

export function GameModes() {
  return (
    <Section id="games" tone="white">
      <div className="mb-9 flex flex-wrap items-baseline gap-4">
        <h2 className="font-display text-[32px] uppercase md:text-[38px]">Game Modes</h2>
        <span className="text-[15px] font-medium text-black/50">
          Pick your weapon. Every game settles a real perk.
        </span>
      </div>
      <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
        {GAME_MODES.map((g) => {
          const card = (
            <NeoCard
              shadowSize={6}
              className={`${toneClass[g.tone]} flex h-full flex-col gap-2.5 p-5 transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5`}
            >
              <div className="text-[30px]">{g.icon}</div>
              <div className="font-display text-[15px] leading-tight">{g.title}</div>
              <p className="text-[13px] leading-relaxed opacity-85">{g.body}</p>
            </NeoCard>
          );
          const span = g.span === 2 ? "sm:col-span-2" : "";
          if ("href" in g && g.href) {
            return (
              <Link key={g.title} href={g.href} className={span}>
                {card}
              </Link>
            );
          }
          return (
            <div key={g.title} className={span}>
              {card}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
