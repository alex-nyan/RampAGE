---
name: tidy-docs
description: Keep the repo root clean by moving loose Markdown documentation into docs/. Use whenever you create a new .md doc (notes, guide, spec, plan, writeup), when the user asks to tidy/organize docs, or before committing if stray .md files landed outside docs/. Preserves functional Markdown that MUST stay put (CLAUDE.md, root README.md, .claude/skills/**).
---

# tidy-docs — keep Markdown docs in `docs/`

All project documentation lives in `docs/`. Loose `.md` docs in the repo root (or
other non-doc locations) get moved into `docs/` so the root stays clean.

## When to run this
- You just wrote a new Markdown doc (notes, guide, spec, plan, design writeup).
- The user asks to tidy / organize / clean up docs.
- Before committing, if a stray `.md` file landed outside `docs/`.

## The one rule
A new Markdown **documentation** file goes in `docs/`, not the repo root. If you're
about to create one at the root, create it under `docs/` in the first place.

## NEVER move these — they are functional, not docs
Moving any of these breaks tooling. Leave them exactly where they are:

- `CLAUDE.md` and `CLAUDE.local.md` (repo root) — Claude Code project instructions.
- `README.md` at the **repo root** — the conventional readme GitHub renders.
- `AGENTS.md` (repo root) — agent instructions, if present.
- Anything under `.claude/**` — `SKILL.md`, the skills `README.md`, agents, commands.
- Anything under `node_modules/**`, `.git/**`, `.next/**`, `dist/**`, `build/**`, or `.vercel/**`.
- `README.md` / `CHANGELOG.md` that live **inside a subfolder** to document that
  folder (e.g. `components/README.md`) — those belong next to the code, leave them.
- Anything already inside `docs/`.

Everything else that is a loose `.md` doc → move into `docs/`.

## Procedure (sweeping existing files)
1. Create `docs/` if it doesn't exist.
2. Find candidate files (root-level and other loose docs), excluding the never-move
   list:
   ```bash
   find . -maxdepth 1 -name "*.md" -not -name "CLAUDE.md" -not -name "CLAUDE.local.md" \
     -not -name "README.md" -not -name "AGENTS.md"
   ```
   (Widen the search beyond `-maxdepth 1` only if the user asks; be careful not to
   sweep up `.claude/**`, `node_modules/**`, or subfolder-local READMEs.)
3. Move each match with `git mv <file> docs/` (falls back to `mv` if the file isn't
   tracked) so history is preserved.
4. If a moved doc is referenced elsewhere (links, imports), update the paths.
5. Report exactly what moved and what was intentionally left in place.

## Notes
- Prefer `git mv` over `mv` to keep git history and stage the move in one step.
- If two files would collide (e.g. two `notes.md`), rename rather than overwrite —
  never clobber an existing doc.
- This is about tidiness, not busywork: if nothing is loose, say so and stop.
