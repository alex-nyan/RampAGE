---
name: rampage-conventions
description: Core conventions for the Rampage hackathon project — the stack (Next.js App Router + TypeScript, Supabase, Tailwind + shadcn/ui, Framer Motion, Vercel), the positive-sum product frame, the shared-types rule, and the "do NOT" time-sinks. Use at the start of ANY Rampage feature, when unsure about a stack choice, or when writing player-facing copy.
---

# Rampage — project conventions

> This is a **4-hour hackathon**. Optimize for a working, good-looking demo — not correctness, tests, or architecture. Between "clever" and "shippable in 15 min," pick shippable. The full source of truth is `CLAUDE.md` at the repo root; this skill is the fast path.

## What we're building
Rampage: a competitive arena where coworkers play skill-based multiplayer minigames to win **house-sponsored bonus perk credits**, wrapped in Ramp's spend controls (budget, merchant limits, approvals, receipts).

## Product frame — enforce in ALL copy and logic
- **Positive-sum only.** Players compete for a *bonus pool the company adds*. A player's own baseline allowance is NEVER lost to a coworker. Never write "you took their lunch money" mechanics or copy.
  - ✅ *"@alex challenged @sam — winner grabs a slice of this week's bonus pool 🎁."*
  - ❌ *"Beat Sam and take their budget."*
- **No coworker surveillance.** Never bet on individuals' PRs, Slack reactions, or output.
- Cheeky in *tone*, defensible in *mechanics*.

## Stack — do not deviate
- **Next.js (App Router) + TypeScript** — one repo, one deployable app. UI + backend (route handlers) together. Monorepo-of-one; do NOT split front/back.
- **Supabase** — Postgres + Realtime (broadcast + presence). See `supabase-realtime` skill.
- **Tailwind + shadcn/ui** — all UI. No hand-written CSS files, no other component library.
- **Framer Motion** for juice. `<canvas>` / `react-konva` ONLY if the game is spatial. No Phaser/Three.js/game engine unless the core loop genuinely needs it.
- **Vercel** for deploy — real HTTPS (phones hit it via QR; `localhost` won't work).

## Hard rules
1. **Deploy early, deploy often.** Skeleton live on Vercel *before* features. If it's not deploying, that's the #1 priority.
2. **Everyone commits to `main`.** Tiny commits, pull often. No PRs, no long-lived branches.
3. **Vertical slices.** Own a feature end-to-end (UI → API route → table), not "all the frontend."
4. **Shared types live in `lib/types.ts` only.** Game-state shape defined once. Never redeclare it.
5. **Seed fake data on load.** No empty states in the demo, ever.
6. **Never put an external API on the demo's critical path unguarded.** Wrap it, mock it, feature-flag it. (See `ramp-integration` and `slack-challenge`.)

## Identity — no real auth
Players join a room via `roomId` + a display name they type. Store in Supabase / Realtime presence. Do NOT build sign-up, email, or OAuth — it eats the afternoon and adds nothing to the demo.

## Structure
```
app/
  page.tsx                    # lobby / landing (QR lands here)
  game/[roomId]/page.tsx      # the game room
  api/
    slack/command/route.ts    # slash command: /rampage @teammate
    slack/interactivity/route.ts  # accept/decline buttons
lib/
  supabase.ts   # client + realtime helpers
  ramp.ts       # the ONE swappable Ramp module
  slack.ts      # the ONE swappable Slack module (mock by default)
  types.ts      # shared game-state types (single source of truth)
supabase/
  schema.sql    # tables
  seed.sql      # demo data
```

## Commands
```bash
npm run dev        # local
npm run build      # must pass before trusting a deploy
npx vercel --prod  # ship it
```

## Do NOT (time-sinks that kill hackathon teams)
- Set up Turborepo / npm workspaces / a monorepo toolchain.
- Add auth, user accounts, or email.
- Write raw CSS or add a heavy UI kit.
- Add a game engine for a non-spatial game.
- Write tests, CI, or linting config.
- Refactor for "cleanliness." Duplicated code that works beats an abstraction that isn't shipping.
- Block on the real Ramp API or Slack. Mock first, wire real second.

## Related skills
- `ramp-integration` — the swappable `lib/ramp.ts` module.
- `slack-challenge` — the `/rampage` Slack flow and its gotchas.
- `supabase-realtime` — multiplayer state + polling fallback.
- `new-minigame` — scaffold a game that plugs into the shared conventions.
