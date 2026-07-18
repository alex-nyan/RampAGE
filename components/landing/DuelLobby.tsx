"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Ticker } from "@/components/ui";
import { TICKER_ONE, TICKER_TWO } from "@/lib/landing";
import type { GameId } from "@/lib/types";

const GAMES: { id: GameId; label: string }[] = [
  { id: "mines", label: "💣 Mines Duel" },
  { id: "receipt-blitz", label: "🧾 Receipt Blitz" },
  { id: "flip", label: "🪙 Flip" },
  { id: "split-or-steal", label: "🤝 Split or Steal" },
];

export function DuelLobby() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlight = searchParams.get("game");
  const [duelId, setDuelId] = useState("");
  const [creating, setCreating] = useState<string | null>(null);
  const [status, setStatus] = useState<{ message: string; error: boolean } | null>(null);

  function enterDuel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const roomId = duelId.trim();

    if (!roomId) {
      setStatus({ message: "✕ ENTER A ROOM ID FIRST", error: true });
      return;
    }

    setStatus({ message: `⚡ JOINING ROOM ${roomId}…`, error: false });
    router.push(`/game/${encodeURIComponent(roomId)}`);
  }

  // Same room-creation path Slack hits — preserve the existing game launch behavior.
  async function createDuel(gameId: string) {
    if (creating) return;
    setCreating(gameId);
    setStatus({ message: "⚡ CREATING YOUR DUEL…", error: false });

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      setStatus({ message: "✕ COULDN’T CREATE THAT DUEL", error: true });
    }
  }

  return (
    <main className="flex min-h-dvh min-w-0 flex-col overflow-hidden bg-night font-body text-acid">
      <nav className="relative z-10 flex items-center gap-2.5 border-b-4 border-acid px-5 py-2 sm:px-12">
        <Link href="/" className="flex items-center gap-2.5 text-acid">
          <Image
            src="/logo.png"
            alt="Rampage logo"
            width={40}
            height={40}
            priority
            className="h-10 w-10 rounded-[10px] border-[3px] border-acid object-cover"
          />
          <span className="font-display text-[18px] tracking-wide sm:text-[20px]">RAMPAGE</span>
        </Link>
        <span className="ml-auto whitespace-nowrap rounded-full bg-acid px-3 py-1.5 font-display text-[9px] text-night sm:px-4 sm:text-[10px]">
          ⚔ DUEL LOBBY
        </span>
      </nav>

      <section className="relative grid flex-1 place-items-center overflow-hidden px-5 py-8 sm:px-12 sm:py-10">
        <Image
          src="/background.png"
          alt=""
          fill
          priority
          aria-hidden="true"
          sizes="100vw"
          className="object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(10,10,10,.5) 0%, rgba(10,10,10,.7) 33.333%, rgba(10,10,10,1) 100%)",
          }}
        />

        <div className="relative w-full max-w-[680px] text-center">
          <Image
            src="/logo.png"
            alt="Rampage"
            width={68}
            height={68}
            className="mx-auto mb-4 h-[68px] w-[68px] -rotate-3 rounded-2xl border-[3px] border-acid object-cover shadow-[5px_5px_0_rgba(228,242,34,.3)]"
          />
          <h1 className="mb-2 font-display text-[24px] text-acid sm:text-[28px]">
            ENTER DUEL ROOM ID
          </h1>
          <p className="mx-auto mb-5 max-w-[470px] text-[13.5px] font-medium text-[#b8c41e]">
            Grab the room code from your Slack thread or launch the link from the agent directly
          </p>

          <form onSubmit={enterDuel} className="mx-auto flex max-w-[500px] flex-col gap-2.5 sm:flex-row">
            <input
              id="duel-id"
              name="duelId"
              value={duelId}
              onChange={(event) => {
                setDuelId(event.target.value.toUpperCase());
                setStatus(null);
              }}
              placeholder="E.G. RMPG-4207"
              aria-label="Enter duel room ID"
              autoComplete="off"
              autoFocus
              className="min-w-0 flex-1 rounded-xl border-[3px] border-acid bg-night px-4 py-3 text-center font-display text-[15px] tracking-[2px] text-acid caret-acid outline-none placeholder:text-acid-ink focus:shadow-[4px_4px_0_rgba(228,242,34,.35)]"
            />
            <button
              type="submit"
              className="rounded-xl border-[3px] border-acid bg-acid px-5 py-3 font-display text-[12px] text-night shadow-[4px_4px_0_rgba(228,242,34,.35)] transition hover:border-hot hover:bg-hot hover:text-white"
            >
              ENTER ▸
            </button>
          </form>

          <div className="mt-5 border-t-2 border-acid/25 pt-4">
            <div className="mb-3 font-display text-[10px] tracking-[1.5px] text-acid/65">
              OR LAUNCH A NEW GAME
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {GAMES.map((game) => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => createDuel(game.id)}
                  disabled={!!creating}
                  className={`rounded-xl border-2 border-acid px-2 py-3 font-display text-[10px] uppercase transition hover:bg-acid hover:text-night disabled:cursor-wait disabled:opacity-50 ${
                    highlight === game.id ? "bg-acid text-night" : "bg-night/85 text-acid"
                  }`}
                >
                  {creating === game.id ? "Opening…" : game.label}
                </button>
              ))}
            </div>
          </div>

          <div
            aria-live="polite"
            className={`mt-3 min-h-[15px] font-display text-[10.5px] ${status?.error ? "text-hot" : "text-acid"}`}
          >
            {status?.message}
          </div>
          <Link
            href="/"
            className="mt-3 inline-block border-b-2 border-acid pb-0.5 text-[12px] font-bold text-acid hover:text-white"
          >
            ◂ Back to Rampage
          </Link>
        </div>
      </section>

      <Ticker text={TICKER_ONE} speed={30} tone="light" className="border-t-[3px] border-acid" />
      <Ticker text={TICKER_TWO} speed={40} tone="acid" className="border-t-2 border-[#333]" />
    </main>
  );
}
