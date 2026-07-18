// /rampage @teammate [game] — ack within 3s, verify signature over RAW body first.
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { challengeBlocks, resolveUser, verifySlack } from "@/lib/slack";
import { DEFAULT_BONUS_POOL_CENTS } from "@/lib/types";

export async function POST(req: Request) {
  const raw = await req.text(); // RAW body BEFORE parsing — signature needs it
  if (!verifySlack(raw, req.headers.get("x-slack-request-timestamp"), req.headers.get("x-slack-signature")))
    return new NextResponse("bad signature", { status: 401 });

  const form = new URLSearchParams(raw);
  const challengerId = form.get("user_id") ?? "unknown";
  const text = form.get("text") ?? ""; // "<@U123|sam> mines"
  const mention = /<@([A-Z0-9]+)(?:\|([^>]+))?>/.exec(text);
  const challengedId = mention?.[1] ?? null;
  // Optional game after the mention: "/rampage @sam flip"
  const gameToken = text.replace(/<@[^>]+>/, "").trim().split(/\s+/)[0]?.toLowerCase();
  const gameId = ["receipt-blitz", "flip"].includes(gameToken) ? gameToken : "receipt-blitz";

  const [challenger, challenged] = await Promise.all([
    resolveUser(challengerId),
    challengedId ? resolveUser(challengedId) : Promise.resolve({ name: "a mystery coworker" }),
  ]);

  const { data: room } = await supabase
    .from("rooms")
    .insert({
      challenger_name: challenger.name,
      challenged_name: challenged.name,
      challenger_slack_id: challengerId,
      challenged_slack_id: challengedId,
      status: "pending",
      game: gameId,
      bonus_pool_cents: DEFAULT_BONUS_POOL_CENTS,
    })
    .select()
    .single();

  // Ack in-channel within 3s
  return NextResponse.json({
    response_type: "in_channel",
    blocks: challengeBlocks({
      challengerName: challenger.name,
      challengedName: challenged.name,
      roomId: room?.id ?? "pending",
    }),
  });
}
