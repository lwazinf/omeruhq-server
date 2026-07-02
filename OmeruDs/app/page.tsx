"use client";

import React, {
  createContext, useContext,
  useEffect, useRef, useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { bundledFlows } from "@/lib/flows";
import { usePlayer, UsePlayerResult } from "@/lib/usePlayer";
import Avatar from "@/components/chat/Avatar";
import ChatScreen, { ChatScrollHandle } from "@/components/chat/ChatScreen";
import PlayerControls from "@/components/PlayerControls";
import { Flow } from "@/lib/types";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

const WaIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

// ── Shared player context ─────────────────────────────────────────────────────
const PlayerCtx = createContext<UsePlayerResult | null>(null);
function usePlayerCtx() {
  const ctx = useContext(PlayerCtx);
  if (!ctx) throw new Error("PlayerCtx missing");
  return ctx;
}
function PlayerProvider({ flow, children }: { flow: Flow; children: React.ReactNode }) {
  const player = usePlayer(flow, true);
  return <PlayerCtx.Provider value={player}>{children}</PlayerCtx.Provider>;
}

// ── Controls ──────────────────────────────────────────────────────────────────
function TopControls() {
  const player = usePlayerCtx();
  return <PlayerControls player={player} compact />;
}

function PlayingIndicator() {
  const { status } = usePlayerCtx();
  const playing = status === "playing";
  const done    = status === "done";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, paddingLeft: 6 }}>
      <div
        className={playing ? "status-pulse" : ""}
        style={{
          width: 5, height: 5, borderRadius: "50%",
          background: playing ? "#C8F135" : done ? "rgba(200,241,53,0.35)" : "rgba(255,255,255,0.18)",
          boxShadow: playing ? "0 0 5px rgba(200,241,53,0.65)" : "none",
          transition: "background 0.3s ease, box-shadow 0.3s ease",
        }}
      />
      <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase",
        color: playing ? "#C8F135" : done ? "rgba(200,241,53,0.45)" : "rgba(255,255,255,0.18)",
        transition: "color 0.3s ease",
      }}>
        {done ? "Done" : playing ? "Playing" : "Paused"}
      </span>
    </div>
  );
}

// ── Typewriter text ───────────────────────────────────────────────────────────
function TypewriterText({ text }: { text: string }) {
  const [chars, setChars] = useState(0);

  useEffect(() => {
    setChars(0);
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setChars(i);
      if (i >= text.length) clearInterval(id);
    }, 22);
    return () => clearInterval(id);
  }, [text]);

  return (
    <>
      {text.slice(0, chars)}
      {chars < text.length && <span className="typewriter-cursor" aria-hidden>▋</span>}
    </>
  );
}

// ── Bot description (editable + typewriter) ───────────────────────────────────
const DEFAULT_DESCRIPTIONS: Record<string, string> = {
  "omeru-discovery": "Discover SA's best township stores — browse by category, explore products, and shop directly on WhatsApp.",
  "kasi-kicks":      "Shop Kasi Kicks sneakers on WhatsApp — browse the catalogue, pick your size and colorway, and pay to confirm.",
  "mamas-kitchen":   "Order from Mama's Kitchen — view today's specials, choose delivery or collect, and pay without leaving chat.",
  "thandi-bridal":   "Find your perfect gown with Thandi Bridal — browse styles, book a fitting, and secure your order in chat.",
};

function BotDescription({
  value, onChange, isEditing, onStartEdit, onEndEdit,
}: {
  value: string;
  onChange: (v: string) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isEditing || !ref.current) return;
    ref.current.focus();
    ref.current.style.height = "auto";
    ref.current.style.height = ref.current.scrollHeight + "px";
    const len = ref.current.value.length;
    ref.current.setSelectionRange(len, len);
  }, [isEditing]);

  const resize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  if (isEditing) {
    return (
      <textarea
        ref={ref}
        value={value}
        onChange={e => { onChange(e.target.value); resize(e.target); }}
        onBlur={onEndEdit}
        onKeyDown={e => { if (e.key === "Escape") { e.preventDefault(); onEndEdit(); } }}
        style={{
          fontSize: 10, lineHeight: 1.6,
          color: "rgba(255,255,255,0.75)",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 6, padding: "5px 8px",
          resize: "none", outline: "none", overflow: "hidden",
          width: "100%", minHeight: 32, fontFamily: "inherit",
          caretColor: "#C8F135",
          transition: "border-color 0.15s ease",
        }}
      />
    );
  }

  return (
    <motion.div
      onClick={onStartEdit}
      initial={false}
      whileHover={{ color: "rgba(255,255,255,0.55)" }}
      transition={{ duration: 0.15 }}
      style={{
        fontSize: 10, lineHeight: 1.6,
        color: "rgba(255,255,255,0.3)",
        cursor: "text", userSelect: "none", paddingBottom: 2,
      }}
    >
      {value ? <TypewriterText text={value} /> : "Add a description…"}
    </motion.div>
  );
}

