"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Flow, Message, Sender, inferType, isSystem } from "./types";

// ============================================================================
// lib/usePlayer.ts
// Drives the "motion showcase": reveals messages one by one with realistic
// typing indicators and pacing, and exposes transport controls.
// ============================================================================

export type PlayerStatus = "idle" | "playing" | "paused" | "done";

export interface RenderedMessage extends Message {
  _key: string;
  _index: number;
  /** Reaction merged onto this bubble from a following reaction message. */
  _reaction?: string;
}

function defaultDelay(m: Message, i: number): number {
  if (i === 0) return 150;
  if (isSystem(m)) return 250;
  return 300;
}

/** How long to show the typing indicator before a message. */
function autoTyping(m: Message): number {
  if (isSystem(m)) return 0;
  const from = m.from ?? "bot";
  // Explicit author control wins.
  if (typeof m.typing === "number") return m.typing;
  // Users normally don't get a "typing…" shimmer unless asked.
  if (from === "user") return 0;
  const type = inferType(m);
  if (m.text) {
    return Math.min(2400, Math.max(550, m.text.length * 32));
  }
  switch (type) {
    case "image":
    case "video":
    case "sticker":
    case "voice":
    case "audio":
    case "document":
      return 750;
    default:
      return 800;
  }
}

function buildFull(messages: Message[]): RenderedMessage[] {
  const full: RenderedMessage[] = [];
  messages.forEach((m, i) => {
    const t = inferType(m);
    if (t === "reaction" && full.length) {
      full[full.length - 1] = { ...full[full.length - 1], _reaction: m.reaction };
    } else {
      full.push({ ...m, _key: m.id ?? `m-${i}`, _index: i });
    }
  });
  return full;
}

export interface UsePlayerResult {
  visible: RenderedMessage[];
  typingSide: Sender | null;
  status: PlayerStatus;
  speed: number;
  setSpeed: (s: number) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  restart: () => void;
  skipToEnd: () => void;
  total: number;
  progress: number; // 0..1
}

export function usePlayer(flow: Flow, autoPlay = true): UsePlayerResult {
  const [visible, setVisible] = useState<RenderedMessage[]>([]);
  const [typingSide, setTypingSide] = useState<Sender | null>(null);
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [speed, setSpeed] = useState<number>(flow.speed && flow.speed > 0 ? flow.speed : 1);

  const idxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const genRef = useRef(0);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const totalBubbles = flow.messages.filter((m) => inferType(m) !== "reaction").length;

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const revealOne = useCallback(
    (i: number) => {
      const m = flow.messages[i];
      const t = inferType(m);
      setVisible((prev) => {
        if (t === "reaction" && prev.length) {
          const copy = prev.slice();
          copy[copy.length - 1] = { ...copy[copy.length - 1], _reaction: m.reaction };
          return copy;
        }
        return [...prev, { ...m, _key: m.id ?? `m-${i}`, _index: i }];
      });
    },
    [flow]
  );

  const step = useCallback(
    (i: number, gen: number) => {
      if (gen !== genRef.current) return;
      if (i >= flow.messages.length) {
        setStatus("done");
        return;
      }
      idxRef.current = i;
      const m = flow.messages[i];
      const from: Sender = m.from ?? "bot";
      const delay = defaultDelay(m, i) + (m.delay ?? 0);
      clear();
      timerRef.current = setTimeout(() => {
        if (gen !== genRef.current) return;
        const typing = autoTyping(m);
        if (typing > 0) {
          setTypingSide(from);
          clear();
          timerRef.current = setTimeout(() => {
            if (gen !== genRef.current) return;
            setTypingSide(null);
            revealOne(i);
            step(i + 1, gen);
          }, typing / speedRef.current);
        } else {
          revealOne(i);
          step(i + 1, gen);
        }
      }, delay / speedRef.current);
    },
    [flow, clear, revealOne]
  );

  const play = useCallback(() => {
    setStatus((s) => {
      if (s === "done") return s; // handled by restart elsewhere
      genRef.current += 1;
      const gen = genRef.current;
      step(idxRef.current, gen);
      return "playing";
    });
  }, [step]);

  const pause = useCallback(() => {
    genRef.current += 1;
    clear();
    setTypingSide(null);
    setStatus("paused");
  }, [clear]);

  const restart = useCallback(() => {
    genRef.current += 1;
    const gen = genRef.current;
    clear();
    idxRef.current = 0;
    setVisible([]);
    setTypingSide(null);
    setStatus("playing");
    timerRef.current = setTimeout(() => step(0, gen), 80);
  }, [clear, step]);

  const skipToEnd = useCallback(() => {
    genRef.current += 1;
    clear();
    setTypingSide(null);
    setVisible(buildFull(flow.messages));
    idxRef.current = flow.messages.length;
    setStatus("done");
  }, [clear, flow]);

  const toggle = useCallback(() => {
    if (status === "playing") pause();
    else if (status === "done") restart();
    else play();
  }, [status, pause, restart, play]);

  // Auto-start once on mount.
  useEffect(() => {
    if (autoPlay) {
      const id = setTimeout(() => play(), 250);
      return () => clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset and restart when the flow changes (e.g. bot switch without remount).
  const prevFlowId = useRef(flow.id);
  useEffect(() => {
    if (flow.id === prevFlowId.current) return;
    prevFlowId.current = flow.id;
    restart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow.id]);

  // Cleanup on unmount.
  useEffect(
    () => () => {
      genRef.current += 1;
      clear();
    },
    [clear]
  );

  const progress = totalBubbles === 0 ? 1 : Math.min(1, visible.length / totalBubbles);

  return {
    visible,
    typingSide,
    status,
    speed,
    setSpeed,
    play,
    pause,
    toggle,
    restart,
    skipToEnd,
    total: totalBubbles,
    progress,
  };
}
