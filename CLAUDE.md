# CLAUDE.md — Rampage

> Read this before doing anything. This is a **4-hour hackathon**. Optimize for a working, good-looking demo — not for correctness, tests, or architecture. When a choice is between "clever" and "shippable in 15 min," pick shippable.

## What we're building
Rampage: a competitive arena where coworkers play skill-based multiplayer minigames to win **house-sponsored bonus perk credits**, wrapped in Ramp's spend controls (budget, merchant limits, approvals, receipts).

**Product frame — enforce this in all copy and logic:**
- **Positive-sum only.** Players compete for a *bonus pool* the company adds. A player's own baseline allowance is NEVER lost to a coworker. Never generate "you took their lunch money" mechanics or copy.
- **No coworker surveillance.** Don't build features that bet on individuals' PRs, Slack reactions, or output.
- Cheeky in *tone*, defensible in *mechanics*.

**The game we're shipping:** `<<< FILL IN: e.g. Receipt Match Blitz / Mines-on-bonus-pot / Split-or-Steal >>>`
(Everything else here is stack-agnostic to the chosen game.)

## Stack — do not deviate
- **Next.js (App Router) + TypeScript** — one repo, one deployable app. UI + backend (route handlers) live together. This is a monorepo-of-one; do NOT split front/back into separate packages or repos.
- **Supabase** — Postgres + **Realtime** (broadcast + presence) for multiplayer and the live crowd-join room. Auth is NOT used (see Identity below).
- **Tailwind + shadcn/ui** — all UI. Do NOT hand-write CSS files or add another component library.
- **Framer Motion** for juice. Reach for `<canvas>` (raw or `react-konva`) ONLY if the game is spatial. **No Phaser / Three.js / game engine** unless the core loop genuinely requires it.
- **Vercel** for deploy. The live URL must be real HTTPS (phones hit it via QR — `localhost` won't work).

## Hard rules
1. **Deploy early, deploy often.** The skeleton must be live on Vercel before features. If it's not deploying, that's the top priority — fix it before anything else.
2. **Everyone commits to `main`.** Tiny commits, pull often. No PRs, no long-lived branches, no branch protection.
3. **Vertical slices.** Own a whole feature end-to-end (UI → API route → table), not "all the frontend." Don't block teammates on a layer.
4. **Shared types live in `lib/types.ts` only.** Game state shape is defined once. Never redeclare it.
5. **Seed fake data on load.** No empty states in the demo, ever. Don't manually set up state live on stage.
6. **Never put an external API on the demo's critical path unguarded.** Wrap it, mock it, feature-flag it.

## Identity (no real auth)
Players join a room via `roomId` + a display name they type. Store in Supabase / Realtime presence. Do NOT build sign-up, email, or OAuth flows — they will eat the afternoon and add nothing to the demo.

## Slack bot — the challenge entry point
A coworker fires off a Slack slash command to challenge another coworker; the bot drops a message with a button; both click through to a live game room. This is the *delightful entry point*, not a required path — see the fallback rule below.

**The flow (keep it this simple):**
1. In Slack: `/rampage @teammate` — optionally `/rampage @teammate mines` to name the game.
2. `app/api/slack/command/route.ts` handles the slash command:
   - Verify the Slack signature over the **raw** body, then parse.
   - Create a room row in Supabase (`roomId`, challenger + challenged Slack user ids + display names, status `pending`).
   - **Ack within 3s** with an in-channel message: cheeky copy + an **"Accept & Play ⚔️"** button (and a "Nah" button).
3. `app/api/slack/interactivity/route.ts` handles the button clicks:
   - Verify signature. On accept → set room `active`, replace the message with the room link `https://<deploy>/game/<roomId>`.
4. Both players click the link → land in `game/[roomId]` → Realtime presence shows them joined. Game proceeds exactly as the QR-join path does.

**Wrap it like Ramp — one swappable module.** All outbound Slack API calls go through `lib/slack.ts`:
```ts
// lib/slack.ts
const SLACK_MOCK = process.env.SLACK_MOCK !== "false";
// export the SAME functions (postChallenge, resolveUser, ...) for mock + real.
```
- **Slack is NEVER on the demo's critical path.** The web lobby has a "Challenge a coworker" button that hits the *same* room-creation code path. If the Slack app breaks live, you demo the challenge from the web and nobody notices. Build the web path first, wire Slack second.
- Never call the Slack API from a component — go through `lib/slack.ts`.

**Gotchas (these eat hours — don't relearn them live):**
- Slash-command + interactivity handlers **must respond within 3s**. Keep the handler tiny; defer heavy work.
- Signature verification needs the **raw request body** (`await req.text()`) *before* any JSON/form parsing. Don't let a framework parse it first.
- Slack sends `application/x-www-form-urlencoded`. Slash command = form fields; interactivity = a `payload=<json>` form field.
- Bot scopes: `commands`, `chat:write`, `users:read` (to resolve `@mentions` → display names).
- Set the app's Request URLs to the **Vercel prod HTTPS URL**, not localhost — same reason as the QR flow.
- One person owns "create + install the Slack app in a workspace" as the very first Slack task; token/scope approval can stall everyone else.
- Env: `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `SLACK_MOCK`.

**Product frame still applies:**
- Positive-sum copy only: *"@alex challenged @sam to a Rampage — winner grabs a slice of this week's bonus pool 🎁."* NEVER "coming for your lunch money."
- Opt-in and mutual: a challenge only names people who chose to engage. No surveillance, no betting on someone's output.

## Ramp integration — one swappable module
All Ramp calls go through `lib/ramp.ts`, which exposes a clean interface and switches on an env flag:
```ts
// lib/ramp.ts
const USE_MOCK = process.env.NEXT_PUBLIC_RAMP_MOCK !== "false";
// export the SAME functions for mock + real; flip the flag to swap.
```
If real Ramp sandbox access exists: implement behind the same interface, keep the mock as fallback. If it flakes live, we flip one flag. Never call Ramp directly from a component.

## Realtime + fallback
- Default: Supabase Realtime channels (`broadcast` for game events, `presence` for the live player list — presence looks great on stage).
- **Fallback (decide now, not at hour 3):** if Realtime is flaky, poll a Postgres table every 1–2s. Ugly, invisible to the crowd, always works.

## Structure
```
app/
  page.tsx                 # lobby / landing (QR lands here)
  game/[roomId]/page.tsx   # the game room
  api/                     # route handlers = backend
    slack/
      command/route.ts     # slash command: /rampage @teammate
      interactivity/route.ts # accept/decline button clicks
components/ui/             # shadcn
lib/
  supabase.ts              # client + realtime helpers
  ramp.ts                  # the ONE swappable Ramp module
  slack.ts                 # the ONE swappable Slack module (mock by default)
  types.ts                 # shared game-state types (single source of truth)
supabase/
  schema.sql               # tables
  seed.sql                 # demo data
```

## Commands
```bash
npm run dev        # local
npm run build      # must pass before we trust a deploy
npx vercel --prod  # ship it
```

## Do NOT (time sinks that have killed hackathon teams)
- Set up Turborepo / npm workspaces / a monorepo toolchain.
- Add auth, user accounts, or email.
- Write raw CSS or pick a heavy UI kit.
- Add a game engine for a non-spatial game.
- Write tests, CI, or linting config.
- Refactor for "cleanliness." Duplicated code that works beats an abstraction that isn't shipping.
- Block on the real Ramp API. Mock first, wire real second.
- Block on Slack. The web "Challenge a coworker" button is the fallback and must work on its own; Slack is icing.
