import { NextRequest } from "next/server";
import { PERSONA, callLLM, extractJson } from "@/lib/agentServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // seconds — headroom for the Claude call; within the Hobby-plan cap

const SCHEMA = `Write the conversation as a single JSON object (a "Flow") and output NOTHING else —
no prose, no markdown fences.

{
  "name": string,
  "subtitle": "Business Account",
  "avatar": { "initials": string, "color": "#rrggbb" },
  "verified": true,
  "phoneTime": "HH:MM",
  "battery": number,
  "theme": "dark",
  "wallpaper": "default",
  "speed": 1,
  "messages": Message[]
}

Message: { "from": "bot"|"user"|"system", "type": <type>, ...content, "time"?: "H:MM", "status"?: "read", "typing"?: number }
Types & content:
- text: { "text": string }                 // *bold* _italic_ ~strike~
- image: { "image": url, "text"?: caption }
- voice: { "voice": { "duration": "0:14" } }
- document: { "document": { "name","size","pages","ext":"PDF" } }
- buttons: { "text": string, "buttons": [{ "title","reply"?,"icon"? }] }   // max 3, title <= 20 chars
- list: { "list": { "header","body","footer","button","sections":[{ "title","rows":[{ "id","title","description" }] }] } }  // <=10 rows, title <=24, desc <=72
- location: { "location": { "name","address" } }
- contact: { "contact": { "name","phone","org" } }
- cta: { "cta": { "header","text","display","url" } }
- card: { "card": { "image"?,"title","subtitle","body","buttons"? } }
- product: { "product": { "image"?,"name","price","description","catalog" } }
- reaction: { "from":"user"|"bot", "reaction":"❤️" }
- date/system: { "type":"date"|"system", "text": string }   // no "from"

Rules:
- 14-22 messages, realistic and specific to THIS business; use real offerings and believable prices.
- Open with a system note + a date row, then a user "Hi", then a bot welcome with reply buttons.
- Demonstrate several functions: at least a list, a product or card, a CTA, and one of {voice, location, document, contact}.
- Respect WhatsApp limits (button/list character counts; 3 buttons max). Do NOT use polls.
- Times advance naturally; only user messages get "status":"read".
- Output ONLY the JSON object.`;

function buildUserPrompt(body: any): string {
  const parts: string[] = [];
  const intake = body?.intake;
  if (intake) {
    parts.push("BUSINESS INTAKE:");
    if (intake.name) parts.push(`- Name: ${intake.name}`);
    if (intake.description) parts.push(`- What it does: ${intake.description}`);
    if (intake.goal) parts.push(`- Primary goal of the bot: ${intake.goal}`);
    if (intake.tone) parts.push(`- Tone: ${intake.tone}`);
    const c = intake.contacts || {};
    const reach = [c.phone && `phone ${c.phone}`, c.email && `email ${c.email}`, c.website && `website ${c.website}`, c.address && `address ${c.address}`, c.hours && `hours ${c.hours}`]
      .filter(Boolean)
      .join("; ");
    if (reach) parts.push(`- Contact details to use where natural: ${reach}`);
  }
  if (body?.brief?.summary) {
    parts.push("\nAGREED UNDERSTANDING:");
    parts.push(body.brief.summary);
    if (Array.isArray(body.brief.proposedFlow) && body.brief.proposedFlow.length)
      parts.push("Proposed flow: " + body.brief.proposedFlow.join(" → "));
  }
  if (body?.corrections) parts.push(`\nUSER CORRECTIONS (must honour): ${body.corrections}`);
  if (parts.length === 0 && body?.idea) parts.push(`Business: ${body.idea}`);
  parts.push("\nNow produce the best, most user-friendly WhatsApp bot conversation for this business as the JSON Flow.");
  return parts.join("\n");
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  if (!body?.idea && !body?.intake) return Response.json({ error: "empty" }, { status: 400 });

  const result = await callLLM({
    system: `${PERSONA}\n\n${SCHEMA}`,
    user: buildUserPrompt(body),
    maxTokens: 4096,
    model: "smart",
  });
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status ?? 502 });

  const jsonStr = extractJson(result.text || "");
  if (!jsonStr) return Response.json({ error: "no_json" }, { status: 502 });
  try {
    const flow = JSON.parse(jsonStr);
    if (!flow || typeof flow !== "object" || !Array.isArray(flow.messages)) {
      return Response.json({ error: "invalid_flow" }, { status: 502 });
    }
    return Response.json({ flow });
  } catch {
    return Response.json({ error: "parse_failed" }, { status: 502 });
  }
}
