"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Flow } from "@/lib/types";
import { track } from "@/lib/analytics";

interface InteractiveChatProps {
  flow: Flow;
  botDescription: string;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  from: "user" | "bot";
  text: string;
  time: string;
  typing?: boolean;
}

function now(): string {
  const d = new Date();
  return `${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export default function InteractiveChat({ flow, botDescription, onClose }: InteractiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      from: "bot",
      text: `Welcome to *${flow.name}*! 👋 How can I help you today?`,
      time: now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    track("interactive_started", { flowId: flow.id, flowName: flow.name });
  }, [flow.id, flow.name]);

  const generateResponse = useCallback(async (userMessage: string): Promise<string> => {
    // Try API first, fall back to local heuristics
    try {
      const res = await fetch("/api/interactive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: flow.name,
          botDescription,
          userMessage,
          history: messages.slice(-10).map((m) => ({ role: m.from, content: m.text })),
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        const data = await res.json();
        return data.reply;
      }
    } catch { /* fall through to local */ }

    // Local heuristic responses based on keywords
    const lower = userMessage.toLowerCase();

    if (/\b(hi|hello|hey|howzit|morning|afternoon|evening)\b/.test(lower)) {
      return `Howzit! 👋 Welcome to ${flow.name}. I'm here to help. What are you looking for today?`;
    }
    if (/\b(menu|products?|services?|options?|what do you|what.*offer|catalogue|catalog)\b/.test(lower)) {
      return `Great question! We've got a range of options for you. Let me pull up our top picks — one moment! 📋`;
    }
    if (/\b(book|appointment|schedule|reserve|slot)\b/.test(lower)) {
      return `I'd love to help you book! 📅 When works best for you? We have slots available this week.`;
    }
    if (/\b(price|cost|how much|rate|fee|charge|expensive|cheap|afford)\b/.test(lower)) {
      return `Good question! Our prices are competitive. I can send you a detailed breakdown — would you like that?`;
    }
    if (/\b(location|where|address|directions|find you|map|office)\b/.test(lower)) {
      return `We're based in South Africa — I can share our exact location and directions. Want me to send a pin? 📍`;
    }
    if (/\b(hours?|open|close|when|time|available)\b/.test(lower)) {
      return `We're open Mon–Fri 8am–5pm, and Saturdays 9am–1pm. Closed on Sundays and public holidays.`;
    }
    if (/\b(help|support|problem|issue|complaint|wrong|broken)\b/.test(lower)) {
      return `I'm sorry to hear that! Let me connect you with our team right away. Could you describe the issue briefly?`;
    }
    if (/\b(thank|thanks|cheers|appreciate|great|perfect|awesome|wonderful|brilliant)\b/.test(lower)) {
      return `Pleasure! 🙌 Is there anything else I can help you with today?`;
    }
    if (/\b(bye|goodbye|later|done|that'?s all|no thanks)\b/.test(lower)) {
      return `Thanks for chatting with us! Have a lekker day! 🇿🇦 Feel free to message anytime.`;
    }
    if (/\b(order|buy|purchase|checkout|cart|pay|payment)\b/.test(lower)) {
      return `Let's get your order sorted! 🛒 I'll prepare everything. Shall I send you a payment link?`;
    }
    if (/\b(delivery|ship|courier|collect|pickup)\b/.test(lower)) {
      return `We offer delivery across major SA cities and collection from our premises. Which would you prefer?`;
    }
    if (/\b(whatsapp|bot|automation|ai|agent)\b/.test(lower)) {
      return `Great question! This bot is designed to ${botDescription || "help customers like you get answers fast"}. Pretty neat, right? 🤖`;
    }

    return `That's a great question! Let me look into that for you. In the meantime, is there anything specific about ${flow.name} I can help with?`;
  }, [flow.name, botDescription, messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMessage = { id: `u_${Date.now()}`, from: "user", text, time: now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    track("interactive_message", { flowId: flow.id, direction: "user" });

    // Simulate typing delay
    const delay = Math.min(2000, 800 + text.length * 20);
    await new Promise((r) => setTimeout(r, delay));

    const reply = await generateResponse(text);
    const botMsg: ChatMessage = { id: `b_${Date.now()}`, from: "bot", text: reply, time: now() };
    setMessages((prev) => [...prev, botMsg]);
    setIsTyping(false);

    track("interactive_message", { flowId: flow.id, direction: "bot" });
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-md h-[600px] max-h-[85vh] rounded-2xl overflow-hidden flex flex-col" style={{ background: "#0b141a", border: "1px solid rgba(255,255,255,0.1)" }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ background: "#202c33" }}>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold" style={{ background: flow.avatar?.color || "#00a884" }}>
            {flow.avatar?.initials || flow.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-[15px] font-medium truncate">{flow.name}</div>
            <div className="text-[12px] text-[#8696a0]">
              {isTyping ? "typing..." : "Interactive mode"}
            </div>
          </div>
          <div className="px-2 py-1 rounded-full text-[11px] font-semibold" style={{ background: "rgba(0,168,132,0.2)", color: "#7ff0cf" }}>
            LIVE
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto wa-scroll px-3 py-3 space-y-1.5" style={{ background: "var(--bg, #0b141a)" }}>
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[80%] rounded-xl px-3 py-2 text-[14px] leading-relaxed"
                style={{
                  background: msg.from === "user" ? "#005c4b" : "#202c33",
                  color: "#e9edef",
                }}
              >
                <div style={{ whiteSpace: "pre-wrap" }}>
                  {msg.text.split(/(\*[^*]+\*)/).map((part, i) =>
                    part.startsWith("*") && part.endsWith("*")
                      ? <strong key={i}>{part.slice(1, -1)}</strong>
                      : part
                  )}
                </div>
                <div className="text-[11px] text-right mt-0.5" style={{ color: "rgba(233,237,239,0.5)" }}>
                  {msg.time}
                  {msg.from === "user" && <span className="ml-1 text-[#53bdeb]">&#10003;&#10003;</span>}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="rounded-xl px-4 py-3 flex gap-1" style={{ background: "#202c33" }}>
                <span className="typing-dot animate-typing-1" />
                <span className="typing-dot animate-typing-2" />
                <span className="typing-dot animate-typing-3" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 px-3 py-2.5 shrink-0" style={{ background: "#202c33" }}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Type a message..."
            className="flex-1 bg-[#2a3942] rounded-full px-4 py-2 text-[14px] text-white outline-none placeholder:text-white/30"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-40 transition"
            style={{ background: "#00a884" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0b141a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