// ── CTA progress button ───────────────────────────────────────────────────────
const ARROW = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const SPARKLE = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

function CtaProgressButton({ isEditing, onGenerate }: { isEditing: boolean; onGenerate?: () => void }) {
  const { progress } = usePlayerCtx();
  const pct = Math.round(progress * 100);
  const [hovered, setHovered] = useState(false);

  const label = isEditing ? "Generate" : "Let's make it real";
  const icon  = isEditing ? SPARKLE : ARROW;

  const handleClick = isEditing
    ? (e: React.MouseEvent) => { e.preventDefault(); onGenerate?.(); }
    : undefined;

  return (
    <a
      href={isEditing ? undefined : "https://wa.me/27000000000?text=Hi%20OMERU%2C%20I%E2%80%99d%20like%20to%20get%20started"}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative", overflow: "hidden",
        display: "inline-flex", alignItems: "center", gap: 7,
        padding: "8px 16px", borderRadius: 100,
        background: "rgba(200,241,53,0.06)",
        border: `1px solid rgba(200,241,53,${0.15 + progress * 0.25 + (hovered ? 0.12 : 0)})`,
        fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
        textDecoration: "none", whiteSpace: "nowrap",
        boxShadow: hovered
          ? `0 0 14px rgba(200,241,53,${0.1 + progress * 0.15}), 0 2px 8px rgba(0,0,0,0.45)`
          : `0 0 ${4 + pct * 0.06}px rgba(200,241,53,${0.06 + progress * 0.1}), 0 2px 6px rgba(0,0,0,0.35)`,
        transform: hovered ? "translateY(-1px) scale(1.015)" : "translateY(0) scale(1)",
        cursor: "pointer",
        transition: "box-shadow 0.25s ease, border-color 0.25s ease, transform 0.18s ease",
      }}
    >
      {/* Fill */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0,
        width: `${pct}%`,
        background: "linear-gradient(180deg,#d4fc38 0%,#C8F135 60%,#b5d620 100%)",
        transition: "width 0.4s ease", zIndex: 0, pointerEvents: "none",
      }} />
      {/* Sheen */}
      <div style={{
        position: "absolute", left: 0, top: 0, right: `${100 - pct}%`, bottom: "55%",
        background: "rgba(255,255,255,0.12)",
        transition: "right 0.4s ease", zIndex: 1, pointerEvents: "none",
      }} />

      {/* Lime text */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={label} aria-hidden
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          style={{ position: "relative", zIndex: 2, display: "inline-flex", alignItems: "center", gap: 7, color: "#C8F135" }}
        >
          {icon}{label}
        </motion.span>
      </AnimatePresence>

      {/* Dark text (clipped to fill zone) */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={`d-${label}`}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{
            position: "absolute", inset: 0,
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
            padding: "8px 16px", color: "#0a0a0a",
            clipPath: `inset(0 ${100 - pct}% 0 0 round 100px)`,
            transition: "clip-path 0.4s ease", zIndex: 3, pointerEvents: "none",
          }}
        >
          {icon}{label}
        </motion.span>
      </AnimatePresence>
    </a>
  );
}

