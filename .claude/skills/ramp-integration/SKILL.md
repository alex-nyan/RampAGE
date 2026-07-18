---
name: ramp-integration
description: How to call Ramp (budgets, merchant limits, approvals, receipts, and awarding bonus perk credits) in the Rampage project. Everything goes through ONE swappable module, lib/ramp.ts, mock-by-default behind an env flag. Use when adding any spend-control feature, awarding bonus-pool credits to a winner, or wiring the real Ramp sandbox.
---

# Ramp integration — one swappable module

**Golden rule:** never call Ramp directly from a component or a route handler. All Ramp calls go through `lib/ramp.ts`, which exposes a clean interface and switches on an env flag. Mock is the default so the demo never depends on a live API.

## The pattern
```ts
// lib/ramp.ts
const USE_MOCK = process.env.NEXT_PUBLIC_RAMP_MOCK !== "false";

// Export the SAME functions for mock + real; flip the flag to swap.
export async function awardBonusCredit(args: {
  roomId: string;
  userId: string;
  amountCents: number;
  memo: string;
}): Promise<{ ok: true; txId: string } | { ok: false; error: string }> {
  if (USE_MOCK) return mockAwardBonusCredit(args);
  return realAwardBonusCredit(args);
}

// ...same shape for getBudget, listReceipts, requestApproval, etc.
```

## Rules
- **Mock first, wire real second.** Get the whole game loop working against the mock. Only implement `real*` once the mock path is demo-ready.
- **Same function signatures for mock and real** — the caller never knows which is live. Flipping `NEXT_PUBLIC_RAMP_MOCK=false` is the only difference.
- If real Ramp sandbox access flakes live, flip the flag back to mock — one env var, no code change.
- Mock functions should return **realistic, seeded** data (never empty) so the demo looks alive. Add a small artificial delay if you want the UI's loading states to show.
- Keep the interface small — only the calls the demo actually makes (award credit, show budget, show receipts, maybe an approval).

## Product frame (always applies)
Ramp here wraps a **positive-sum bonus pool the company funds**. Awarding credit adds to a winner's perks; it NEVER debits a coworker's baseline allowance. Copy and amounts must reflect that. See `rampage-conventions`.

## Env
- `NEXT_PUBLIC_RAMP_MOCK` — `"false"` to use the real API; anything else (or unset) = mock.
- Real credentials (only if wiring sandbox): keep in `.env.local`, never commit.

## Related
- `rampage-conventions` — hard rules + product frame.
- `slack-challenge` — same swappable-module discipline, for Slack.
