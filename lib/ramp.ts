// The ONE swappable Ramp module. Never call Ramp from a component or route directly.
import { supabase } from "./supabase";

const USE_MOCK = process.env.NEXT_PUBLIC_RAMP_MOCK !== "false";

export type AwardResult = { ok: true; txId: string } | { ok: false; error: string };
export type Budget = {
  label: string;
  totalCents: number;
  bonusPoolCents: number;
  merchantRestrictions: string[];
};

export async function awardBonusCredit(args: {
  roomId: string;
  userName: string;
  amountCents: number;
  memo: string;
}): Promise<AwardResult> {
  if (USE_MOCK) {
    await delay(400); // let loading states show
    const txId = `mock_tx_${args.roomId.slice(0, 8)}_${Date.now()}`;
    // Positive-sum ledger: credit the winner from the house pot; nobody is debited.
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
    return { ok: true, txId };
  }
  return realAwardBonusCredit(args);
}

export async function getBudget(): Promise<Budget> {
  if (USE_MOCK) {
    return {
      label: "Team Perks — July",
      totalCents: 500_00,
      bonusPoolCents: 125_00,
      merchantRestrictions: ["Restaurants", "Coffee", "Wellness"],
    };
  }
  return realGetBudget();
}

// --- real implementations ---
// The client secret can't live in the browser, so real Ramp calls go through
// server route handlers (app/api/ramp/*), which call lib/ramp.server.ts.
// Same signatures as the mock — the caller never knows which is live.
async function realAwardBonusCredit(args: {
  roomId: string;
  userName: string;
  amountCents: number;
  memo: string;
}): Promise<AwardResult> {
  const res = await fetch("/api/ramp/award", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) return { ok: false, error: `award route ${res.status}` };
  return res.json();
}
async function realGetBudget(): Promise<Budget> {
  const res = await fetch("/api/ramp/budget");
  return res.json();
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
