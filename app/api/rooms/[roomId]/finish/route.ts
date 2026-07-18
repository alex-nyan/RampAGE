// Called by the room shell when a duel resolves. Posts the result (and a
// mini leaderboard) back into the Slack channel the challenge came from.
// Slack is icing: if the room has no channel (web-created), this is a no-op.
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { postResult } from "@/lib/slack";

export async function POST(req: Request, ctx: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const { winner, potCents, gameName } = body as {
    winner?: string;
    potCents?: number;
    gameName?: string;
  };

  const { data: room } = await supabase.from("rooms").select("*").eq("id", roomId).single();
  if (!room?.slack_channel_id || !winner) return NextResponse.json({ ok: true, posted: false });

  // Mini leaderboard from the awards ledger (top 3 by chips won).
  const { data: rows } = await supabase.from("awards").select("user_name, amount_cents");
  const totals = new Map<string, number>();
  for (const r of rows ?? []) totals.set(r.user_name, (totals.get(r.user_name) ?? 0) + r.amount_cents);
  const top = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([n, c], i) => `${["🥇", "🥈", "🥉"][i]} ${n} ◆${(c / 100).toFixed(0)}`)
    .join("  ");

  const pot = potCents ? ` and grabs ◆${(potCents / 100).toFixed(0)} of the bonus pool` : "";
  const text = winner.includes(" ")
    ? `🎲 *${gameName ?? "Duel"}* is settled: ${winner}. The pot stays in the family 🎁`
    : `🏆 *${winner}* wins *${gameName ?? "the duel"}*${pot} 🎁 Redeemable on food orders via a Ramp merchant-locked card.\n${top ? `Leaderboard: ${top}` : ""}`;

  const result = await postResult({ channelId: room.slack_channel_id, text });
  return NextResponse.json({ ok: result.ok, posted: result.ok });
}
