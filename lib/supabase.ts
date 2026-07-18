import { createClient, type RealtimeChannel } from "@supabase/supabase-js";
import type { Player } from "./types";

// Anon key is public by design (RLS is the boundary); defaults keep the demo
// working even if env vars are missing. Env vars override.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://ifetanzpmmgyolhglcco.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmZXRhbnpwbW1neW9saGdsY2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzNzk5NjQsImV4cCI6MjA5OTk1NTk2NH0.COI_n_xTUWgiOvWbdu9k4Mfwnj7KQMQRC0T2cZajX18"
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
    config: { presence: { key: displayName } },
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
