// All copy + data for the marketing landing. Edit here, not in the JSX — the
// section components in components/landing/ just render these arrays.

export const HERO_PILLS = [
  "💬 Slack-native",
  "🧾 Ramp-connected",
  "🔍 GitHub-aware",
  "🛡 Budget-safe",
];

// Live "mines duel" preview grid: 0 = hidden tile, 1 = mine hit, 2 = safe pick.
const MINE_CODES = [0, 0, 1, 0, 2, 2, 0, 0, 0, 1, 0, 2, 0, 0, 0] as const;
export const MINE_TILES = MINE_CODES.map((v) =>
  v === 1
    ? { bg: "#F2216E", border: "#F2216E", icon: "💥" }
    : v === 2
      ? { bg: "#E4F222", border: "#E4F222", icon: "✓" }
      : { bg: "#1E1E1E", border: "#333", icon: "" }
);

export const LEADERS = [
  { rank: "01", name: "@xikron", won: "3.5x dinners won", color: "#E4F222" },
  { rank: "02", name: "@maya", won: "2 offsites won", color: "#FDB515" },
  { rank: "03", name: "@nyan", won: "1 karaoke night", color: "#F2216E" },
];

export const STEPS = [
  {
    n: "1",
    title: "INSTALL THE SLACK BOT",
    body: "Add Rampage to your org in one click. It lives where the trash talk already happens.",
  },
  {
    n: "2",
    title: "CONNECT PERK SOURCES",
    body: "Read-only hooks into Slack, the GitHub API, and the Ramp API surface eligible outings, dinners, and allowances.",
  },
  {
    n: "3",
    title: "CHALLENGE COWORKERS",
    body: "Start duels tied to real company-funded perks and events. Winner takes the bigger slice — Ramp settles the rest.",
  },
];

// span/bg/fg mirror the original layout so the grid keeps its rhythm.
export const GAME_MODES = [
  {
    icon: "🎯",
    title: "CANDIDATE DUELS",
    body: "Binary prediction-style coworker competitions. Which AI tops the leaderboard this week? Who pushes the most PRs?",
    span: 2,
    tone: "night" as const,
  },
  {
    icon: "🕹",
    title: "MINIGAMES",
    body: "Game Pigeon-style quick matches — 8-ball, darts, word hunts. Low stakes, high drama.",
    span: 1,
    tone: "acid" as const,
  },
  {
    icon: "🤝",
    title: "SPLIT OR STEAL",
    body: "The classic trust game, but the pot is Thursday's team lunch budget.",
    span: 1,
    tone: "white" as const,
  },
  {
    icon: "🎵",
    title: "MUSIC MINI GAMES",
    body: "Guess the track, beat-match, playlist battles. Winner DJs the offsite.",
    span: 1,
    tone: "white" as const,
  },
  {
    icon: "🪙",
    title: "FLIP GAME",
    body: "Enter how much of your allowance you're willing to wager — odds adjust automatically.",
    span: 1,
    tone: "acid" as const,
  },
  {
    icon: "💣",
    title: "MINES DUEL",
    body: "One player places the mines, the other reveals tiles. Every safe pick raises the payout.",
    span: 1,
    tone: "hot" as const,
    href: "/game/new?game=mines",
  },
  {
    icon: "📈",
    title: "BINARY PREDICTION MARKET",
    body: "Settle on any measurable real-world result both parties agree on — verified through read-only data.",
    span: 1,
    tone: "night" as const,
  },
];

export const CONTROLS = [
  { title: "Budgets preserved", body: "Total spend never exceeds what finance already approved." },
  { title: "Merchant restrictions respected", body: "Card rules from Ramp apply to every winner's payout." },
  { title: "Approval flows intact", body: "Duels route through existing approval chains before settlement." },
  { title: "Receipts captured", body: "Every settled perk lands in Ramp with receipts attached." },
  { title: "Accounting categories maintained", body: "GL codes and categories carry through untouched." },
  { title: "Read-only integrations", body: "GitHub and Slack data is observed, never modified." },
];

// Full-section office leaderboard. `you` highlights the viewer's row. Prizes are
// house-sponsored bonus-pool credit, redeemable via Ramp.
export const LEADERBOARD_ROWS = [
  { rank: 1, name: "@xikron", chips: 1940, prize: "3.5 team dinners", streak: "🔥 7-win streak", color: "#E4F222" },
  { rank: 2, name: "@maya", chips: 1410, prize: "2 offsite passes", streak: "won last 3", color: "#FDB515" },
  { rank: 3, name: "@rachel_o", chips: 1180, prize: "1 karaoke night", streak: "clutch closer", color: "#F2216E" },
  { rank: 4, name: "@you", chips: 850, prize: "coffee runs", streak: "climbing ↑", color: "#fff", you: true },
  { rank: 5, name: "@sam_dev", chips: 790, prize: "lunch credit", streak: "rookie season", color: "#E4F222" },
];

// Headline stats above the board.
export const LEADERBOARD_STATS = [
  { label: "Bonus pool this week", value: "$4,200" },
  { label: "Duels settled", value: "312" },
  { label: "Chips in play", value: "6,170" },
];

export const TICKER_ONE = Array(4)
  .fill("RAMPAGE • SPEND PVP • SLACK DUELS • BUDGET SAFE • GITHUB CHALLENGES • CORPORATE CHAOS •")
  .join(" ");
export const TICKER_TWO = Array(4)
  .fill("PLAY FOR DINNER • PREDICTIVE DUELS • MINES • SPLIT OR STEAL • OFFICE LEADERBOARD •")
  .join(" ");
