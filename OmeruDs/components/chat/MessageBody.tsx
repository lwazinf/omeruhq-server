"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Button,
  ContactData,
  DeliveryStatus,
  DocumentData,
  ListData,
  ListRow,
  PollData,
  Sender,
  VoiceData,
  inferType,
} from "@/lib/types";
import { RenderedMessage } from "@/lib/usePlayer";
import { formatText, isEmojiOnly } from "@/lib/format";
import Bubble, { MetaRow } from "./Bubble";
import Avatar from "./Avatar";
import { useChatUI } from "./ChatContext";
import {
  CheckDouble,
  CheckSingle,
  DocFile,
  Download,
  External,
  ListRows,
  Mic,
  Pause,
  Pin,
  Play,
  Reply,
  UserIcon,
} from "./Icons";

// ─── helpers ────────────────────────────────────────────────────────────────

function normalizeButton(b: Button | string): Button {
  return typeof b === "string" ? { title: b } : b;
}

function seededWaveform(seed: string, n = 30): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    out.push(0.25 + (h % 1000) / 1000 * 0.75);
  }
  return out;
}

function parseDuration(d?: string): number {
  if (!d) return 12;
  const [m, s] = d.split(":").map((x) => parseInt(x, 10));
  if (isNaN(m)) return 12;
  return (m || 0) * 60 + (s || 0);
}

