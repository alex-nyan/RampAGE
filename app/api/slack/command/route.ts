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
  const channelId = form.get("channel_id");
  const text = form.get("text") ?? ""; // "<@U123|sam> flip"

  // `/rampage leaderboard` — chips won from the awards ledger, top 5.
  if (text.trim().toLowerCase().startsWith("leaderboard")) {
    const { data: rows } = await supabase.from("awards").select("user_name, amount_cents");
    const totals = new Map<string, number>();
    for (const r of rows ?? [])
      totals.set(r.user_name, (totals.get(r.user_name) ?? 0) + r.amount_cents);
    const lines = [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([n, c], i) => `${["🥇", "🥈", "🥉", "4.", "5."][i]} *${n}* — ◆${(c / 100).toFixed(0)} bonus chips won`);
    return NextResponse.json({
      response_type: "in_channel",
      text: lines.length
        ? `🏟 *Rampage leaderboard*\n${lines.join("\n")}\n_All chips are house-sponsored bonus credit — redeemable on food orders via Ramp._`
        : "No duels settled yet — `/rampage @teammate` to start one ⚔️",
    });
  }
  // Mentions arrive escaped (<@U123|sam>) when should_escape is true, or as
  // plain "@sam" when false. Handle BOTH — don't relearn this live.
  const escaped = /<@([A-Z0-9]+)(?:\|([^>]+))?>/.exec(text);
  const plain = /@([\w.\-]+)/.exec(text);
  const challengedId = escaped?.[1] ?? null;
  const plainName = escaped?.[2] ?? plain?.[1] ?? null;
  // Optional game after the mention: "/rampage @sam flip"
  const gameToken =
    text
      .replace(/<@[^>]+>/g, "")
      .replace(/@[\w.\-]+/g, "")
      .trim()
      .split(/\s+/)[0]?.toLowerCase() ?? "";
  const gameId = ["receipt-blitz", "flip", "wordle-duel", "mines"].includes(gameToken)
    ? gameToken
    : "receipt-blitz";
  const gameNames: Record<string, string> = {
    "receipt-blitz": "Receipt Match Blitz",
    flip: "Flip",
    "wordle-duel": "Word Duel",
    mines: "Mines Duel",
  };

  const [challenger, challenged] = await Promise.all([
    resolveUser(challengerId),
    challengedId
      ? resolveUser(challengedId)
      : Promise.resolve({ name: plainName ?? "a mystery coworker" }),
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
      slack_channel_id: channelId,
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
      gameName: gameNames[gameId],
    }),
  });
}
