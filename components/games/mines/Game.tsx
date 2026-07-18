"use client";

// Mines Duel — pick roles → place mines → clear board.
// Syncs via full-state snapshots so both clients always converge (Realtime can drop events).
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { GameProps } from "@/lib/games/registry";
import type { MinesMove, MinesState } from "@/lib/types";
import {
  GRID,
  MINES,
  CELL_COUNT,
  SAFE_COUNT,
  adjacentCount,
  applyClaim,
  applyPlace,
  applyProbe,
  initialMinesState,
} from "@/lib/games/mines/rules";

export { initialMinesState };

const NUMBER_COLORS = [
  "",
  "text-blue-600",
  "text-green-700",
  "text-red-600",
  "text-purple-700",
  "text-amber-700",
  "text-cyan-700",
  "text-night",
  "text-hot",
];

function normalize(raw: unknown, roomId: string): MinesState {
  const s = (raw ?? {}) as Partial<MinesState>;
  const phase =
    s.phase === "roles" || s.phase === "placing" || s.phase === "probing" || s.phase === "done"
      ? s.phase
      : "roles";
  return {
    roomId: s.roomId || roomId,
    phase,
    placer: s.placer || "",
    checker: s.checker || "",
    mines: Array.isArray(s.mines) ? s.mines : [],
    revealed: Array.isArray(s.revealed) ? s.revealed : [],
    hitMine: s.hitMine,
    winner: s.winner,
  };
}

