"use client";

import React, { useRef, useState } from "react";
import { Flow, Message, inferType } from "@/lib/types";
import { requestAnalysis, EditAnalysis, Verdict } from "@/lib/agent";
import { Sparkle } from "@/components/chat/Icons";

// which copy field is the "primary" editable text for a message
type Field = "text" | "cta" | "card" | "product" | "list";
function primaryField(m: Message): Field | null {
  if (m.text !== undefined) return "text";
  if (m.cta) return "cta";
  if (m.card) return "card";
  if (m.product) return "product";
  if (m.list) return "list";
  const t = inferType(m);
  if (t === "text" || t === "image") return "text";
  return null;
}
function getPrimary(m: Message, f: Field): string {
  switch (f) {
    case "text": return m.text ?? "";
    case "cta": return m.cta?.text ?? "";
    case "card": return m.card?.body ?? "";
    case "product": return m.product?.description ?? "";
    case "list": return m.list?.body ?? "";
  }
}
function setPrimary(m: Message, f: Field, v: string) {
  switch (f) {
    case "text": m.text = v; break;
    case "cta": if (m.cta) m.cta.text = v; break;
    case "card": if (m.card) m.card.body = v; break;
    case "product": if (m.product) m.product.description = v; break;
    case "list": if (m.list) m.list.body = v; break;
  }
}

function summarize(m: Message): string {
  const t = inferType(m);
  const map: Record<string, string> = {
    buttons: "Reply buttons", list: "List menu", poll: "Poll (shown for demo only)",
    cta: "Call-to-action button", card: "Rich card", product: "Product", image: "Image",
    video: "Video", voice: "Voice note", audio: "Audio", document: "Document",
    sticker: "Sticker", location: "Location", contact: "Contact card", reaction: "Reaction",
    date: "Date separator", system: "System note", text: "Text",
  };
  let extra = "";
  if (t === "buttons" && m.buttons) extra = ` · ${m.buttons.map((b) => (typeof b === "string" ? b : b.title)).join(" / ")}`;
  if (t === "list" && m.list) extra = ` · ${m.list.sections?.reduce((n, s) => n + (s.rows?.length || 0), 0) || 0} rows`;
  if (t === "product" && m.product) extra = ` · ${m.product.name}`;
  if (t === "cta" && m.cta) extra = ` · ${m.cta.display}`;
  if (t === "reaction") return `Reaction ${m.reaction ?? ""}`;
  return (map[t] || t) + extra;
}

const VERDICT: Record<Verdict, { dot: string; label: string; ring: string }> = {
  good: { dot: "#25d366", label: "Looks good", ring: "rgba(37,211,102,0.3)" },
  tip: { dot: "#53bdeb", label: "Tip", ring: "rgba(83,189,235,0.3)" },
  caution: { dot: "#f5b14c", label: "Heads up", ring: "rgba(245,177,76,0.35)" },
};

interface RowState {
  loading: boolean;
  analysis?: EditAnalysis;
  source?: "ai" | "local";
}

export default function ReviewEditor({ flow, onChange }: { flow: Flow; onChange: (f: Flow) => void }) {
  const [rows, setRows] = useState<Record<number, RowState>>({});
  const baselines = useRef<Record<number, string>>({});

  const patch = (i: number, mutate: (m: Message) => void) => {
    const next: Flow = { ...flow, messages: flow.messages.map((m, idx) => (idx === i ? { ...structuredCloneSafe(m) } : m)) };
    mutate(next.messages[i]);
    onChange(next);
  };

  const analyze = async (i: number, before: string) => {
    const m = flow.messages[i];
    const f = primaryField(m);
    const after = f ? getPrimary(m, f) : "";
    setRows((r) => ({ ...r, [i]: { loading: true } }));
    const { analysis, source } = await requestAnalysis({
      before,
      after,
      sender: (m.from ?? "bot") as "bot" | "user" | "system",
      comment: m.note,
      business: flow.name,
    });
    setRows((r) => ({ ...r, [i]: { loading: false, analysis, source } }));
  };

  return (
    <div className="space-y-2.5">
      {flow.messages.map((m, i) => {
        const f = primaryField(m);
        const sender = m.from ?? "system";
        const isUser = sender === "user";
        const isSys = sender === "system";
        const row = rows[i];
        return (
          <div
            key={i}
            className="rounded-xl p-3"
            style={{ background: isUser ? "rgba(0,92,75,0.18)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[10.5px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ background: isUser ? "rgba(37,211,102,0.18)" : isSys ? "rgba(255,255,255,0.06)" : "rgba(83,189,235,0.15)", color: isUser ? "#7ff0cf" : isSys ? "#8696a0" : "#9fdcf5" }}
              >
                {isUser ? "Customer" : isSys ? "System" : "Bot"}
              </span>
              <span className="text-[11.5px] text-white/40 truncate">{summarize(m)}</span>
            </div>

            {f ? (
              <textarea
                value={getPrimary(m, f)}
                onFocus={() => (baselines.current[i] = getPrimary(m, f))}
                onChange={(e) => patch(i, (mm) => setPrimary(mm, f, e.target.value))}
                onBlur={() => {
                  const before = baselines.current[i] ?? "";
                  const after = getPrimary(flow.messages[i], f);
                  if (after !== before) analyze(i, before);
                }}
                rows={Math.min(5, Math.max(1, Math.ceil((getPrimary(m, f).length || 1) / 46)))}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-[14px] leading-relaxed outline-none focus:border-[#00a884]/50 resize-none"
                placeholder="Message text…"
              />
            ) : (
              <div className="text-[13px] text-white/45 italic px-1 py-1">No editable text on this message — add a note for the agent below.</div>
            )}

            <div className="flex items-center gap-2 mt-2">
              <input
                value={m.note ?? ""}
                onChange={(e) => patch(i, (mm) => { mm.note = e.target.value || undefined; })}
                placeholder="Add a note explaining your change (optional)"
                className="flex-1 bg-transparent border border-white/10 rounded-lg px-2.5 py-1.5 text-[12.5px] outline-none focus:border-white/25 placeholder:text-white/30"
              />
              <button
                onClick={() => analyze(i, baselines.current[i] ?? getPrimary(m, f ?? "text"))}
                disabled={row?.loading}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12.5px] text-[#0b141a] font-medium disabled:opacity-50"
                style={{ background: "#00a884" }}
                title="Ask the agent to review this message"
              >
                <Sparkle size={13} /> {row?.loading ? "…" : "Review"}
              </button>
            </div>

            {row?.analysis && (
              <div className="mt-2 rounded-lg px-3 py-2 text-[13px]" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${VERDICT[row.analysis.verdict].ring}` }}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: VERDICT[row.analysis.verdict].dot }} />
                  <span className="font-medium" style={{ color: VERDICT[row.analysis.verdict].dot }}>{VERDICT[row.analysis.verdict].label}</span>
                  {row.source === "local" && <span className="text-[10.5px] text-white/30">offline</span>}
                </div>
                <div className="text-white/80">{row.analysis.note}</div>
                {row.analysis.suggestion && <div className="text-white/55 mt-1">→ {row.analysis.suggestion}</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// structuredClone isn't guaranteed in every target; fall back to JSON clone
function structuredCloneSafe<T>(o: T): T {
  try {
    // @ts-ignore
    return typeof structuredClone === "function" ? structuredClone(o) : JSON.parse(JSON.stringify(o));
  } catch {
    return JSON.parse(JSON.stringify(o));
  }
}
