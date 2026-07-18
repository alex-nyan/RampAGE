# CLAUDE.md — Rampage

> Read this before doing anything. This is a **4-hour hackathon**. Optimize for a working, good-looking demo — not for correctness, tests, or architecture. When a choice is between "clever" and "shippable in 15 min," pick shippable.

## What we're building
Rampage: a competitive arena where coworkers play **1v1 minigames** to wager claims on **house-sponsored bonus perk credits**, wrapped in Ramp's spend controls (budget, merchant limits, approvals, receipts).

**Product frame — enforce this in all copy and logic:**
- **Positive-sum only.** Players stake slices of a *bonus pool* the company adds (or house-matched stakes). A player's own baseline allowance is NEVER lost to a coworker. Never generate "you took their lunch money" mechanics or copy.
- **Wagers = bonus-pool claims, not salary raids.** Each player enters how much bonus credit they're willing to put on the line for *this* match. Winner takes the match pot. Baseline perk allowance stays untouched.
- **No coworker surveillance.** Don't build features that settle on individuals' PRs, Slack reactions, or private output. Binary markets must resolve on opt-in / public / external questions — never "who got more reactions today."
- Cheeky in *tone*, defensible in *mechanics*.

**The games we're shipping now:** **Fraudle** (live — daily single-player: spot the policy-violating transaction) and **Receipt Blitz** (head-to-head via challenge flow + `game/[roomId]`). See `lib/data.ts` for the lobby lineup.

**Also ship a modular multi-game shell** so adding the next 1v1 wagered game is cheap. Infra first; demo can highlight 1–2 games.

## Modular games — set this up early
Treat rooms, presence, wagering, and payout as shared infrastructure. Each game is a small plug-in, not a new app.

**Shared boilerplate (build once):**
1. **Room + challenge flow** — create room, two players join (`roomId` + display name), presence, start/ready.
2. **Wager layer** — both players enter a stake amount (bonus-pool credits). Persist stakes on the room. On resolve → award via `lib/ramp.ts`.
3. **Odds helper** — when stakes are asymmetric, auto-adjust payout odds so the match is fair (e.g. Alice stakes $20, Bob stakes $10 → Alice wins smaller multiple, Bob wins larger). One shared util; every game reuses it.
4. **Game registry** — a single map of `gameId → { name, description, Component, initialState }`. Lobby / Slack `/rampage @teammate <gameId>` pick from this list.
5. **Shared types in `lib/types.ts`** — `Room`, `Wager`, `GameId`, plus per-game state under a discriminated union. Never redeclare game state elsewhere.

**Per-game module (copy this shape for each new game):**
```
lib/games/<gameId>/
  rules.ts          # pure logic: apply move, check win, no React
  types.ts          # ONLY if needed — prefer extending lib/types.ts
components/games/<gameId>/
  Game.tsx          # the UI mounted by game/[roomId]
```
Register it in the game registry; wire `game/[roomId]` to render `registry[room.gameId].Component`. Do not fork the room page per game.

**Games in / near the lineup:**
| gameId | Loop | Roles / notes |
|--------|------|----------------|
| `fraudle` | Daily spot-the-fraud | Live single-player (lobby). Not a 1v1 wager room. |
| `receipt-blitz` | Receipt Match Blitz | Head-to-head multiplayer via `game/[roomId]` + challenge flow. |
| `mines` | Grid / minefield | One player is **placer**, the other is **checker**. Placer hides mines; checker probes cells. Stakes settle on hit/clear. Spatial → canvas/`react-konva` OK. |
| `predict` | Binary prediction market | Two friends open a yes/no market on an opt-in question (e.g. *"which AI tops the public leaderboard this week?"*). Each side stakes; odds from stake imbalance. Resolve when the outcome is known (manual resolve OK for demo). **Not** PR/Slack-reaction surveillance. |
| `flip` | Fair coin / side pick | Both enter how much they're willing to wager; **odds auto-adjust** from the two stakes so EV is balanced. Simplest wager demo — ship this if time is tight. |

Add a game = new folder + registry entry + types discriminant. Do **not** rebuild lobby, Slack, Realtime, or Ramp payout.

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
4. **Shared types live in `lib/types.ts` only.** Room / wager / game-state union defined once. Never redeclare it.
5. **Games plug into the registry.** New game = `lib/games/<id>` + `components/games/<id>` + registry entry. Do not fork `game/[roomId]` or duplicate wager/Realtime/Ramp code per game.
6. **Seed fake data on load.** No empty states in the demo, ever. Don't manually set up state live on stage.
7. **Never put an external API on the demo's critical path unguarded.** Wrap it, mock it, feature-flag it.

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
  page.tsx                 # lobby / landing (QR lands here) — pick game + stake
  game/[roomId]/page.tsx   # shared room shell (presence, wager, mounts game)
  api/                     # route handlers = backend
    slack/
      command/route.ts     # slash command: /rampage @teammate [gameId]
      interactivity/route.ts # accept/decline button clicks
components/
  ui/                      # shadcn
  games/<gameId>/Game.tsx  # one component per game
lib/
  supabase.ts              # client + realtime helpers
  ramp.ts                  # the ONE swappable Ramp module
  slack.ts                 # the ONE swappable Slack module (mock by default)
  types.ts                 # Room, Wager, GameId, game-state union (single source of truth)
  wager.ts                 # stake + auto-odds helpers (shared by all games)
  games/
    registry.ts            # gameId → metadata + Component + initialState
    <gameId>/rules.ts      # pure game logic
supabase/
  schema.sql               # tables (rooms include game_id + stakes)
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
