// Single source of truth for shared shapes + brand. Never redeclare these.

// One-line brand flip. The site-wide neubrutalist landing is branded "Rampage".
export const APP_NAME = "Rampage";

// Every playable/registered game id. New game = add its id here + a registry entry.
export type GameId =
  | "receipt-blitz"
  | "fraudle"
  | "split-or-steal"
  | "wordle-duel"
  | "flip"
  | "mines"
  | "predict";

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

// --- Flip (fair coin, stake-weighted odds) ---
export type FlipState = {
  roomId: string;
  roll?: number;
  winner?: string;
};

// --- Mines (placer hides, checker clears) ---
export type MinesPhase = "roles" | "placing" | "probing" | "done";

export type MinesState = {
  roomId: string;
  phase: MinesPhase;
  placer: string;
  checker: string;
  mines: number[]; // length 5 after place; cell indices 0..35
  revealed: number[];
  hitMine?: number; // index that blew up, if any
  winner?: string;
};

export type MinesMove =
  | { type: "claim"; role: "placer" | "checker" }
  | { type: "place"; mines: number[] }
  | { type: "probe"; index: number }
  /** Full snapshot — preferred sync so late/missed events still converge. */
  | { type: "sync"; state: MinesState };

// --- Predict (LIVE multi-person prediction market) ---
// A shared, always-live board of hardcoded PUBLIC / EXTERNAL yes/no events.
// Anyone can bet their bonus chips on either side; the pool + implied odds move
// live for every viewer via Supabase realtime (no 1v1 room, no QR). Positive-sum
// — chips are house-granted bonus credit, never a personal allowance, and events
// settle on public data, never on a coworker's output.
export type PredictSide = "yes" | "no";

export type PredictEvent = {
  id: string;
  question: string;
  source: string; // how it resolves — public/external, keeps it defensible
  category: string; // Markets / Weather / AI / Office …
  closesLabel: string; // flavor, e.g. "Closes Fri 5pm"
  seedYesCents: number; // seeded crowd pool so the board is never empty
  seedNoCents: number;
};

// One live bet — broadcast to every viewer and shown in the ticker.
export type PredictBet = {
  eventId: string;
  side: PredictSide;
  amountCents: number;
  by: string; // display name
  at: number;
};

// Shared room events plus opaque per-game moves.
export type GameEvent =
  | { type: "stake"; by: string; label?: string; amountCents: number }
  | {
      type: "start";
      gameId: GameId;
      state: unknown;
      stakes: Record<string, number>;
      stakeLabels?: Record<string, string>;
    }
  | { type: "move"; by: string; data: unknown }
  | { type: "match"; attempt: MatchAttempt }
  | { type: "finish"; winner: string; scores: Record<string, number> };

export const TOTAL_ROUNDS = 1;
export const RECEIPTS_PER_ROUND = 8;
export const DEFAULT_BONUS_POOL_CENTS = 2500; // $25 slice of the weekly pool
