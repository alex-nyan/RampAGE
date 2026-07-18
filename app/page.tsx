import { Ticker } from "@/components/ui";
import {
  Nav,
  Hero,
  SlackPreview,
  HowItWorks,
  GameModes,
  Safety,
  Leaderboard,
  FooterCta,
} from "@/components/landing";
import { TICKER_ONE, TICKER_TWO } from "@/lib/landing";

// The Rampage landing — the QR / marketing front door. Sections live in
// components/landing/*; copy lives in lib/landing.ts. The hero "Start a Duel"
// button hits the same /api/rooms path Slack does.
export default function Landing() {
  return (
    <main className="min-w-0 overflow-x-hidden bg-acid font-body text-night">
      <Nav />
      <Hero />
      <SlackPreview />
      <HowItWorks />
      <GameModes />
      <Safety />
      <Leaderboard />
      <FooterCta />
      <Ticker text={TICKER_ONE} speed={30} tone="light" />
      <Ticker text={TICKER_TWO} speed={40} tone="acid" />
    </main>
  );
}
