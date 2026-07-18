// Seed data — the demo never shows an empty state.
import type { GameMeta, PlayerStat, PredictEvent, PriceItem, Txn } from "./types";

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
  {
    id: "price-is-ramp",
    name: "The Price Is Ramp",
    blurb: "Guess the expense · closest without going over wins · 1v1",
    badge: { label: "CHALLENGE", tone: "amber" },
    live: true, // no href — lobby creates a room
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

// The Price Is Ramp — a deck of real-ish company expenses to price. Each match
// pulls a shuffled few; closest guess without going over takes the round. Numbers
// are plausible-but-surprising on purpose — that's the whole game.
export const PRICE_ITEMS: PriceItem[] = [
  {
    id: "p_wework",
    merchant: "WEWORK OBLIGATIONS LLC",
    emoji: "🏢",
    blurb: "10 hot desks at WeWork for the “quick” team offsite — one day.",
    actualCents: 59000,
    zinger: "Day passes run ~$59 a head. Ten heads, one offsite nobody remembers.",
  },
  {
    id: "p_doordash",
    merchant: "DOORDASH *TEAM DINNER",
    emoji: "🥡",
    blurb: "Team dinner via DoorDash — 12 people, extra guac all around.",
    actualCents: 48732,
    zinger: "$34 a head, plus fees, service, and a driver who earned every cent.",
  },
  {
    id: "p_aws",
    merchant: "AMAZON WEB SERVICES",
    emoji: "☁️",
    blurb: "One month of the “we’ll optimize it later” AWS bill.",
    actualCents: 421300,
    zinger: "Nobody turned off the staging cluster. Nobody ever does.",
  },
  {
    id: "p_notion",
    merchant: "NOTION LABS INC",
    emoji: "📝",
    blurb: "Annual Notion seats for the whole 40-person team.",
    actualCents: 480000,
    zinger: "$10 a seat a month. Half of them use it as a to-do list.",
  },
  {
    id: "p_espresso",
    merchant: "LA MARZOCCO USA",
    emoji: "☕️",
    blurb: "The office espresso machine finance “pushed back on.”",
    actualCents: 189900,
    zinger: "A La Marzocco Linea Mini. Worth it. Don’t @ the finance team.",
  },
  {
    id: "p_bluebottle",
    merchant: "SQ *BLUE BOTTLE",
    emoji: "🧋",
    blurb: "Blue Bottle run for the 9am standup — 8 drinks.",
    actualCents: 5400,
    zinger: "$6.75 a cup. Cold brew’s extra. It’s always extra.",
  },
  {
    id: "p_uber",
    merchant: "UBER *TRIP",
    emoji: "🚕",
    blurb: "Airport Uber, 5pm on a Friday, surge included.",
    actualCents: 8840,
    zinger: "Base fare was $42. The 2.1x surge did the rest.",
  },
  {
    id: "p_swag",
    merchant: "CUSTOMINK *SWAG",
    emoji: "🧥",
    blurb: "50 branded hoodies for the all-hands.",
    actualCents: 225000,
    zinger: "$45 a hoodie. Half will end up on someone’s dog.",
  },
  {
    id: "p_datadog",
    merchant: "DATADOG INC",
    emoji: "📊",
    blurb: "A month of Datadog after we added “just a few” custom metrics.",
    actualCents: 341000,
    zinger: "Custom metrics are $5 each. There were not a few.",
  },
  {
    id: "p_steak",
    merchant: "TST* THE STEAKHOUSE",
    emoji: "🥩",
    blurb: "Client dinner, steakhouse, 4 people — someone ordered the wagyu.",
    actualCents: 61200,
    zinger: "The wagyu was $140 of it. The client was worth it. Probably.",
  },
  {
    id: "p_figma",
    merchant: "FIGMA INC",
    emoji: "🎨",
    blurb: "Figma editor seats for the design team of 6 — annual.",
    actualCents: 108000,
    zinger: "$15 an editor a month. Viewers are free; editors are not.",
  },
  {
    id: "p_superhuman",
    merchant: "SUPERHUMAN LABS",
    emoji: "📬",
    blurb: "One Superhuman seat, annual, for the exec who loves inbox zero.",
    actualCents: 36000,
    zinger: "$30 a month to feel fast. It is, honestly, quite fast.",
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
