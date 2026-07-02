"use client";

import React, { useState } from "react";
import { track } from "@/lib/analytics";

interface BookCallProps {
  businessName?: string;
  compact?: boolean;
}

export default function BookCall({ businessName, compact }: BookCallProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleOpen = () => {
    setOpen(true);
    track("book_call_clicked", { business: businessName || "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    track("book_call_submitted", {
      business: businessName || "",
      hasEmail: !!form.email,
      hasPhone: !!form.phone,
    });
    // Store lead locally for now
    try {
      const leads = JSON.parse(localStorage.getItem("wa-showcase:leads") || "[]");
      leads.push({ ...form, businessName, timestamp: Date.now() });
      localStorage.setItem("wa-showcase:leads", JSON.stringify(leads));
    } catch { /* ignore */ }
    setSubmitted(true);
  };

  if (compact) {
    return (
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-[13.5px] transition-all hover:scale-[1.02]"
        style={{
          background: "linear-gradient(135deg, #00a884 0%, #25d366 100%)",
          color: "#0b141a",
          boxShadow: "0 2px 12px rgba(0,168,132,0.3)",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
        </svg>
        Book a Call
      </button>
    );
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-[15px] transition-all hover:scale-[1.01]"
        style={{
          background: "linear-gradient(135deg, #00a884 0%, #25d366 100%)",
          color: "#0b141a",
          boxShadow: "0 4px 20px rgba(0,168,132,0.35)",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
        </svg>
        Ready? Book a Customisation Call
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 relative" style={{ background: "#111b21", border: "1px solid rgba(255,255,255,0.1)" }}>
            <button onClick={() => { setOpen(false); setSubmitted(false); }} className="absolute top-4 right-4 text-white/50 hover:text-white text-xl">&times;</button>

            {submitted ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">&#10003;</div>
                <h3 className="text-xl font-bold text-white mb-2">We'll be in touch!</h3>
                <p className="text-white/60 text-[14px]">
                  Our team will reach out within 24 hours to schedule your customisation call.
                </p>
                <button
                  onClick={() => { setOpen(false); setSubmitted(false); }}
                  className="mt-6 px-6 py-2.5 rounded-xl text-[14px] font-semibold"
                  style={{ background: "#00a884", color: "#0b141a" }}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-white mb-1">Book a Customisation Call</h3>
                <p className="text-white/50 text-[13px] mb-5">
                  Tell us about your project and we'll schedule a free consultation.
                </p>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name *"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-[14px] text-white outline-none focus:border-[#00a884]/50 placeholder:text-white/30"
                  />
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Email address *"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-[14px] text-white outline-none focus:border-[#00a884]/50 placeholder:text-white/30"
                  />
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="WhatsApp number (e.g. +27 82 123 4567)"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-[14px] text-white outline-none focus:border-[#00a884]/50 placeholder:text-white/30"
                  />
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us briefly about the bot you need..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-[14px] text-white outline-none focus:border-[#00a884]/50 resize-none placeholder:text-white/30"
                  />
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl font-bold text-[14px] transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #00a884 0%, #25d366 100%)", color: "#0b141a" }}
                  >
                    Request a Call
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
