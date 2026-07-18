"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const GAMES = [
  { id: "receipt-blitz", label: "🧾 Receipt Blitz" },
  { id: "flip", label: "🪙 Flip" },
  { id: "split-or-steal", label: "🤝 Split or Steal" },
];

export function DuelLobby() {
  const router = useRouter();
  const [duelId, setDuelId] = useState("");
  const [creating, setCreating] = useState<string | null>(null);

  function enterDuel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const roomId = duelId.trim();
    if (roomId) router.push(`/game/${encodeURIComponent(roomId)}`);
  }

  // Same room-creation path Slack hits — Slack is icing, this always works.
  async function createDuel(gameId: string) {
    if (creating) return;
    setCreating(gameId);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        body: JSON.stringify({
          challengerName: sessionStorage.getItem("rampage_name") ?? "challenger",
          gameId,
        }),
      });
      const { room, error } = await res.json();
      if (error || !room) throw new Error(error);
      router.push(`/game/${room.id}`);
    } catch {
      setCreating(null);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-night px-6 py-10 font-body text-acid">
      <div className="w-full max-w-[620px]">
        <h1 className="mb-6 block text-center font-display text-[38px] uppercase leading-tight sm:text-[56px]">
          Start a duel
        </h1>
        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {GAMES.map((g) => (
            <button
              key={g.id}
              onClick={() => createDuel(g.id)}
              disabled={!!creating}
              className="rounded-2xl border-[3px] border-acid bg-night px-4 py-5 font-display text-[15px] uppercase text-acid shadow-[6px_6px_0_#e4f222] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_#e4f222] disabled:opacity-50"
            >
              {creating === g.id ? "Opening…" : g.label}
            </button>
          ))}
        </div>
        <form onSubmit={enterDuel}>
          <label htmlFor="duel-id" className="mb-3 block text-center font-mono text-[13px] uppercase text-acid/60">
            or enter a duel id
          </label>
          <input
            id="duel-id"
            name="duelId"
            value={duelId}
            onChange={(event) => setDuelId(event.target.value)}
            aria-label="Enter duel ID"
            autoComplete="off"
            required
            className="w-full rounded-2xl border-[3px] border-acid bg-night px-5 py-4 text-center font-mono text-[20px] text-acid caret-acid shadow-[6px_6px_0_#e4f222] outline-none transition placeholder:text-acid/35 focus:-translate-x-0.5 focus:-translate-y-0.5 focus:shadow-[8px_8px_0_#e4f222]"
          />
        </form>
      </div>
    </main>
  );
}
