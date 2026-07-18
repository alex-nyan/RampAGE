---
name: judging-criteria
description: What the Rampage hackathon is judged on — technical complexity, uniqueness/originality of the idea, the demo, and how fun the game is to play. Use when prioritizing what to build, cutting scope, deciding trade-offs, or prepping the demo, so every decision maps to something that actually scores.
---

# What we're judged on — build toward these four

Every scope call, feature, and demo choice should ladder up to at least one of these. If something advances none of them, cut it.

## 1. Technical complexity
Show real engineering, not a static mockup. What reads as complexity here: live multiplayer via Supabase Realtime (broadcast + presence), the Slack challenge flow with signature-verified webhooks, the Ramp spend-control integration, deterministic game-state sync. Make the hard parts *visible* in the demo — presence popping in live, a Slack button dropping two people into a room, a real payout to the bonus pool.

## 2. Uniqueness & originality of the idea
Lean into what makes Rampage unlike a generic game: **positive-sum, company-funded bonus pool** wrapped in **Ramp spend controls**, entered through a **Slack challenge**. That combination is the differentiator — protect it. Cheeky tone, defensible mechanics. Don't sand off the distinctive angle to save time; it's a scoring axis.

## 3. Demo
The demo is graded directly, so treat it as a first-class deliverable:
- **Deploy early, deploy often** — must be live on real HTTPS (phones hit it via QR). A broken deploy tanks this whole axis.
- **Seed fake data on load** — never an empty state on stage. Never set up state live.
- **Keep external APIs off the critical path** — mock-first Ramp and Slack so nothing flakes live (flip the flag if it does).
- Rehearse a tight, legible happy path: QR/Slack join → play → win → bonus-pool payout.

## 4. Fun — how fun the game is to play
The core loop has to actually feel good. A tight, juicy, skill-based game beats a deep one that isn't fun or isn't done:
- Framer Motion juice, satisfying feedback, clear win moment.
- Skill-based and fair; positive-sum stakes (win a slice of the bonus pool).
- Playtest it early — if it's not fun in 30 seconds, fix the loop before adding features.

## How to use this when deciding
- Prioritizing/cutting scope → does this advance complexity, originality, demo, or fun? If not, drop it.
- Trade-off between two tasks → pick the one that moves more of these axes, or the axis that's currently weakest.
- "Is this good enough?" → check it against all four before calling it done.

## Related
- `rampage-conventions` — hard rules (deploy early, seed data, mock APIs) that protect the demo axis.
- `new-minigame` — the fun axis lives here; keep the loop tight and shippable.
- `slack-challenge` / `ramp-integration` / `supabase-realtime` — the technical-complexity and originality surface area.
