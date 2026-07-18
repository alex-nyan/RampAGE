// The ONE swappable Ramp module. Never call Ramp from a component or route directly.
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
    return { ok: true, txId: `mock_tx_${args.roomId.slice(0, 8)}_${Date.now()}` };
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

// --- real implementations (wire to Ramp sandbox ONLY after mock path demos clean) ---
async function realAwardBonusCredit(_: unknown): Promise<AwardResult> {
  return { ok: false, error: "Ramp sandbox not wired yet — flip NEXT_PUBLIC_RAMP_MOCK back" };
}
async function realGetBudget(): Promise<Budget> {
  throw new Error("Ramp sandbox not wired yet");
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
