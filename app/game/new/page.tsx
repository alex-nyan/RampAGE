import { Suspense } from "react";
import { DuelLobby } from "@/components/landing/DuelLobby";

export default function NewDuelPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-dvh place-items-center bg-night font-display text-acid">
          Loading…
        </main>
      }
    >
      <DuelLobby />
    </Suspense>
  );
}
