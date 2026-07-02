import { NextRequest } from "next/server";
import { PERSONA, callLLM, extractJson } from "@/lib/agentServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // seconds — headroom for the Claude call; within the Hobby-plan cap

const TASK = `A business owner is briefing you before you design their WhatsApp bot. Analyse what
they've told you and reply with your understanding so they can correct you before you build.

Return ONLY a JSON object, no prose or fences:
{
  "summary": string,                    // 1-3 sentences, what you understand the business + bot to be
  "businessType": string,               // short label
  "audience": string,                   // who messages this business
  "primaryGoal": string,                // the single most valuable action the bot should drive
  "proposedFlow": string[],             // 5-8 short steps, each one bot turn
  "whatsappFeatures": [{ "feature": string, "why": string }],  // the WhatsApp components you'll use and why
  "constraints": string[],              // honest notes on WhatsApp limits relevant to this flow
  "openQuestions": string[]             // up to 3 specific questions whose answers would improve the bot
}

Be specific to THIS business, concise, and honest about what WhatsApp can and cannot do.`;

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const intake = body?.intake;
  if (!intake || (!intake.name && !intake.description)) {
    return Response.json({ error: "empty" }, { status: 400 });
  }

  const c = intake.contacts || {};
  const user = [
    "BUSINESS BRIEF:",
    intake.name && `- Name: ${intake.name}`,
    intake.description && `- What it does: ${intake.description}`,
    intake.goal && `- Stated goal: ${intake.goal}`,
    intake.tone && `- Desired tone: ${intake.tone}`,
    (c.phone || c.email || c.website || c.address || c.hours) &&
      `- Contacts: ${[c.phone && `phone ${c.phone}`, c.email && `email ${c.email}`, c.website && `website ${c.website}`, c.address && `address ${c.address}`, c.hours && `hours ${c.hours}`].filter(Boolean).join("; ")}`,
    "\nReply with your understanding as the JSON object.",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await callLLM({ system: `${PERSONA}\n\n${TASK}`, user, maxTokens: 1600, model: "balanced" });
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status ?? 502 });

  const jsonStr = extractJson(result.text || "");
  if (!jsonStr) return Response.json({ error: "no_json" }, { status: 502 });
  try {
    const brief = JSON.parse(jsonStr);
    return Response.json({ brief });
  } catch {
    return Response.json({ error: "parse_failed" }, { status: 502 });
  }
}
