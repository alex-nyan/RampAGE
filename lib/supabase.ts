import { createClient, type RealtimeChannel } from "@supabase/supabase-js";
import type { Player } from "./types";
import { DEFAULT_BONUS_POOL_CENTS } from "./types";

// Anon key is public by design (RLS is the boundary); defaults keep the demo
// working even if env vars are missing. Env vars override.
// Project: RampAGE (wxyuihxinyykgmcdzxde). `||` (not `??`) so an EMPTY env value
// still falls back — an empty NEXT_PUBLIC_SUPABASE_URL would otherwise break the client.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wxyuihxinyykgmcdzxde.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4eXVpaHhpbnl5a2dtY2R6eGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzODU4NDEsImV4cCI6MjA5OTk2MTg0MX0.LteVurgEKtL_DZRD3gzrAEoEVEcSEC_w2tR5zVPLBQw"
);

// One channel per room. Join on mount, clean up on unmount. Game-agnostic:
// `onEvent` payloads are whatever the mounted game broadcasts (cast per game).
export function joinRoom(
  roomId: string,
  displayName: string,
  handlers: {
    onEvent?: (e: unknown) => void;
    onPlayers?: (players: Player[]) => void;
  }
): RealtimeChannel {
  const channel = supabase.channel(`room:${roomId}`, {
    config: {
      presence: { key: displayName },
      broadcast: { self: false, ack: false },
    },
  });

  channel
    .on("broadcast", { event: "game" }, ({ payload }) => handlers.onEvent?.(payload))
    .on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<Player>();
      handlers.onPlayers?.(
        Object.values(state)
          .flat()
          .sort((a, b) => a.joinedAt - b.joinedAt)
      );
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED")
        await channel.track({ name: displayName, joinedAt: Date.now() });
    });

  return channel;
}

export function sendEvent(channel: RealtimeChannel, event: unknown) {
  return channel.send({ type: "broadcast", event: "game", payload: event });
}

// Fallback (decide now, not at hour 3): poll rooms table every 1-2s if Realtime flakes.
export async function getRoomState(roomId: string) {
  const { data } = await supabase.from("rooms").select("*").eq("id", roomId).single();
  return data;
}

export const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

// Deterministic uuid for an arbitrary room code, so two people typing the SAME code
// (e.g. RMPG-4207) resolve to the SAME persistable room — meetup preserved, and the
// `rooms.id` uuid column stays happy. SHA-1 of a namespaced code → uuid-shaped hex.
async function codeToUuid(code: string): Promise<string> {
  const bytes = new TextEncoder().encode(`rampage-room:${code.trim().toLowerCase()}`);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-1", bytes));
  const h = Array.from(digest.slice(0, 16), (b) => b.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

// Guarantee a persistable room row for this URL BEFORE anything is played, so the
// stake / result / payout writes always land in Supabase. The `rooms.id` column is a
// uuid: QR / lobby / Slack rooms already have a valid-uuid row and come back as-is;
// typed codes map deterministically to a uuid room (caller normalizes the URL to it).
// Returns the id to use for ALL DB writes plus the game the room is for.
export async function ensureRoom(
  roomId: string,
  gameId: string
): Promise<{ id: string; game: string; created: boolean }> {
  const target = isUuid(roomId) ? roomId.toLowerCase() : await codeToUuid(roomId);

  const existing = await supabase.from("rooms").select("id, game").eq("id", target).maybeSingle();
  if (existing.data) return { id: existing.data.id, game: existing.data.game, created: false };

  const { data, error } = await supabase
    .from("rooms")
    .insert({
      id: target,
      status: "pending",
      game: gameId,
      challenger_name: "player1",
      bonus_pool_cents: DEFAULT_BONUS_POOL_CENTS,
    })
    .select("id, game")
    .single();
  if (data) return { id: data.id, game: data.game, created: true };

  // Race: the other player created the same room between our select and insert.
  const retry = await supabase.from("rooms").select("id, game").eq("id", target).maybeSingle();
  if (retry.data) return { id: retry.data.id, game: retry.data.game, created: false };

  throw new Error(error?.message ?? "room create failed");
}

// Persist the FINAL duel result so the full record survives a refresh: scores +
// winner on the room, plus a game-state snapshot in room_states (which also feeds
// the polling fallback). Idempotent — safe if both clients call it on finish.
export async function saveRoomResult(
  roomId: string,
  result: { winner: string; scores: Record<string, number>; stakes: Record<string, number> }
) {
  await Promise.all([
    supabase
      .from("rooms")
      .update({ status: "finished", winner: result.winner, scores: result.scores })
      .eq("id", roomId),
    supabase.from("room_states").upsert({
      room_id: roomId,
      state: { phase: "finished", ...result },
      updated_at: new Date().toISOString(),
    }),
  ]);
}
