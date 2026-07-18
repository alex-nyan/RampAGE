# Rampage 🎮⚔️

**The company-perk arcade.** Coworkers play 1v1 minigames to wager slices of a **house-sponsored bonus pool**, all wrapped in Ramp's spend controls (budgets, merchant limits, approvals, receipts).

Built in a 4-hour hackathon. Optimized for a working, good-looking demo.

## The product frame

Rampage is **positive-sum by design** — this is enforced in every mechanic and every line of copy:

- **Your baseline allowance is never at stake.** Players stake slices of a *bonus pool the company adds*. Winners take the match pot; nobody's own perk allowance is ever raided.
- **Wagers = bonus-pool claims, not salary raids.** Each player puts up how much bonus credit they'll risk for *this* match. When stakes are asymmetric, odds auto-adjust so EV stays fair.
- **No coworker surveillance.** Prediction markets resolve on opt-in, public, external questions (markets, weather, public leaderboards) — never on someone's PRs, Slack reactions, or private output.
- Cheeky in *tone*, defensible in *mechanics*.

## The games

The lobby seeds a full lineup so the demo never shows an empty state. Games plug into a single registry (`lib/games/registry.ts`) and render through one shared room shell (`app/game/[roomId]`).

| Game | Loop | Format |
|------|------|--------|
| **The Price Is Ramp** | Guess the company expense — closest without going over wins | 1v1 room |
| **Receipt Blitz** | Match receipts to card transactions faster than your opponent | 1v1 room |
| **Mines Duel** | One player hides 5 mines on a 6×6; the other clears every safe cell | 1v1 room (placer / checker) |
| **Flip** | Stake-weighted coin — odds auto-adjust from the two stakes | 1v1 room |
| **Word Duel** | Race a coworker to solve the same five-letter word in a minute | 1v1 room |
| **Split or Steal** | Trust game — split the bonus lunch pot or gamble for it all | 1v1 room |
| **Fraudle** | Spot the one policy-violating transaction | Daily single-player (`/game/fraudle`) |
| **Predict** | Live prediction market on public/opt-in events — the whole office bets | Multi-person board (`/predict`) |

## Stack

- **Next.js (App Router) + TypeScript** — one repo, one deployable app; UI and route handlers live together.
- **Supabase** — Postgres + Realtime (broadcast for game events, presence for the live player list), with a Postgres-polling fallback.
- **Tailwind CSS v4** + custom neubrutalist UI components (`components/ui/*`).
- **Framer Motion** for juice.
- **Vercel** for deploy (phones hit the live URL via QR).

No real auth — players join a room via `roomId` + a display name they type, stored in Realtime presence.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase; Ramp + Slack default to mock
npm run dev                  # http://localhost:3000
```

Then apply the database schema in the Supabase SQL editor:

```bash
supabase/schema.sql   # tables: rooms, room_states, awards
supabase/seed.sql     # demo data
```

### Environment variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project (required) |
| `NEXT_PUBLIC_BASE_URL` | Base URL used in QR + Slack links |
| `NEXT_PUBLIC_RAMP_MOCK` | `true` (default) uses the mock ledger; `false` wires the real Ramp sandbox |
| `RAMP_*` | Real Ramp sandbox creds (server-only; used only when the mock is off) |
| `SLACK_MOCK` | `true` (default) logs instead of calling Slack; `false` uses the real app |
| `SLACK_BOT_TOKEN` / `SLACK_SIGNING_SECRET` | Real Slack app creds |

Everything external is **mock-by-default** — the demo works end-to-end with zero third-party setup, and each integration flips on with a single env flag.

## Architecture

Rooms, presence, wagering, and payout are **shared infrastructure**. Each game is a small plug-in, not a new app.

```
app/
  page.tsx                 # neubrutalist landing (QR + Slack front door)
  game/[roomId]/page.tsx   # shared room shell — presence, wager, mounts the game
  game/fraudle             # daily single-player
  predict/                 # live multi-person prediction market
  api/
    rooms/                 # shared room-creation path (web "Challenge" + Slack both hit this)
    ramp/                  # server-side Ramp routes (real sandbox only)
    slack/                 # slash command + interactivity (accept/decline buttons)
components/
  landing/                 # marketing sections
  games/<gameId>/Game.tsx  # one component per game
  ui/                      # shared neubrutalist components
lib/
  types.ts                 # single source of truth — Room, Wager, GameId, per-game state union
  games/registry.ts        # gameId → { name, Component, initialState, payoutMode }
  wager.ts                 # stake + auto-odds helpers (shared by every game)
  ramp.ts                  # the ONE swappable Ramp module (mock by default)
  slack.ts                 # the ONE swappable Slack module (mock by default)
  supabase.ts              # client + realtime join/broadcast helpers
  data.ts                  # seed data — the demo is never empty
supabase/
  schema.sql               # rooms (game_id + stakes), room_states, awards
  seed.sql                 # demo rows
```

**Adding a game** = new folder under `lib/games/<id>` + `components/games/<id>/Game.tsx` + one registry entry + a `GameId` discriminant in `lib/types.ts`. Never fork the room page or duplicate the wager / Realtime / Ramp code.

### Swappable integrations

Both Ramp and Slack are single modules with identical mock/real signatures behind an env flag — nothing external is ever on the demo's critical path:

- **`lib/ramp.ts`** — `awardBonusCredit`, `getBudget`. Mock writes a positive-sum ledger to Supabase (`awards`); the winner is credited from the house pot, nobody is debited.
- **`lib/slack.ts`** — `/rampage @teammate [game]` posts an "Accept & Play ⚔️" button that drops both players into a live room. Signature is verified over the raw body; the web "Challenge a coworker" button hits the same room-creation path as a fallback.

### Wager & odds

`lib/wager.ts` is the shared math. Stakes are bonus-pool credits; the pot is house-backed. Two payout modes:

- **`chance`** (e.g. Flip) — winner takes the full pot; fairness comes from stake-weighted win probability.
- **`skill`** (e.g. Receipt Blitz, Mines) — winner takes the *matched* pot (2× the smaller stake); staking less caps your upside instead of skewing the odds.

## Commands

```bash
npm run dev     # local
npm run build   # must pass before trusting a deploy
npm run lint    # next lint
```

Deploy to Vercel — the live URL must be real HTTPS so phones can join rooms via QR.
