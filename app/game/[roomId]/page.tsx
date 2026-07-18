"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function DuelRoom() {
  const { roomId } = useParams<{ roomId: string }>();

  return (
    <main className="flex min-h-screen justify-center bg-acid font-body text-night">
      <div className="relative flex min-h-screen w-full max-w-[480px] flex-col gap-4 border-x-4 border-night bg-white px-5 pb-8 pt-6">
        {/* top bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            aria-label="Back to landing"
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-night bg-white transition hover:bg-acid"
          >
            ←
          </Link>
          <span className="font-mono text-[11px] text-black/50">room · {roomId}</span>
        </div>
        <div className="flex-1" />
      </div>
    </main>
  );
}
