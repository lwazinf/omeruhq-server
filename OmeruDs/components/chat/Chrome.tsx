import React from "react";
import { Lock } from "./Icons";

export function DateChip({ text }: { text: string }) {
  return (
    <div className="flex justify-center my-2">
      <span
        style={{
          fontSize: 12.5,
          padding: "5px 12px",
          borderRadius: 7.5,
          background: "var(--chip)",
          color: "var(--chip-text)",
          boxShadow: "0 1px 0.5px rgba(11,20,26,0.13)",
          letterSpacing: 0.1,
        }}
      >
        {text}
      </span>
    </div>
  );
}

export function SystemNote({ text }: { text: string }) {
  return (
    <div className="flex justify-center my-2 px-8">
      <span
        className="text-center leading-snug flex items-start gap-1.5 max-w-[88%]"
        style={{
          fontSize: 12,
          padding: "7px 12px",
          borderRadius: 7.5,
          background: "var(--chip)",
          color: "var(--chip-text)",
          boxShadow: "0 1px 0.5px rgba(11,20,26,0.13)",
        }}
      >
        <Lock size={12} className="shrink-0 mt-[1px] opacity-70" />
        <span>{text}</span>
      </span>
    </div>
  );
}
