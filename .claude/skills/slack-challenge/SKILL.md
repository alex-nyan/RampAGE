---
name: slack-challenge
description: Build and debug the Rampage Slack challenge flow — /rampage @teammate posts a message with an "Accept & Play" button that drops both coworkers into a live game room. Covers signature verification over the RAW body, the 3-second ack rule, form encoding, bot scopes, and the mock-first lib/slack.ts module. Use for anything touching app/api/slack/* or lib/slack.ts.
---

# Slack challenge flow — the delightful entry point (never the critical path)

Slack is **icing, not a requirement.** The web lobby's "Challenge a coworker" button must hit the *same* room-creation code path and work with Slack completely broken. Build the web path first, wire Slack second. If the Slack app dies live, demo from the web and nobody notices.

## The flow (keep it this simple)
1. In Slack: `/rampage @teammate` — optionally `/rampage @teammate mines` to name the game.
2. `app/api/slack/command/route.ts` (slash command):
   - Verify the Slack signature over the **raw** body, then parse.
   - Create a room row in Supabase (`roomId`, challenger + challenged Slack user ids + display names, status `pending`).
   - **Ack within 3s** with an in-channel message: cheeky positive-sum copy + an **"Accept & Play ⚔️"** button and a **"Nah"** button.
3. `app/api/slack/interactivity/route.ts` (button clicks):
   - Verify signature. On accept → set room `active`, replace the message with `https://<deploy>/game/<roomId>`.
4. Both players click the link → land in `game/[roomId]` → Realtime presence shows them joined. Same as the QR-join path.

## Swappable module — lib/slack.ts
All outbound Slack API calls go through it. Never call the Slack API from a component.
```ts
// lib/slack.ts
const SLACK_MOCK = process.env.SLACK_MOCK !== "false";
// export the SAME functions (postChallenge, resolveUser, ...) for mock + real.
```

## Gotchas — these eat hours, don't relearn them live
- **Respond within 3s** from both handlers. Keep them tiny; defer heavy work.
- **Signature verification needs the RAW request body** — `await req.text()` *before* any JSON/form parsing. Do not let a framework parse it first. (In Next.js route handlers, read `req.text()` yourself; don't use a body parser.)
- Slack sends `application/x-www-form-urlencoded`:
  - Slash command → plain form fields (`text`, `user_id`, `channel_id`, ...).
  - Interactivity → a single `payload=<json>` form field (URL-decode, then `JSON.parse`).
- **Bot scopes:** `commands`, `chat:write`, `users:read` (resolve `@mentions` → display names).
- Set the app's **Request URLs to the Vercel prod HTTPS URL**, not localhost.
- **One person owns** "create + install the Slack app in a workspace" as the very first Slack task — token/scope approval stalls everyone else.

## Signature verification sketch
```ts
import crypto from "crypto";

function verifySlack(raw: string, ts: string, sig: string) {
  const base = `v0:${ts}:${raw}`;
  const hmac = crypto.createHmac("sha256", process.env.SLACK_SIGNING_SECRET!);
  const mine = `v0=${hmac.update(base).digest("hex")}`;
  return crypto.timingSafeEqual(Buffer.from(mine), Buffer.from(sig));
}
// In the route: const raw = await req.text(); verify BEFORE parsing.
```

## Product frame (always applies)
Positive-sum, opt-in, mutual. A challenge only names people who chose to engage. No surveillance, no betting on someone's output. Copy example: *"@alex challenged @sam to a Rampage — winner grabs a slice of this week's bonus pool 🎁."* See `rampage-conventions`.

## Env
`SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `SLACK_MOCK`.

## Related
- `rampage-conventions` — hard rules + product frame.
- `ramp-integration` — same swappable-module discipline.
- `supabase-realtime` — the room the accept button drops players into.
