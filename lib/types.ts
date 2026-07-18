// Single source of truth for shared shapes + brand. Never redeclare these.

// One-line brand flip. The imported design is branded "Perkade";
// change to "Rampage" here if we want the repo name in the UI.
export const APP_NAME = "Perkade";

export type GameId = "receipt-blitz" | "fraudle" | "split-or-steal";

export interface GameMeta {
  id: GameId;
  name: string;
  blurb: string;
  badge?: { label: string; tone: "green" | "amber" };
  href?: string; // present only when the game is actually playable
  live: boolean;
}

export interface Txn {
  id: string;
  amount: number;
  label: string;
  time: string;
  fraud?: boolean; // exactly one per deck is the policy violator
  reason?: string; // shown on reveal when this is the fraud
}

export interface PlayerStat {
  rank: number;
  name: string;
  chips: number;
  you?: boolean;
}
