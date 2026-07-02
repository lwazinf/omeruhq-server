"use client";

import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Flow, ListData, ListRow, Sender, inferType, isSystem } from "@/lib/types";
import { RenderedMessage, UsePlayerResult } from "@/lib/usePlayer";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import { DateChip, SystemNote } from "./Chrome";
import TypingBubble from "./TypingBubble";
import MessageBody from "./MessageBody";
import ListSheet from "./ListSheet";
import { ChatContext } from "./ChatContext";

interface SheetState {
  list: ListData;
  onSelect: (row: ListRow) => void;
}

export type ChatScrollHandle = {
  scrollToRatio: (ratio: number) => void;
};

const ChatScreen = forwardRef<ChatScrollHandle, {
  flow: Flow;
  player: UsePlayerResult;
  onBack?: () => void;
  onScrollChange?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
}>(function ChatScreen({ flow, player, onBack, onScrollChange }, ref) {
  const dark = (flow.theme ?? "dark") === "dark";
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [extras, setExtras] = useState<RenderedMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Screen drag + momentum state
  const screenDragRef = useRef<{ y: number; top: number } | null>(null);
  const didDragRef = useRef(false);
  const blockNextClickRef = useRef(false);
  // velocity samples: [{ y, t }] – keep a rolling 120ms window
  const velSamples = useRef<{ y: number; t: number }[]>([]);
  const momentumRaf = useRef<number | null>(null);

  const combined = useMemo(
    () => [...player.visible, ...extras],
    [player.visible, extras]
  );

  const emitScroll = () => {
    const el = scrollRef.current;
    if (el) onScrollChange?.(el.scrollTop, el.scrollHeight, el.clientHeight);
  };

  useImperativeHandle(ref, () => ({
    scrollToRatio: (ratio: number) => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTop = ratio * (el.scrollHeight - el.clientHeight);
      emitScroll();
    },
  }));

  // Auto-scroll to bottom as content appears.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      setTimeout(emitScroll, 320);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combined.length, player.typingSide]);

  // Global mouse handlers for screen drag + momentum
  useEffect(() => {
    const stopMomentum = () => {
      if (momentumRaf.current !== null) {
        cancelAnimationFrame(momentumRaf.current);
        momentumRaf.current = null;
      }
    };

    const startMomentum = (velocityPxPerMs: number) => {
      stopMomentum();
      const FRICTION = 0.94; // per frame (~16.7ms)
      let vel = velocityPxPerMs * 16.7; // px per frame
      let lastTime = performance.now();

      const tick = (now: number) => {
        const dt = now - lastTime;
        lastTime = now;
        const frames = dt / 16.7;
        vel *= Math.pow(FRICTION, frames);

        const el = scrollRef.current;
        if (!el || Math.abs(vel) < 0.3) { stopMomentum(); return; }

        el.scrollTop -= vel;
        // clamp
        if (el.scrollTop <= 0 || el.scrollTop >= el.scrollHeight - el.clientHeight) {
          stopMomentum();
          return;
        }
        emitScroll();
        momentumRaf.current = requestAnimationFrame(tick);
      };

      momentumRaf.current = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      if (!screenDragRef.current) return;
      const delta = e.clientY - screenDragRef.current.y;
      if (!didDragRef.current && Math.abs(delta) < 6) return;
      didDragRef.current = true;
      stopMomentum();
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTop = screenDragRef.current.top - delta;
      emitScroll();
      // Record velocity sample
      const now = performance.now();
      velSamples.current.push({ y: e.clientY, t: now });
      // Keep only last 120ms
      velSamples.current = velSamples.current.filter(s => now - s.t <= 120);
    };

    const onUp = () => {
      if (didDragRef.current) {
        blockNextClickRef.current = true;
        // Compute velocity from recent samples
        const samples = velSamples.current;
        if (samples.length >= 2) {
          const first = samples[0];
          const last = samples[samples.length - 1];
          const dt = last.t - first.t;
          if (dt > 0) {
            const velPxPerMs = (last.y - first.y) / dt; // positive = moving down = scroll up
            if (Math.abs(velPxPerMs) > 0.1) {
              startMomentum(velPxPerMs);
            }
          }
        }
      }
      screenDragRef.current = null;
      didDragRef.current = false;
      velSamples.current = [];
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      stopMomentum();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wallpaper = flow.wallpaper;
  const isImgWall = wallpaper && wallpaper !== "default" && /^https?:\/\//.test(wallpaper);
  const isColorWall = wallpaper && wallpaper !== "default" && wallpaper.startsWith("#");

  const bodyClass = isImgWall ? "wa-wallpaper-img" : isColorWall ? "" : "wa-wallpaper";
  const bodyStyle: React.CSSProperties = isImgWall
    ? { backgroundImage: `url(${wallpaper})` }
    : isColorWall
    ? { background: wallpaper }
    : {};

  return (
    <ChatContext.Provider value={{ openListSheet: (list, onSelect) => setSheet({ list, onSelect }) }}>
      <div
        className="wa-screen relative flex flex-col h-full w-full overflow-hidden"
        data-theme={dark ? "dark" : "light"}
      >
        <ChatHeader flow={flow} onBack={onBack} typing={player.typingSide === "bot"} />

        {/* progress hairline */}
        <div className="h-[2px] w-full shrink-0" style={{ background: "transparent" }}>
          <div
            className="h-full transition-[width] duration-300"
            style={{ width: `${Math.round(player.progress * 100)}%`, background: "var(--accent)", opacity: 0.85 }}
          />
        </div>

        <div
          ref={scrollRef}
          onScroll={emitScroll}
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            const el = scrollRef.current;
            if (!el) return;
            didDragRef.current = false;
            screenDragRef.current = { y: e.clientY, top: el.scrollTop };
          }}
          onClickCapture={(e) => {
            if (blockNextClickRef.current) {
              blockNextClickRef.current = false;
              e.stopPropagation();
            }
          }}
          className={`flex-1 overflow-y-auto wa-scroll ${bodyClass} py-2`}
          style={{ ...bodyStyle, cursor: "default", userSelect: "none" }}
        >
          <AnimatePresence initial={false}>
            {combined.map((m, i) => {
              if (isSystem(m)) {
                const t = inferType(m);
                if (t === "date")
                  return <DateChip key={m._key ?? `c-${i}`} text={m.text ?? ""} />;
                return <SystemNote key={m._key ?? `c-${i}`} text={m.text ?? ""} />;
              }
              const side: Sender = m.from ?? "bot";
              const prev = combined[i - 1];
              const prevIsBubble = prev && !isSystem(prev);
              const prevSide: Sender | null = prevIsBubble ? prev.from ?? "bot" : null;
              const grouped = prevSide === side;
              return (
                <MessageBody
                  key={m._key ?? `m-${i}`}
                  m={m}
                  side={side}
                  tail={!grouped}
                  grouped={grouped}
                />
              );
            })}
            {player.typingSide && (
              <TypingBubble key="typing" side={player.typingSide} />
            )}
          </AnimatePresence>
          <div className="h-1" />
        </div>

        <ChatInput
          onSend={(text) =>
            setExtras((prev) => [
              ...prev,
              {
                _key: `extra-${Date.now()}`,
                _index: -1,
                from: "user",
                type: "text",
                text,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                status: "read",
              },
            ])
          }
        />

        {/* Android-style gesture bar */}
        <div className="shrink-0 flex items-center justify-center" style={{ height: 16, background: "var(--bg)" }}>
          <div style={{ width: 120, height: 4, borderRadius: 9999, background: "var(--text2)", opacity: 0.4 }} />
        </div>

        <ListSheet
          open={!!sheet}
          list={sheet?.list ?? null}
          onClose={() => setSheet(null)}
          onSelect={(row) => sheet?.onSelect(row)}
        />
      </div>
    </ChatContext.Provider>
  );
});

export default ChatScreen;
