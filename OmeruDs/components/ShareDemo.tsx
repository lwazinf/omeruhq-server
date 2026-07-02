"use client";

import React, { useState } from "react";
import { Flow } from "@/lib/types";
import { slugify } from "@/lib/flows";
import { buildShareUrl } from "@/lib/shareLink";
import { track } from "@/lib/analytics";

interface ShareDemoProps {
  flow: Flow;
  compact?: boolean;
}

export default function ShareDemo({ flow, compact }: ShareDemoProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(flow, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugify(flow.name)}-demo.json`;
    a.click();
    URL.revokeObjectURL(url);
    track("demo_shared", { method: "json", flowId: flow.id });
  };

  const copyLink = () => {
    try {
      const shareUrl = buildShareUrl(flow); // read-only viewer — works even for custom flows
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      track("demo_shared", { method: "link", flowId: flow.id });
    } catch {
      // Fallback: copy the current URL
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareNative = async () => {
    try {
      await navigator.share({
        title: `${flow.name} - WhatsApp Bot Demo`,
        text: `Check out this WhatsApp bot demo for ${flow.name}`,
        url: buildShareUrl(flow),
      });
      track("demo_shared", { method: "native", flowId: flow.id });
    } catch {
      // User cancelled or share API not available
      setOpen(true);
    }
  };

  if (compact) {
    return (
      <button
        onClick={shareNative}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/10 text-[14px] text-white/80"
        title="Share demo"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        Share
      </button>
    );
  }

  return (
    <>
      <button
        onClick={shareNative}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13.5px] font-medium bg-white/5 border border-white/10 hover:bg-white/10 transition text-white/80"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        Share this Demo
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm rounded-2xl p-5 relative" style={{ background: "#111b21", border: "1px solid rgba(255,255,255,0.1)" }}>
            <button onClick={() => setOpen(false)} className="absolute top-3 right-3 text-white/50 hover:text-white text-lg">&times;</button>

            <h3 className="text-lg font-bold text-white mb-4">Share Demo</h3>

            <div className="space-y-2.5">
              <button
                onClick={copyLink}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left bg-white/5 hover:bg-white/10 border border-white/10 transition"
              >
                <span className="w-10 h-10 rounded-lg bg-[#00a884]/20 flex items-center justify-center text-[18px]">
                  {copied ? "&#10003;" : "&#128279;"}
                </span>
                <div>
                  <div className="text-white text-[14px] font-medium">{copied ? "Copied!" : "Copy link"}</div>
                  <div className="text-white/40 text-[12px]">Read-only demo page — safe to send to customers</div>
                </div>
              </button>

              <button
                onClick={exportJson}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left bg-white/5 hover:bg-white/10 border border-white/10 transition"
              >
                <span className="w-10 h-10 rounded-lg bg-[#8b5cf6]/20 flex items-center justify-center text-[18px]">&#128230;</span>
                <div>
                  <div className="text-white text-[14px] font-medium">Export JSON</div>
                  <div className="text-white/40 text-[12px]">Download the flow file to share or import</div>
                </div>
              </button>

              <button
                onClick={() => {
                  const text = `Check out this WhatsApp bot demo I built for ${flow.name}: ${buildShareUrl(flow)}`;
                  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
                  window.open(waUrl, "_blank");
                  track("demo_shared", { method: "whatsapp", flowId: flow.id });
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left bg-white/5 hover:bg-white/10 border border-white/10 transition"
              >
                <span className="w-10 h-10 rounded-lg bg-[#25d366]/20 flex items-center justify-center text-[18px]">&#128172;</span>
                <div>
                  <div className="text-white text-[14px] font-medium">Send via WhatsApp</div>
                  <div className="text-white/40 text-[12px]">Share directly on WhatsApp</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