export default function MinesGame({
  roomId,
  me,
  state,
  lastEvent,
  send,
  onFinish,
}: GameProps) {
  const finishedRef = useRef(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const gameRef = useRef<MinesState>(normalize(state, roomId));

  const [game, setGame] = useState<MinesState>(() => normalize(state, roomId));
  const [draft, setDraft] = useState<number[]>([]);
  const [claimError, setClaimError] = useState<string | null>(null);

  // Keep a ref for broadcasting the latest snapshot without stale closures.
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  // New match start → reset.
  useEffect(() => {
    const next = normalize(state, roomId);
    gameRef.current = next;
    finishedRef.current = false;
    setDraft([]);
    setClaimError(null);
    setGame(next);
  }, [state, roomId]);

  function publish(next: MinesState) {
    gameRef.current = next;
    setGame(next);
    send({ type: "sync", state: next } satisfies MinesMove);
    if (next.phase === "done" && next.winner && !finishedRef.current) {
      finishedRef.current = true;
      const winner = next.winner;
      const loser = winner === next.placer ? next.checker : next.placer;
      queueMicrotask(() => onFinishRef.current(winner, { [winner]: 1, [loser || ""]: 0 }));
    }
  }

  // Apply opponent snapshots / legacy move types.
  useEffect(() => {
    if (!lastEvent || lastEvent.by === me) return;
    const move = lastEvent.data as MinesMove;
    if (!move?.type) return;

    if (move.type === "sync" && move.state) {
      const next = normalize(move.state, roomId);
      gameRef.current = next;
      setGame(next);
      if (next.phase === "done" && next.winner && !finishedRef.current) {
        finishedRef.current = true;
        const winner = next.winner;
        const loser = winner === next.placer ? next.checker : next.placer;
        queueMicrotask(() => onFinishRef.current(winner, { [winner]: 1, [loser || ""]: 0 }));
      }
      return;
    }

    // Legacy fallbacks if an older client is still in the room.
    setGame((g) => {
      let next = g;
      if (move.type === "claim") next = applyClaim(g, lastEvent.by, move.role);
      else if (move.type === "place") next = applyPlace(g, move.mines, lastEvent.by);
      else if (move.type === "probe") next = applyProbe(g, move.index, lastEvent.by);
      gameRef.current = next;
      return next;
    });
  }, [lastEvent, me, roomId]);

  const isPlacer = me === game.placer;
  const isChecker = me === game.checker;

  function claim(role: "placer" | "checker") {
    setClaimError(null);
    const cur = gameRef.current;
    if (role === "placer" && cur.placer && cur.placer !== me) {
      setClaimError(`${cur.placer} already claimed Place mines.`);
      return;
    }
    if (role === "checker" && cur.checker && cur.checker !== me) {
      setClaimError(`${cur.checker} already claimed Clear board.`);
      return;
    }
    publish(applyClaim(cur, me, role));
  }

  function toggleDraft(index: number) {
    if (!isPlacer || game.phase !== "placing") return;
    setDraft((d) => {
      if (d.includes(index)) return d.filter((i) => i !== index);
      if (d.length >= MINES) return d;
      return [...d, index];
    });
  }

  function confirmPlace() {
    if (!isPlacer || game.phase !== "placing" || draft.length !== MINES) return;
    const next = applyPlace(gameRef.current, draft, me);
    if (next.phase !== "probing") return;
    setDraft([]);
    publish(next);
  }

  function probe(index: number) {
    if (!isChecker || game.phase !== "probing") return;
    if (game.revealed.includes(index)) return;
    const next = applyProbe(gameRef.current, index, me);
    publish(next);
  }

  const safeLeft = SAFE_COUNT - game.revealed.filter((i) => !game.mines.includes(i)).length;

  // ——— Role pick (always first) ———
  if (game.phase === "roles") {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="w-full rounded-2xl border-[3px] border-night bg-hot p-4 text-center text-white shadow-hard">
          <p className="font-display text-[18px] uppercase">Step 1 — pick roles</p>
          <p className="mt-2 text-[13px] text-white/85">
            One person plants 5 mines. The other clears the board. You must pick opposite roles.
          </p>
        </div>

        <div className="grid w-full max-w-[360px] gap-3">
          <button
            type="button"
            onClick={() => claim("placer")}
            className={`min-h-[64px] rounded-2xl border-[3px] border-night px-4 py-4 text-left shadow-hard transition active:translate-x-px active:translate-y-px ${
              isPlacer ? "bg-hot text-white" : "bg-white text-night hover:bg-cream"
            }`}
          >
            <div className="font-display text-[15px] uppercase">💣 I place the mines</div>
            <div className="mt-1 font-mono text-[12px] opacity-70">
              {game.placer ? `→ ${game.placer}` : "tap to claim"}
            </div>
          </button>
          <button
            type="button"
            onClick={() => claim("checker")}
            className={`min-h-[64px] rounded-2xl border-[3px] border-night px-4 py-4 text-left shadow-hard transition active:translate-x-px active:translate-y-px ${
              isChecker ? "bg-acid text-night" : "bg-white text-night hover:bg-cream"
            }`}
          >
            <div className="font-display text-[15px] uppercase">🔎 I clear the board</div>
            <div className="mt-1 font-mono text-[12px] opacity-70">
              {game.checker ? `→ ${game.checker}` : "tap to claim"}
            </div>
          </button>
        </div>

        {claimError && <p className="max-w-[360px] text-center text-[13px] font-semibold text-hot">{claimError}</p>}
        {(isPlacer || isChecker) && !(game.placer && game.checker) && (
          <p className="text-center text-[13px] text-black/50">
            Waiting for the other player to take the other role…
          </p>
        )}
      </div>
    );
  }

  // ——— Board ———
  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="w-full rounded-2xl border-[3px] border-night bg-cream p-3 text-center shadow-hard-sm">
        <p className="font-display text-[13px] uppercase tracking-wide">
          {game.phase === "placing" && (isPlacer ? "Plant 5 mines, then confirm" : `Waiting — ${game.placer} is planting…`)}
          {game.phase === "probing" &&
            (isChecker ? `Your turn — ${safeLeft} safe left` : `Waiting — ${game.checker} is clearing…`)}
          {game.phase === "done" &&
            (game.hitMine != null ? "Boom — placer wins" : "Board cleared — checker wins")}
        </p>
        <p className="mt-1 font-mono text-[11px] text-black/50">
          placer · {game.placer || "—"} · checker · {game.checker || "—"}
        </p>
      </div>

      <div
        className="grid w-full max-w-[360px] gap-1.5"
        style={{ gridTemplateColumns: `repeat(${GRID}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: CELL_COUNT }, (_, i) => {
          const revealed = game.revealed.includes(i);
          const isMine = game.mines.includes(i);
          const inDraft = draft.includes(i);
          const blown = game.hitMine === i;
          const count = revealed && !isMine ? adjacentCount(i, game.mines) : 0;

          let label = "";
          let cellClass =
            "aspect-square min-h-[44px] rounded-lg border-[2.5px] border-night font-display text-[15px] transition active:translate-x-px active:translate-y-px";

          if (game.phase === "placing") {
            cellClass += inDraft
              ? " bg-hot text-white shadow-hard-sm"
              : " bg-slate text-acid hover:bg-night";
            label = inDraft ? "●" : "";
          } else if (blown || (revealed && isMine)) {
            cellClass += " bg-hot text-white";
            label = "💥";
          } else if (revealed) {
            cellClass += " bg-acid text-night";
            label = count > 0 ? String(count) : "";
          } else if (isPlacer && isMine) {
            cellClass += " bg-slate text-hot/80";
            label = "●";
          } else {
            cellClass += " bg-night text-acid hover:bg-slate";
          }

          const clickable =
            (game.phase === "placing" && isPlacer) ||
            (game.phase === "probing" && isChecker && !revealed);

          return (
            <motion.button
              key={i}
              type="button"
              disabled={!clickable || game.phase === "done"}
              onClick={() => (game.phase === "placing" ? toggleDraft(i) : probe(i))}
              whileTap={clickable ? { scale: 0.92 } : undefined}
              className={`${cellClass} ${NUMBER_COLORS[count] ?? ""}`}
            >
              {label}
            </motion.button>
          );
        })}
      </div>

      {game.phase === "placing" && isPlacer && (
        <button
          type="button"
          disabled={draft.length !== MINES}
          onClick={confirmPlace}
          className="w-full max-w-[360px] rounded-2xl border-[3px] border-night bg-acid px-6 py-3.5 font-display text-[15px] uppercase text-night shadow-hard disabled:opacity-50"
        >
          Confirm {draft.length}/{MINES} mines
        </button>
      )}
    </div>
  );
}
