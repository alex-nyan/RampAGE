# RampAGE — PRD

**Thesis:** A competitive arena for corporate spend. Coworkers duel over company-funded perks via a Slack bot — prediction markets on work metrics and live minigames — while Ramp's controls (budget totals, merchant restrictions, approvals, receipts) stay intact. Payoffs are floored at **0.5x / capped at 1.5x** so nobody ever loses their perk entirely.

---

## 1. Problem / Market Gap

- Companies spend billions on perks/stipends (meals, wellness, L&D) with **20–40% breakage** — allowances go unused because they're invisible and boring.
- Spend-management platforms (Ramp, Brex) optimize *control*, not *engagement*. There is no product that makes corporate spend **social**.
- Remote/hybrid teams lack lightweight bonding rituals. Slack games exist (Donut, trivia bots) but have **no stakes**; fantasy-league-style office competitions exist but have **no rails or controls**.

**Gap:** programmable, skill-based competition layered on top of real corporate budgets, with fintech-grade guardrails. RampAGE is the engagement layer Ramp doesn't have.

## 2. Ideal User

- **Player:** engineers/employees at a 50–500 person startup that runs on Ramp + Slack. Competitive, meme-fluent, already tracks PRs and Slack reactions informally.
- **Buyer:** Head of People / finance admin who wants perk utilization and team engagement without losing budget control.
- **Design principle:** zero-loss floor (0.5x) means HR can approve it; 1.5x upside means employees care.

## 3. Product Spec (hackathon scope)

### Duel types
1. **Prediction duel** (binary market): "who merges more PRs this week", "who gets more Slack reactions today", "which AI tops the company leaderboard". Resolved by an **agent observer** that polls the metric source.
2. **Live minigame** (GamePigeon-style): real-time head-to-head web game (ship one: reaction-race or tic-tac-toe blitz) at a link the bot returns.

### Flow
1. Org installs the RampAGE Slack app; admin connects the (mocked) Ramp backend.
2. `@rampage start a prediction duel with @nyan for most PRs merged this week at 0.5/1.5 on Friday's NYC intern dinner`
3. Bot parses game type, opponent, metric, odds, targeted perk → creates duel, escrows the stake in the ledger, posts a duel card (accept/decline buttons).
4. Opponent accepts → bot returns a live-game link **or** spins up an agent observer for the metric.
5. On resolution: ledger applies payout (loser floored at 0.5x of their perk, winner capped at 1.5x), bot posts results + updated leaderboard. Total org budget is conserved.

### Guardrails (the pitch's fintech credibility)
- Zero-sum within the pair; org budget total invariant.
- Floor/cap enforced at ledger level, not UI level.
- Mock Ramp API mirrors real Ramp primitives: budgets, spend limits, merchant restrictions, receipts — swap-in ready if Ramp exposes an API.

## 4. Architecture

```
Slack workspace
   │  (Events API / slash cmd / interactivity)
   ▼
rampage-bot (Bolt.js, Railway service #1)
   │  parse duel → REST
   ▼
API + ledger + mock Ramp API (Express, Railway service #2 or same app)
   │  Postgres + Realtime
   ▼
Supabase  ◄──────── game-web (Vite/React, Railway service #3)
   ▲
agent observer (cron/poller in API service; GitHub API + Slack reactions)
```

- **Slack:** Bolt for JS. Socket Mode during dev (no public URL needed), HTTP endpoints on Railway for prod. Scopes: `app_mentions:read`, `chat:write`, `commands`, `reactions:read`, `users:read`. Docs: https://docs.slack.dev/
- **Supabase:** Postgres tables `users`, `perks`, `duels`, `ledger_entries`, `game_moves`; Supabase Realtime channels drive the live minigame; no auth needed for demo (Slack user IDs are identity).
- **Railway:** monorepo, 3 services from one repo (bot, api, web) with env vars; deploy on push to `main`.
- **Duel parsing:** Claude API call (structured output) to turn the natural-language mention into `{game, opponent, metric, odds, perk, deadline}` — cheap technical-complexity points, robust demo.

## 5. Build Workflow — 4 hours, 4 members

Everyone: clone repo, branch per member, merge to `main` at each sync point.

| Time | M1 – Slack | M2 – API/Ledger | M3 – Minigame | M4 – Observer/Deploy/Pitch |
|---|---|---|---|---|
| 0:00–0:30 | **All together:** create Slack app (manifest), Supabase project, Railway project; commit `.env.example`; agree API contract (routes + duel JSON schema) | | | |
| 0:30–1:30 | Bolt app: mention handler, Claude parse, duel card w/ accept button | Schema + migrations, mock Ramp API, escrow/payout w/ floor-cap logic | Vite app: lobby by duel ID, reaction-race game, Supabase Realtime sync | GitHub PR poller + Slack reactions poller; Railway service scaffolding |
| 1:30–2:30 | Accept flow → call API → post game link/observer confirmation; result announcement message | `/duels` CRUD, `/resolve` endpoint, leaderboard query | Win detection → POST `/resolve`; scoreboard screen | Wire observers to `/resolve`; deploy all 3 services to Railway |
| 2:30–3:15 | **Integration hour (pair up):** full loop — mention → parse → accept → play/observe → resolve → payout → leaderboard post | | | |
| 3:15–3:45 | Polish duel-card UX, error copy | Seed demo data (perks, fake PR history) | Game juice: countdown, win animation | Demo script + pitch deck outline |
| 3:45–4:00 | **Freeze + rehearse:** run demo twice end-to-end in a clean channel | | | |

**Cut list if behind (in order):** Claude parsing → regex; minigame → prediction duels only; leaderboard → skip; observer polling → manual `/resolve` trigger hidden from judges' view of the flow.

## 6. Hosting / Deploy

1. **Supabase:** new project → run `db/schema.sql` in SQL editor → copy URL + service key.
2. **Railway:** connect GitHub repo → 3 services (root dirs `apps/bot`, `apps/api`, `apps/web`) → set env vars (`SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `ANTHROPIC_API_KEY`, `GITHUB_TOKEN`) → auto-deploy on push.
3. **Slack:** app manifest with request URLs pointed at the Railway bot domain (`/slack/events`); install to demo workspace. Use Socket Mode until 2:30, flip to HTTP for final deploy.

## 7. Judging Alignment

- **Technical complexity:** real-time multiplayer via Supabase Realtime + LLM structured parsing + autonomous metric observers + double-entry ledger with invariants — four distinct systems integrated in 4 hours.
- **Fun:** live demo is a duel between two judges'/teammates' Slack accounts ending in an actual payout swing.
- **Originality:** nobody has gamified spend management; it's Ramp's data model turned into a game engine.
- **Pitch:** "$X B in perk budgets, 20–40% unused. Ramp controls the money; RampAGE makes people care about it. Same budget, same controls, 10x the engagement."
