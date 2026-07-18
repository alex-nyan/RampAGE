"use client";

// Mines Duel — placer hides 5 mines on 6×6; checker clears all safe cells.
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
  applyPlace,
  applyProbe,
} from "@/lib/games/mines/rules";

export { initialMinesState } from "@/lib/games/mines/rules";

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

export default function MinesGame({
  me,
  players,
  state,
  lastEvent,
  send,
  onFinish,
}: GameProps) {
  const rolesLocked = useRef(false);
  const finishedRef = useRef(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const [game, setGame] = useState<MinesState>(() => {
    const base = state as MinesState;
    return {
      ...base,
      placer: base?.placer || players[0]?.name || "",
      checker: base?.checker || players[1]?.name || "",
    };
  });
  const [draft, setDraft] = useState<number[]>([]);

  // Lock roles once from presence order — do NOT reassign mid-match (presence can reorder).
  useEffect(() => {
    if (rolesLocked.current || players.length < 2) return;
    rolesLocked.current = true;
    const placer = players[0].name;
    const checker = players[1].name;
    setGame((g) => ({ ...g, placer: g.placer || placer, checker: g.checker || checker }));
  }, [players]);

  function settleIfDone(next: MinesState) {
    if (next.phase !== "done" || finishedRef.current) return next;
    const winner = next.winner || next.placer;
    if (!winner) return next;
    finishedRef.current = true;
    const loser = winner === next.placer ? next.checker : next.placer;
    // Defer so setState finishes before shell unmounts this component.
    queueMicrotask(() => onFinishRef.current(winner, { [winner]: 1, [loser || ""]: 0 }));
    return { ...next, winner };
  }

  // Apply opponent moves.
  useEffect(() => {
    if (!lastEvent || lastEvent.by === me) return;
    const move = lastEvent.data as MinesMove;
    if (!move?.type) return;
    setGame((g) => {
      let next = g;
      if (move.type === "place")
        next = applyPlace(g, move.mines, lastEvent.by, {
          placer: move.placer,
          checker: move.checker,
        });
      else if (move.type === "probe") next = applyProbe(g, move.index, lastEvent.by);
      return settleIfDone(next);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastEvent, me]);

  const isPlacer = me === game.placer;
  const isChecker = me === game.checker;
  const showMinesToMe = isPlacer;

  function toggleDraft(index: number) {
    if (!isPlacer || game.phase !== "placing") return;
    setDraft((d) => {
      if (d.includes(index)) return d.filter((i) => i !== index);
      if (d.length >= MINES) return d;
      return [...d, index];
    });
  }

  function confirmPlace() {
    if (!isPlacer || draft.length !== MINES) return;
    const placer = game.placer || me;
    const checker = game.checker || players.find((p) => p.name !== me)?.name || "";
    send({ type: "place", mines: draft, placer, checker } satisfies MinesMove);
    setGame((g) =>
      settleIfDone(applyPlace({ ...g, placer, checker }, draft, me, { placer, checker }))
    );
  }

  function probe(index: number) {
    if (!isChecker || game.phase !== "probing") return;
    if (game.revealed.includes(index)) return;
    send({ type: "probe", index } satisfies MinesMove);
    setGame((g) => settleIfDone(applyProbe(g, index, me)));
  }

  const safeLeft = SAFE_COUNT - game.revealed.filter((i) => !game.mines.includes(i)).length;

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="w-full rounded-2xl border-[3px] border-night bg-cream p-3 text-center shadow-hard-sm">
        <p className="font-display text-[13px] uppercase tracking-wide">
          {game.phase === "placing" && (isPlacer ? "Plant 5 mines" : "Waiting for placer…")}
          {game.phase === "probing" &&
            (isChecker ? `Clear the board · ${safeLeft} safe left` : "Checker is probing…")}
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
          } else if (showMinesToMe && isMine) {
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

      {game.phase === "placing" && !isPlacer && (
        <p className="text-center text-[13px] text-black/50">
          {game.placer || "Placer"} is hiding {MINES} mines…
        </p>
      )}

      {!isPlacer && !isChecker && game.placer && (
        <p className="text-center text-[12px] text-hot">
          Role mismatch — refresh and rejoin (first joiner = placer).
        </p>
      )}
    </div>
  );
}
