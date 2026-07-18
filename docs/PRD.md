# RampAGE — PRD (updated for 4-hour feasibility)

> **Status:** working spec. This supersedes `docs/PRD-original.md` (kept verbatim for
> reference). It was re-scoped after a feasibility review against (a) the 4-hour clock,
> (b) the code already scaffolded in this repo, and (c) the hard rules in `CLAUDE.md`.
> **Read `CLAUDE.md` first; this fills in the game + economy specifics.**

---

## 0. 4-Hour Feasibility Review — what changed and why

**Verdict on the original PRD: not shippable in 4 hours as written, and it conflicts with what's already built.** The good bones (competitive arena for corporate spend, Slack as the entry point, Ramp guardrails as credibility, floor/cap payoffs, the pitch framing) are kept. The parts that would sink the demo are cut or reframed.

**What the team has ALREADY built (the ground truth):**
- **Next.js 15 + React 19 + Tailwind v4 + Framer Motion**, one app — exactly the `CLAUDE.md` stack. Not Bolt/Express/Vite, not 3 Railway services.
- A working **Fraudle** minigame (`app/game/fraudle/page.tsx`), a **lobby** (`app/page.tsx`) with a **house bonus pot** and **leaderboard**, and seeded data (`lib/data.ts`, `lib/types.ts`).
- Shipped UI copy: *"HOUSE BONUS POT — Sponsored chips — your allowance is never at stake."* → the product is **positive-sum** already.

**The five things in the original PRD that break a 4-hour build:**

1. **Wrong stack — would throw away the app.** The PRD mandates Bolt + Express + Vite across **3 Railway services**. The repo is a single Next.js app targeting Vercel. Switching means re-scaffolding three deploys, cross-service env vars, and CORS — ~1h+ of pure infra for zero demo value, and it deletes working code. → **Keep the Next.js one-app on Vercel.** Route handlers (`app/api/*`) are the backend. (Matches `CLAUDE.md` "do NOT split front/back.")
2. **Four independent backend systems in 4h across 4 people.** LLM parsing + autonomous GitHub/Slack observers + double-entry ledger with invariants + realtime multiplayer. Any one can eat the afternoon; together the integration hour can't absorb them. → **Ship one polished minigame loop + Slack challenge + mock ledger.** LLM parse and observers become clearly-labeled stretch goals.
3. **Product-frame violation (surveillance + real loss).** "Who merges more PRs this week" / "who gets more Slack reactions today" is exactly the coworker-surveillance mechanic `CLAUDE.md` forbids, and a **0.5x floored loss of your own perk** contradicts the shipped copy ("your allowance is never at stake"). It also breaks the HR-approvable pitch. → **Cut PR/reaction prediction markets.** Reframe floor/cap as a **winnings multiplier on a company-funded bonus stake** (see §3).
4. **External APIs on the demo's critical path.** GitHub API + Slack-reaction polling as the *resolution* mechanism is a live-demo landmine (`CLAUDE.md` rule 6). → resolution is **in-game skill outcome**, computed locally. No external API decides the winner.
5. **Risky live infra migration.** "Socket Mode until 2:30, flip to HTTP for prod" is a stack switch during the crunch. → Next.js route handlers are HTTP from minute one; deploy to Vercel early and keep deploying (`CLAUDE.md` rule 1).

**Net:** same story, same guardrails, same "wow" — delivered on the stack that's already running, with nothing external on the critical path.

---

## 1. Problem / Market Gap
*(unchanged — this framing is strong and stays the pitch)*
- Companies spend billions on perks/stipends (meals, wellness, L&D) with **20–40% breakage** — allowances go unused because they're invisible and boring.
- Spend-management platforms (Ramp, Brex) optimize **control, not engagement**. Nothing makes corporate spend *social*.
- Remote/hybrid teams lack lightweight bonding rituals. Slack games (Donut, trivia) have **no stakes**; office fantasy leagues have **no rails**.
- **Gap:** programmable, skill-based competition on top of real corporate budgets, with fintech-grade guardrails. RampAGE is the engagement layer Ramp doesn't have.

