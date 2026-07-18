// The ONE swappable Slack module. Mock by default; never call Slack API from a component.
import crypto from "crypto";

const SLACK_MOCK = process.env.SLACK_MOCK !== "false";

// Signature verification over the RAW body — call BEFORE parsing.
export function verifySlack(raw: string, ts: string | null, sig: string | null) {
  if (SLACK_MOCK) return true;
  if (!ts || !sig || Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const hmac = crypto.createHmac("sha256", process.env.SLACK_SIGNING_SECRET!);
  const mine = `v0=${hmac.update(`v0:${ts}:${raw}`).digest("hex")}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(mine), Buffer.from(sig));
  } catch {
    return false;
  }
}

export async function postChallenge(args: {
  channelId: string;
  challengerName: string;
  challengedName: string;
  roomId: string;
}): Promise<{ ok: boolean }> {
  if (SLACK_MOCK) {
    console.log("[slack mock] challenge posted:", args);
    return { ok: true };
  }
  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel: args.channelId,
      text: `⚔️ ${args.challengerName} challenged ${args.challengedName} to a Rampage — winner grabs a slice of this week's bonus pool 🎁`,
      blocks: challengeBlocks(args),
    }),
  });
  return { ok: (await res.json()).ok };
}

export async function resolveUser(userId: string): Promise<{ name: string }> {
  if (SLACK_MOCK) return { name: `player_${userId.slice(-4)}` };
  const res = await fetch(`https://slack.com/api/users.info?user=${userId}`, {
    headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` },
  });
  const json = await res.json();
  return { name: json.user?.profile?.display_name || json.user?.real_name || userId };
}

export function challengeBlocks(args: {
  challengerName: string;
  challengedName: string;
  roomId: string;
  gameName?: string;
}) {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `⚔️ *${args.challengerName}* challenged *${args.challengedName}* to *${args.gameName ?? "Receipt Match Blitz"}* — winner grabs a slice of this week's bonus pool 🎁`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          style: "primary",
          text: { type: "plain_text", text: "Accept & Play ⚔️" },
          action_id: "accept",
          value: args.roomId,
        },
        {
          type: "button",
          text: { type: "plain_text", text: "Nah 🙅" },
          action_id: "decline",
          value: args.roomId,
        },
      ],
    },
  ];
}
