"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ListData, ListRow } from "@/lib/types";
import { formatText } from "@/lib/format";

export default function ListSheet({
  open,
  list,
  onClose,
  onSelect,
}: {
  open: boolean;
  list: ListData | null;
  onClose: () => void;
  onSelect: (row: ListRow) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);

  const choose = (row: ListRow) => {
    if (row.disabled) return;
    setPicked(row.id);
    onSelect(row);
    setTimeout(() => { onClose(); setPicked(null); }, 260);
  };

  return (
    <AnimatePresence>
      {open && list && (
        <motion.div
          className="absolute inset-0 z-40 flex flex-col justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* Scrim */}
          <motion.div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.55)" }}
            onClick={onClose}
            aria-hidden
          />

          {/* Sheet */}
          <motion.div
            className="relative wa-scroll overflow-y-auto"
            style={{
              background: "var(--sheet)",
              maxHeight: "80%",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              boxShadow: "0 -4px 32px rgba(0,0,0,0.45)",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 38 }}
          >
            {/* Handle + header */}
            <div className="sticky top-0 z-10 pt-2 pb-0" style={{ background: "var(--sheet)" }}>
              <div className="flex justify-center mb-2">
                <div className="w-8 h-[3px] rounded-full" style={{ background: "rgba(134,150,160,0.4)" }} />
              </div>
              <div className="flex items-center px-4 py-2 gap-3">
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center no-tap-highlight"
                  style={{ color: "var(--text2)" }}
                  aria-label="Close"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </motion.button>
                <h3 className="flex-1 text-center pr-8 text-[16px] font-semibold" style={{ color: "var(--text)" }}>
                  {list.button}
                </h3>
              </div>
              <div className="h-px mx-0" style={{ background: "var(--divider)" }} />
            </div>

            {/* Sections */}
            <div className="pb-6">
              {list.sections.map((section, si) => (
                <div key={si}>
                  {section.title && (
                    <div
                      className="px-4 pt-4 pb-[6px] text-[12px] font-semibold uppercase tracking-widest"
                      style={{ color: "var(--text2)" }}
                    >
                      {section.title}
                    </div>
                  )}
                  {section.rows.map((row) => {
                    const isMine = picked === row.id;
                    return (
                      <motion.button
                        key={row.id}
                        whileTap={{ backgroundColor: "rgba(0,168,132,0.08)" }}
                        onClick={() => choose(row)}
                        disabled={row.disabled}
                        className="w-full flex items-center gap-3 px-4 py-[13px] text-left no-tap-highlight"
                        style={{
                          opacity: row.disabled ? 0.4 : 1,
                          cursor: row.disabled ? "default" : "pointer",
                          transition: "background 0.1s ease",
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-[15px] leading-snug" style={{ color: "var(--text)" }}>
                            {row.title}
                          </div>
                          {row.description && (
                            <div className="text-[13px] mt-[2px] leading-snug" style={{ color: "var(--text2)" }}>
                              {formatText(row.description)}
                            </div>
                          )}
                        </div>
                        {/* Radio dot */}
                        <motion.span
                          animate={{
                            borderColor: isMine ? "var(--accent)" : "var(--text2)",
                            backgroundColor: isMine ? "var(--accent)" : "transparent",
                          }}
                          transition={{ duration: 0.15 }}
                          className="shrink-0 rounded-full flex items-center justify-center"
                          style={{ width: 21, height: 21, border: "2px solid" }}
                        >
                          {isMine && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="rounded-full"
                              style={{ width: 9, height: 9, background: "#fff" }}
                            />
                          )}
                        </motion.span>
                      </motion.button>
                    );
                  })}
                  {si < list.sections.length - 1 && (
                    <div className="mx-4 h-px my-1" style={{ background: "var(--divider)" }} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
