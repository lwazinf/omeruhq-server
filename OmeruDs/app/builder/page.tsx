"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Flow, Message, inferType } from "@/lib/types";
import {
  bundledFlows,
  getFlow,
  slugify,
  upsertCustomFlow,
  validateFlow,
} from "@/lib/flows";
import { usePlayer } from "@/lib/usePlayer";
import { buildShareUrl } from "@/lib/shareLink";
import { buildFlowFromIdea } from "@/lib/generator";
import PhoneFrame from "@/components/PhoneFrame";
import ChatScreen from "@/components/chat/ChatScreen";
import PlayerControls from "@/components/PlayerControls";
import ReviewEditor from "@/components/ReviewEditor";
import { ArrowLeft, Copy, Download, Plus, Trash, Sparkle } from "@/components/chat/Icons";

// ── Starter template ────────────────────────────────────────────────────────

const BLANK: Flow = {
  id: "",
  name: "New Flow",
  subtitle: "online",
  avatar: { initials: "NF", color: "#00a884" },
  verified: false,
  phoneTime: "09:41",
  battery: 80,
  theme: "dark",
  wallpaper: "default",
  speed: 1,
  messages: [
    { type: "system", text: "Messages are end-to-end encrypted. Tap to learn more." },
    { type: "date", text: "Today" },
    { from: "user", type: "text", text: "Hi!", time: "09:40", status: "read" },
    { from: "bot", type: "text", text: "Hello 👋 How can I help today?", time: "09:40" },
  ],
};

