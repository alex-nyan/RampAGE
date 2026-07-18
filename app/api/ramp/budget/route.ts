import { NextResponse } from "next/server";
import { serverGetBudget, rampConfigured } from "@/lib/ramp.server";

// Real Ramp budget read. Guarded: on any failure, return a sane seeded budget so no empty state.
export async function GET() {
  const fallback = {
    label: "Team Perks — July",
    totalCents: 500_00,
    bonusPoolCents: 125_00,
    merchantRestrictions: ["Restaurants", "Coffee", "Wellness"],
  };
  try {
    if (!rampConfigured()) return NextResponse.json(fallback);
    return NextResponse.json(await serverGetBudget());
  } catch (e) {
    console.warn("[ramp] budget fell back to seed:", (e as Error).message);
    return NextResponse.json(fallback);
  }
}
