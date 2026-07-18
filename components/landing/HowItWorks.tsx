import { Fragment } from "react";
import { Section, NeoCard } from "@/components/ui";
import { STEPS } from "@/lib/landing";

export function HowItWorks() {
  return (
    <Section id="how" tone="acid">
      <h2 className="mb-10 text-center font-display text-[32px] uppercase md:text-[38px]">
        How it Works
      </h2>
      <div className="grid items-stretch gap-5 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
        {STEPS.map((s, i) => (
          <Fragment key={s.n}>
            <NeoCard className="bg-white p-6" shadowSize={7}>
              <div className="mb-4 grid h-14 w-14 place-items-center rounded-[14px] bg-night font-display text-[30px] text-acid">
                {s.n}
              </div>
              <div className="mb-2.5 font-display text-[16px]">{s.title}</div>
              <p className="text-[14px] leading-relaxed text-black/70">{s.body}</p>
            </NeoCard>
            {i < STEPS.length - 1 && (
              <div className="hidden self-center font-display text-[28px] lg:block">▸</div>
            )}
          </Fragment>
        ))}
      </div>
    </Section>
  );
}
