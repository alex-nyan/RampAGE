# RampAGE — Build Plan (start here)

Repo layout (create at 0:00):

```
apps/
  bot/   # Bolt.js Slack app
  api/   # Express: duels, ledger, mock Ramp API, observers
  web/   # Vite/React minigame
db/schema.sql
.env.example
```

## 0:00–0:30 — All hands setup
- [ ] One person creates: Slack app (from `slack-manifest.yml` below), Supabase project, Railway project, Anthropic API key, GitHub PAT (repo read).
- [ ] Scaffold monorepo above, commit, push. Everyone branches: `m1-slack`, `m2-api`, `m3-game`, `m4-ops`.
- [ ] Agree on API contract (below) — do not drift from it.
- [ ] Run `db/schema.sql` in Supabase SQL editor.

### API contract (frozen at 0:30)
```
POST /duels                {challenger, opponent, game, metric?, odds:{floor:0.5,cap:1.5}, perk_id, deadline}
POST /duels/:id/accept
POST /duels/:id/resolve    {winner}
GET  /duels/:id            → duel + state
GET  /leaderboard
Mock Ramp: GET /ramp/budgets  GET /ramp/perks/:user  POST /ramp/transfer {from,to,amount} (enforces floor/cap invariant)
```

### Supabase schema (db/schema.sql)
```sql
create table users (slack_id text primary key, name text, github text);
create table perks (id serial primary key, user_id text references users, label text, amount numeric, event text);
create table duels (id uuid default gen_random_uuid() primary key, challenger text, opponent text,
  game text, metric text, perk_id int, status text default 'pending', winner text, deadline timestamptz);
create table ledger_entries (id serial primary key, duel_id uuid, user_id text, delta numeric, created_at timestamptz default now());
create table game_moves (id serial primary key, duel_id uuid, player text, payload jsonb, created_at timestamptz default now());
```

### Slack app manifest (slack-manifest.yml)
```yaml
display_information: { name: RampAGE }
features:
  bot_user: { display_name: rampage, always_online: true }
oauth_config:
  scopes: { bot: [app_mentions:read, chat:write, commands, reactions:read, users:read, im:write] }
settings:
  event_subscriptions: { bot_events: [app_mention, reaction_added] }
  interactivity: { is_enabled: true }
  socket_mode_enabled: true
```

## 0:30–2:30 — Parallel build

**M1 (Slack, `apps/bot`)**
- [ ] `npm i @slack/bolt` — Socket Mode app; handle `app_mention`.
- [ ] Claude structured-output call → `{game, opponent, metric, odds, perk, deadline}` (fallback: regex).
- [ ] Post duel card (Block Kit, Accept/Decline buttons) → on accept: `POST /duels/:id/accept`, reply with game link (`WEB_URL/duel/:id`) or "observer armed 👁️".
- [ ] Listen for API webhook/poll → post result + leaderboard.

**M2 (API + ledger, `apps/api`)**
- [ ] Express + `@supabase/supabase-js`. Implement contract above.
- [ ] Escrow on accept; resolve applies payout with **floor 0.5x / cap 1.5x, zero-sum invariant** — write a unit test for this, it's the pitch.
- [ ] Mock Ramp API routes + seed script (`npm run seed`: 4 users, perks, fake PR counts).

**M3 (Minigame, `apps/web`)**
- [ ] Vite + React. Route `/duel/:id` → lobby (both players join) → **reaction-race**: 5 rounds, tap when screen flashes, lowest total ms wins.
- [ ] Sync via Supabase Realtime channel `duel:{id}` (broadcast taps, presence for lobby).
- [ ] On win: `POST /duels/:id/resolve` → victory screen with payout delta.

**M4 (Observers + deploy, `apps/api/observers`, Railway)**
- [ ] Pollers (60s interval): GitHub merged-PR count per user; Slack reactions count via `reactions_added` events stored by bot.
- [ ] Deadline hit → compute winner → call `/resolve`.
- [ ] Railway: 3 services from repo root dirs; env vars everywhere; flip bot from Socket Mode → HTTP (`/slack/events`) once URL exists.
- [ ] Draft pitch: problem (perk breakage) → gap (control vs engagement) → demo → guardrails slide.

## 2:30–3:15 — Integration
- [ ] Full loop in a test channel: mention → parse → accept → play → resolve → ledger payout → leaderboard post.
- [ ] Fix drift against the API contract; nothing new gets built.

## 3:15–4:00 — Polish, freeze, rehearse
- [ ] Seed clean demo data; do the demo twice; assign who talks (problem / demo driver / opponent player / architecture+guardrails).
- [ ] Cut list if behind: LLM parse→regex, drop leaderboard, manual resolve trigger.

## Env vars (.env.example)
```
SLACK_BOT_TOKEN= SLACK_SIGNING_SECRET= SLACK_APP_TOKEN=
SUPABASE_URL= SUPABASE_SERVICE_KEY=
ANTHROPIC_API_KEY= GITHUB_TOKEN=
API_URL= WEB_URL=
```
