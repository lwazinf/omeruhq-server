// ============================================================================
// lib/scenarios.ts
// Scenarios represent different functions/use-cases a single bot can handle.
// Each scenario is a separate conversation flow that demonstrates one capability.
// ============================================================================

import { Flow } from "./types";

export interface Scenario {
  id: string;
  label: string;
  description: string;
  icon: string;
  flow: Flow;
}

export interface BotShowcase {
  id: string;
  businessName: string;
  businessDescription: string;
  avatar: Flow["avatar"];
  scenarios: Scenario[];
  activeScenarioId: string;
}

const STORAGE_KEY = "wa-showcase:showcases";

export function loadShowcases(): BotShowcase[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveShowcase(showcase: BotShowcase): void {
  if (typeof window === "undefined") return;
  const all = loadShowcases();
  const idx = all.findIndex((s) => s.id === showcase.id);
  if (idx >= 0) all[idx] = showcase;
  else all.push(showcase);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function getShowcase(id: string): BotShowcase | undefined {
  return loadShowcases().find((s) => s.id === id);
}

export function deleteShowcase(id: string): void {
  const all = loadShowcases().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

// Create a showcase from multiple flows
export function createShowcase(
  businessName: string,
  businessDescription: string,
  scenarios: Omit<Scenario, "id">[],
): BotShowcase {
  const id = `showcase-${Date.now().toString(36)}`;
  return {
    id,
    businessName,
    businessDescription,
    avatar: scenarios[0]?.flow.avatar,
    scenarios: scenarios.map((s, i) => ({ ...s, id: `sc-${i}-${Date.now().toString(36)}` })),
    activeScenarioId: "",
  };
}

// Default scenario templates that users can add to their bot
export const SCENARIO_TEMPLATES: { label: string; icon: string; description: string }[] = [
  { label: "Welcome & Menu", icon: "👋", description: "Greet the customer and show main options" },
  { label: "Browse Products", icon: "🛍️", description: "Let customers browse your catalogue" },
  { label: "Book Appointment", icon: "📅", description: "Schedule a booking or appointment" },
  { label: "Order & Checkout", icon: "🛒", description: "Take an order and process payment" },
  { label: "Customer Support", icon: "💬", description: "Handle enquiries and complaints" },
  { label: "Loyalty & Rewards", icon: "⭐", description: "Check points, redeem rewards" },
  { label: "Feedback & Review", icon: "📝", description: "Collect customer feedback" },
  { label: "Location & Hours", icon: "📍", description: "Share business location and operating hours" },
];
