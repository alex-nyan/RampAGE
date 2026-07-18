// Pure Mines logic — no React. 6×6, 5 mines. Hit → placer wins; clear all safe → checker wins.
import type { MinesState } from "@/lib/types";

export const GRID = 6;
export const MINES = 5;
export const CELL_COUNT = GRID * GRID; // 36
export const SAFE_COUNT = CELL_COUNT - MINES; // 31

export function initialMinesState(roomId: string): MinesState {
  return {
    roomId,
    phase: "roles",
    placer: "",
    checker: "",
    mines: [],
    revealed: [],
  };
}

export function isValidPlacement(mines: number[]): boolean {
  if (mines.length !== MINES) return false;
  const seen = new Set<number>();
  for (const i of mines) {
    if (!Number.isInteger(i) || i < 0 || i >= CELL_COUNT) return false;
    if (seen.has(i)) return false;
    seen.add(i);
  }
  return true;
}

export function adjacentCount(index: number, mines: number[]): number {
  const mineSet = new Set(mines);
  const r = Math.floor(index / GRID);
  const c = index % GRID;
  let n = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const rr = r + dr;
      const cc = c + dc;
      if (rr < 0 || rr >= GRID || cc < 0 || cc >= GRID) continue;
      if (mineSet.has(rr * GRID + cc)) n++;
    }
  }
  return n;
}

/** Reveal index plus flood-fill of zero-adjacent cells (classic minesweeper). */
export function revealCells(index: number, mines: number[], already: number[]): number[] {
  const mineSet = new Set(mines);
  if (mineSet.has(index)) return already;
  const revealed = new Set(already);
  const stack = [index];
  while (stack.length) {
    const i = stack.pop()!;
    if (revealed.has(i) || mineSet.has(i)) continue;
    revealed.add(i);
    if (adjacentCount(i, mines) !== 0) continue;
    const r = Math.floor(i / GRID);
    const c = i % GRID;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const rr = r + dr;
        const cc = c + dc;
        if (rr < 0 || rr >= GRID || cc < 0 || cc >= GRID) continue;
        const ni = rr * GRID + cc;
        if (!revealed.has(ni) && !mineSet.has(ni)) stack.push(ni);
      }
    }
  }
  return [...revealed];
}

/** Each player claims placer or checker. When both roles are filled by different people → placing. */
export function applyClaim(
  state: MinesState,
  by: string,
  role: "placer" | "checker"
): MinesState {
  if (state.phase !== "roles") return state;

  let placer = state.placer;
  let checker = state.checker;

  // Drop this player from the other seat if they switch.
  if (role === "placer") {
    if (placer && placer !== by) return state; // seat taken
    if (checker === by) checker = "";
    placer = by;
  } else {
    if (checker && checker !== by) return state;
    if (placer === by) placer = "";
    checker = by;
  }

  const bothReady = Boolean(placer && checker && placer !== checker);
  return {
    ...state,
    placer,
    checker,
    phase: bothReady ? "placing" : "roles",
  };
}

export function applyPlace(state: MinesState, mines: number[], by: string): MinesState {
  if (state.phase !== "placing") return state;
  if (!state.placer || !state.checker || state.placer === state.checker) return state;
  if (by !== state.placer) return state;
  if (!isValidPlacement(mines)) return state;
  return {
    ...state,
    mines: [...mines].sort((a, b) => a - b),
    phase: "probing",
  };
}

export function applyProbe(state: MinesState, index: number, by: string): MinesState {
  if (state.phase !== "probing") return state;
  if (!state.checker || by !== state.checker) return state;
  if (!Number.isInteger(index) || index < 0 || index >= CELL_COUNT) return state;
  if (state.revealed.includes(index)) return state;

  if (state.mines.includes(index)) {
    return {
      ...state,
      revealed: [...state.revealed, index],
      hitMine: index,
      phase: "done",
      winner: state.placer,
    };
  }

  const revealed = revealCells(index, state.mines, state.revealed);
  const safeRevealed = revealed.filter((i) => !state.mines.includes(i));
  if (safeRevealed.length >= SAFE_COUNT) {
    return {
      ...state,
      revealed: safeRevealed,
      phase: "done",
      winner: state.checker,
    };
  }
  return { ...state, revealed: safeRevealed };
}
