"use client";

import React, { useEffect, useRef, useState } from "react";
import { Flow } from "@/lib/types";
import { getFlow } from "@/lib/flows";
import { decodeSharedFlow, buildShareUrl } from "@/lib/shareLink";
import { usePlayer } from "@/lib/usePlayer";
import { track } from "@/lib/analytics";
import PhoneFrame from "@/components/PhoneFrame";
import ChatScreen from "@/components/chat/ChatScreen";

// ============================================================================
// /share — the read-only, customer-facing demo page.
// Reached only via a share link. No builder, no editing, no navigation into
// the tool — just the conversation playing in a phone, and two actions:
// get this for your business, or pass the demo along.
// ============================================================================

export default function SharePage() {
  const [flow, setFlow] = useState<Flow | null | undefined>(undefined);

  useEffect(() => {
    // Parse the URL on the client only: ?id= for bundled flows,
    // #f= for self-contained encoded flows. Avoids useSearchParams/Suspense.
    const url = new URL(window.location.href);
    const id = url.searchParams.get("id");
    const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
    const encoded = hash.get("f");

    let resolved: Flow | null = null;
    if (encoded) resolved = decodeSharedFlow(encoded);
    else if (id) resolved = getFlow(id) ?? null;

    setFlow(resolved);
    track("page_view", { page: "share", flowId: resolved?.id ?? "invalid" });
  }, []);

  if (flow === undefined) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center text-white/60" style={{ background: "#0a0f14" }}>
        Loading demo…
      </main>
    );
  }

  if (flow === null) {
    return (
      <main className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 text-white/70 px-6 text-center" style={{ background: "#0a0f14" }}>
        <p className="text-lg">This demo link is invalid or has expired.</p>
        <a href="https://omeru.io" className="px-5 py-2.5 rounded-full font-semibold text-[#0b141a]" style={{ background: "#C8F135" }}>
          Discover Omeru
        </a>
      </main>
    );
  }

  return <ShareStage flow={flow} />;
}

function ShareStage({ flow }: { flow: Flow }) {
  const player = usePlayer(flow, true);
  const phoneWrapRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = () => buildShareUrl(flow);

  const shareDemo = async () => {
    const url = shareUrl();
    try {
      await navigator.share({ title: `${flow.name} on WhatsApp`, text: `See how ${flow.name} works on WhatsApp — live demo:`, url });
      track("demo_shared", { method: "native", flowId: flow.id, page: "share" });
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        track("demo_shared", { method: "link", flowId: flow.id, page: "share" });
      } catch { /* clipboard unavailable */ }
    }
  };

  const toggleFullscreen = async () => {
    const next = !fullscreen;
    setFullscreen(next);
    // Best-effort native fullscreen on top of the CSS takeover
    try {
      if (next) await phoneWrapRef.current?.requestFullscreen?.();
      else if (document.fullscreenElement) await document.exitFullscreen();
    } catch { /* iOS Safari etc. — CSS mode still applies */ }
    track(next ? "share_fullscreen_open" : "share_fullscreen_close", { flowId: flow.id });
  };

  useEffect(() => {
    const onFsChange = () => { if (!document.fullscreenElement) setFullscreen(false); };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  return (
    <main
      className="min-h-[100dvh] w-full flex flex-col items-center"
      style={{ background: "radial-gradient(1100px 600px at 50% -10%, rgba(0,168,132,0.12), transparent 60%), #0a0f14" }}
    >
      {/* Header — brand + context, no tool navigation */}
      <header className={`w-full max-w-3xl px-5 pt-6 pb-4 text-center ${fullscreen ? "hidden" : ""}`}>
        <a href="https://omeru.io" className="inline-block font-extrabold tracking-tight text-white text-[15px]" style={{ letterSpacing: "-0.01em" }}>
          OMERU<span style={{ color: "#C8F135" }}>.</span>
        </a>
        <h1 className="mt-3 text-white font-extrabold leading-tight" style={{ fontSize: "clamp(22px, 5vw, 32px)", letterSpacing: "-0.02em" }}>
          {flow.name} — live on WhatsApp
        </h1>
        <p className="mt-2 text-white/55 text-[14px] leading-relaxed max-w-md mx-auto">
          This is a real conversation flow. Watch how customers browse, order and pay without ever leaving WhatsApp.
        </p>
      </header>

      {/* Phone */}
      <div
        ref={phoneWrapRef}
        className={
          fullscreen
            ? "fixed inset-0 z-[90] bg-[#0a0f14] flex items-center justify-center"
            : "relative w-full flex justify-center md:py-2"
        }
      >
        <div className={fullscreen ? "h-[100dvh] w-full max-w-[480px]" : "h-[70dvh] min-h-[520px] md:h-auto"}>
          <PhoneFrame>
            <ChatScreen flow={flow} player={player} onBack={() => player.restart()} />
          </PhoneFrame>
        </div>

        {/* In-phone overlay controls */}
        <div className={`absolute z-[95] flex items-center gap-2 ${fullscreen ? "top-4 right-4" : "top-2 right-2 md:top-4 md:right-1/2 md:translate-x-[240px]"}`}>
          <button
            onClick={() => player.restart()}
            aria-label="Replay demo"
            className="px-3 py-2 rounded-full text-[12.5px] font-medium text-white/90"
            style={{ background: "rgba(20,26,31,0.92)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            ↺ Replay
          </button>
          <button
            onClick={toggleFullscreen}
            aria-label={fullscreen ? "Exit full screen" : "View full screen"}
            className="px-3 py-2 rounded-full text-[12.5px] font-medium text-white/90 md:hidden"
            style={{ background: "rgba(20,26,31,0.92)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            {fullscreen ? "✕ Close" : "⤢ Expand"}
          </button>
        </div>
      </div>

      {/* Conversion bar */}
      <footer className={`w-full max-w-3xl px-5 pt-5 pb-8 flex flex-col items-center gap-3 ${fullscreen ? "hidden" : ""}`}>
        <a
          href="https://omeru.io/#pricing"
          onClick={() => track("share_cta_clicked", { flowId: flow.id })}
          className="w-full max-w-sm text-center px-6 py-3.5 rounded-full font-bold text-[15px] text-[#0b141a] transition hover:opacity-90"
          style={{ background: "#C8F135" }}
        >
          Get this for your business →
        </a>
        <button
          onClick={shareDemo}
          className="w-full max-w-sm text-center px-6 py-3 rounded-full font-medium text-[14px] text-white/85 transition hover:bg-white/10"
          style={{ border: "1px solid rgba(255,255,255,0.18)" }}
        >
          {copied ? "Link copied ✓" : "Share this demo"}
        </button>
        <p className="text-white/35 text-[11.5px] mt-1">
          One flat fee · 0% commission · Powered by Stitch instant EFT
        </p>
      </footer>
    </main>
  );
}