const SNIPPETS: { label: string; make: () => Message }[] = [
  { label: "Bot text", make: () => ({ from: "bot", type: "text", text: "Here's some info for you.", time: "09:41" }) },
  { label: "User text", make: () => ({ from: "user", type: "text", text: "Sounds good!", time: "09:41", status: "read" }) },
  { label: "Image", make: () => ({ from: "bot", type: "image", image: "https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?w=640&q=80", text: "Take a look 👀", time: "09:41" }) },
  { label: "Video", make: () => ({ from: "bot", type: "video", poster: "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=640&q=80", text: "Quick clip 🎥", time: "09:41" }) },
  { label: "Voice note", make: () => ({ from: "bot", type: "voice", voice: { duration: "0:12" }, time: "09:41" }) },
  { label: "Document", make: () => ({ from: "user", type: "document", document: { name: "Brief.pdf", size: "120 kB", ext: "PDF" }, time: "09:41", status: "read" }) },
  { label: "Reply buttons", make: () => ({ from: "bot", type: "buttons", text: "Would you like to continue?", buttons: [{ title: "Yes", reply: "Yes please" }, { title: "Not now" }], time: "09:41" }) },
  {
    label: "List menu",
    make: () => ({
      from: "bot", type: "list",
      list: {
        header: "Choose an option",
        body: "Pick one to continue.",
        footer: "Powered by your bot",
        button: "View options",
        sections: [{ title: "Available", rows: [{ id: "a", title: "Option A", description: "First choice" }, { id: "b", title: "Option B", description: "Second choice" }] }],
      },
      time: "09:41",
    }),
  },
  { label: "Poll", make: () => ({ from: "bot", type: "poll", poll: { question: "Which do you prefer?", options: [{ text: "Option 1", votes: 0 }, { text: "Option 2", votes: 0 }], multiple: false }, time: "09:41" }) },
  { label: "Location", make: () => ({ from: "bot", type: "location", location: { name: "Our office", address: "14 Long Street, Cape Town" }, time: "09:41" }) },
  { label: "Contact", make: () => ({ from: "bot", type: "contact", contact: { name: "Support Team", phone: "+27 82 123 4567", org: "Help desk" }, time: "09:41" }) },
  { label: "CTA link", make: () => ({ from: "bot", type: "cta", cta: { text: "Tap to open the link.", display: "Open", url: "https://example.com" }, time: "09:41" }) },
  { label: "Rich card", make: () => ({ from: "bot", type: "card", card: { image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=640&q=80", title: "Featured item", subtitle: "Limited time", body: "A short description goes here.", buttons: [{ title: "Buy now", reply: "I'll take it" }, { title: "Details" }] }, time: "09:41" }) },
  { label: "Product", make: () => ({ from: "bot", type: "product", product: { image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=640&q=80", name: "Sample product", price: "R849.00", description: "Great value", catalog: "View catalogue" }, time: "09:41" }) },
  { label: "Reaction ❤️", make: () => ({ from: "user", type: "reaction", reaction: "❤️" }) },
  { label: "Date divider", make: () => ({ type: "date", text: "Tomorrow" }) },
  { label: "System note", make: () => ({ type: "system", text: "This is a system message." }) },
];

// ── Message types reference data ─────────────────────────────────────────────

const ALL_MESSAGE_TYPES = [
  { type: "text",     icon: "💬", label: "Text",         desc: 'Plain text. Supports *bold* _italic_ ~strike~ ```mono```' },
  { type: "image",    icon: "🖼️", label: "Image",        desc: "Photo with optional caption. Set `image` to a URL." },
  { type: "video",    icon: "🎥", label: "Video",        desc: "Video with play button. Use `poster` for thumbnail." },
  { type: "voice",    icon: "🎙️", label: "Voice note",   desc: 'Audio waveform player. Set `voice.duration` e.g. "0:14".' },
  { type: "audio",    icon: "🎵", label: "Audio",        desc: "Audio file with waveform. Same fields as voice." },
  { type: "document", icon: "📄", label: "Document",     desc: "File attachment. Set `document.name`, `size`, `ext`." },
  { type: "sticker",  icon: "😀", label: "Sticker",      desc: "Transparent PNG/WebP. Set `sticker` to a URL." },
  { type: "buttons",  icon: "↩️", label: "Reply buttons",desc: "Tappable reply buttons. Set `buttons: [{title, reply}]`." },
  { type: "list",     icon: "☰",  label: "List menu",    desc: "Bottom-sheet list. Set `list.sections` with rows." },
  { type: "poll",     icon: "📊", label: "Poll",         desc: "Voting poll. Set `poll.question` and `poll.options`." },
  { type: "location", icon: "📍", label: "Location",     desc: "Map pin. Set `location.name` and `location.address`." },
  { type: "contact",  icon: "👤", label: "Contact card", desc: "Contact with Message button. Set `contact.name`." },
  { type: "cta",      icon: "🔗", label: "CTA link",     desc: "Action button. Set `cta.display` and `cta.url`." },
  { type: "card",     icon: "🃏", label: "Rich card",    desc: "Image + title + body + buttons. Set `card.image`." },
  { type: "product",  icon: "🛍️", label: "Product",      desc: "Product card. Set `product.name` and `product.price`." },
  { type: "reaction", icon: "❤️", label: "Reaction",     desc: "Emoji on previous message. Set `reaction: '😂'`." },
  { type: "date",     icon: "📅", label: "Date divider", desc: 'Centered date chip. Set `text: "Today"`.' },
  { type: "system",   icon: "ℹ️", label: "System note",  desc: "Centered system notice. Set `text` to the message." },
] as const;

// ── Scan flow for interactive elements ───────────────────────────────────────

interface Action { icon: string; label: string; desc: string }

function getAllowedActions(flow: Flow): Action[] {
  const actions: Action[] = [];
  flow.messages.forEach((m) => {
    const type = inferType(m);
    if (type === "buttons" && m.buttons) {
      const labels = m.buttons.map((b) => (typeof b === "string" ? b : b.title)).join(" · ");
      actions.push({ icon: "↩️", label: "Reply buttons", desc: labels });
    }
    if (type === "list" && m.list) {
      const rows = m.list.sections.flatMap((s) => s.rows).map((r) => r.title);
      actions.push({ icon: "☰", label: `List: "${m.list.button}"`, desc: rows.join(" · ") });
    }
    if (type === "poll" && m.poll) {
      actions.push({ icon: "📊", label: `Poll: "${m.poll.question}"`, desc: m.poll.options.map((o) => o.text).join(" · ") });
    }
    if (type === "cta" && m.cta) {
      actions.push({ icon: "🔗", label: `CTA: "${m.cta.display}"`, desc: m.cta.url });
    }
    if (type === "product" && m.product?.catalog) {
      actions.push({ icon: "🛍️", label: `Product: "${m.product.name}"`, desc: m.product.catalog });
    }
    if (type === "contact" && m.contact) {
      actions.push({ icon: "👤", label: `Contact: "${m.contact.name}"`, desc: "Tap Message to interact" });
    }
    if (type === "voice" || type === "audio") {
      actions.push({ icon: "▶️", label: "Voice playback", desc: "Tap play/pause button" });
    }
    if (type === "card" && m.card?.buttons?.length) {
      const labels = (m.card.buttons as (string | { title: string })[]).map((b) => (typeof b === "string" ? b : b.title)).join(" · ");
      actions.push({ icon: "🃏", label: "Card buttons", desc: labels });
    }
  });
  return actions;
}

// ── Collapsible section ───────────────────────────────────────────────────────

function CollapsibleSection({
  title, badge, badgeColor = "#25d366", badgeBg = "rgba(0,168,132,0.2)", defaultOpen = true, children,
}: {
  title: string; badge?: string | number; badgeColor?: string; badgeBg?: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-white/10">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-white/5 transition"
      >
        <span
          className="text-[10px] text-white/40 transition-transform duration-200 inline-block"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >▶</span>
        <span className="flex-1 text-[12.5px] text-white/70 font-medium">{title}</span>
        {badge !== undefined && (
          <span className="text-[11px] px-1.5 py-0.5 rounded-full" style={{ background: badgeBg, color: badgeColor }}>
            {badge}
          </span>
        )}
      </button>
      {open && children}
    </div>
  );
}

// ── Allowed actions panel ─────────────────────────────────────────────────────

function AllowedActionsPanel({ flow }: { flow: Flow }) {
  const actions = useMemo(() => getAllowedActions(flow), [flow]);
  return (
    <CollapsibleSection title="Allowed Actions" badge={actions.length} defaultOpen>
      <div className="px-3 pb-3 space-y-2">
        {actions.length === 0 ? (
          <p className="text-[12px] text-white/30 italic px-1 leading-relaxed">
            No interactive elements found. Add buttons, a list, poll, or CTA to enable user actions.
          </p>
        ) : (
          actions.map((a, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-lg px-2.5 py-2" style={{ background: "rgba(255,255,255,0.04)" }}>
              <span className="text-[15px] shrink-0 mt-0.5 w-5 text-center">{a.icon}</span>
              <div className="min-w-0">
                <div className="text-[12.5px] text-white/80 font-medium leading-tight">{a.label}</div>
                <div className="text-[11.5px] text-white/40 mt-0.5 break-all">{a.desc}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </CollapsibleSection>
  );
}

// ── Message types reference panel ─────────────────────────────────────────────

function MessageTypesPanel() {
  return (
    <CollapsibleSection
      title="All Message Types"
      badge={ALL_MESSAGE_TYPES.length}
      badgeColor="rgba(255,255,255,0.5)"
      badgeBg="rgba(255,255,255,0.08)"
      defaultOpen={false}
    >
      <div className="px-3 pb-3 space-y-1">
        {ALL_MESSAGE_TYPES.map((t) => (
          <div key={t.type} className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 hover:bg-white/5 transition">
            <span className="text-[15px] shrink-0 mt-0.5 w-5 text-center">{t.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[12.5px] text-white/80 font-medium">{t.label}</span>
                <code
                  className="text-[10.5px] px-1.5 py-0.5 rounded font-mono"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }}
                >
                  {t.type}
                </code>
              </div>
              <div className="text-[11.5px] text-white/40 mt-0.5 leading-relaxed">{t.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}

// ── Phone preview panel ───────────────────────────────────────────────────────

const PHONE_W = 402;
const PHONE_H = 860;
const DEFAULT_ZOOM = 0.6;

function PhonePreviewPanel({ flow, replayKey }: { flow: Flow; replayKey: number }) {
  const player = usePlayer(flow, true);
  const mountedRef = useRef(false);

  // Restart player when replayKey changes; skip on initial mount (autoPlay handles that)
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; }
    player.restart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replayKey]);

  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; panX: number; panY: number; moved: boolean } | null>(null);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y, moved: false };
  };

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      d.moved = true;
      setIsDragging(true);
    }
    if (d.moved) setPan({ x: d.panX + dx, y: d.panY + dy });
  }, []);

  const handleCanvasMouseUp = useCallback(() => {
    dragRef.current = null;
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom((z) => Math.max(0.3, Math.min(1.5, z - e.deltaY * 0.003)));
    }
  }, []);

  const resetView = () => { setZoom(DEFAULT_ZOOM); setPan({ x: 0, y: 0 }); };

  return (
    <div className="flex flex-col h-full">
      {/* Zoom controls */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/10 shrink-0">
        <span className="text-[11px] text-white/40 uppercase tracking-wider flex-1 select-none">Live Preview</span>
        <button
          onClick={resetView}
          className="px-2 py-1 rounded text-[11px] text-white/50 hover:text-white hover:bg-white/10 transition"
          title="Reset zoom & position"
        >
          Reset
        </button>
        <div className="flex items-center gap-0.5 rounded-lg px-1 py-0.5" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <button
            onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-white/70 text-[18px] leading-none"
            title="Zoom out"
          >−</button>
          <span className="w-10 text-center text-[12px] text-white/60 tabular-nums select-none">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-white/70 text-[18px] leading-none"
            title="Zoom in"
          >+</button>
        </div>
      </div>

      {/* Phone canvas — drag to pan, Ctrl+scroll to zoom */}
      <div
        className="relative overflow-hidden shrink-0 select-none"
        style={{
          height: 500,
          cursor: isDragging ? "grabbing" : "grab",
          background: "rgba(0,0,0,0.35)",
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onWheel={handleWheel}
      >
        {/* Dot grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: `${Math.round(20 * zoom)}px ${Math.round(20 * zoom)}px`,
          }}
        />

        {/* Scaled phone */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: PHONE_W,
            height: PHONE_H,
            transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
            transformOrigin: "center center",
            pointerEvents: isDragging ? "none" : "auto",
          }}
        >
          <PhoneFrame>
            <ChatScreen flow={flow} player={player} />
          </PhoneFrame>
        </div>

        {/* Hint overlay */}
        <div className="absolute bottom-2 right-2 pointer-events-none select-none" style={{ color: "rgba(255,255,255,0.18)", fontSize: 10 }}>
          Ctrl+scroll to zoom · drag to pan
        </div>
      </div>

      {/* Scrollable bottom: player + reference panels */}
      <div className="flex-1 min-h-0 overflow-y-auto thin-scroll">
        {/* Player controls */}
        <div className="px-3 py-2.5 border-b border-white/10">
          <PlayerControls player={player} />
        </div>

        <AllowedActionsPanel flow={flow} />
        <MessageTypesPanel />
      </div>
    </div>
  );
}

// ── Builder ───────────────────────────────────────────────────────────────────

function BuilderInner() {
  const router = useRouter();
  const search = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);

  const initial = useMemo(() => {
    const id = search.get("id");
    if (id) { const f = getFlow(id); if (f) return f; }
    return { ...BLANK, id: slugify(BLANK.name) };
  }, [search]);

  const [text, setText] = useState<string>(() => JSON.stringify(initial, null, 2));
  const [applied, setApplied] = useState<Flow>(initial);
  const [replayKey, setReplayKey] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [editMode, setEditMode] = useState<"review" | "json">("review");
  const [ideaText, setIdeaText] = useState("");

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const generateIntoEditor = () => {
    const value = ideaText.trim();
    if (!value) return;
    const flow = buildFlowFromIdea(value);
    setText(JSON.stringify(flow, null, 2));
    setTab("edit");
    flash("Generated — tweak the JSON, then Save");
  };

  const { parsed, errors } = useMemo(() => {
    try {
      const obj = JSON.parse(text);
      const res = validateFlow(obj);
      return { parsed: res.ok ? res.flow! : null, errors: res.errors };
    } catch (e) {
      return { parsed: null, errors: [(e as Error).message] };
    }
  }, [text]);

  useEffect(() => {
    if (!parsed) return;
    const id = setTimeout(() => {
      setApplied(parsed);
      setReplayKey((k) => k + 1);
    }, 700);
    return () => clearTimeout(id);
  }, [parsed]);

  const insertSnippet = (make: () => Message) => {
    try {
      const obj = JSON.parse(text) as Flow;
      if (!Array.isArray(obj.messages)) obj.messages = [];
      obj.messages.push(make());
      setText(JSON.stringify(obj, null, 2));
      flash("Snippet added");
    } catch {
      flash("Fix JSON errors before inserting");
    }
  };

  const format = () => {
    try { setText(JSON.stringify(JSON.parse(text), null, 2)); flash("Formatted"); }
    catch { flash("Can't format — invalid JSON"); }
  };

  const save = () => {
    if (!parsed) { flash("Fix errors before saving"); return; }
    const withId: Flow = { ...parsed, id: parsed.id || slugify(parsed.name) };
    upsertCustomFlow(withId);
    setText(JSON.stringify(withId, null, 2));
    flash(`Saved "${withId.name}" — find it in your chats`);
  };

  const copyShareLink = async () => {
    if (!parsed) { flash("Fix errors before sharing"); return; }
    const withId: Flow = { ...parsed, id: parsed.id || slugify(parsed.name) };
    try {
      await navigator.clipboard.writeText(buildShareUrl(withId));
      flash("Read-only demo link copied — safe to send to customers");
    } catch {
      flash("Couldn't copy the link");
    }
  };

  const exportJson = () => {
    const name = (parsed?.id || parsed?.name || "flow").toString();
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${slugify(name)}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try { const obj = JSON.parse(String(reader.result)); setText(JSON.stringify(obj, null, 2)); flash("Imported"); }
      catch { flash("That file isn't valid JSON"); }
    };
    reader.readAsText(file);
  };

  const loadDemo = (id: string) => {
    if (id === "__blank__") {
      const blank = { ...BLANK, id: slugify("New Flow " + Date.now().toString().slice(-4)) };
      setText(JSON.stringify(blank, null, 2)); return;
    }
    const f = bundledFlows.find((b) => b.id === id);
    if (f) setText(JSON.stringify(f, null, 2));
  };

  return (
    <main className="h-[100dvh] flex flex-col text-white overflow-hidden" style={{ background: "#0a0f14" }}>
      {/* Top bar */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-white/10 shrink-0 z-20"
        style={{ background: "rgba(10,15,20,0.95)", backdropFilter: "blur(8px)" }}
      >
        <button onClick={() => router.push("/")} className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/10 text-[14px]">
          <ArrowLeft size={18} /> <span className="hidden sm:inline">Chats</span>
        </button>
        <div className="flex items-center gap-2 text-[14px] font-semibold">
          <span className="text-[#25d366]">Flow Builder</span>
          {parsed ? (
            <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ background: "rgba(0,168,132,0.2)", color: "#25d366" }}>valid</span>
          ) : (
            <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ background: "rgba(241,92,109,0.2)", color: "#ff8a96" }}>errors</span>
          )}
        </div>
        <div className="flex-1" />
        <button onClick={exportJson} className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/10 text-[14px]" title="Download JSON">
          <Download size={16} /> <span className="hidden sm:inline">Export</span>
        </button>
        <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/10 text-[14px]" title="Import JSON">
          <Copy size={16} /> <span className="hidden sm:inline">Import</span>
        </button>
        <button onClick={copyShareLink} className="px-4 py-2 rounded-lg font-medium text-white/85 text-[14px] border border-white/15 hover:bg-white/10" title="Copy a read-only demo link to send to customers">
          Share link
        </button>
        <button onClick={save} className="px-4 py-2 rounded-lg font-semibold text-[#0b141a] text-[14px]" style={{ background: "#00a884" }}>
          Save
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
      </div>

      {/* Mobile tabs */}
      <div className="md:hidden flex border-b border-white/10 shrink-0">
        {(["edit", "preview"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-3 text-[14px] font-medium capitalize"
            style={{
              color: tab === t ? "#25d366" : "rgba(255,255,255,0.55)",
              borderBottom: tab === t ? "2px solid #00a884" : "2px solid transparent",
            }}
          >{t}</button>
        ))}
      </div>

      {/* Content area — two-pane layout */}
      <div className="flex flex-1 min-h-0">
        {/* Editor (left) */}
        <div
          className={`${tab === "edit" ? "flex" : "hidden"} md:flex flex-col flex-1 min-h-0 overflow-y-auto thin-scroll p-4 md:p-6`}
        >
          {/* Generate from idea */}
          <div className="mb-3 rounded-xl p-2 flex items-center gap-2" style={{ background: "rgba(0,168,132,0.08)", border: "1px solid rgba(0,168,132,0.25)" }}>
            <Sparkle size={16} className="text-[#25d366] shrink-0 ml-1" />
            <input
              value={ideaText}
              onChange={(e) => setIdeaText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") generateIntoEditor(); }}
              placeholder='Generate from a business idea, e.g. "a fruit restaurant"'
              className="flex-1 bg-transparent outline-none text-[13.5px] py-1.5 placeholder:text-white/35"
            />
            <button
              onClick={generateIntoEditor}
              disabled={!ideaText.trim()}
              className="px-3 py-1.5 rounded-lg text-[13px] font-semibold text-[#0b141a] disabled:opacity-50 shrink-0"
              style={{ background: "#00a884" }}
            >Generate</button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <select
              onChange={(e) => loadDemo(e.target.value)}
              defaultValue=""
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[13.5px] outline-none"
            >
              <option value="" disabled>Load…</option>
              <option value="__blank__">＋ Blank flow</option>
              {bundledFlows.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <button onClick={format} className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[13.5px]">Format</button>
            <button
              onClick={() => setText(JSON.stringify({ ...BLANK, id: slugify("New Flow " + Date.now().toString().slice(-4)) }, null, 2))}
              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[13.5px] flex items-center gap-1"
            ><Trash size={14} /> Reset</button>
            <button
              onClick={() => setReplayKey((k) => k + 1)}
              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[13.5px]"
            >↻ Replay</button>
          </div>

          {/* Edit mode toggle */}
          <div className="flex gap-1 mb-3 p-1 rounded-lg bg-white/5 border border-white/10 w-fit">
            {(["review", "json"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setEditMode(mode)}
                className={`px-3 py-1.5 rounded-md text-[13px] ${editMode === mode ? "bg-[#00a884] text-[#0b141a] font-semibold" : "text-white/70 hover:text-white"}`}
              >{mode === "review" ? "Review & refine" : "JSON"}</button>
            ))}
          </div>

          {editMode === "review" ? (
            parsed ? (
              <ReviewEditor flow={parsed} onChange={(f) => setText(JSON.stringify(f, null, 2))} />
            ) : (
              <div className="rounded-xl p-4 text-[13.5px] text-amber-300/90" style={{ background: "rgba(245,177,76,0.08)", border: "1px solid rgba(245,177,76,0.25)" }}>
                Fix the JSON errors below to use Review &amp; refine.
              </div>
            )
          ) : (
            <>
              {/* Snippet palette */}
              <div className="mb-3">
                <div className="text-[12px] uppercase tracking-wider text-white/40 mb-2">Insert message</div>
                <div className="flex flex-wrap gap-1.5">
                  {SNIPPETS.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => insertSnippet(s.make)}
                      className="px-2.5 py-1.5 rounded-lg text-[12.5px] bg-white/5 hover:bg-[#00a884]/20 border border-white/10 hover:border-[#00a884]/40 flex items-center gap-1 transition"
                    >
                      <Plus size={12} /> {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                spellCheck={false}
                className="w-full h-[52vh] md:h-[58vh] rounded-xl p-4 font-mono text-[12.5px] leading-[1.6] outline-none thin-scroll resize-none"
                style={{ background: "#0d1620", border: "1px solid rgba(255,255,255,0.1)", color: "#cdd6dc", tabSize: 2 }}
              />
            </>
          )}

          {/* Validation */}
          <div className="mt-3 min-h-[28px]">
            {errors.length === 0 ? (
              <div className="text-[13px] text-[#25d366]">✓ JSON is valid — preview updates automatically.</div>
            ) : (
              <ul className="text-[13px] text-[#ff8a96] space-y-1">
                {errors.slice(0, 4).map((err, i) => <li key={i}>• {err}</li>)}
              </ul>
            )}
          </div>
        </div>

        {/* Preview panel (far right) */}
        <div
          className={`${tab === "preview" ? "flex" : "hidden"} md:flex flex-col min-h-0 w-full md:w-[440px] md:min-w-[440px] md:max-w-[440px] md:border-l border-white/10`}
          style={{ background: "rgba(10,15,20,0.97)" }}
        >
          <PhonePreviewPanel flow={applied} replayKey={replayKey} />
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-[14px] shadow-xl" style={{ background: "#202c33", border: "1px solid rgba(255,255,255,0.1)" }}>
          {toast}
        </div>
      )}
    </main>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={<main className="h-[100dvh] flex items-center justify-center text-white/50" style={{ background: "#0a0f14" }}>Loading…</main>}>
      <BuilderInner />
    </Suspense>
  );
}
