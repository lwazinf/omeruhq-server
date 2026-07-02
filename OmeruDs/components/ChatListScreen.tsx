"use client";

import React from "react";
import { Flow, inferType, isSystem } from "@/lib/types";
import { previewOf } from "@/lib/flows";
import StatusBar from "./StatusBar";
import Avatar from "./chat/Avatar";
import { Search, Dots, Camera, Pencil } from "./chat/Icons";
import Ticks from "./chat/Ticks";

function lastTime(flow: Flow): string {
  for (let i = flow.messages.length - 1; i >= 0; i--) {
    const m = flow.messages[i];
    if (!isSystem(m) && inferType(m) !== "reaction" && m.time) return m.time;
  }
  return "";
}

function lastFromUser(flow: Flow): boolean {
  for (let i = flow.messages.length - 1; i >= 0; i--) {
    const m = flow.messages[i];
    if (!isSystem(m) && inferType(m) !== "reaction") return (m.from ?? "bot") === "user";
  }
  return false;
}

export default function ChatListScreen({
  flows,
  onOpen,
  onNew,
}: {
  flows: Flow[];
  onOpen: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <div className="wa-screen relative flex flex-col h-full w-full overflow-hidden" data-theme="dark">
      <StatusBar time="20:19" battery={76} dark />

      <header className="px-4 pt-1 pb-2" style={{ background: "var(--header)", color: "var(--header-text)" }}>
        <div className="flex items-center justify-between">
          <h1 className="text-[22px] font-bold tracking-tight" style={{ color: "#25d366" }}>
            WhatsApp
          </h1>
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-full hover:bg-white/10 no-tap-highlight" aria-label="Camera">
              <Camera size={22} />
            </button>
            <button className="p-2 rounded-full hover:bg-white/10 no-tap-highlight" aria-label="Search">
              <Search size={21} />
            </button>
            <button className="p-2 rounded-full hover:bg-white/10 no-tap-highlight" aria-label="Menu">
              <Dots size={21} />
            </button>
          </div>
        </div>
      </header>

      <div className="px-3 py-2 shrink-0" style={{ background: "var(--header)" }}>
        <div className="flex items-center gap-3 rounded-full px-4 py-2" style={{ background: "var(--bg)" }}>
          <Search size={18} style={{ color: "var(--text2)" }} />
          <span className="text-[14px]" style={{ color: "var(--text2)" }}>
            Ask Meta AI or Search
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 pb-2 shrink-0" style={{ background: "var(--header)" }}>
        {["All", "Unread", "Bots", "Groups"].map((f, i) => (
          <span
            key={f}
            className="text-[13px] px-3 py-1 rounded-full"
            style={{
              background: i === 0 ? "rgba(0,168,132,0.25)" : "var(--bg)",
              color: i === 0 ? "#25d366" : "var(--text2)",
            }}
          >
            {f}
          </span>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto wa-scroll" style={{ background: "var(--bg)" }}>
        {flows.map((flow) => {
          const fromUser = lastFromUser(flow);
          return (
            <button
              key={flow.id}
              onClick={() => onOpen(flow.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left no-tap-highlight active:bg-white/5"
            >
              <Avatar avatar={flow.avatar} name={flow.name} size={50} />
              <div className="flex-1 min-w-0 border-b py-1" style={{ borderColor: "var(--divider)" }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[16px] font-medium truncate" style={{ color: "var(--text)" }}>
                    {flow.name}
                  </span>
                  <span className="text-[12px] shrink-0" style={{ color: "var(--text2)" }}>
                    {lastTime(flow)}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {fromUser && <Ticks status="read" />}
                  <span className="text-[14px] truncate" style={{ color: "var(--text2)" }}>
                    {previewOf(flow)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
        <div className="text-center text-[12.5px] py-5 flex items-center justify-center gap-1.5" style={{ color: "var(--text2)" }}>
          <svg width="13" height="13" viewBox="0 0 16 16"><rect x="3.5" y="7" width="9" height="6.5" rx="1.5" fill="currentColor"/><path d="M5.2 7V5.2a2.8 2.8 0 0 1 5.6 0V7" stroke="currentColor" strokeWidth="1.4" fill="none"/></svg>
          Your personal messages are end-to-end encrypted
        </div>
      </div>

      <button
        onClick={onNew}
        className="absolute bottom-6 right-5 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg no-tap-highlight"
        style={{ background: "#00a884", color: "#0b141a" }}
        aria-label="New flow"
        title="Create a new conversation flow"
      >
        <Pencil size={24} />
      </button>
    </div>
  );
}
