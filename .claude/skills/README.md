# Rampage — Claude Code skills

Project skills for the Rampage hackathon. **They work automatically** — anyone who clones this repo and opens it in Claude Code gets them; Claude loads the right one by matching your task to each skill's `description`. You can also invoke one directly by name.

| Skill | Use it when |
| --- | --- |
| `rampage-conventions` | Starting any feature; unsure about a stack choice; writing player-facing copy. **Read-this-first.** |
| `judging-criteria` | Prioritizing, cutting scope, weighing trade-offs, or prepping the demo — map every call to what scores. |
| `ramp-integration` | Adding a spend-control feature, awarding bonus-pool credits, or wiring the real Ramp sandbox (via `lib/ramp.ts`). |
| `slack-challenge` | Anything touching the `/rampage` Slack flow — `app/api/slack/*` or `lib/slack.ts`. |
| `supabase-realtime` | Building the game room, live lobby/presence, or fixing multiplayer sync. |
| `shared-ui-components` | Building ANY UI — reuse shared packages/components (shadcn, Tailwind, Framer Motion) before hand-rolling. |
| `new-minigame` | Adding/changing the game loop, extending `lib/types.ts`, or the `game/[roomId]` UI. |

Each skill is a distilled fast-path; the full source of truth is `CLAUDE.md` at the repo root.

## Adding a skill
Create `.claude/skills/<name>/SKILL.md` with YAML frontmatter (`name`, `description`) then Markdown instructions. Write the `description` around *when to use it* (specific triggers) — that's how Claude decides to load it. Commit to `main`.
