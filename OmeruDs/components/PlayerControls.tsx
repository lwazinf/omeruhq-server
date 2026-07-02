"use client";

import React from "react";
import { UsePlayerResult } from "@/lib/usePlayer";
import { Play, Pause, Replay, SkipEnd } from "./chat/Icons";

const SPEEDS = [0.5, 1, 1.5, 2];

export default function PlayerControls({
  player,
  compact = false,
}: {
  player: UsePlayerResult;
  compact?: boolean;
}) {
  const { status, progress, toggle, restart, skipToEnd, speed, setSpeed } = player;
  const isPlaying = status === "playing";

  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(speed);
    setSpeed(SPEEDS[(idx + 1) % SPEEDS.length]);
  };

  if (compact) {
    return (
      <div className="flex items-center justify-evenly" style={{ width: "100%" }}>
        <button
          onClick={restart}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 no-tap-highlight transition-colors"
          style={{ color: "rgba(255,255,255,0.55)" }}
          aria-label="Restart" title="Restart"
        >
          <Replay size={15} />
        </button>
        <button
          onClick={toggle}
          className="w-8 h-8 rounded-full flex items-center justify-center no-tap-highlight hover:bg-white/10 transition-colors"
          style={{ color: "rgba(255,255,255,0.9)" }}
          aria-label={isPlaying ? "Pause" : "Play"}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={17} /> : <Play size={17} className="ml-0.5" />}
        </button>
        <button
          onClick={skipToEnd}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 no-tap-highlight transition-colors"
          style={{ color: "rgba(255,255,255,0.55)" }}
          aria-label="Skip to end" title="Skip to end"
        >
          <SkipEnd size={15} />
        </button>
        <button
          onClick={cycleSpeed}
          className="flex items-center justify-center text-[11px] font-semibold hover:bg-white/10 no-tap-highlight transition-colors tabular-nums rounded-full px-1.5 py-1"
          style={{ color: "rgba(255,255,255,0.4)" }}
          aria-label="Playback speed" title="Playback speed"
        >
          {speed}×
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2.5 rounded-full px-2.5 py-2 shadow-xl"
      style={{
        background: "rgba(20,26,31,0.92)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(8px)",
      }}
    >
      <button
        onClick={restart}
        className="p-2 rounded-full hover:bg-white/10 text-white/80 no-tap-highlight"
        aria-label="Restart" title="Restart"
      >
        <Replay size={18} />
      </button>
      <button
        onClick={toggle}
        className="w-10 h-10 rounded-full flex items-center justify-center text-white no-tap-highlight"
        style={{ background: "#00a884" }}
        aria-label={isPlaying ? "Pause" : "Play"}
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
      </button>
      <button
        onClick={skipToEnd}
        className="p-2 rounded-full hover:bg-white/10 text-white/80 no-tap-highlight"
        aria-label="Skip to end" title="Skip to end"
      >
        <SkipEnd size={18} />
      </button>
      <div className="flex-1 min-w-[80px] h-1.5 rounded-full overflow-hidden mx-1" style={{ background: "rgba(255,255,255,0.14)" }}>
        <div
          className="h-full rounded-full transition-[width] duration-200"
          style={{ width: `${Math.round(progress * 100)}%`, background: "#00a884" }}
        />
      </div>
      <button
        onClick={cycleSpeed}
        className="px-2.5 py-1.5 rounded-full text-[12.5px] font-semibold text-white/90 hover:bg-white/10 no-tap-highlight tabular-nums"
        aria-label="Playback speed" title="Playback speed"
      >
        {speed}×
      </button>
    </div>
  );
}
