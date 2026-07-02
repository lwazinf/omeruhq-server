// ============================================================================
// lib/agentServer.ts  (server-only — imported by API routes)
// The agent's persona + a thin Ollama caller shared by the agent routes.
// Routes return 502 when Ollama is unreachable; the client falls back to
// offline heuristics so every feature still works without a running model.
//
// Model tiers (all overridable via env):
//   OLLAMA_MODEL_FAST     → quick tasks: edit-review, live chat   (default: llama3.2:3b)
//   OLLAMA_MODEL_BALANCED → structured analysis: understand brief  (default: llama3.1:8b)
//   OLLAMA_MODEL_SMART    → heavy generation: full flow JSON        (default: qwen2.5:14b)
//   OLLAMA_HOST           → Ollama base URL                        (default: http://localhost:11434)
// ============================================================================

const OLLAMA_HOST     = process.env.OLLAMA_HOST           || "http://localhost:11434";
const MODEL_FAST      = process.env.OLLAMA_MODEL_FAST     || "qwen3.5:latest";
const MODEL_BALANCED  = process.env.OLLAMA_MODEL_BALANCED || "qwen3-vl:235b-cloud";
const MODEL_SMART     = process.env.OLLAMA_MODEL_SMART    || "qwen3-vl:235b-cloud";

export type ModelTier = "fast" | "balanced" | "smart";

export const PERSONA = `You are "Flow", a world-class WhatsApp Business Platform solution architect and
conversation designer. You have two strengths in equal measure:

1) BUSINESS ANALYST. You quickly distil any business into its essence: who the
customer is, what they want, and the single most valuable action the bot should
drive (a booking, an order, a qualified lead, an answer). You design the most
*user-friendly* flow — short, warm, unambiguous, and fast to the goal.

2) WHATSAPP EXPERT. You know the WhatsApp Cloud API intimately and you are honest
about what is and isn't possible:
- 24-hour customer service window: outside it, a business may only send pre-approved
  message templates (utility / marketing / authentication). Inside it, free-form
  session messages are fine.
- Reply buttons: at most 3 per message; each button title <= 20 characters.
- List messages: one button opens a list of up to 10 rows total across up to 10
  sections; row title <= 24 chars, row description <= 72 chars; list button <= 20 chars.
- A single message can't combine reply buttons AND a list.
- CTA URL button messages, location, contacts, and media (image/video/audio/voice/
  document/sticker) are all supported. Body text up to ~1024 chars for interactive
  messages, 4096 for plain text.
- WhatsApp Flows provide native multi-screen forms for richer data capture.
- There are NO native "polls" in the Business/Cloud API — recommend reply buttons or
  a list instead. (A showcase may simulate a poll purely for visual effect.)
- You cannot invent custom UI, colours, or inline keyboards beyond buttons/lists.
- Users must opt in; quality rating affects messaging limits.

You keep copy concise and mobile-first, prefer one clear call-to-action per message,
and never recommend something the platform can't do without flagging it.`;

export interface LLMResult {
  ok: boolean;
  text?: string;
  error?: string;
  status?: number;
}

function resolveModel(tier: ModelTier | string | undefined): string {
  if (tier === "fast")     return MODEL_FAST;
  if (tier === "balanced") return MODEL_BALANCED;
  if (tier === "smart")    return MODEL_SMART;
  return tier || MODEL_BALANCED;
}

export async function callLLM(opts: {
  system: string;
  user: string;
  maxTokens?: number;
  timeoutMs?: number;
  model?: ModelTier | string;
}): Promise<LLMResult> {
  const model = resolveModel(opts.model);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 60000);

  try {
    const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: opts.system },
          { role: "user",   content: opts.user   },
        ],
        stream: false,
        think: opts.model !== "fast",
        options: {
          num_predict: opts.maxTokens ?? 2048,
          temperature: opts.model === "smart" ? 0.7 : 0.5,
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { ok: false, error: "upstream", status: res.status, text: detail.slice(0, 300) };
    }

    const data = await res.json();
    const text: string = (data?.message?.content ?? "").trim();
    if (!text) return { ok: false, error: "empty_response", status: 502 };
    return { ok: true, text };
  } catch (e) {
    const aborted = (e as Error)?.name === "AbortError";
    return { ok: false, error: aborted ? "timeout" : "ollama_unreachable", status: 502 };
  } finally {
    clearTimeout(timer);
  }
}

/** Pull the first balanced JSON value ({...} or [...]) out of a model reply. */
export function extractJson(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const src = fenced ? fenced[1] : text;
  const startObj = src.indexOf("{");
  const startArr = src.indexOf("[");
  const candidates = [startObj, startArr].filter((n) => n >= 0);
  if (candidates.length === 0) return null;
  const start = Math.min(...candidates);
  const open = src[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
    } else {
      if (ch === '"') inStr = true;
      else if (ch === open) depth++;
      else if (ch === close) {
        depth--;
        if (depth === 0) return src.slice(start, i + 1);
      }
    }
  }
  return null;
}
