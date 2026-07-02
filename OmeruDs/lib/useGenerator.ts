"use client";

import { useState, useCallback } from "react";
import { Flow } from "./types";
import { slugify, upsertCustomFlow, validateFlow } from "./flows";
import { buildFlowFromIdea, buildFlowFromIntake } from "./generator";
import { Intake, Brief } from "./agent";

export type GenSource = "ai" | "local";

export interface GenInput {
  idea?: string;
  intake?: Intake;
  brief?: Brief;
  corrections?: string;
}

function ensureId(flow: Flow): Flow {
  const id = (flow.id && flow.id.trim()) || slugify(flow.name || "flow");
  return { ...flow, id };
}

export function useGenerator() {
  const [generating, setGenerating] = useState(false);
  const [source, setSource] = useState<GenSource | null>(null);

  const generate = useCallback(async (input: string | GenInput): Promise<Flow> => {
    const req: GenInput = typeof input === "string" ? { idea: input } : input;
    setGenerating(true);
    setSource(null);
    try {
      // 1) try the AI route (short timeout so a live demo never stalls)
      try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 38000);
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(req),
          signal: controller.signal,
        });
        clearTimeout(t);
        if (res.ok) {
          const data = await res.json();
          if (data?.flow) {
            const check = validateFlow(data.flow);
            if (check.ok && check.flow) {
              const flow = ensureId(check.flow);
              upsertCustomFlow(flow);
              setSource("ai");
              return flow;
            }
          }
        }
      } catch {
        /* ignore and fall back */
      }

      // 2) offline fallback — always succeeds
      const flow = ensureId(req.intake ? buildFlowFromIntake(req.intake) : buildFlowFromIdea(req.idea || ""));
      upsertCustomFlow(flow);
      setSource("local");
      return flow;
    } finally {
      setGenerating(false);
    }
  }, []);

  return { generate, generating, source };
}
