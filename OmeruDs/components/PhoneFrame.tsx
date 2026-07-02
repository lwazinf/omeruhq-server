"use client";

import React from "react";

// ============================================================================
// components/PhoneFrame.tsx
// Houses the chat screen. On phones it fills the viewport; on larger screens
// it renders a centered device with a bezel so the demo looks like a handset.
// ============================================================================

export default function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      {/* Mobile: full bleed. Desktop: bezel. */}
      <div
        className="
          relative bg-black overflow-hidden
          w-full h-[100dvh] rounded-none
          md:w-[402px] md:h-[min(860px,94vh)] md:rounded-[48px] md:p-[12px]
          md:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]
          md:ring-1 md:ring-white/10
        "
      >
        <div className="relative w-full h-full overflow-hidden rounded-none md:rounded-[36px] bg-black">
          {children}
        </div>
      </div>
    </div>
  );
}
