---
name: supabase-realtime
description: Multiplayer state for Rampage rooms via Supabase Realtime — broadcast for game events, presence for the live player list — with a Postgres-polling fallback for when Realtime is flaky. Use when building the game room, the live lobby/crowd-join screen, player presence, or diagnosing sync issues.
---

# Supabase Realtime + fallback

## Default path
- **Broadcast** channels for game events (moves, round changes, results).
- **Presence** for the live player list — presence looks great on stage (players popping into the lobby as they scan the QR).
- One channel per room, keyed by `roomId`. Join on mount, clean up on unmount.

```ts
// lib/supabase.ts — client + realtime helpers
const channel = supabase.channel(`room:${roomId}`, {
  config: { presence: { key: displayName } },
});

channel
  .on("broadcast", { event: "game" }, ({ payload }) => applyEvent(payload))
  .on("presence", { event: "sync" }, () => setPlayers(channel.presenceState()))
  .subscribe(async (status) => {
    if (status === "SUBSCRIBED") await channel.track({ name: displayName, joinedAt: Date.now() });
  });

// send an event
channel.send({ type: "broadcast", event: "game", payload: { ... } });
```

## Fallback — decide NOW, not at hour 3
If Realtime is flaky, **poll a Postgres table every 1–2s** for room state. Ugly, invisible to the crowd, always works. Keep the game-state shape identical so swapping in the poller doesn't touch the UI.
```ts
// fallback: setInterval(() => refetchRoom(roomId), 1500)
```
Structure the room-state read behind one function (`getRoomState(roomId)`) so Realtime vs polling is a swap, not a rewrite.

## Rules
- **Shared game-state shape lives in `lib/types.ts` only** — never redeclare it. Both broadcast payloads and the polling read use it.
- **Seed fake players/state on load** so the lobby and game are never empty in the demo.
- Identity is just `roomId` + typed display name (no auth) — that name is the presence key. See `rampage-conventions`.

## Related
- `rampage-conventions` — shared-types rule, identity, seeding.
- `new-minigame` — how a game's events ride these channels.
- `slack-challenge` — Accept button lands players in the room these channels power.