function fmtElapsed(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── overlay timestamp on media ─────────────────────────────────────────────

function OverlayMeta({ time, status }: { time?: string; status?: DeliveryStatus }) {
  if (!time && !status) return null;
  return (
    <div
      className="absolute bottom-[7px] right-[7px] flex items-center gap-1 px-[6px] py-[2px] rounded-full"
      style={{ background: "rgba(0,0,0,0.42)", backdropFilter: "blur(4px)" }}
    >
      {time && <span className="text-[11px] text-white/95 whitespace-nowrap">{time}</span>}
      {status === "read"      && <CheckDouble size={16} style={{ color: "#afecff" }} />}
      {status === "delivered" && <CheckDouble size={16} style={{ color: "rgba(255,255,255,0.8)" }} />}
      {status === "sent"      && <CheckSingle size={15} style={{ color: "rgba(255,255,255,0.8)" }} />}
    </div>
  );
}

// ─── inline text + meta ──────────────────────────────────────────────────────

function TextWithMeta({ text, time, status }: { text: string; time?: string; status?: DeliveryStatus }) {
  return (
    <div className="relative text-[14.2px] leading-[19px] whitespace-pre-wrap break-words">
      <span>{formatText(text)}</span>
      {(time || status) && (
        <span className="inline-block" style={{ width: status ? 56 : 38, height: 1 }} aria-hidden />
      )}
      <span className="absolute bottom-0 right-0">
        <MetaRow time={time} status={status} />
      </span>
    </div>
  );
}

// ─── interactive reply buttons ───────────────────────────────────────────────

function ButtonRows({ buttons, onTap }: { buttons: (Button | string)[]; onTap?: (b: Button) => void }) {
  const [pressed, setPressed] = useState<number | null>(null);

  return (
    <div>
      {buttons.map((raw, i) => {
        const b = normalizeButton(raw);
        const isPressed = pressed === i;
        return (
          <motion.button
            key={b.id ?? i}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setPressed(i);
              onTap?.(b);
              setTimeout(() => setPressed(null), 300);
            }}
            className="wa-btn w-full flex items-center justify-center gap-2 py-[11px] text-[14.5px] font-medium no-tap-highlight"
            style={{
              color: b.selected ? "var(--text2)" : "var(--interactive)",
              borderTop: "1px solid var(--divider)",
              background: isPressed ? "rgba(0,168,132,0.08)" : "transparent",
              transition: "background 0.15s ease",
            }}
          >
            {b.icon ? (
              <span className="text-[15px]">{b.icon}</span>
            ) : (
              <Reply size={15} style={{ color: "var(--interactive)", opacity: 0.8 }} />
            )}
            <span>{b.title}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── image ───────────────────────────────────────────────────────────────────

function ImageContent({ m, status }: { m: RenderedMessage; status?: DeliveryStatus }) {
  const caption = m.text?.trim();
  return (
    <div className="relative">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={m.image}
        alt={caption || "Photo"}
        className="w-full object-cover"
        style={{
          maxHeight: 320,
          minHeight: 120,
          background: "rgba(0,0,0,0.2)",
          borderRadius: caption ? "5px 5px 0 0" : 5,
          display: "block",
        }}
      />
      {caption ? (
        <div className="px-[9px] pt-[6px] pb-[4px]">
          <TextWithMeta text={caption} time={m.time} status={status} />
        </div>
      ) : (
        <OverlayMeta time={m.time} status={status} />
      )}
    </div>
  );
}

// ─── video ───────────────────────────────────────────────────────────────────

function VideoContent({ m, status }: { m: RenderedMessage; status?: DeliveryStatus }) {
  const caption = m.text?.trim();
  const poster = m.poster || m.video;
  return (
    <div className="relative">
      <div
        className="w-full overflow-hidden relative flex items-center justify-center"
        style={{ maxHeight: 320, minHeight: 180, background: "#0c1216", borderRadius: 5 }}
      >
        {poster && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt={caption || "Video"} className="w-full h-full object-cover absolute inset-0" />
        )}
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.58)" }}
        >
          <Play size={26} className="text-white ml-1" />
        </motion.div>
      </div>
      {caption ? (
        <div className="px-[9px] pt-[6px] pb-[4px]">
          <TextWithMeta text={caption} time={m.time} status={status} />
        </div>
      ) : (
        <OverlayMeta time={m.time} status={status} />
      )}
    </div>
  );
}

// ─── voice ───────────────────────────────────────────────────────────────────

function VoiceContent({ m, voice, status, side }: { m: RenderedMessage; voice: VoiceData; status?: DeliveryStatus; side: Sender }) {
  const total = parseDuration(voice.duration);
  const bars = voice.waveform?.length ? voice.waveform : seededWaveform(m._key, 30);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (playing) {
      ref.current = setInterval(() => {
        setT((prev) => {
          if (prev >= total) { setPlaying(false); return 0; }
          return prev + 0.1;
        });
      }, 100);
    }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [playing, total]);

  const progress = total ? t / total : 0;

  return (
    <div className="flex items-center gap-3 px-2 py-[7px] min-w-[220px]">
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={() => setPlaying((p) => !p)}
        className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center no-tap-highlight"
        style={{ background: "var(--accent)", color: "#fff" }}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
      </motion.button>
      <div className="flex-1">
        <div className="relative flex items-end gap-[2.5px] h-8">
          {bars.map((h, i) => {
            const filled = i / bars.length <= progress;
            return (
              <span
                key={i}
                className="wave-bar"
                style={{
                  height: `${5 + h * 22}px`,
                  color: filled ? "var(--accent)" : "var(--text2)",
                  opacity: filled ? 1 : 0.5,
                  transition: "color 0.15s ease",
                }}
              />
            );
          })}
          {/* Playhead dot */}
          <span
            className="absolute rounded-full"
            style={{
              left: `calc(${Math.min(100, progress * 100)}% - 5px)`,
              top: "50%",
              transform: "translateY(-50%)",
              width: 10,
              height: 10,
              background: "var(--accent)",
              transition: "left 0.1s linear",
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px]" style={{ color: "var(--text2)" }}>
            {playing || t > 0 ? fmtElapsed(t) : voice.duration ?? fmtElapsed(total)}
          </span>
          <MetaRow time={m.time} status={status} />
        </div>
      </div>
      <div className="relative shrink-0">
        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--text2)", opacity: 0.4 }}>
          <UserIcon size={20} style={{ color: "var(--text)" }} />
        </div>
        <Mic size={14} className="absolute -bottom-0.5 -right-0.5" style={{ color: "var(--accent)" }} />
      </div>
    </div>
  );
}

// ─── document ────────────────────────────────────────────────────────────────

function DocumentContent({ doc, m, status }: { doc: DocumentData; m: RenderedMessage; status?: DeliveryStatus }) {
  const ext = (doc.ext ?? doc.name.split(".").pop() ?? "FILE").toUpperCase();
  const tint = ext === "PDF" ? "#e15f6e" : ext === "DOCX" || ext === "DOC" ? "#5aa7ff" : "#8696a0";
  const sub = [doc.size, doc.pages].filter(Boolean).join(" · ");

  return (
    <div className="px-2 pt-[7px] pb-[3px]">
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-3 rounded-[9px] px-3 py-[9px] no-tap-highlight"
        style={{ background: "rgba(0,0,0,0.18)", cursor: "pointer" }}
      >
        {/* Doc icon */}
        <div
          className="shrink-0 w-10 h-[46px] rounded-[6px] flex flex-col items-center justify-center"
          style={{ background: tint + "22", color: tint }}
        >
          <DocFile size={22} />
          <span className="text-[8px] font-bold mt-0.5 tracking-wide">{ext}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-medium leading-snug break-words line-clamp-2" style={{ color: "var(--text)" }}>
            {doc.name}
          </div>
          {sub && (
            <div className="text-[12px] mt-[2px]" style={{ color: "var(--text2)" }}>
              {sub}
            </div>
          )}
        </div>
        <motion.div whileTap={{ scale: 0.88 }} className="shrink-0" style={{ color: "var(--text2)" }}>
          <Download size={20} />
        </motion.div>
      </motion.div>
      <div className="flex justify-end px-1 pt-[4px] pb-[3px]">
        <MetaRow time={m.time} status={status} />
      </div>
    </div>
  );
}

// ─── map preview ─────────────────────────────────────────────────────────────

function MapPreview({ src }: { src?: string }) {
  if (src) return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="Map" className="w-full h-[150px] object-cover rounded-[5px]" />
  );
  return (
    <div
      className="relative w-full h-[150px] rounded-[5px] overflow-hidden"
      style={{ background: "linear-gradient(135deg,#1f3a36 0%,#24414b 45%,#2b3b46 100%)" }}
    >
      <div className="absolute inset-0 opacity-25">
        <div className="absolute left-0 right-0 top-[38%] h-[3px] bg-white/40 -rotate-6" />
        <div className="absolute left-0 right-0 top-[64%] h-[2px] bg-white/25 rotate-3" />
        <div className="absolute top-0 bottom-0 left-[30%] w-[3px] bg-white/30 rotate-2" />
        <div className="absolute top-0 bottom-0 left-[68%] w-[2px] bg-white/20 -rotate-3" />
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full" style={{ color: "#ea4335" }}>
        <Pin size={34} />
      </div>
    </div>
  );
}

// ─── poll ────────────────────────────────────────────────────────────────────

function PollContent({ poll, m, status }: { poll: PollData; m: RenderedMessage; status?: DeliveryStatus }) {
  const [votes, setVotes] = useState<number[]>(poll.options.map((o) => o.votes ?? 0));
  const [mine, setMine] = useState<Set<number>>(new Set());
  const total = votes.reduce((a, b) => a + b, 0);

  const toggle = (i: number) => {
    const nextMine = new Set(mine);
    const nextVotes = [...votes];
    if (mine.has(i)) {
      nextMine.delete(i);
      nextVotes[i] = Math.max(0, nextVotes[i] - 1);
    } else {
      if (!poll.multiple) {
        mine.forEach((j) => { nextVotes[j] = Math.max(0, nextVotes[j] - 1); });
        nextMine.clear();
      }
      nextMine.add(i);
      nextVotes[i] = nextVotes[i] + 1;
    }
    setMine(nextMine);
    setVotes(nextVotes);
  };

  return (
    <div className="px-3 pt-[10px] pb-[7px] min-w-[250px]">
      <div className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>{poll.question}</div>
      <div className="text-[12px] mt-0.5 mb-3" style={{ color: "var(--text2)" }}>
        {poll.multiple ? "Select one or more" : "Select one"} · {total} vote{total === 1 ? "" : "s"}
      </div>
      <div className="space-y-[10px]">
        {poll.options.map((opt, i) => {
          const pct = total ? Math.round((votes[i] / total) * 100) : 0;
          const chosen = mine.has(i);
          return (
            <motion.button key={i} whileTap={{ scale: 0.98 }} onClick={() => toggle(i)} className="w-full text-left no-tap-highlight">
              <div className="flex items-center gap-3">
                <span
                  className="shrink-0 rounded-full flex items-center justify-center transition-all duration-150"
                  style={{
                    width: 20, height: 20,
                    border: `2px solid ${chosen ? "var(--accent)" : "var(--text2)"}`,
                    background: chosen ? "var(--accent)" : "transparent",
                  }}
                >
                  {chosen && (
                    <svg width="11" height="11" viewBox="0 0 11 11">
                      <path d="M1.5 5.5l2.5 2.5L9.5 2" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="flex-1 text-[14px]" style={{ color: "var(--text)" }}>{opt.text}</span>
                <span className="text-[12px] font-medium" style={{ color: "var(--text2)" }}>{pct}%</span>
              </div>
              <div className="ml-[31px] mt-[5px] h-[3px] rounded-full overflow-hidden" style={{ background: "var(--divider)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "var(--accent)" }}
                  animate={{ width: `${pct}%` }}
                  transition={{ type: "spring", stiffness: 220, damping: 28 }}
                />
              </div>
            </motion.button>
          );
        })}
      </div>
      <div className="flex justify-end mt-3 pt-2" style={{ borderTop: "1px solid var(--divider)" }}>
        <MetaRow time={m.time} status={status} />
      </div>
    </div>
  );
}

// ─── main dispatcher ─────────────────────────────────────────────────────────

export default function MessageBody({
  m,
  side,
  tail,
  grouped,
  noAnim = false,
}: {
  m: RenderedMessage;
  side: Sender;
  tail: boolean;
  grouped: boolean;
  noAnim?: boolean;
}) {
  const { openListSheet } = useChatUI();
  const [pickedRow, setPickedRow] = useState<string | null>(null);
  const type = inferType(m);
  const metaStatus = side === "user" ? m.status : undefined;

  const common = { side, tail, grouped, noAnim, quote: m.quote, forwarded: m.forwarded, starred: m.starred, reaction: m._reaction };

  // ── emoji-only text ──
  if (type === "text") {
    const text = m.text ?? "";
    if (isEmojiOnly(text)) {
      return (
        <Bubble {...common} variant="sticker" metaMode="none">
          <div className="flex flex-col items-end px-1">
            <div className="text-[48px] leading-tight select-none">{text}</div>
            <div className="mt-1">
              <MetaRow time={m.time} status={metaStatus} />
            </div>
          </div>
        </Bubble>
      );
    }
    return (
      <Bubble {...common} variant="text" time={m.time} status={metaStatus} metaMode="inline">
        {formatText(text)}
      </Bubble>
    );
  }

  // ── image ──
  if (type === "image") {
    return (
      <Bubble {...common} variant="media" metaMode="none">
        <ImageContent m={m} status={metaStatus} />
      </Bubble>
    );
  }

  // ── video ──
  if (type === "video") {
    return (
      <Bubble {...common} variant="media" metaMode="none">
        <VideoContent m={m} status={metaStatus} />
      </Bubble>
    );
  }

  // ── voice / audio ──
  if (type === "voice" || type === "audio") {
    const v: VoiceData =
      typeof m.voice === "string" ? { duration: m.voice }
      : typeof m.audio === "string" ? { duration: m.audio }
      : (m.voice as VoiceData) ?? (m.audio as VoiceData) ?? {};
    return (
      <Bubble {...common} variant="card" metaMode="none">
        <VoiceContent m={m} voice={v} status={metaStatus} side={common.side} />
      </Bubble>
    );
  }

  // ── document ──
  if (type === "document" && m.document) {
    return (
      <Bubble {...common} variant="card" metaMode="none">
        <DocumentContent doc={m.document} m={m} status={metaStatus} />
      </Bubble>
    );
  }

  // ── sticker ──
  if (type === "sticker") {
    return (
      <Bubble {...common} variant="sticker" metaMode="none">
        <div className="flex flex-col items-end">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.sticker} alt="Sticker" style={{ width: 120, height: 120, objectFit: "contain" }} />
          <div className="mt-1 pr-0.5">
            <MetaRow time={m.time} status={metaStatus} />
          </div>
        </div>
      </Bubble>
    );
  }

  // ── reply buttons ──
  if (type === "buttons" && m.buttons) {
    return (
      <Bubble {...common} variant="interactive" metaMode="none">
        {m.text && (
          <div className="px-[9px] pt-[8px] pb-[6px]">
            <TextWithMeta text={m.text} time={m.time} status={metaStatus} />
          </div>
        )}
        <ButtonRows buttons={m.buttons} />
      </Bubble>
    );
  }

  // ── list (interactive menu) ──
  if (type === "list" && m.list) {
    const list: ListData = m.list;
    return (
      <Bubble {...common} variant="interactive" metaMode="none">
        <div className="px-[9px] pt-[8px] pb-[6px]">
          {list.header && (
            <div className="text-[15px] font-semibold leading-tight mb-[3px]" style={{ color: "var(--text)" }}>
              {list.header}
            </div>
          )}
          {list.body && (
            <div className="text-[14.2px] leading-[19px] whitespace-pre-wrap" style={{ color: "var(--text)" }}>
              {formatText(list.body)}
            </div>
          )}
          <div className="flex items-end justify-between mt-[5px] gap-2">
            {list.footer ? (
              <div className="text-[12px] leading-snug" style={{ color: "var(--text2)" }}>
                {list.footer}
              </div>
            ) : <span />}
            <MetaRow time={m.time} status={metaStatus} />
          </div>
          {pickedRow && (
            <div className="text-[12.5px] mt-1.5 font-medium" style={{ color: "var(--accent)" }}>
              ✓ {pickedRow}
            </div>
          )}
        </div>
        {/* List open button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => openListSheet(list, (row: ListRow) => setPickedRow(row.title))}
          className="wa-btn w-full flex items-center justify-center gap-[7px] py-[11px] text-[14.5px] font-medium no-tap-highlight"
          style={{ color: "var(--interactive)", borderTop: "1px solid var(--divider)" }}
        >
          <ListRows size={18} />
          <span>{list.button}</span>
        </motion.button>
      </Bubble>
    );
  }

  // ── poll ──
  if (type === "poll" && m.poll) {
    return (
      <Bubble {...common} variant="card" metaMode="none">
        <PollContent poll={m.poll} m={m} status={metaStatus} />
      </Bubble>
    );
  }

  // ── location ──
  if (type === "location" && m.location) {
    const loc = m.location;
    return (
      <Bubble {...common} variant="media" metaMode="none">
        <MapPreview src={loc.map} />
        <div className="px-[9px] py-[6px]">
          {loc.name && <div className="text-[14px] font-semibold" style={{ color: "var(--text)" }}>{loc.name}</div>}
          {loc.address && <div className="text-[12.5px] mt-[2px]" style={{ color: "var(--text2)" }}>{loc.address}</div>}
          {m.text && <div className="text-[13.5px] mt-1" style={{ color: "var(--text)" }}>{formatText(m.text)}</div>}
          <div className="flex justify-end mt-1">
            <MetaRow time={m.time} status={metaStatus} />
          </div>
        </div>
      </Bubble>
    );
  }

  // ── contact ──
  if (type === "contact" && m.contact) {
    const c: ContactData = m.contact;
    return (
      <Bubble {...common} variant="card" metaMode="none">
        <div className="px-[9px] pt-[9px] pb-[5px] min-w-[230px]">
          <div className="flex items-center gap-3">
            <Avatar avatar={{ initials: undefined, image: c.avatar }} name={c.name} size={44} />
            <div className="min-w-0">
              <div className="text-[15px] font-semibold truncate" style={{ color: "var(--text)" }}>{c.name}</div>
              {(c.org || c.phone) && <div className="text-[12.5px] truncate mt-[1px]" style={{ color: "var(--text2)" }}>{c.org ?? c.phone}</div>}
            </div>
          </div>
          <div className="flex justify-end mt-2">
            <MetaRow time={m.time} status={metaStatus} />
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.98 }}
          className="wa-btn w-full py-[11px] text-[14.5px] font-medium no-tap-highlight"
          style={{ color: "var(--interactive)", borderTop: "1px solid var(--divider)" }}
        >
          Message
        </motion.button>
      </Bubble>
    );
  }

  // ── CTA url button ──
  if (type === "cta" && m.cta) {
    const cta = m.cta;
    return (
      <Bubble {...common} variant="interactive" metaMode="none">
        <div className="px-[9px] pt-[8px] pb-[6px]">
          {cta.header && (
            <div className="text-[15px] font-semibold mb-[3px]" style={{ color: "var(--text)" }}>{cta.header}</div>
          )}
          {cta.text && (
            <div className="text-[14.2px] leading-[19px] whitespace-pre-wrap" style={{ color: "var(--text)" }}>
              {formatText(cta.text)}
            </div>
          )}
          <div className="flex justify-end mt-[5px]">
            <MetaRow time={m.time} status={metaStatus} />
          </div>
        </div>
        <motion.a
          whileTap={{ scale: 0.98 }}
          href={cta.url}
          target="_blank"
          rel="noopener noreferrer"
          className="wa-btn w-full flex items-center justify-center gap-[7px] py-[11px] text-[14.5px] font-medium no-tap-highlight"
          style={{ color: "var(--interactive)", borderTop: "1px solid var(--divider)", display: "flex" }}
        >
          <External size={17} />
          <span>{cta.display}</span>
        </motion.a>
      </Bubble>
    );
  }

  // ── rich card / template ──
  if (type === "card" && m.card) {
    const card = m.card;
    return (
      <Bubble {...common} variant="card" metaMode="none">
        {card.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.image}
            alt={card.title || "Card"}
            className="w-full object-cover"
            style={{ maxHeight: 190, display: "block" }}
          />
        )}
        <div className="px-[9px] pt-[8px] pb-[4px]">
          {card.title && (
            <div className="text-[15px] font-semibold leading-tight" style={{ color: "var(--text)" }}>{card.title}</div>
          )}
          {card.subtitle && (
            <div className="text-[12.5px] mt-[2px]" style={{ color: "var(--text2)" }}>{card.subtitle}</div>
          )}
          {card.body && (
            <div className="text-[13.5px] mt-[7px] whitespace-pre-wrap leading-[18px]" style={{ color: "var(--text)" }}>
              {formatText(card.body)}
            </div>
          )}
          <div className="flex justify-end mt-[5px]">
            <MetaRow time={m.time} status={metaStatus} />
          </div>
        </div>
        {card.buttons && card.buttons.length > 0 && <ButtonRows buttons={card.buttons} />}
      </Bubble>
    );
  }

  // ── product ──
  if (type === "product" && m.product) {
    const p = m.product;
    return (
      <Bubble {...common} variant="card" metaMode="none">
        {p.image && (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image} alt={p.name} className="w-full object-cover" style={{ maxHeight: 210, display: "block" }} />
            <div
              className="absolute top-2 left-2 flex items-center gap-1 px-[7px] py-[3px] rounded-full text-[11px] font-medium"
              style={{ background: "rgba(0,0,0,0.52)", backdropFilter: "blur(4px)", color: "#fff" }}
            >
              🛍️ Product
            </div>
          </div>
        )}
        <div className="px-[9px] pt-[8px] pb-[4px]">
          <div className="text-[15px] font-semibold leading-tight" style={{ color: "var(--text)" }}>{p.name}</div>
          {p.price && (
            <div className="text-[16px] font-bold mt-[3px]" style={{ color: "var(--text)" }}>{p.price}</div>
          )}
          {p.description && (
            <div className="text-[13px] mt-[5px] leading-snug" style={{ color: "var(--text2)" }}>
              {formatText(p.description)}
            </div>
          )}
          <div className="flex justify-end mt-[6px]">
            <MetaRow time={m.time} status={metaStatus} />
          </div>
        </div>
        {p.catalog && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            className="wa-btn w-full py-[11px] text-[14.5px] font-medium no-tap-highlight"
            style={{ color: "var(--interactive)", borderTop: "1px solid var(--divider)" }}
          >
            {p.catalog}
          </motion.button>
        )}
      </Bubble>
    );
  }

  // ── fallback ──
  return (
    <Bubble {...common} variant="text" time={m.time} status={m.status}>
      {formatText(m.text ?? "[unsupported]")}
    </Bubble>
  );
}
