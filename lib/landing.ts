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
  { rank: "01", name: "@xikron", won: "1,940 ELO", avatar: "/carrie.jpg" },
  { rank: "02", name: "@ishani", won: "1,410 ELO", avatar: "/ishani.jpeg" },
  { rank: "03", name: "@nyan", won: "1,180 ELO", avatar: "/nyan.jpeg" },
  { rank: "04", name: "@you", won: "850 ELO", avatar: "/gordon.jpeg" },
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

// span/tone keep the grid rhythm. `href` = playable now; omit = coming soon.
export const GAME_MODES = [
  {
    icon: "🎯",
    title: "CANDIDATE DUELS",
    body: "Binary prediction-style coworker competitions. Which AI tops the public leaderboard this week?",
    span: 2,
    tone: "night" as const,
    href: "/predict",
  },
  {
    icon: "🕹",
    title: "MINIGAMES",
    body: "Quick 1v1 matches — Receipt Blitz, Word Duel, The Price Is Ramp. Low stakes, high drama.",
    span: 1,
    tone: "acid" as const,
    href: "/game/new",
  },
  {
    icon: "🤝",
    title: "SPLIT OR STEAL",
    body: "The classic trust game, but the pot is Thursday's team lunch budget.",
    span: 1,
    tone: "white" as const,
    href: "/game/split-or-steal",
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
    href: "/game/new?game=flip",
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
    href: "/predict",
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

// Full-section office leaderboard. `you` highlights the viewer's row.
export const LEADERBOARD_ROWS = [
  { rank: 1, name: "@xikron", elo: 1940, prize: "3.5 team dinners", streak: "🔥 7-win streak", avatar: "/carrie.jpg" },
  { rank: 2, name: "@ishani", elo: 1410, prize: "2 offsite passes", streak: "won last 3", avatar: "/ishani.jpeg" },
  { rank: 3, name: "@nyan", elo: 1180, prize: "1 karaoke night", streak: "clutch closer", avatar: "/nyan.jpeg" },
  { rank: 4, name: "@you", elo: 850, prize: "coffee runs", streak: "climbing ↑", avatar: "/gordon.jpeg", you: true },
];

// Headline stats above the board.
export const LEADERBOARD_STATS = [
  { label: "Bonus pool this week", value: "$4,200" },
  { label: "Duels settled", value: "312" },
  { label: "ELO in play", value: "5,380" },
];

export const TICKER_ONE = Array(4)
  .fill("RAMPAGE • SPEND PVP • SLACK DUELS • BUDGET SAFE • GITHUB CHALLENGES • CORPORATE CHAOS •")
  .join(" ");
export const TICKER_TWO = Array(4)
  .fill("PLAY FOR DINNER • PREDICTIVE DUELS • MINES • SPLIT OR STEAL • OFFICE LEADERBOARD •")
  .join(" ");
