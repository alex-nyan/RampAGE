// Pure Mines logic — no React. 6×6, 5 mines. Hit → placer wins; clear all safe → checker wins.
import type { MinesState } from "@/lib/types";

export const GRID = 6;
export const MINES = 5;
export const CELL_COUNT = GRID * GRID; // 36
export const SAFE_COUNT = CELL_COUNT - MINES; // 31

export function initialMinesState(roomId: string): MinesState {
  return {
    roomId,
    phase: "placing",
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

export function applyPlace(
  state: MinesState,
  mines: number[],
  by: string,
  roles?: { placer?: string; checker?: string }
): MinesState {
  if (state.phase !== "placing") return state;
  const placer = roles?.placer || state.placer || by;
  const checker = roles?.checker || state.checker;
  // Accept place from the known placer, OR from whoever places first if roles aren't set yet.
  if (state.placer && by !== state.placer && by !== placer) return state;
  if (!isValidPlacement(mines)) return state;
  return {
    ...state,
    placer,
    checker,
    mines: [...mines].sort((a, b) => a - b),
    phase: "probing",
  };
}

export function applyProbe(state: MinesState, index: number, by: string): MinesState {
  if (state.phase !== "probing") return state;
  // Only the checker may probe once roles are known; if checker unset, allow any non-placer.
  if (state.checker) {
    if (by !== state.checker) return state;
  } else if (state.placer && by === state.placer) {
    return state;
  }
  if (!Number.isInteger(index) || index < 0 || index >= CELL_COUNT) return state;
  if (state.revealed.includes(index)) return state;

  if (state.mines.includes(index)) {
    const winner = state.placer || "placer";
    return {
      ...state,
      revealed: [...state.revealed, index],
      hitMine: index,
      phase: "done",
      winner,
    };
  }

  const revealed = revealCells(index, state.mines, state.revealed);
  const safeRevealed = revealed.filter((i) => !state.mines.includes(i));
  if (safeRevealed.length >= SAFE_COUNT) {
    const winner = state.checker || by;
    return {
      ...state,
      revealed: safeRevealed,
      phase: "done",
      winner,
    };
  }
  return { ...state, revealed: safeRevealed };
}
