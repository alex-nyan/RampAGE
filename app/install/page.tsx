import Image from "next/image";
import { Section, NeoButton, NeoCard } from "@/components/ui";

// Static "download / install the Slack bot" page. The landing's "Install in
// Slack" CTAs point here. Slack's OAuth URL 401s without a client_id, so we
// only render the real link when NEXT_PUBLIC_SLACK_CLIENT_ID is set (from
// api.slack.com → your app → Basic Information). Fallback: deep-link the
// already-installed workspace app so the demo button always does something.
const CLIENT_ID = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID;
const SLACK_INSTALL_URL = CLIENT_ID
  ? `https://slack.com/oauth/v2/authorize?client_id=${CLIENT_ID}&scope=commands,chat:write,users:read`
  : "slack://open"; // opens the Slack app — demo workspace already has Rampage installed

const STEPS = [
  ["Add Rampage to Slack", "One click installs the bot into your workspace."],
  ["Connect your perks", "Read-only hooks surface eligible dinners, outings, and allowances."],
  ["Challenge a coworker", "Type /rampage @teammate and a duel spins up in the thread."],
];

export default function Install() {
  return (
    <main className="min-h-screen bg-acid font-body text-night">
      <Section tone="acid" rule={false} className="text-center">
        <Image
          src="/logo.png"
          alt="Rampage"
          width={96}
          height={96}
          className="mx-auto mb-6 h-24 w-24 -rotate-3 rounded-3xl border-4 border-night object-cover shadow-hard"
          priority
        />
        <h1 className="mb-3 font-display text-[34px] uppercase md:text-[44px]">
          Install Rampage
        </h1>
        <p className="mx-auto mb-8 max-w-[520px] text-[16px] font-medium">
          Add the bot to your Slack workspace and start settling perks with duels — no new tools,
          right where the trash talk already happens.
        </p>
        <NeoButton href={SLACK_INSTALL_URL} size="lg">
          Add to Slack ▸
        </NeoButton>

        <div className="mx-auto mt-12 grid max-w-[900px] gap-4 text-left md:grid-cols-3">
          {STEPS.map(([title, body], i) => (
            <NeoCard key={title} className="bg-white p-5" shadowSize={6}>
              <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-night font-display text-[18px] text-acid">
                {i + 1}
              </div>
              <div className="mb-1.5 font-display text-[14px]">{title}</div>
              <p className="text-[13px] leading-relaxed text-black/60">{body}</p>
            </NeoCard>
          ))}
        </div>

        <div className="mt-12">
          <NeoButton href="/" size="sm" variant="ghost">
            ← Back to home
          </NeoButton>
        </div>
      </Section>
    </main>
  );
}
