// Stake + auto-odds helpers — shared by ALL games. Never redeclare per game.
// Positive-sum frame: stakes are bonus-pool credits; the pot is house-backed.

export const DEFAULT_STAKE_CENTS = 1000; // ◆10 / $10 slice

export function potCents(stakes: Record<string, number>): number {
  return Object.values(stakes).reduce((a, b) => a + b, 0);
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

// For skill games the winner just takes the pot; use this to describe the odds line.
export function oddsLabel(stakes: Record<string, number>, me: string): string {
  const pot = potCents(stakes);
  const mine = stakes[me] ?? 0;
  if (!pot || !mine) return "";
  const multiple = pot / mine;
  return `stake ◆${(mine / 100).toFixed(0)} → win ◆${(pot / 100).toFixed(0)} (${multiple.toFixed(2)}x)`;
}
