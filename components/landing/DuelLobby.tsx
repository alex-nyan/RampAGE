"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function DuelLobby() {
  const router = useRouter();
  const [duelId, setDuelId] = useState("");

  function enterDuel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const roomId = duelId.trim();
    if (roomId) router.push(`/game/${encodeURIComponent(roomId)}`);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-night px-6 font-body text-acid">
      <form onSubmit={enterDuel} className="w-full max-w-[620px]">
        <label
          htmlFor="duel-id"
          className="mb-6 block text-center font-display text-[38px] uppercase leading-tight sm:text-[56px]"
        >
          Enter duel id
        </label>
        <input
          id="duel-id"
          name="duelId"
          value={duelId}
          onChange={(event) => setDuelId(event.target.value)}
          aria-label="Enter duel ID"
          autoComplete="off"
          autoFocus
          required
          className="w-full rounded-2xl border-[3px] border-acid bg-night px-5 py-4 text-center font-mono text-[20px] text-acid caret-acid shadow-[6px_6px_0_#e4f222] outline-none transition placeholder:text-acid/35 focus:-translate-x-0.5 focus:-translate-y-0.5 focus:shadow-[8px_8px_0_#e4f222]"
        />
      </form>
    </main>
  );
}
