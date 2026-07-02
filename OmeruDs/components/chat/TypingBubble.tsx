"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sender } from "@/lib/types";

export default function TypingBubble({ side }: { side: Sender }) {
  const isUser = side === "user";
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 8, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88, y: 4 }}
      transition={{ type: "spring", stiffness: 480, damping: 28 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} px-3 mt-1`}
    >
      <div
        className={`bubble ${isUser ? "tail-out" : "tail-in"} rounded-lg flex items-center`}
        style={{
          background: isUser ? "var(--out)" : "var(--in)",
          padding: "10px 13px",
          gap: 5,
          boxShadow: "0 1px 0.5px rgba(11,20,26,0.13)",
        }}
      >
        <span className="typing-dot animate-typing-1" />
        <span className="typing-dot animate-typing-2" />
        <span className="typing-dot animate-typing-3" />
      </div>
    </motion.div>
  );
}
