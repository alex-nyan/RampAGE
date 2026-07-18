# docs/

Project documentation lives here to keep the repo root clean.

Loose Markdown docs (notes, guides, specs, plans) belong in this folder. The
`tidy-docs` skill (`.claude/skills/tidy-docs/`) keeps this tidy automatically —
when a stray `.md` doc shows up in the repo root, it gets moved here.

**These Markdown files stay where they are — they are functional, not docs:**

- `CLAUDE.md` (repo root) — Claude Code loads it as project instructions.
- `README.md` (repo root) — the conventional root readme GitHub renders.
- `.claude/skills/**` — `SKILL.md` and the skills `README.md` define the skills.
