import Image from "next/image";
import { NeoButton } from "@/components/ui";

const LINKS = [
  ["Product", "#product"],
  ["Games", "#games"],
  ["How it Works", "#how"],
  ["Integrations", "#integrations"],
  ["Docs", "#docs"],
];

export function Nav() {
  return (
    <nav className="sticky top-0 z-20 flex items-center gap-9 border-b-4 border-night bg-acid px-6 py-4 md:px-12">
      <div className="flex items-center gap-3">
        <Image
          src="/logo.png"
          alt="Rampage logo"
          width={52}
          height={52}
          className="h-[52px] w-[52px] rounded-xl border-[3px] border-night object-cover"
          priority
        />
        <span className="font-display text-[22px] tracking-wide">RAMPAGE</span>
      </div>
      <div className="ml-auto hidden gap-6 text-[14px] font-bold tracking-wide lg:flex">
        {LINKS.map(([label, href]) => (
          <a key={href} href={href} className="text-night hover:text-acid-ink">
            {label}
          </a>
        ))}
      </div>
      <NeoButton href="/install" size="sm" shadow="duel" className="ml-auto lg:ml-0">
        Install in Slack
      </NeoButton>
    </nav>
  );
}
