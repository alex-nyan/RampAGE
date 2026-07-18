// Accept/decline button clicks. Slack sends payload=<json> form field.
// IMPORTANT: for block actions Slack IGNORES the ack body — message updates
// must be POSTed to payload.response_url. Ack fast + empty.
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifySlack } from "@/lib/slack";

export async function POST(req: Request) {
  const raw = await req.text(); // RAW body first
  if (!verifySlack(raw, req.headers.get("x-slack-request-timestamp"), req.headers.get("x-slack-signature")))
    return new NextResponse("bad signature", { status: 401 });

  const payload = JSON.parse(new URLSearchParams(raw).get("payload") ?? "{}");
  const action = payload.actions?.[0];
  const roomId = action?.value;
  const responseUrl: string | undefined = payload.response_url;
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  async function respond(text: string) {
    if (!responseUrl) return;
    await fetch(responseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ replace_original: true, response_type: "in_channel", text }),
    }).catch(() => {});
  }

  if (action?.action_id === "accept" && roomId) {
    await supabase.from("rooms").update({ status: "active" }).eq("id", roomId);
    await respond(
      `⚔️ It's ON — play here: ${base}/game/${roomId} 🎁 (winner grabs a slice of the bonus pool)`
    );
  } else if (action?.action_id === "decline" && roomId) {
    await supabase.from("rooms").update({ status: "finished" }).eq("id", roomId);
    await respond("Challenge declined. The bonus pool remains unclaimed... for now 👀");
  }

  return new NextResponse("", { status: 200 });
}
