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

// --- Multiplayer rooms + realtime (broadcast/presence payloads) ---

export type RoomStatus = "pending" | "active" | "finished";

export type Player = { name: string; joinedAt: number };

export type Room = {
  id: string;
  status: RoomStatus;
  challenger_name: string;
  challenged_name: string | null;
  game: GameId;
  bonus_pool_cents: number;
  created_at?: string;
};

// --- Receipt Match Blitz ---
export type ReceiptCard = {
  id: string;
  merchant: string;
  amountCents: number;
  emoji: string;
};

export type TxnCard = {
  id: string;
  merchant: string; // slightly obfuscated on the card (e.g. "SQ *BLUE BOTTLE")
  amountCents: number;
  date: string;
};

export type MatchAttempt = {
  receiptId: string;
  txnId: string;
  by: string; // player display name
  at: number;
  correct: boolean;
};

export type GameState = {
  roomId: string;
  status: RoomStatus;
  round: number;
  receipts: ReceiptCard[];
  txns: TxnCard[]; // shuffled
  matched: Record<string, string>; // receiptId -> player who matched it
  scores: Record<string, number>;
  bonusPoolCents: number; // company-funded. Winner draws from THIS, never a coworker's allowance.
  winner?: string;
};

export type GameEvent =
  | { type: "start"; state: GameState }
  | { type: "match"; attempt: MatchAttempt }
  | { type: "finish"; winner: string; scores: Record<string, number> };

export const TOTAL_ROUNDS = 1;
export const RECEIPTS_PER_ROUND = 8;
export const DEFAULT_BONUS_POOL_CENTS = 2500; // $25 slice of the weekly pool
