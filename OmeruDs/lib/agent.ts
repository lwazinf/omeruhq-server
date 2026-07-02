import { categoryLabel } from "./generator";

// ============================================================================
// lib/agent.ts
// The "Flow" agent on the client: shared types, offline heuristics that always
// work, and callers that try the AI routes first and fall back gracefully.
// ============================================================================

export interface Intake {
  name: string;
  description: string;
  goal: string;
  tone?: string;
  contacts?: {
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    hours?: string;
  };
}

export interface Brief {
  summary: string;
  businessType: string;
  audience: string;
  primaryGoal: string;
  proposedFlow: string[];
  whatsappFeatures: { feature: string; why: string }[];
  constraints: string[];
  openQuestions: string[];
}

export type Verdict = "good" | "tip" | "caution";
export interface EditAnalysis {
  verdict: Verdict;
  note: string;
  suggestion?: string;
}

export type AgentSource = "ai" | "local";

const has = (s?: string) => !!s && s.trim().length > 0;

// ---- offline understanding --------------------------------------------------
export function understandLocally(intake: Intake): Brief {
  const label = categoryLabel(`${intake.description} ${intake.name}`);
  const name = has(intake.name) ? intake.name.trim() : "your business";
  const goal = has(intake.goal) ? intake.goal.trim().toLowerCase() : "guide customers to the next step";
  const c = intake.contacts ?? {};
  const hasPlace = has(c.address);
  const hasReach = has(c.phone) || has(c.website) || has(c.email);

  const proposedFlow: string[] = [
    `Greet the customer warmly and confirm what ${name} can help with, using up to 3 reply buttons.`,
    `Present the main offerings as a single tappable list so choosing is one tap.`,
    `Confirm their selection and show the details with a rich card or product message.`,
    `Capture the one detail that drives ${goal} (a time, a quantity, or their contact).`,
  ];
  if (hasPlace) proposedFlow.push(`Share location and opening hours so they can find you.`);
  if (hasReach) proposedFlow.push(`Offer a contact card / link for anything the bot can't answer.`);
  proposedFlow.push(`Drive ${goal} with one clear call-to-action button.`);
  proposedFlow.push(`Confirm and set expectations for what happens next.`);

  const whatsappFeatures: Brief["whatsappFeatures"] = [
    { feature: "Reply buttons (max 3)", why: "Fastest way to steer the conversation without typing." },
    { feature: "Interactive list", why: "Show several options compactly; one tap to choose." },
    { feature: "Rich card / product", why: "Give a selection a clear, attractive summary." },
    { feature: "Call-to-action URL button", why: `Send them straight to ${goal}.` },
  ];
  if (hasPlace) whatsappFeatures.push({ feature: "Location message", why: "One tap to directions." });
  if (hasReach) whatsappFeatures.push({ feature: "Contact card", why: "Easy hand-off to a human." });

  const constraints: string[] = [
    "Outside the 24-hour customer-service window the bot can only send pre-approved message templates.",
    "Reply buttons are limited to 3 (titles ≤ 20 chars); a list holds up to 10 rows (titles ≤ 24 chars).",
    "WhatsApp has no native polls — I'll use reply buttons or a list for choices (a poll can be shown for demo flair only).",
    "Customers must opt in before the business can message them.",
  ];

  const openQuestions: string[] = [];
  if (!has(intake.name)) openQuestions.push("What's the business name as it should appear in the chat?");
  if (!hasReach && !hasPlace) openQuestions.push("What phone, website, or address should the bot share?");
  if (!has(intake.goal)) openQuestions.push("What's the single most important action this bot should drive?");
  if (openQuestions.length === 0)
    openQuestions.push(`Is "${goal}" definitely the primary goal, or should the bot prioritise something else first?`);

  const toneBit = has(intake.tone) ? ` with a ${intake.tone!.toLowerCase()} tone` : "";
  return {
    summary: `${name} is ${article(label)} ${label.toLowerCase()}. Its WhatsApp bot should greet customers${toneBit}, present the main offerings, and drive ${goal} with as little typing as possible.`,
    businessType: label,
    audience: "Customers messaging the business on WhatsApp, mostly on mobile.",
    primaryGoal: has(intake.goal) ? intake.goal : "Guide customers to the next step",
    proposedFlow,
    whatsappFeatures,
    constraints,
    openQuestions: openQuestions.slice(0, 3),
  };
}

