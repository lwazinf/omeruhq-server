"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Flow } from "@/lib/types";
import { getFlow } from "@/lib/flows";
import { usePlayer } from "@/lib/usePlayer";
import { exportNodeToPng, safeFileName } from "@/lib/capture";
import { track } from "@/lib/analytics";
import PhoneFrame from "@/components/PhoneFrame";
import ChatScreen from "@/components/chat/ChatScreen";
import ChatExportView from "@/components/chat/ChatExportView";
import PlayerControls from "@/components/PlayerControls";
import ShareDemo from "@/components/ShareDemo";
import VideoDownload from "@/components/VideoDownload";
import BookCall from "@/components/BookCall";
import InteractiveChat from "@/components/InteractiveChat";
import { ArrowLeft, Pencil, Camera, DocFile } from "@/components/chat/Icons";

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [flow, setFlow] = useState<Flow | null | undefined>(undefined);

  useEffect(() => {
    const id = decodeURIComponent(params.id);
    setFlow(getFlow(id) ?? null);
    track("page_view", { page: "chat", flowId: id });
  }, [params.id]);

  if (flow === undefined) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center text-white/60" style={{ background: "#0a0f14" }}>
        Loading…
      </main>
    );
  }

  if (flow === null) {
    return (
      <main className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 text-white/70 px-6 text-center" style={{ background: "#0a0f14" }}>
        <p className="text-lg">That conversation flow doesn't exist.</p>
        <button onClick={() => router.push("/")} className="px-4 py-2 rounded-lg font-medium text-[#0b141a]" style={{ background: "#00a884" }}>
          Back to chats
        </button>
      </main>
    );
  }

  return <ChatStage flow={flow} />;
}

function ChatStage({ flow }: { flow: Flow }) {
  const router = useRouter();
  const player = usePlayer(flow, true);
  const phoneWrapRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<null | "shot" | "full">(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showInteractive, setShowInteractive] = useState(false);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const shoot = async () => {
    if (busy) return;
    setBusy("shot");
    try {
      const node = phoneWrapRef.current?.querySelector(".wa-screen") as HTMLElement | null;
      await exportNodeToPng(node, safeFileName(flow.name, "screenshot"));
      flash("Screenshot saved");
      track("screenshot_taken", { flowId: flow.id });
    } catch {
      flash("Couldn't save the screenshot");
    } finally {
      setBusy(null);
    }
  };

  const fullChat = async () => {
    if (busy) return;
    setBusy("full");
    try {
      await exportNodeToPng(exportRef.current, safeFileName(flow.name, "full-chat"));
      flash("Full conversation saved");
      track("full_chat_exported", { flowId: flow.id });
    } catch {
      flash("Couldn't save the conversation");
    } finally {
      setBusy(null);
    }
  };

  return (
    <main
      className="min-h-[100dvh] w-full md:flex md:flex-col md:items-center md:justify-center md:py-8 md:gap-5"
      style={{
        background:
          "radial-gradient(1100px 600px at 50% -10%, rgba(0,168,132,0.12), transparent 60%), #0a0f14",
      }}
    >
      {/* desktop top actions */}
      <div className="hidden md:flex items-center gap-2 text-white/80">
        <button onClick={() => router.push("/")} className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/10 text-[14px]">
          <ArrowLeft size={18} /> Chats
        </button>
        <span className="text-white/30">/</span>
        <span className="text-white/90 font-medium mr-2">{flow.name}</span>
        <button onClick={shoot} disabled={!!busy} className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/10 text-[14px] disabled:opacity-50">
          <Camera size={16} /> {busy === "shot" ? "Saving…" : "Screenshot"}
        </button>
        <button onClick={fullChat} disabled={!!busy} className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/10 text-[14px] disabled:opacity-50">
          <DocFile size={16} /> {busy === "full" ? "Saving…" : "Full chat"}
        </button>
        <VideoDownload targetRef={phoneWrapRef} fileName={safeFileName(flow.name, "demo")} compact />
        <ShareDemo flow={flow} compact />
        <button
          onClick={() => setShowInteractive(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/10 text-[14px] text-[#7ff0cf]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          Try Live
        </button>
        <button onClick={() => router.push(`/builder?id=${encodeURIComponent(flow.id)}`)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/10 text-[14px]">
          <Pencil size={16} /> Edit flow
        </button>
        <BookCall businessName={flow.name} compact />
      </div>

      <div ref={phoneWrapRef} className="relative h-[100dvh] md:h-auto">
        <PhoneFrame>
          <ChatScreen flow={flow} player={player} onBack={() => router.push("/")} />
        </PhoneFrame>

        {/* mobile floating controls */}
        <div className="md:hidden fixed left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2" style={{ bottom: 84 }}>
          <div className="flex items-center gap-2">
            <button onClick={shoot} disabled={!!busy} className="flex items-center gap-1.5 px-3 py-2 rounded-full text-white/90 text-[13px] disabled:opacity-50" style={{ background: "rgba(20,26,31,0.92)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Camera size={15} /> {busy === "shot" ? "…" : "Shot"}
            </button>
            <button onClick={fullChat} disabled={!!busy} className="flex items-center gap-1.5 px-3 py-2 rounded-full text-white/90 text-[13px] disabled:opacity-50" style={{ background: "rgba(20,26,31,0.92)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <DocFile size={15} /> {busy === "full" ? "…" : "Full chat"}
            </button>
            <button
              onClick={() => setShowInteractive(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px]"
              style={{ background: "rgba(0,168,132,0.2)", border: "1px solid rgba(0,168,132,0.3)", color: "#7ff0cf" }}
            >
              Try Live
            </button>
          </div>
          <PlayerControls player={player} compact />
        </div>
      </div>

      {/* desktop controls + CTA below phone */}
      <div className="hidden md:flex md:flex-col md:items-center gap-4 w-[402px]">
        <PlayerControls player={player} />
        <div className="w-full flex gap-2">
          <div className="flex-1">
            <ShareDemo flow={flow} />
          </div>
          <div className="flex-1">
            <BookCall businessName={flow.name} compact />
          </div>
        </div>
      </div>

      {/* offscreen full-conversation view used for the "Full chat" export */}
      <div aria-hidden style={{ position: "fixed", left: -100000, top: 0, zIndex: -1, pointerEvents: "none" }}>
        <ChatExportView ref={exportRef} flow={flow} />
      </div>

      {/* Interactive chat overlay */}
      {showInteractive && (
        <InteractiveChat
          flow={flow}
          botDescription={flow.subtitle || ""}
          onClose={() => setShowInteractive(false)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-xl text-[14px] shadow-xl" style={{ background: "#202c33", border: "1px solid rgba(255,255,255,0.1)", color: "#e9edef" }}>
          {toast}
        </div>
      )}
    </main>
  );
}
