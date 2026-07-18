// Seed data — the demo never shows an empty state.
import type { GameMeta, PlayerStat, PredictEvent, Txn } from "./types";

export const HOUSE_POT = 12400;

export const YOU = { chips: 850, rank: 4, of: 23, today: 120 };

export const GAMES: GameMeta[] = [
  {
    id: "receipt-blitz",
    name: "Receipt Blitz",
    blurb: "Match receipts to transactions · 1v1",
    badge: { label: "CHALLENGE", tone: "amber" },
    live: true, // no href — the lobby creates a room and routes both players in
  },
  {
    id: "fraudle",
    name: "Fraudle",
    blurb: "Spot the policy-violating transaction",
    badge: { label: "DAILY", tone: "green" },
    href: "/game/fraudle",
    live: true,
  },
  {
    id: "mines",
    name: "Mines Duel",
    blurb: "Placer hides 5 mines · checker clears the 6×6",
    badge: { label: "CHALLENGE", tone: "amber" },
    live: true,
  },
  {
    id: "flip",
    name: "Flip",
    blurb: "Stake-weighted coin · odds auto-adjust · 10s",
    badge: { label: "CHALLENGE", tone: "amber" },
    live: true, // no href — lobby creates a room
  },
  {
    id: "split-or-steal",
    name: "Split or Steal",
    blurb: "Trust game · split the bonus lunch pot or gamble for it all",
    badge: { label: "CHALLENGE", tone: "amber" },
    href: "/game/split-or-steal",
    live: true,
  },
  {
    id: "predict",
    name: "Predict",
    blurb: "Live market · bet chips on public events · the whole office plays",
    badge: { label: "LIVE", tone: "green" },
    href: "/predict",
    live: true,
  },
];

// Predict — the LIVE market board. Every event is opt-in and settles on a
// PUBLIC / EXTERNAL outcome (markets, weather, public leaderboards, communal
// stuff) — never on a coworker's work, output, or reactions. Pools are seeded
// so the board is never empty; the whole office bets their bonus chips live.
export const PREDICT_EVENTS: PredictEvent[] = [
  {
    id: "hackathon_midnight",
    question: "Will this hackathon run past midnight?",
    source: "An opt-in team over/under — public, no surveillance.",
    category: "Office",
    closesLabel: "Closes 11:59pm",
    seedYesCents: 46000,
    seedNoCents: 14000,
  },
  {
    id: "btc_friday",
    question: "Will Bitcoin close above its Monday price this Friday?",
    source: "Settles on the public BTC/USD Friday close — an external market.",
    category: "Markets",
    closesLabel: "Closes Fri 4pm ET",
    seedYesCents: 52000,
    seedNoCents: 33500,
  },
  {
    id: "llm_arena",
    question: "Will an open-weights model top this week's public LLM arena?",
    source: "Settles on the public LMArena leaderboard — no coworker's work involved.",
    category: "AI",
    closesLabel: "Closes Fri 5pm",
    seedYesCents: 18500,
    seedNoCents: 41200,
  },
  {
    id: "sf_70",
    question: "Will it break 70°F in SF this weekend?",
    source: "Settles on the public NWS forecast — weather, not a person.",
    category: "Weather",
    closesLabel: "Closes Sat 9am",
    seedYesCents: 12000,
    seedNoCents: 28800,
  },
  {
    id: "office_plant",
    question: "Will the office plant still be alive on payday? 🌱",
    source: "Communal & opt-in — and it is, frankly, overdue for a watering.",
    category: "Office",
    closesLabel: "Closes payday",
    seedYesCents: 30500,
    seedNoCents: 9500,
  },
];

// Fraudle: 9 transactions, exactly one violates policy.
export const FRAUDLE_TXNS: Txn[] = [
  { id: "t1", amount: 42.1, label: "Team lunch", time: "Tue 12:04" },
  { id: "t2", amount: 180.0, label: "Conf ticket", time: "Mon 08:00" },
  { id: "t3", amount: 12.99, label: "SaaS seat", time: "Mon 09:12" },
  { id: "t4", amount: 38.2, label: "Taxi", time: "Fri 22:41" },
  {
    id: "t5",
    amount: 249.99,
    label: '"Office chair"',
    time: "Sat 21:16",
    fraud: true,
    reason:
      "Personal furniture billed as office equipment — and it landed on a Saturday night, over the $150 equipment cap. That's the policy violation.",
  },
  { id: "t6", amount: 6.5, label: "Coffee", time: "Wed 08:15" },
  { id: "t7", amount: 95.0, label: "Client dinner", time: "Thu 20:02" },
  { id: "t8", amount: 14.5, label: "Team coffee", time: "Tue 15:30" },
  { id: "t9", amount: 29.0, label: "Rideshare", time: "Fri 18:20" },
];

// Chips awarded for solving Fraudle on guess 1 / 2 / 3 (from the house pot).
export const FRAUDLE_REWARD: Record<number, number> = { 1: 100, 2: 60, 3: 30 };

export const LEADERBOARD: PlayerStat[] = [
  { rank: 1, name: "rachel_o", chips: 1940 },
  { rank: 2, name: "demo_dan", chips: 1410 },
  { rank: 3, name: "maya_k", chips: 1180 },
  { rank: 4, name: "YOU", chips: 850, you: true },
  { rank: 5, name: "sam_dev", chips: 790 },
];
