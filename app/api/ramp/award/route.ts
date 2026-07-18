import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { serverAwardBonusCredit, rampConfigured } from "@/lib/ramp.server";

// Real Ramp award path. Runs ONLY when NEXT_PUBLIC_RAMP_MOCK=false (lib/ramp.ts routes here).
// Guarded per hard-rule #7: if Ramp isn't configured or the call throws, fall back to the
// mock ledger so the winner still gets credited and the demo never breaks.
export async function POST(req: Request) {
  const args = (await req.json()) as {
    roomId: string;
    userName: string;
    amountCents: number;
    memo: string;
  };

  let txId: string;
  let degraded = false;
  try {
    if (!rampConfigured()) throw new Error("Ramp not configured");
    const result = await serverAwardBonusCredit(args);
    if (!result.ok) throw new Error(result.error);
    txId = result.txId;
  } catch (e) {
    degraded = true;
    txId = `mock_tx_${args.roomId.slice(0, 8)}_${Date.now()}`;
    console.warn("[ramp] award fell back to mock ledger:", (e as Error).message);
  }

  // Positive-sum ledger + room resolution (same writes the mock path does client-side).
  await Promise.all([
    supabase.from("awards").insert({
      room_id: args.roomId,
      user_name: args.userName,
      amount_cents: args.amountCents,
      memo: args.memo,
      tx_id: txId,
    }),
    supabase.from("rooms").update({ status: "finished", winner: args.userName }).eq("id", args.roomId),
  ]);

  return NextResponse.json({ ok: true, txId, degraded });
}
