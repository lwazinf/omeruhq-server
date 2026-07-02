// ============================================================================
// lib/analytics.ts
// Lightweight client-side analytics for tracking user interactions.
// Persists to localStorage; can be extended to POST to an endpoint later.
// ============================================================================

export type EventType =
  | "page_view"
  | "demo_started"
  | "demo_completed"
  | "demo_shared"
  | "demo_downloaded"
  | "video_downloaded"
  | "flow_created"
  | "flow_edited"
  | "flow_exported"
  | "scenario_switched"
  | "interactive_started"
  | "interactive_message"
  | "book_call_clicked"
  | "book_call_submitted"
  | "cta_clicked"
  | "node_added"
  | "node_connected"
  | "flow_saved"
  | "screenshot_taken"
  | "full_chat_exported"
  | "share_fullscreen_open"
  | "share_fullscreen_close"
  | "share_cta_clicked";

export interface AnalyticsEvent {
  id: string;
  type: EventType;
  timestamp: number;
  data?: Record<string, string | number | boolean>;
  sessionId: string;
}

const STORAGE_KEY = "wa-showcase:analytics";
const SESSION_KEY = "wa-showcase:session";

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

function uid(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function track(type: EventType, data?: Record<string, string | number | boolean>): void {
  if (typeof window === "undefined") return;
  const event: AnalyticsEvent = {
    id: uid(),
    type,
    timestamp: Date.now(),
    data,
    sessionId: getSessionId(),
  };
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as AnalyticsEvent[];
    // Keep last 500 events to avoid unbounded growth
    const trimmed = existing.length > 499 ? existing.slice(-400) : existing;
    trimmed.push(event);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage full or unavailable — silently skip
  }
}

export function getEvents(): AnalyticsEvent[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function getEventsByType(type: EventType): AnalyticsEvent[] {
  return getEvents().filter((e) => e.type === type);
}

export function getEventCount(type: EventType): number {
  return getEventsByType(type).length;
}

export function clearEvents(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

// Summary for display
export function getAnalyticsSummary(): Record<string, number> {
  const events = getEvents();
  const summary: Record<string, number> = {};
  for (const e of events) {
    summary[e.type] = (summary[e.type] || 0) + 1;
  }
  return summary;
}
