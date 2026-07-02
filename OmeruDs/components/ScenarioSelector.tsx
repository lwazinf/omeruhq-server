"use client";

import React from "react";
import { track } from "@/lib/analytics";

export interface ScenarioTab {
  id: string;
  label: string;
  icon: string;
  description: string;
}

interface ScenarioSelectorProps {
  scenarios: ScenarioTab[];
  activeId: string;
  onChange: (id: string) => void;
}

export default function ScenarioSelector({ scenarios, activeId, onChange }: ScenarioSelectorProps) {
  if (scenarios.length <= 1) return null;

  return (
    <div className="flex gap-1.5 p-1 rounded-xl overflow-x-auto thin-scroll" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      {scenarios.map((s) => {
        const active = s.id === activeId;
        return (
          <button
            key={s.id}
            onClick={() => {
              onChange(s.id);
              track("scenario_switched", { scenarioId: s.id, label: s.label });
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] whitespace-nowrap transition-all shrink-0"
            style={{
              background: active ? "rgba(0,168,132,0.2)" : "transparent",
              color: active ? "#7ff0cf" : "rgba(255,255,255,0.55)",
              border: active ? "1px solid rgba(0,168,132,0.3)" : "1px solid transparent",
              fontWeight: active ? 600 : 400,
            }}
            title={s.description}
          >
            <span>{s.icon}</span>
            <span>{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}
