import Image from "next/image";
import { Section } from "@/components/ui";
import { INTEGRATIONS } from "@/lib/landing";

export function Integrations() {
  return (
    <Section id="integrations" tone="night" className="py-14">
      <div className="flex flex-wrap items-center justify-center gap-7">
        <span className="font-display text-[14px] text-acid">PLAYS NICE WITH</span>
        {INTEGRATIONS.map((i) => (
          <div
            key={i.name}
            className="flex items-center gap-3 rounded-[14px] border-[3px] border-[#333] px-6 py-3.5 transition-colors hover:border-acid"
          >
            {i.name === "Slack" || i.name === "Ramp" ? (
              <Image
                src={i.name === "Slack" ? "/slack.png" : "/ramp.png"}
                alt={`${i.name} logo`}
                width={34}
                height={34}
                className="h-[34px] w-[34px] rounded-[9px] border-2 border-night bg-white object-contain p-1"
              />
            ) : (
              <span
                className="grid h-[34px] w-[34px] place-items-center rounded-[9px] border-2 border-night font-display text-[14px] text-night"
                style={{ background: i.color }}
              >
                {i.glyph}
              </span>
            )}
            <div>
              <b className="text-[15px]">{i.name}</b>
              <div className="text-[11.5px] text-white/50">{i.note}</div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
