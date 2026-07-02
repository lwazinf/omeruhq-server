"use client";

import React, { useState } from "react";
import { Smiley, Paperclip, Camera, Mic, Send, Plus } from "./Icons";

export default function ChatInput({
  onSend,
}: {
  onSend?: (text: string) => void;
}) {
  const [value, setValue] = useState("");
  const hasText = value.trim().length > 0;

  const submit = () => {
    if (!hasText) return;
    onSend?.(value.trim());
    setValue("");
  };

  return (
    <div
      className="flex items-end gap-2 px-2 py-[6px] shrink-0"
      style={{ background: "var(--bg)" }}
    >
      {/* Compose field */}
      <div
        className="flex items-end flex-1 gap-0 rounded-[24px] overflow-hidden"
        style={{ background: "var(--input)", minHeight: 46 }}
      >
        {/* Emoji */}
        <button
          className="flex items-center justify-center no-tap-highlight"
          style={{ width: 44, height: 46, color: "var(--text2)", flexShrink: 0 }}
          aria-label="Emoji"
        >
          <Smiley size={24} />
        </button>

        {/* Text field */}
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder="Message"
          className="flex-1 bg-transparent outline-none"
          style={{
            fontSize: 15,
            color: "var(--text)",
            paddingTop: 12,
            paddingBottom: 12,
            caretColor: "var(--accent)",
          }}
        />

        {/* Attach */}
        {!hasText && (
          <button
            className="flex items-center justify-center no-tap-highlight"
            style={{ width: 40, height: 46, color: "var(--text2)", flexShrink: 0 }}
            aria-label="Attach"
          >
            <Paperclip size={22} />
          </button>
        )}
        {/* Camera — only when no text */}
        {!hasText && (
          <button
            className="flex items-center justify-center no-tap-highlight"
            style={{ width: 40, height: 46, color: "var(--text2)", flexShrink: 0 }}
            aria-label="Camera"
          >
            <Camera size={22} />
          </button>
        )}
      </div>

      {/* Mic / Send circle */}
      <button
        onClick={submit}
        className="shrink-0 flex items-center justify-center no-tap-highlight"
        style={{
          width: 46,
          height: 46,
          borderRadius: "50%",
          background: "var(--accent)",
          color: "#fff",
          flexShrink: 0,
        }}
        aria-label={hasText ? "Send" : "Voice message"}
      >
        {hasText ? <Send size={20} /> : <Mic size={22} />}
      </button>
    </div>
  );
}

export { Plus };
