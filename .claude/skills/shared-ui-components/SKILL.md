---
name: shared-ui-components
description: How to build UI/UX in Rampage — lean on shared packages and existing shared components as hard as possible instead of writing bespoke markup or CSS. Use whenever you add or change ANY visual component, screen, layout, animation, icon, or styling in the app.
---

# Build UI from shared packages — reuse first, hand-roll last

**Default stance: assume the thing you need already exists.** Before writing any new component or CSS, reach for a shared package or an already-built component in the repo. Hand-rolling is the last resort, not the first move — it fragments the look, wastes hackathon time, and creates one-offs nobody can reuse.

## The order of operations (do these in order, stop at the first that works)
1. **Reuse an existing component** in `components/ui/` (or anywhere in `components/`). Grep before you build — if a Card, Button, Dialog, Avatar, Badge, etc. already exists, use it.
2. **Pull a shadcn/ui component** you don't have yet — `npx shadcn@latest add <component>`. shadcn is the project's component source; adding one is cheap and keeps everything consistent.
3. **Compose from Tailwind utilities** for layout/spacing/color. Style via Tailwind classes and design tokens, never a hand-written `.css` file.
4. **Animate with Framer Motion** — it's already in the stack. Don't hand-roll keyframes or add another animation library.
5. **Icons: use the shared icon set** already installed (e.g. `lucide-react` that ships with shadcn). Don't paste ad-hoc SVGs when a shared icon exists.
6. **Only then** write something custom — and when you do, make it a **shared, reusable component in `components/`**, not an inline one-off, so the next person reuses it.

## Rules
- **Do NOT hand-write raw CSS files.** Tailwind + shadcn only. (Repo hard rule.)
- **Do NOT add another component/UI library** (MUI, Chakra, Ant, Bootstrap, etc.). One system: Tailwind + shadcn/ui. (Repo hard rule.)
- **Do NOT add a second animation, icon, or utility library** if the installed one covers it. More shared usage, fewer packages.
- **Extract, don't duplicate.** If you copy-paste markup twice, promote it to a shared component in `components/`. But note the repo rule: *duplicated code that works beats an abstraction that isn't shipping* — extract when reuse is real, not speculatively.
- **Match the existing look.** New components should read like the surrounding ones — same shadcn primitives, same Tailwind token usage, same spacing rhythm.
- **Keep it consistent for the demo.** A cohesive UI built from shared parts looks more polished on stage than a pile of bespoke pieces.

## Design references
There are hi-fi mockups in `frontend ideas/` (gitignored — local only). Mine them for the intended look, then rebuild it out of shared shadcn/Tailwind pieces rather than copying their raw HTML/CSS.

## Quick check before you write UI
- Does a component for this already exist in `components/`? → reuse it.
- Is there a shadcn component for it? → `npx shadcn@latest add` it.
- Can Tailwind utilities + an existing primitive do it? → compose.
- Genuinely new? → build it as a **shared** component others can reuse.

## Related
- `rampage-conventions` — stack + "do NOT add a heavy UI kit / write raw CSS" hard rules.
- `new-minigame` — game UI still comes from these shared pieces (canvas only if spatial).
