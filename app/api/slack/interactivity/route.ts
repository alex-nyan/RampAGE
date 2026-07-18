// Accept/decline button clicks. Slack sends payload=<json> form field.
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
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  if (action?.action_id === "accept" && roomId) {
    await supabase.from("rooms").update({ status: "active" }).eq("id", roomId);
    return NextResponse.json({
      replace_original: true,
      text: `⚔️ It's ON — play here: ${base}/game/${roomId} 🎁 (winner grabs a slice of the bonus pool)`,
    });
  }
  if (action?.action_id === "decline" && roomId) {
    await supabase.from("rooms").update({ status: "finished" }).eq("id", roomId);
    return NextResponse.json({ replace_original: true, text: "Challenge declined. The bonus pool remains unclaimed... for now 👀" });
  }
  return NextResponse.json({ ok: true });
}
