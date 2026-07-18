// Stake + auto-odds helpers — shared by ALL games. Never redeclare per game.
// Positive-sum frame: stakes are bonus-pool credits; the pot is house-backed.

export const DEFAULT_STAKE_CENTS = 1000; // $10 default value until the player enters the real wager

export type PayoutMode = "chance" | "skill";

export function potCents(stakes: Record<string, number>): number {
  return Object.values(stakes).reduce((a, b) => a + b, 0);
}

// Contested amount for skill games: only 2× the smaller stake is on the line.
// Staking less caps your upside — you can't win the opponent's unmatched excess.
export function matchedPotCents(stakes: Record<string, number>): number {
  const vals = Object.values(stakes).filter((v) => v > 0);
  if (vals.length === 0) return 0;
  if (vals.length === 1) return vals[0];
  return 2 * Math.min(...vals);
}

// EV-fair win probability for a player who staked `mine` vs a pot including it:
// P(win) = mine / pot  →  EV = P*pot - mine = 0 for everyone, any stake split.
export function winProbability(mineCents: number, potTotalCents: number): number {
  if (potTotalCents <= 0) return 0.5;
  return mineCents / potTotalCents;
}

// Weighted winner pick for chance games (flip). Deterministic given `roll` in [0,1),
// so the flipping client broadcasts the roll and every client converges.
export function pickWinner(stakes: Record<string, number>, roll: number): string {
  const entries = Object.entries(stakes);
  const pot = potCents(stakes);
  if (!entries.length) return "";
  if (pot <= 0) return entries[Math.floor(roll * entries.length)][0];
  let acc = 0;
  for (const [name, stake] of entries) {
    acc += stake / pot;
    if (roll < acc) return name;
  }
  return entries[entries.length - 1][0];
}

// Chance (flip): winner takes full pot; fairness is via winProbability.
// Skill (mines, etc.): winner takes matched pot only — low stake ≠ full pot.
export function winnerPayoutCents(
  stakes: Record<string, number>,
  mode: PayoutMode = "skill"
): number {
  return mode === "chance" ? potCents(stakes) : matchedPotCents(stakes);
}

export function oddsLabel(
  stakes: Record<string, number>,
  me: string,
  mode: PayoutMode = "skill"
): string {
  const mine = stakes[me] ?? 0;
  if (!mine) return "";
  if (mode === "chance") {
    const pot = potCents(stakes);
    if (!pot) return "";
    const p = winProbability(mine, pot);
    return `stake $${(mine / 100).toFixed(2)} → ${(p * 100).toFixed(0)}% shot at $${(pot / 100).toFixed(2)}`;
  }
  const matched = matchedPotCents(stakes);
  const pot = potCents(stakes);
  const excess = Math.max(0, pot - matched);
  const base = `stake $${(mine / 100).toFixed(2)} → win $${(matched / 100).toFixed(2)}`;
  return excess > 0
    ? `${base} (matched; $${(excess / 100).toFixed(2)} excess sits out)`
    : base;
}