function article(s: string) {
  return /^[aeiou]/i.test(s.trim()) ? "an" : "a";
}

// ---- offline edit analysis --------------------------------------------------
export function analyzeEditLocally(input: {
  before: string;
  after: string;
  sender: "bot" | "user" | "system";
  comment?: string;
}): EditAnalysis {
  const { before, after, sender, comment } = input;
  const a = (after ?? "").trim();
  const b = (before ?? "").trim();
  const lead = has(comment) ? `Noted — "${comment!.trim()}". ` : "";

  if (a.length === 0) {
    return { verdict: "caution", note: `${lead}This message is now empty; it won't send.`, suggestion: "Add at least a short line of text." };
  }
  const letters = a.replace(/[^A-Za-z]/g, "");
  if (letters.length >= 6 && letters === letters.toUpperCase()) {
    return { verdict: "caution", note: `${lead}All-caps reads as shouting on WhatsApp.`, suggestion: "Use sentence case and reserve emphasis for *bold*." };
  }
  const emojis = (a.match(/\p{Extended_Pictographic}/gu) || []).length;
  if (emojis >= 4) {
    return { verdict: "tip", note: `${lead}That's a lot of emojis for one bubble.`, suggestion: "One or two keeps it friendly but professional." };
  }
  if (a.length > 220) {
    return { verdict: "caution", note: `${lead}Long for a chat bubble — WhatsApp folds after ~3 lines behind “Read more”.`, suggestion: "Split into two messages or trim to the essentials." };
  }
  if (sender === "bot" && a.length <= 160 && !/[?]/.test(a) && !/\b(tap|choose|select|book|order|reply|see|view|pay|confirm|pick|browse|call|visit)\b/i.test(a)) {
    return { verdict: "tip", note: `${lead}Clear — consider ending with a next step.`, suggestion: "End with a question or a button so the customer knows what to do." };
  }
  if (b && a.length < b.length * 0.6) {
    return { verdict: "good", note: `${lead}Tighter and easier to skim on mobile. Nice.` };
  }
  if (/(https?:\/\/|\b\d{3,})/.test(a)) {
    return { verdict: "good", note: `${lead}Concrete detail like this builds trust. Looks good.` };
  }
  return { verdict: "good", note: `${lead}Clear and on-brand. Good to go.` };
}

// ---- client callers (AI route → offline fallback) ---------------------------
async function tryPost(url: string, body: unknown, timeoutMs = 32000): Promise<any | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function requestUnderstanding(intake: Intake): Promise<{ brief: Brief; source: AgentSource }> {
  const data = await tryPost("/api/understand", { intake });
  const brief = data?.brief;
  if (brief && Array.isArray(brief.proposedFlow) && typeof brief.summary === "string") {
    return { brief: normaliseBrief(brief), source: "ai" };
  }
  return { brief: understandLocally(intake), source: "local" };
}

export async function requestAnalysis(input: {
  before: string;
  after: string;
  sender: "bot" | "user" | "system";
  comment?: string;
  business?: string;
}): Promise<{ analysis: EditAnalysis; source: AgentSource }> {
  const data = await tryPost("/api/analyze", input, 20000);
  const an = data?.analysis;
  if (an && typeof an.note === "string" && ["good", "tip", "caution"].includes(an.verdict)) {
    return { analysis: an as EditAnalysis, source: "ai" };
  }
  return { analysis: analyzeEditLocally(input), source: "local" };
}

function normaliseBrief(b: Partial<Brief>): Brief {
  const arr = (x: unknown): string[] => (Array.isArray(x) ? x.filter((s) => typeof s === "string") : []);
  return {
    summary: b.summary || "",
    businessType: b.businessType || "",
    audience: b.audience || "",
    primaryGoal: b.primaryGoal || "",
    proposedFlow: arr(b.proposedFlow),
    whatsappFeatures: Array.isArray(b.whatsappFeatures)
      ? b.whatsappFeatures
          .filter((f) => f && typeof f.feature === "string")
          .map((f) => ({ feature: f.feature, why: f.why || "" }))
      : [],
    constraints: arr(b.constraints),
    openQuestions: arr(b.openQuestions),
  };
}
