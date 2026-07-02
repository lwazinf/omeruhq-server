"use client";

import { Flow } from "./types";
import { validateFlow, isBundled } from "./flows";

// ============================================================================
// lib/shareLink.ts — read-only share links
// Bundled flows share as a short URL:      /share?id=<flowId>
// Custom flows travel inside the URL hash: /share#f=<base64url(flow JSON)>
// The hash never reaches the server, needs no backend or account, and the
// viewer page is playback-only — no builder, no editing.
// ============================================================================

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "==".slice(0, (4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function encodeFlowForShare(flow: Flow): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(flow)));
}

export function decodeSharedFlow(encoded: string): Flow | null {
  try {
    const json = new TextDecoder().decode(fromBase64Url(encoded));
    const result = validateFlow(JSON.parse(json));
    return result.ok && result.flow ? result.flow : null;
  } catch {
    return null;
  }
}

/** Read-only viewer URL for any flow — short for bundled, self-contained for custom. */
export function buildShareUrl(flow: Flow, origin?: string): string {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return isBundled(flow.id)
    ? `${base}/share?id=${encodeURIComponent(flow.id)}`
    : `${base}/share#f=${encodeFlowForShare(flow)}`;
}
