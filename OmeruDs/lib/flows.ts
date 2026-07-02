import { Flow, Message, inferType, isSystem } from "./types";
import omeru from "@/data/flows/omeru-discovery.json";
import kasi from "@/data/flows/kasi-kicks.json";
import mamas from "@/data/flows/mamas-kitchen.json";
import bridal from "@/data/flows/thandi-bridal.json";

// ============================================================================
// lib/flows.ts
// Resolves flows from two places:
//   1. Bundled demo JSON (shipped with the app)
//   2. Custom flows saved by the user in localStorage (from the Builder)
// ============================================================================

const STORAGE_KEY = "wa-showcase:flows";

export const bundledFlows: Flow[] = [omeru as Flow, kasi as Flow, mamas as Flow, bridal as Flow];

export function loadCustomFlows(): Flow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Flow[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomFlows(flows: Flow[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flows));
}

export function upsertCustomFlow(flow: Flow): void {
  const flows = loadCustomFlows();
  const idx = flows.findIndex((f) => f.id === flow.id);
  if (idx >= 0) flows[idx] = flow;
  else flows.push(flow);
  saveCustomFlows(flows);
}

export function deleteCustomFlow(id: string): void {
  saveCustomFlows(loadCustomFlows().filter((f) => f.id !== id));
}

export function allFlows(): Flow[] {
  return [...loadCustomFlows(), ...bundledFlows];
}

export function getFlow(id: string): Flow | undefined {
  return allFlows().find((f) => f.id === id);
}

export function isBundled(id: string): boolean {
  return bundledFlows.some((f) => f.id === id);
}

/** Last non-system message text, for the chat-list preview line. */
export function previewOf(flow: Flow): string {
  if (flow.preview) return flow.preview;
  for (let i = flow.messages.length - 1; i >= 0; i--) {
    const m = flow.messages[i];
    if (isSystem(m) || inferType(m) === "reaction") continue;
    return summarize(m);
  }
  return "Tap to open";
}

export function summarize(m: Message): string {
  const t = inferType(m);
  const strip = (s?: string) =>
    (s ?? "").replace(/[*_~`]/g, "").replace(/\n/g, " ").trim();
  switch (t) {
    case "image":
      return "📷 Photo";
    case "video":
      return "🎥 Video";
    case "voice":
    case "audio":
      return "🎤 Voice message";
    case "document":
      return `📄 ${m.document?.name ?? "Document"}`;
    case "sticker":
      return "Sticker";
    case "location":
      return "📍 Location";
    case "contact":
      return `👤 ${m.contact?.name ?? "Contact"}`;
    case "poll":
      return `📊 ${strip(m.poll?.question)}`;
    case "list":
      return strip(m.list?.body || m.list?.header) || m.list?.button || "Menu";
    case "product":
      return `🛍️ ${m.product?.name ?? "Product"}`;
    case "card":
      return strip(m.card?.title || m.card?.body) || "Card";
    case "cta":
      return strip(m.cta?.text) || m.cta?.display || "Link";
    case "buttons":
    case "text":
    default:
      return strip(m.text) || "Message";
  }
}

export interface ValidationResult {
  ok: boolean;
  flow?: Flow;
  errors: string[];
}

/** Validate a parsed JSON object as a Flow. Forgiving but catches the basics. */
export function validateFlow(input: unknown): ValidationResult {
  const errors: string[] = [];
  if (typeof input !== "object" || input === null) {
    return { ok: false, errors: ["Top level must be a JSON object."] };
  }
  const f = input as Partial<Flow>;
  if (!f.name || typeof f.name !== "string") errors.push("`name` (string) is required.");
  if (!Array.isArray(f.messages)) errors.push("`messages` (array) is required.");
  else if (f.messages.length === 0) errors.push("`messages` should contain at least one message.");

  if (errors.length) return { ok: false, errors };

  const flow: Flow = {
    id: f.id && typeof f.id === "string" ? f.id : slugify(f.name!),
    name: f.name!,
    subtitle: f.subtitle,
    avatar: f.avatar,
    verified: f.verified,
    phoneTime: f.phoneTime,
    battery: f.battery,
    theme: f.theme === "light" ? "light" : "dark",
    wallpaper: f.wallpaper,
    speed: typeof f.speed === "number" && f.speed > 0 ? f.speed : 1,
    preview: f.preview,
    messages: f.messages as Message[],
  };
  return { ok: true, flow, errors: [] };
}

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || `flow-${Date.now()}`
  );
}
