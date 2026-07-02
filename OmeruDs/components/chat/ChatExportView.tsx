"use client";

import React, { forwardRef } from "react";
import { Flow, Sender, inferType, isSystem } from "@/lib/types";
import { RenderedMessage } from "@/lib/usePlayer";
import StatusBar from "../StatusBar";
import ChatHeader from "./ChatHeader";
import { DateChip, SystemNote } from "./Chrome";
import MessageBody from "./MessageBody";
import { ChatContext } from "./ChatContext";

// Fold reaction messages onto the previous bubble, exactly like the player does.
function fold(messages: Flow["messages"]): RenderedMessage[] {
  const out: RenderedMessage[] = [];
  messages.forEach((m, i) => {
    if (inferType(m) === "reaction" && !isSystem(m)) {
      for (let j = out.length - 1; j >= 0; j--) {
        if (!isSystem(out[j])) {
          out[j] = { ...out[j], _reaction: m.reaction };
          break;
        }
      }
      return;
    }
    out.push({ ...m, _key: `x-${i}`, _index: i });
  });
  return out;
}

const ChatExportView = forwardRef<HTMLDivElement, { flow: Flow }>(function ChatExportView(
  { flow },
  ref
) {
  const dark = (flow.theme ?? "dark") === "dark";
  const items = fold(flow.messages);

  const wallpaper = flow.wallpaper;
  const isImg = wallpaper && wallpaper !== "default" && /^https?:\/\//.test(wallpaper);
  const isColor = wallpaper && wallpaper !== "default" && wallpaper.startsWith("#");
  const bodyClass = isImg ? "wa-wallpaper-img" : isColor ? "" : "wa-wallpaper";
  const bodyStyle: React.CSSProperties = isImg
    ? { backgroundImage: `url(${wallpaper})` }
    : isColor
    ? { background: wallpaper }
    : {};

  return (
    <ChatContext.Provider value={{ openListSheet: () => {} }}>
      <div
        ref={ref}
        className="wa-screen"
        data-theme={dark ? "dark" : "light"}
        style={{ width: 402, background: "var(--bg)" }}
      >
        <StatusBar time={flow.phoneTime ?? "20:19"} battery={flow.battery ?? 76} dark={dark} />
        <ChatHeader flow={flow} />
        <div className={bodyClass} style={{ ...bodyStyle, paddingTop: 8, paddingBottom: 16 }}>
          {items.map((m, i) => {
            if (isSystem(m)) {
              const t = inferType(m);
              return t === "date" ? (
                <DateChip key={m._key} text={m.text ?? ""} />
              ) : (
                <SystemNote key={m._key} text={m.text ?? ""} />
              );
            }
            const side: Sender = m.from ?? "bot";
            const prev = items[i - 1];
            const prevSide: Sender | null = prev && !isSystem(prev) ? prev.from ?? "bot" : null;
            const grouped = prevSide === side;
            return (
              <MessageBody key={m._key} m={m} side={side} tail={!grouped} grouped={grouped} noAnim />
            );
          })}
        </div>
      </div>
    </ChatContext.Provider>
  );
});

export default ChatExportView;
