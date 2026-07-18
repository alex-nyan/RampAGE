import "server-only";
// Real Ramp sandbox calls. SERVER ONLY — reads the client secret.
// Never import this from a component or from lib/ramp.ts (which is client-safe).
// Reached only via the /api/ramp/* route handlers when NEXT_PUBLIC_RAMP_MOCK=false.
import type { AwardResult, Budget } from "./ramp";

// Default to the SANDBOX host so we never hit prod by accident. Override in env.
const BASE = process.env.RAMP_API_BASE ?? "https://demo-api.ramp.com";
const CLIENT_ID = process.env.RAMP_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.RAMP_CLIENT_SECRET ?? "";
const SCOPES = process.env.RAMP_SCOPES ?? "limits:write spend_programs:read users:read transactions:read";
// Account-specific — copy these from your Ramp sandbox dashboard.
const SPEND_PROGRAM_ID = process.env.RAMP_SPEND_PROGRAM_ID ?? "";
const MEMBER_USER_ID = process.env.RAMP_MEMBER_USER_ID ?? "";

export function rampConfigured(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}

// --- OAuth2 client-credentials token, cached in-memory until ~1 min before expiry ---
let cached: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (!rampConfigured()) throw new Error("RAMP_CLIENT_ID / RAMP_CLIENT_SECRET not set");
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.token;

  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${BASE}/developer/v1/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials", scope: SCOPES }),
  });
  if (!res.ok) throw new Error(`Ramp token ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: json.access_token, expiresAt: now + (json.expires_in - 60) * 1000 };
  return json.access_token;
}

async function rampFetch(path: string, init?: RequestInit) {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`Ramp ${path} ${res.status}: ${await res.text()}`);
  return res.json();
}

// --- Award: create a bonus-pool spend limit for the winner ---
// Positive-sum: this ADDS a house-funded limit; it never debits anyone.
//
// NOTE: two things to sanity-check against your live sandbox account —
//   1. member field name: `user_ids` (array) vs `user_id`.
//   2. amount units: Ramp's CurrencyAmount is integer MINOR units (cents) — matches amountCents.
// Everything account-specific (spend_program_id, member) comes from env.
export async function serverAwardBonusCredit(args: {
  roomId: string;
  userName: string;
  amountCents: number;
  memo: string;
}): Promise<AwardResult> {
  const body: Record<string, unknown> = {
    display_name: `${args.memo} — ${args.userName}`.slice(0, 100),
    spending_restrictions: {
      amount: { currency_code: "USD", amount: args.amountCents },
      interval: "TOTAL", // one-off bonus, not recurring
    },
    fulfillment: { should_create_card: false },
  };
  if (SPEND_PROGRAM_ID) body.spend_program_id = SPEND_PROGRAM_ID;
  if (MEMBER_USER_ID) body.user_ids = [MEMBER_USER_ID];

  const limit = (await rampFetch("/developer/v1/limits", {
    method: "POST",
    body: JSON.stringify(body),
  })) as { id?: string };

  if (!limit.id) return { ok: false, error: "Ramp limit created but no id returned" };
  return { ok: true, txId: limit.id };
}

// --- Budget: read the bonus-pool spend program (read-only, safe) ---
export async function serverGetBudget(): Promise<Budget> {
  const data = (await rampFetch("/developer/v1/spend-programs")) as {
    data?: Array<{ display_name?: string; spending_restrictions?: { amount?: { amount?: number } } }>;
  };
  const program = data.data?.[0];
  const totalCents = program?.spending_restrictions?.amount?.amount ?? 500_00;
  return {
    label: program?.display_name ?? "Team Perks",
    totalCents,
    bonusPoolCents: Math.round(totalCents * 0.25),
    merchantRestrictions: ["Restaurants", "Coffee", "Wellness"],
  };
}
