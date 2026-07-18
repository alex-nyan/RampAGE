import Image from "next/image";
import { Section, NeoButton } from "@/components/ui";

export function FooterCta() {
  return (
    <Section id="install" tone="acid" className="text-center">
      <Image
        src="/logo.png"
        alt="Rampage"
        width={110}
        height={110}
        className="mx-auto mb-6 h-[110px] w-[110px] -rotate-3 rounded-3xl border-4 border-night object-cover shadow-hard"
      />
      <h2 className="mb-3.5 font-display text-[36px] uppercase md:text-[44px]">Ready to Rumble?</h2>
      <p className="mb-7 text-[17px] font-medium">
        Your perks budget is already approved. Now make them fight for it.
      </p>
      <NeoButton href="/install" size="lg">
        Install in Slack ▸
      </NeoButton>
      <div id="docs" className="mt-10 text-[12.5px] font-medium text-acid-ink">
        Built at Ramp Hackathon 2026 · Rampage is a concept demo · No real budgets were harmed
      </div>
    </Section>
  );
}
