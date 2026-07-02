"use client";

import { toPng } from "html-to-image";

// ============================================================================
// lib/capture.ts
// Turn a DOM node into a downloadable PNG. Used to export client-ready
// WhatsApp screenshots (current phone view, or the full conversation).
// ============================================================================

async function waitForImages(node: HTMLElement) {
  const imgs = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    imgs.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const done = () => resolve();
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
        // safety timeout so a slow/blocked image never stalls the export
        setTimeout(done, 2500);
      });
    })
  );
}

function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Render `node` to a PNG and download it.
 * Resolves on success, rejects on failure (caller can show a toast).
 */
export async function exportNodeToPng(
  node: HTMLElement | null,
  filename: string,
  opts: { pixelRatio?: number; background?: string } = {}
): Promise<void> {
  if (!node) throw new Error("Nothing to capture");
  await waitForImages(node);
  // a couple of frames so fonts/layout settle
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));

  const dataUrl = await toPng(node, {
    pixelRatio: opts.pixelRatio ?? 2,
    cacheBust: true,
    backgroundColor: opts.background,
    // html-to-image occasionally races web fonts; this filter keeps <link> styles
    skipFonts: false,
  });
  triggerDownload(dataUrl, filename);
}

export function safeFileName(base: string, suffix: string): string {
  const clean = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "whatsapp-chat";
  return `${clean}-${suffix}.png`;
}
