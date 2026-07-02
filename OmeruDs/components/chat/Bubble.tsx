"use client";

import React from "react";
import { motion } from "framer-motion";
import { DeliveryStatus, Quote, Sender } from "@/lib/types";
import Ticks from "./Ticks";
import { Star, Reply as ReplyIcon } from "./Icons";

export type BubbleVariant = "text" | "media" | "card" | "interactive" | "sticker";

export interface BubbleProps {
  side: Sender;
  variant?: BubbleVariant;
  tail?: boolean;
  grouped?: boolean;
  children: React.ReactNode;
  time?: string;
  status?: DeliveryStatus;
  metaMode?: "inline" | "none";
  quote?: Quote;
  forwarded?: boolean;
  starred?: boolean;
  reaction?: string;
  noAnim?: boolean;
}

export function MetaRow({
  time,
  status,
  starred,
}: {
  time?: string;
  status?: DeliveryStatus;
  starred?: boolean;
}) {
  if (!time && !status && !starred) return null;
  return (
    <span
      className="inline-flex items-center gap-[3px] align-bottom select-none"
      style={{ color: "var(--meta)", fontSize: 11, lineHeight: 1, letterSpacing: 0.1 }}
    >
      {starred && <Star size={11} />}
      {time && <span className="whitespace-nowrap">{time}</span>}
      {status && <Ticks status={status} />}
    </span>
  );
}

const SPRING = { type: "spring" as const, stiffness: 440, damping: 30 };

export default function Bubble({
  side,
  variant = "text",
  tail = true,
  grouped = false,
  children,
  time,
  status,
  metaMode = "inline",
  quote,
  forwarded,
  starred,
  reaction,
  noAnim = false,
}: BubbleProps) {
  const isUser = side === "user";
  const showTail = tail && !grouped;
  const isSticker = variant === "sticker";

  const bgVar = isUser ? "var(--out)" : "var(--in)";

  const maxW =
    variant === "interactive" || variant === "card"
      ? "max-w-[88%]"
      : variant === "media"
      ? "max-w-[75%]"
      : "max-w-[80%]";

  const pad =
    variant === "text"
      ? { paddingLeft: 9, paddingRight: 9, paddingTop: 6, paddingBottom: 7 }
      : variant === "media"
      ? { padding: 3 }
      : {}; // card/interactive handle their own padding

  const radiusClass = isSticker ? "" : "rounded-[7.5px]";

  const metaStatus = isUser ? status : undefined;
  const marginTop = grouped ? 2 : 8;

  return (
    <motion.div
      layout="position"
      initial={noAnim ? false : { opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={noAnim ? { duration: 0 } : SPRING}
      className={`flex px-[6px] ${isUser ? "justify-end" : "justify-start"}`}
      style={{ marginTop }}
    >
      <div className={`relative ${maxW} ${reaction ? "mb-[14px]" : ""}`}>
        {/* Main bubble */}
        <div
          className={`bubble ${showTail ? (isUser ? "tail-out" : "tail-in") : ""} ${radiusClass} overflow-hidden`}
          style={{
            background: isSticker ? "transparent" : bgVar,
            color: "var(--text)",
            boxShadow: isSticker ? "none" : "0 1px 0.5px rgba(11,20,26,0.13)",
            ...pad,
          }}
        >
          {/* Forwarded label */}
          {forwarded && (
            <div
              className="flex items-center gap-1 text-[12px] italic mb-1"
              style={{ color: "var(--meta)" }}
            >
              <ReplyIcon size={13} style={{ transform: "scaleX(-1)" }} />
              Forwarded
            </div>
          )}

          {/* Quote block */}
          {quote && (
            <div className={variant === "text" ? "mb-1" : "mx-[3px] mt-[3px] mb-1"}>
              <div
                className="rounded-[5px] overflow-hidden flex"
                style={{ background: "rgba(0,0,0,0.2)" }}
              >
                <div className="w-[3.5px] shrink-0" style={{ background: quote.color ?? "#06cf9c" }} />
                <div className="px-2 py-[6px] min-w-0">
                  <div className="text-[12.5px] font-semibold truncate" style={{ color: quote.color ?? "#06cf9c" }}>
                    {quote.author}
                  </div>
                  <div
                    className="text-[12.5px] leading-snug line-clamp-2"
                    style={{ color: "var(--meta)", maxHeight: 34, overflow: "hidden" }}
                  >
                    {quote.text}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          {variant === "text" ? (
            <div className="relative text-[14.2px] leading-[19px] break-words whitespace-pre-wrap">
              <span>{children}</span>
              {metaMode === "inline" && (time || metaStatus) && (
                <span
                  className="inline-block"
                  style={{ width: metaStatus ? 56 : 38, height: 1 }}
                  aria-hidden
                />
              )}
              {metaMode === "inline" && (
                <span className="absolute bottom-0 right-0">
                  <MetaRow time={time} status={metaStatus} starred={starred} />
                </span>
              )}
            </div>
          ) : (
            <>{children}</>
          )}

          {/* Footer meta for non-text */}
          {variant !== "text" && metaMode === "inline" && (time || metaStatus) && (
            <div className="flex justify-end px-2 pb-[5px] -mt-[2px]">
              <MetaRow time={time} status={metaStatus} starred={starred} />
            </div>
          )}
        </div>

        {/* Reaction chip */}
        {reaction && (
          <motion.div
            className={`absolute -bottom-[14px] ${isUser ? "left-[6px]" : "right-[6px]"}`}
            style={{ zIndex: 5 }}
            initial={noAnim ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={noAnim ? { duration: 0 } : { type: "spring", stiffness: 600, damping: 18, delay: 0.06 }}
          >
            <div
              className="rounded-full px-[6px] py-[3px] text-[13px] leading-none shadow"
              style={{
                background: "var(--react-bg)",
                border: "1.5px solid var(--bg)",
              }}
            >
              {reaction}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
