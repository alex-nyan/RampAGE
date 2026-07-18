// Shared room-creation path — web "Challenge a coworker" AND Slack both hit this logic.
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { DEFAULT_BONUS_POOL_CENTS } from "@/lib/types";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { data, error } = await supabase
    .from("rooms")
    .insert({
      challenger_name: body.challengerName ?? "player1",
      challenged_name: body.challengedName ?? null,
      challenger_slack_id: body.challengerSlackId ?? null,
      challenged_slack_id: body.challengedSlackId ?? null,
      status: body.status ?? "active",
      bonus_pool_cents: DEFAULT_BONUS_POOL_CENTS,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ room: data });
}
