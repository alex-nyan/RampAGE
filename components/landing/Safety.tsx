import { Section, Badge } from "@/components/ui";
import { CONTROLS } from "@/lib/landing";

export function Safety() {
  return (
    <Section tone="cream">
      <div className="mx-auto mb-11 max-w-[720px] text-center">
        <Badge className="mb-4">🛡 FINANCE-TEAM APPROVED</Badge>
        <h2 className="mb-3 font-display text-[30px] uppercase leading-tight md:text-[38px]">
          All the chaos,
          <br />
          none of the accounting damage.
        </h2>
        <p className="mx-auto max-w-[620px] text-[16px] leading-relaxed text-black/55">
          Rampage only re-allocates perks that were already funded. Every control your finance team
          set up in Ramp stays exactly where it is.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {CONTROLS.map((c) => (
          <div
            key={c.title}
            className="flex items-start gap-3 rounded-[14px] border-[2.5px] border-night bg-white px-5 py-4"
          >
            <span className="grid h-7 w-7 flex-none place-items-center rounded-lg border-2 border-night bg-acid font-display text-[13px]">
              ✓
            </span>
            <div>
              <b className="text-[14.5px]">{c.title}</b>
              <div className="mt-0.5 text-[12.5px] leading-snug text-black/55">{c.body}</div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
