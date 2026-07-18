// Seed data — the demo never shows an empty state.
import type { GameMeta, PlayerStat, Txn } from "./types";

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
