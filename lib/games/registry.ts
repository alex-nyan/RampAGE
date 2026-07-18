// The ONE game registry. Add a game = component + entry here. Do NOT fork game/[roomId].
import type { ComponentType } from "react";
import type { GameId } from "@/lib/types";
import ReceiptBlitzGame, { initialReceiptBlitzState } from "@/components/games/receipt-blitz/Game";
import FlipGame, { initialFlipState } from "@/components/games/flip/Game";
import SplitOrStealGame, { initialSplitState } from "@/components/games/split-or-steal/Game";

// Props every game component receives from the room shell.
export type GameProps = {
  roomId: string;
  me: string;
  stakes: Record<string, number>;
  state: unknown; // initial state broadcast with the start event
  lastEvent: { by: string; data: unknown } | null; // last "move" from the other client
  send: (data: unknown) => void; // broadcast a move
  // payouts: optional per-player cents (split outcomes). Omitted = winner takes pot.
  onFinish: (winner: string, scores: Record<string, number>, payouts?: Record<string, number>) => void;
};

export type GameModule = {
  id: string;
  name: string;
  description: string;
  Component: ComponentType<GameProps>;
  initialState: (roomId: string) => unknown;
};

export const REGISTRY: Partial<Record<GameId | "flip", GameModule>> = {
  "receipt-blitz": {
    id: "receipt-blitz",
    name: "Receipt Blitz",
    description: "Match receipts to card transactions faster than your opponent.",
    Component: ReceiptBlitzGame,
    initialState: initialReceiptBlitzState,
  },
  flip: {
    id: "flip",
    name: "Flip",
    description: "Stake-weighted coin flip — odds auto-adjust so EV is fair.",
    Component: FlipGame,
    initialState: initialFlipState,
  },
  "split-or-steal": {
    id: "split-or-steal",
    name: "Split or Steal",
    description: "Trust game — both split the pot, or gamble on stealing it all.",
    Component: SplitOrStealGame,
    initialState: initialSplitState,
  },
};

export function getGame(gameId: string): GameModule {
  return REGISTRY[gameId as GameId] ?? REGISTRY["receipt-blitz"]!;
}
