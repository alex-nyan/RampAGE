import { Section } from "@/components/ui";

export function SlackPreview() {
  return (
    <Section tone="night">
      <div className="grid items-center gap-14 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <div className="mb-3.5 font-display text-[12px] text-acid">💬 SLACK-NATIVE</div>
          <h2 className="mb-4 font-display text-[32px] uppercase leading-tight md:text-[38px]">
            Talk trash. <span className="text-acid">Start duels.</span> Never leave Slack.
          </h2>
          <p className="text-[16px] leading-relaxed text-white/70">
            One mention is all it takes. Our agent parses the challenge, picks the game, sets the
            stakes against a real Ramp-funded perk, and spins up a lobby — right in the thread.
          </p>
        </div>

        <div className="rounded-2xl border-[3px] border-[#333] bg-slate p-5 text-[14px]">
          <div className="mb-4 flex gap-2.5">
            <div className="h-9 w-9 flex-none rounded-lg border-2 border-night bg-amber" />
            <div>
              <b>xikron</b> <span className="text-[11px] text-white/45">11:37 AM</span>
              <div className="mt-1 leading-relaxed text-white/85">
                hey <MentionTag>@rampage</MentionTag> start a prediction duel with{" "}
                <MentionTag>@nyan</MentionTag> for who can get the most PRs merged this week at 0.5x /
                1.5x for Friday&apos;s Ramp NYC intern dinner
              </div>
            </div>
          </div>
          <div className="flex gap-2.5">
            <div className="grid h-9 w-9 flex-none place-items-center rounded-lg border-2 border-night bg-acid font-display text-[14px] text-night">
              R
            </div>
            <div className="flex-1">
              <b>rampage</b>{" "}
              <span className="rounded bg-[#333] px-1.5 py-0.5 text-[10px]">APP</span>{" "}
              <span className="text-[11px] text-white/45">11:37 AM</span>
              <div className="mt-2 rounded-xl border-2 border-acid bg-night p-4">
                <div className="mb-2.5 font-display text-[12px] text-acid">
                  ⚔ PREDICTION DUEL · MAYA vs NYAN
                </div>
                <div className="mb-3 grid grid-cols-2 gap-2 text-[12.5px]">
                  {[
                    ["Metric", "PRs merged · Mon–Fri"],
                    ["Game", "Binary prediction"],
                    ["Stake", "Intern dinner · Ramp NYC"],
                    ["Payout", "0.5× / 1.5× allowance"],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-lg border-2 border-[#333] px-2.5 py-2">
                      <span className="text-white/50">{k}</span>
                      <br />
                      <b>{v}</b>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <span className="rounded-lg bg-acid px-4 py-2 font-display text-[11px] text-night">
                    LAUNCH GAME
                  </span>
                  <span className="rounded-lg border-2 border-acid px-3.5 py-1.5 font-display text-[11px] text-acid">
                    ENABLE OBSERVER MODE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

function MentionTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-acid/10 px-1 text-acid">{children}</span>
  );
}
