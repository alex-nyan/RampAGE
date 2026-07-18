import { createClient, type RealtimeChannel } from "@supabase/supabase-js";
import type { GameEvent, Player } from "./types";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "dev-anon-key"
);

// One channel per room. Join on mount, clean up on unmount.
export function joinRoom(
  roomId: string,
  displayName: string,
  handlers: {
    onEvent: (e: GameEvent) => void;
    onPlayers: (players: Player[]) => void;
  }
): RealtimeChannel {
  const channel = supabase.channel(`room:${roomId}`, {
    config: { presence: { key: displayName } },
  });

  channel
    .on("broadcast", { event: "game" }, ({ payload }) =>
      handlers.onEvent(payload as GameEvent)
    )
    .on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<Player>();
      handlers.onPlayers(
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

export function sendEvent(channel: RealtimeChannel, event: GameEvent) {
  return channel.send({ type: "broadcast", event: "game", payload: event });
}

// Fallback (decide now, not at hour 3): poll rooms table every 1-2s if Realtime flakes.
export async function getRoomState(roomId: string) {
  const { data } = await supabase.from("rooms").select("*").eq("id", roomId).single();
  return data;
}