// ── Bot pills (vertical column) ───────────────────────────────────────────────
function BotPills({ selectedIdx, onSelect }: { selectedIdx: number; onSelect: (i: number) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-start" }}>
      {bundledFlows.map((f, i) => (
        <motion.button
          key={f.id}
          onClick={() => onSelect(i)}
          whileHover={{ scale: 1.04, x: 2 }}
          whileTap={{ scale: 0.93 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          style={{
            position: "relative",
            display: "flex", alignItems: "center", gap: 5,
            padding: "4px 9px", borderRadius: 99, background: "transparent",
            border: `1px solid ${i === selectedIdx ? "rgba(200,241,53,0.28)" : "rgba(255,255,255,0.06)"}`,
            color: i === selectedIdx ? "#c8f135" : "rgba(255,255,255,0.28)",
            fontSize: 10, fontWeight: 500, cursor: "pointer",
            transition: "color 0.25s ease, border-color 0.25s ease",
            whiteSpace: "nowrap",
          }}
        >
          {i === selectedIdx && (
            <motion.div
              layoutId="pill-active-bg"
              style={{ position: "absolute", inset: 0, borderRadius: 99, background: "rgba(200,241,53,0.08)" }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            />
          )}
          <span style={{ position: "relative", zIndex: 1, display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Avatar avatar={f.avatar} name={f.name} size={12} />
            {f.name.split(" ").slice(0, 2).join(" ")}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

// ── Phone frame ───────────────────────────────────────────────────────────────
const PHONE_W = 393, PHONE_H = 852;
const BZ = { side: 5, top: 10, bot: 14 };
const PILL_GAP = 12;
const PILL_W_MIN = 3;
const PILL_W_MAX = 6;
const PILL_PROX_RADIUS = 55;

function Phone({
  flow, selectedIdx, onSelectBot,
}: {
  flow: Flow;
  selectedIdx: number;
  onSelectBot: (i: number) => void;
}) {
  const player = usePlayerCtx();
  const wrapperRef  = useRef<HTMLDivElement>(null);
  const pillRef     = useRef<HTMLDivElement>(null);
  const chatRef     = useRef<ChatScrollHandle>(null);
  const [scale, setScale]         = useState(0.78);
  const [scroll, setScroll]       = useState({ top: 0, height: 1, client: 1 });
  const [proximity, setProximity] = useState(0);
  const [dragging, setDragging]   = useState(false);
  const dragStartRef = useRef<{ y: number; ratio: number } | null>(null);

  useEffect(() => {
    const calc = () => {
      if (!wrapperRef.current) return;
      const { width, height } = wrapperRef.current.getBoundingClientRect();
      setScale(Math.max(Math.min(
        (width - 24 - BZ.side * 2) / PHONE_W,
        (height - 24 - BZ.top - BZ.bot) / PHONE_H,
        0.95,
      ), 0.4));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  const sW = Math.round(PHONE_W * scale);
  const sH = Math.round(PHONE_H * scale);
  const pW = sW + BZ.side * 2;
  const pH = sH + BZ.top + BZ.bot;
  const outerR = Math.round(pW * 0.148);
  const innerR = Math.round(outerR * 0.82);
  const camR   = Math.max(7, Math.round(10 * scale));

  const thumbRatio = scroll.height > 0 ? Math.min(1, scroll.client / scroll.height) : 1;
  const thumbH     = Math.max(24, Math.round(sH * thumbRatio));
  const scrollRatio = scroll.height > scroll.client
    ? scroll.top / (scroll.height - scroll.client) : 0;
  const thumbTop = Math.round(scrollRatio * (sH - thumbH));
  const showPill = thumbRatio < 0.99;
  const pillW    = PILL_W_MIN + (PILL_W_MAX - PILL_W_MIN) * proximity;

  useEffect(() => {
    if (!dragging) return;
    const prev = document.body.style.cursor;
    document.body.style.cursor = "ns-resize";
    const onMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const usable = sH - thumbH;
      if (usable <= 0) return;
      const delta = e.clientY - dragStartRef.current.y;
      const newRatio = Math.max(0, Math.min(1, dragStartRef.current.ratio + delta / usable));
      chatRef.current?.scrollToRatio(newRatio);
    };
    const onUp = () => {
      document.body.style.cursor = prev;
      setDragging(false);
      dragStartRef.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      document.body.style.cursor = prev;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, sH, thumbH]);

  useEffect(() => {
    if (!dragging) return;
    setProximity(1);
    return () => setProximity(0);
  }, [dragging]);

  const handleWrapperMouseMove = (e: React.MouseEvent) => {
    if (dragging || !pillRef.current) return;
    const r  = pillRef.current.getBoundingClientRect();
    const cx = (r.left + r.right) / 2;
    const cy = (r.top + r.bottom) / 2;
    const dx = Math.max(0, Math.abs(e.clientX - cx) - pillW / 2);
    const dy = Math.max(0, Math.abs(e.clientY - cy) - thumbH / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);
    setProximity(Math.max(0, 1 - dist / PILL_PROX_RADIUS));
  };

  const handlePillMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    dragStartRef.current = { y: e.clientY, ratio: scrollRatio };
  };

  const activePill = proximity > 0.05 || dragging;

  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(() => DEFAULT_DESCRIPTIONS[flow.id] ?? "");

  // ── Zoom ──────────────────────────────────────────────────────────────
  const [zoom, setZoom] = useState(1.0);
  const zoomRef = useRef(1.0);
  zoomRef.current = zoom;

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const px = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
      const delta = -px * 0.0007;
      setZoom(prev => Math.round(Math.max(0.35, Math.min(2.5, prev + delta)) * 20) / 20);
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  // Right column layout: fixed 190px wide, starts after scroll-pill zone
  const colLeft  = pW + PILL_GAP + PILL_W_MAX + PILL_GAP;
  const COL_W    = 190;

  return (
    <div
      ref={wrapperRef}
      onMouseMove={handleWrapperMouseMove}
      onMouseLeave={() => { if (!dragging) setProximity(0); }}
      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0, position: "relative" }}
    >
      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "center center",
          transition: zoom === 1.0 ? "transform 0.28s cubic-bezier(0.16,1,0.3,1)" : "none",
          willChange: "transform",
        }}
      >
      <div style={{ position: "relative", width: pW, height: pH, flexShrink: 0 }}>

        {/* Body ─────────────────────────────────────────────────────────── */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: outerR,
          background: "linear-gradient(162deg,#2e2e2e 0%,#1c1c1c 45%,#262626 75%,#1a1a1a 100%)",
          boxShadow: [
            "0 0 0 0.5px rgba(255,255,255,0.07)",
            "0 70px 140px -20px rgba(0,0,0,0.99)",
            "0 35px 70px -10px rgba(0,0,0,0.75)",
            "0 12px 28px rgba(0,0,0,0.55)",
            "inset 0 1.5px 0 rgba(255,255,255,0.1)",
            "inset 0 -1px 0 rgba(0,0,0,0.55)",
          ].join(","),
        }}>
          {/* Matte sheen */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: outerR, pointerEvents: "none",
            background: "radial-gradient(ellipse 75% 55% at 28% 18%,rgba(255,255,255,0.028),transparent 65%)",
          }} />

          {/* Screen viewport – only this cross-fades on bot switch */}
          <div style={{
            position: "absolute", top: BZ.top, left: BZ.side,
            width: sW, height: sH, borderRadius: innerR, overflow: "hidden", background: "#000",
          }}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={selectedIdx}
                initial={{ opacity: 0, filter: "blur(10px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(10px)" }}
                transition={{ duration: 0.38, ease: EASE_OUT_EXPO }}
                style={{
                  width: PHONE_W, height: PHONE_H,
                  transform: `scale(${scale})`, transformOrigin: "top left",
                  position: "absolute", top: 0, left: 0,
                }}
              >
                <ChatScreen
                  ref={chatRef}
                  flow={flow}
                  player={player}
                  onScrollChange={(t, h, c) => setScroll({ top: t, height: h, client: c })}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Punch-hole */}
          <div style={{
            position: "absolute", left: "50%",
            top: BZ.top + Math.round(16 * scale),
            transform: "translateX(-50%)",
            width: camR, height: camR, borderRadius: "50%",
            background: "#050505",
            boxShadow: "0 0 0 1.5px rgba(255,255,255,0.06),inset 0 1px 3px rgba(0,0,0,0.95)",
            zIndex: 2, pointerEvents: "none",
          }} />
        </div>

        {/* Decorative side buttons */}
        <div style={{ position: "absolute", left: -2.5, top: Math.round(pH * 0.26), width: 3, height: Math.round(38 * scale), borderRadius: "2px 0 0 2px", background: "#252525", pointerEvents: "none" }} />
        <div style={{ position: "absolute", left: -2.5, top: Math.round(pH * 0.38), width: 3, height: Math.round(38 * scale), borderRadius: "2px 0 0 2px", background: "#252525", pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: -2.5, top: Math.round(pH * 0.30), width: 3, height: Math.round(58 * scale), borderRadius: "0 2px 2px 0", background: "#252525", pointerEvents: "none" }} />

        {/* Scroll pill */}
        {showPill && (
          <div
            ref={pillRef}
            onMouseDown={handlePillMouseDown}
            style={{
              position: "absolute",
              right: -(Math.ceil(pillW) + PILL_GAP),
              top: BZ.top + thumbTop,
              width: Math.ceil(pillW), height: thumbH,
              borderRadius: 99,
              background: activePill ? "rgba(134,150,160,0.6)" : "rgba(134,150,160,0.35)",
              cursor: activePill ? "ns-resize" : "default",
              transition: dragging
                ? "width 0.1s ease, background 0.1s ease"
                : "top 0.15s ease, width 0.15s ease, background 0.15s ease",
              zIndex: 20,
            }}
          />
        )}

        {/* Bot pills – top of right column (z-index 20 → above strips) */}
        <div style={{
          position: "absolute",
          left: colLeft, top: 0,
          zIndex: 20,
        }}>
          <BotPills selectedIdx={selectedIdx} onSelect={onSelectBot} />
        </div>

        {/* Description + Controls + CTA – bottom of right column */}
        <div style={{
          position: "absolute",
          left: colLeft, bottom: BZ.bot,
          display: "flex", flexDirection: "column",
          width: COL_W, gap: 8, zIndex: 20,
        }}>
          <div style={{ width: "100%" }}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={flow.id}
                initial={{ opacity: 0, y: -4, filter: "blur(3px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 4, filter: "blur(3px)" }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.75)", marginBottom: 4, letterSpacing: "-0.01em" }}
              >
                {flow.name}
              </motion.div>
            </AnimatePresence>
            <BotDescription
              value={description}
              onChange={setDescription}
              isEditing={isEditing}
              onStartEdit={() => setIsEditing(true)}
              onEndEdit={() => setIsEditing(false)}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
            <div style={{ flex: 1 }}><TopControls /></div>
            <PlayingIndicator />
          </div>

          <CtaProgressButton isEditing={isEditing} onGenerate={() => setIsEditing(false)} />
        </div>
      </div>
      </div>{/* /zoom wrapper */}

      {/* Click the middle to reset zoom */}
      {Math.abs(zoom - 1.0) > 0.02 && (
        <button
          onClick={() => setZoom(1.0)}
          style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 40, pointerEvents: "auto",
            background: "rgba(8,8,8,0.82)",
            border: "1px solid rgba(255,255,255,0.11)",
            color: "rgba(255,255,255,0.6)",
            borderRadius: 99,
            padding: "5px 14px",
            fontSize: 11, fontWeight: 600,
            backdropFilter: "blur(12px)",
            cursor: "pointer",
            letterSpacing: "0.05em",
            userSelect: "none",
            whiteSpace: "nowrap",
          }}
        >
          {Math.round(zoom * 100)}% · reset
        </button>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const flow = bundledFlows[selectedIdx];

  return (
    <main style={{
      height: "100dvh", display: "flex", flexDirection: "column",
      background: "radial-gradient(ellipse 600px 400px at 60% 25%,rgba(200,241,53,0.06),transparent 70%),#0a0a0a",
      position: "relative", overflow: "hidden",
    }}>
      {/* Dot grid */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", padding: "14px 24px 12px", gap: 10 }}>

          {/* Left group: wordmark + demo label + bot name */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
            {/* OMERU wordmark */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                background: "#C8F135",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 8px rgba(200,241,53,0.28)",
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 10, fontWeight: 900, color: "#0a0a0a", fontFamily: "var(--font-display)", lineHeight: 1 }}>O</span>
              </div>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.88)", letterSpacing: "-0.025em" }}>
                OMERU
              </span>
            </div>

            <span style={{ width: 1, height: 14, background: "rgba(255,255,255,0.1)", display: "inline-block", flexShrink: 0 }} />

            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", flexShrink: 0 }}>
              Live demo
            </span>

            <span style={{ width: 1, height: 12, background: "rgba(255,255,255,0.1)", display: "inline-block", flexShrink: 0 }} />

            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={flow.id}
                initial={{ opacity: 0, y: -5, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 5, filter: "blur(4px)" }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Avatar avatar={flow.avatar} name={flow.name} size={18} />
                <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.45)" }}>
                  {flow.name}
                </span>
              </motion.span>
            </AnimatePresence>
          </div>

          {/* Right: WhatsApp CTA */}
          <motion.a
            href="https://wa.me/27000000000?text=Hi%20OMERU%2C%20I%E2%80%99d%20like%20to%20get%20started"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.04, boxShadow: "0 0 16px rgba(200,241,53,0.14)" }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 480, damping: 28 }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 16px", borderRadius: 99,
              background: "rgba(200,241,53,0.08)",
              border: "1px solid rgba(200,241,53,0.2)",
              color: "#C8F135",
              fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
              textDecoration: "none", whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <WaIcon /> Chat with us
          </motion.a>
        </div>
      </div>

      {/* ── Phone area – PlayerProvider is stable; only the chat screen fades */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, position: "relative", zIndex: 1 }}>
        <PlayerProvider flow={flow}>
          <Phone
            flow={flow}
            selectedIdx={selectedIdx}
            onSelectBot={setSelectedIdx}
          />
        </PlayerProvider>
      </div>
    </main>
  );
}
