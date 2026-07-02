import { NextRequest } from "next/server";
import { PERSONA, callLLM, extractJson } from "@/lib/agentServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // seconds — headroom for the Claude call; within the Hobby-plan cap

const TASK = `The author just edited one message in a WhatsApp bot flow. Review the change as their
expert collaborator: judge clarity, tone, mobile readability, and WhatsApp best practices
and limits (e.g. button titles <= 20 chars, list titles <= 24 / descriptions <= 72, no
all-caps shouting, one clear next step). If they left a comment, address it directly.

Return ONLY this JSON object, no prose or fences:
{
  "verdict": "good" | "tip" | "caution",
  "note": string,            // <= 2 short sentences, friendly and specific
  "suggestion": string       // optional, <= 1 sentence; omit or "" if none
}`;

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  if (typeof body?.after !== "string") return Response.json({ error: "empty" }, { status: 400 });

  const user = [
    body.business && `Business: ${body.business}`,
    `Message author: ${body.sender || "bot"}`,
    `BEFORE: ${JSON.stringify(body.before ?? "")}`,
    `AFTER: ${JSON.stringify(body.after ?? "")}`,
    body.comment && `Author's comment: ${body.comment}`,
    "\nReview the change and reply with the JSON object.",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await callLLM({ system: `${PERSONA}\n\n${TASK}`, user, maxTokens: 400, timeoutMs: 20000, model: "fast" });
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status ?? 502 });

  const jsonStr = extractJson(result.text || "");
  if (!jsonStr) return Response.json({ error: "no_json" }, { status: 502 });
  try {
    const analysis = JSON.parse(jsonStr);
    return Response.json({ analysis });
  } catch {
    return Response.json({ error: "parse_failed" }, { status: 502 });
  }
}
