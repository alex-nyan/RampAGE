---
name: new-minigame
description: Scaffold a new skill-based minigame in Rampage that plugs into the shared room / realtime / types conventions. Use when adding or changing the game loop, defining or extending game state in lib/types.ts, or building the game/[roomId] UI.
---

# Add a minigame to Rampage

The game is the one variable part; everything around it (rooms, realtime, identity, Ramp payout) is fixed. Plug in, don't rebuild the surroundings.

## Checklist
1. **Define state once** in `lib/types.ts`. One `GameState` shape (plus event/action types). Never redeclare it elsewhere — broadcast payloads, the polling read, and the UI all import from here.
2. **Ride the existing channel.** Send moves via `channel.send({ type: "broadcast", event: "game", payload })`; apply incoming events to local state. See `supabase-realtime`.
3. **Build UI in `app/game/[roomId]/page.tsx`** with Tailwind + shadcn/ui + Framer Motion for juice. Reach for `<canvas>`/`react-konva` ONLY if the game is genuinely spatial. No game engine otherwise.
4. **Deterministic, skill-based loop.** Both clients should converge on the same result from the same events. Keep a clear "who won" resolution.
5. **On win → award via `lib/ramp.ts`** (`awardBonusCredit`). Positive-sum only: the winner gains from the company bonus pool; nobody loses their baseline. See `ramp-integration`.
6. **Seed fake state on load** so the game is never empty in the demo.

## Positive-sum mechanics test (must pass)
- Does any player LOSE their own allowance/credit to another? → ❌ redesign.
- Does it bet on someone's real work/output/reactions? → ❌ redesign.
- Do winners draw only from the company-funded bonus pool? → ✅.

Cheeky tone, defensible mechanics. See `rampage-conventions`.

## Keep it shippable
4-hour hackathon. A tight, juicy loop that resolves cleanly beats a deep game that isn't done. Pick the version you can demo in 15 minutes.

## Related
- `rampage-conventions` — stack, shared-types rule, product frame, do-nots.
- `supabase-realtime` — the channels your game events ride.
- `ramp-integration` — awarding the bonus-pool payout on win.
