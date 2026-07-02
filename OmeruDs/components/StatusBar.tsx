import React from "react";

export default function StatusBar({
  time = "20:19",
  battery = 76,
  dark = true,
}: {
  time?: string;
  battery?: number;
  dark?: boolean;
}) {
  const fg = dark ? "#e9edef" : "#ffffff";
  const pct = Math.max(0, Math.min(100, battery));
  const fillColor = pct <= 20 ? "#f15c6d" : fg;

  return (
    <div
      className="flex items-center justify-between px-5 shrink-0 select-none"
      style={{ color: fg, height: 28, paddingTop: 4, paddingBottom: 2 }}
    >
      {/* Time */}
      <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.1 }}>{time}</span>

      {/* Right icons: signal · wifi · battery */}
      <div className="flex items-center gap-[5px]">
        {/* Cellular signal – 4 bars */}
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none" aria-hidden>
          <rect x="0"  y="8"  width="3" height="4"  rx="0.8" fill={fg} />
          <rect x="4.5" y="5"  width="3" height="7"  rx="0.8" fill={fg} />
          <rect x="9"  y="2.5" width="3" height="9.5" rx="0.8" fill={fg} />
          <rect x="13.5" y="0" width="3" height="12" rx="0.8" fill={fg} opacity="0.38" />
        </svg>

        {/* Wi-Fi */}
        <svg width="15" height="11" viewBox="0 0 15 11" fill="none" aria-hidden>
          <path d="M7.5 9a1.2 1.2 0 1 1 0 2.4A1.2 1.2 0 0 1 7.5 9z" fill={fg} />
          <path d="M3.4 6.4a5.8 5.8 0 0 1 8.2 0" stroke={fg} strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M0.6 3.8A9.6 9.6 0 0 1 14.4 3.8" stroke={fg} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7" />
        </svg>

        {/* Battery */}
        <div className="flex items-center gap-[2px]">
          <span style={{ fontSize: 11, fontWeight: 600 }}>{pct}</span>
          <div className="relative flex items-center" style={{ width: 23, height: 12 }}>
            <div
              className="relative rounded-[3px] border"
              style={{ width: 21, height: 11, borderColor: fg, borderWidth: 1 }}
            >
              <div
                className="absolute rounded-[1.5px]"
                style={{
                  left: 1.5,
                  top: 1.5,
                  bottom: 1.5,
                  width: `calc(${pct}% - 3px)`,
                  background: fillColor,
                }}
              />
            </div>
            {/* terminal nub */}
            <div style={{ width: 2, height: 5, background: fg, borderRadius: 1, marginLeft: 1, opacity: 0.7 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