## 2. Ideal User
- **Player:** employees at a 50–500-person startup on Ramp + Slack. Competitive, meme-fluent.
- **Buyer:** Head of People / finance admin who wants perk utilization + engagement **without losing budget control**.
- **Design principle:** **your baseline allowance is never at risk** (HR can approve it); the **bonus upside** is what makes employees care. *(Note the shift from the original's "0.5x loss floor" — see §3.)*

## 3. Product Spec (hackathon scope)

**The game we're shipping:** **Fraudle** — spot the one policy-violating transaction in a deck of nine, fewer guesses = more chips. Already live. It's skill-based, on-brand (it teaches Ramp's spend policy), and demos in 20 seconds. Second game if time: **Receipt Blitz** (match receipts to transactions, 60s) or **Split or Steal** (vs. the room).

**Economy — positive-sum, floor/cap reframed (the key fix):**
- Every duel/game draws a **bonus stake from the company-funded house pot** — never from a player's baseline allowance.
- **Winner takes up to 1.5x** the stake; **loser still gets 0.5x** the stake as a consolation from the pot. So the *original PRD's 0.5x/1.5x numbers survive*, but nobody ever loses their own money — only how big a slice of the **bonus** they win varies.
- **Org bonus-pot total is the invariant**, enforced at the **ledger level** (mock Ramp), not the UI. This keeps the fintech-credibility guardrail without the surveillance/real-loss problem.

**Two ways to play:**
1. **Solo / daily:** play Fraudle from the lobby, earn chips from the pot, climb the leaderboard. *(Built.)*
2. **Challenge a coworker (the delightful entry point):** `/rampage @teammate` in Slack → cheeky positive-sum card with an **"Accept & Play ⚔️"** button → both land in the same game room → head-to-head → winner takes the bigger slice of the bonus stake. **The web lobby has a "Challenge a coworker" button that hits the exact same room-creation code**, so Slack is never on the critical path.

**Guardrails (the pitch's fintech credibility):**
- Positive-sum: baseline allowance untouched; only the company bonus pot is in play.
- Floor (0.5x) / cap (1.5x) enforced in the mock ledger.
- **Mock Ramp API mirrors real Ramp primitives** — budgets, spend limits, merchant restrictions, receipts — behind one swappable module (`lib/ramp.ts`), swap-in ready if Ramp exposes an API.

**Cut from the original (with reasons):** PR/Slack-reaction prediction markets (surveillance + external API + scope); autonomous GitHub/Slack observers (external API on critical path); double-entry ledger with full invariants (a single-entry mock ledger with floor/cap is enough for the demo).

## 4. Architecture

```
Phone (QR)  ───┐
Slack /rampage ─┤
Web lobby btn ──┴──►  Next.js app on Vercel  (ONE deployable)
                        ├─ app/page.tsx            lobby: house pot, games, leaderboard   [built]
                        ├─ app/game/fraudle/…      the minigame                            [built]
                        ├─ app/game/[roomId]/…     head-to-head room (challenge path)       [todo]
                        ├─ app/api/rooms/…         create/join/resolve a room               [todo]
                        ├─ app/api/slack/command       /rampage slash command               [stretch]
                        ├─ app/api/slack/interactivity accept/decline buttons               [stretch]
                        ├─ lib/ramp.ts             ONE swappable mock Ramp module (ledger)   [todo]
                        ├─ lib/slack.ts            ONE swappable mock Slack module           [stretch]
                        ├─ lib/supabase.ts         realtime + tables                         [todo]
                        └─ lib/types.ts            shared game state (single source)         [built]
                                     │
                                     ▼
                        Supabase — Postgres + Realtime
                        tables: rooms, players, game_state, ledger_entries
                        Realtime: broadcast (game events) + presence (live player list)
                        Fallback: poll a room row every 1–2s if Realtime flakes
```
- **Identity:** `roomId` + typed display name (or Slack user id). **No auth.**
- **Slack:** handled in Next.js route handlers, mock-by-default via `lib/slack.ts`. Signature verify over the **raw** body, **ack within 3s**. (See the `slack-challenge` skill for the gotchas.)
- **Claude API (optional stretch):** parse `/rampage @teammate mines at 0.5/1.5` into `{game, opponent, odds}` via structured output. Regex fallback ships first.

## 5. Build Workflow — 4 hours, 4 members

We start with a **big head start**: lobby, Fraudle, leaderboard, and seed data already exist. So the 4 hours go to multiplayer, the ledger, the challenge entry point, and deploy.

| Time | M1 — Challenge/Slack | M2 — Ledger/Ramp | M3 — Multiplayer/Games | M4 — Deploy/Realtime/Pitch |
|---|---|---|---|---|
| **0:00–0:30** | *All together:* create Supabase project; deploy the existing app to Vercel (rule 1); agree on the room + game-state JSON in `lib/types.ts`; commit `.env.example`. | | | |
| **0:30–1:30** | Web "Challenge a coworker" button → `POST /api/rooms` → room link | `lib/ramp.ts` mock: house pot, chips, **floor/cap payout** | `app/game/[roomId]` room from Fraudle; wire `lib/supabase.ts` | Supabase tables + Realtime helpers; keep Vercel green |
| **1:30–2:30** | `/api/slack/command` + `interactivity` (mock `lib/slack.ts`), same room code path | `/api/rooms/resolve` applies payout, updates leaderboard | Head-to-head Fraudle over broadcast + presence; win detection | Presence in lobby; **polling fallback**; second game if ahead |
| **2:30–3:15** | **Integration hour (pair up):** full loop — challenge (web + Slack) → room → play head-to-head → resolve → bonus payout → leaderboard update. | | | |
| **3:15–3:45** | Duel-card copy (positive-sum), error states | Seed richer demo data | Game juice: countdown, win animation (Framer Motion) | Demo script + pitch outline |
| **3:45–4:00** | **Freeze + rehearse:** run the demo twice end-to-end on the live Vercel URL from a phone. | | | |

**Cut list if behind (in order):** Slack path → web "Challenge" button only (already the fallback); Claude parse → regex; second game → Fraudle only; Realtime → polling; head-to-head → solo + leaderboard swing.

## 6. Hosting / Deploy
- **Vercel:** connect the GitHub repo → auto-deploy on push to `main`. Real HTTPS from hour one (phones hit it via QR — `localhost` won't work). Deploy the skeleton **before** features.
- **Supabase:** new project → run `supabase/schema.sql` → copy URL + anon/service keys into Vercel env.
- **Env:** `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `NEXT_PUBLIC_RAMP_MOCK` (default mock), `SLACK_MOCK` (default mock), `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, optional `ANTHROPIC_API_KEY`.
- **Slack (stretch):** app manifest with Request URLs pointed at the **Vercel prod HTTPS URL** (`/api/slack/command`, `/api/slack/interactivity`); scopes `commands`, `chat:write`, `users:read`. One person owns "create + install the app" first.

## 7. Judging Alignment
*(maps to the four scoring axes — see the `judging-criteria` skill)*
- **Technical complexity:** realtime head-to-head via Supabase (broadcast + presence), a Slack challenge flow with signature-verified webhooks, and a mock Ramp ledger enforcing floor/cap invariants — three integrated systems, all demo-safe. (Claude structured parsing is a bonus if it lands.)
- **Fun:** live head-to-head Fraudle between two teammates' (or judges') devices, ending in a real bonus-pot swing on the leaderboard. Juicy countdown + win animation.
- **Originality:** nobody has gamified spend management — Ramp's data model turned into a positive-sum game engine, entered from Slack.
- **Demo:** one Vercel URL, seeded so it's never empty, nothing external on the critical path (Ramp + Slack both mock-first, flip a flag to go real).
- **Pitch:** *"$X B in perk budgets, 20–40% unused. Ramp controls the money; RampAGE makes people care about it — same budget, same controls, and nobody ever loses their own allowance."*
