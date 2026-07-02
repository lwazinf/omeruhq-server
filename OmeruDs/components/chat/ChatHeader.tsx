import React from "react";
import { Flow } from "@/lib/types";
import Avatar from "./Avatar";
import { ArrowLeft, VideoCam, Phone, Dots } from "./Icons";

export default function ChatHeader({
  flow,
  onBack,
  typing,
}: {
  flow: Flow;
  onBack?: () => void;
  typing?: boolean;
}) {
  const sub = typing ? "typing…" : flow.subtitle ?? "online";
  const subColor = typing ? "#00a884" : "rgba(233,237,239,0.65)";

  return (
    <header
      className="flex items-center shrink-0 z-20"
      style={{
        background: "var(--header)",
        color: "var(--header-text)",
        height: 56,
        paddingLeft: 4,
        paddingRight: 6,
        gap: 4,
      }}
    >
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center justify-center no-tap-highlight"
        style={{ width: 36, height: 36, borderRadius: "50%", color: "var(--header-text)", flexShrink: 0 }}
        aria-label="Back"
      >
        <ArrowLeft size={22} />
      </button>

      {/* Avatar */}
      <Avatar avatar={flow.avatar} name={flow.name} size={40} />

      {/* Name + status */}
      <div className="min-w-0 flex-1 ml-[10px]" style={{ lineHeight: 1.25 }}>
        <div className="flex items-center gap-1">
          <span
            className="truncate"
            style={{ fontSize: 16, fontWeight: 500, color: "var(--header-text)" }}
          >
            {flow.name}
          </span>
          {flow.verified && (
            <svg width="15" height="15" viewBox="0 0 24 24" className="shrink-0" aria-label="Verified">
              <path
                d="M12 2l2.4 1.8 3 .2.9 2.9 2.3 1.9-1 2.8 1 2.8-2.3 1.9-.9 2.9-3 .2L12 22l-2.4-1.8-3-.2-.9-2.9L3.4 15l1-2.8-1-2.8 2.3-1.9.9-2.9 3-.2L12 2z"
                fill="#25d366"
              />
              <path
                d="M8.5 12.2l2.3 2.3 4.7-4.9"
                stroke="#0b141a"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        <div className="truncate" style={{ fontSize: 13, color: subColor, transition: "color 0.2s" }}>
          {sub}
        </div>
      </div>

      {/* Action icons */}
      <button
        className="flex items-center justify-center no-tap-highlight"
        style={{ width: 40, height: 40, borderRadius: "50%", color: "var(--header-text)", flexShrink: 0 }}
        aria-label="Video call"
      >
        <VideoCam size={22} />
      </button>
      <button
        className="flex items-center justify-center no-tap-highlight"
        style={{ width: 40, height: 40, borderRadius: "50%", color: "var(--header-text)", flexShrink: 0 }}
        aria-label="Voice call"
      >
        <Phone size={20} />
      </button>
      <button
        className="flex items-center justify-center no-tap-highlight"
        style={{ width: 40, height: 40, borderRadius: "50%", color: "var(--header-text)", flexShrink: 0 }}
        aria-label="Menu"
      >
        <Dots size={22} />
      </button>
    </header>
  );
}
