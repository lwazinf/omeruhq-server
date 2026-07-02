import React from "react";

// ============================================================================
// lib/format.tsx
// Renders WhatsApp-style inline markdown into React nodes.
//   *bold*   _italic_   ~strikethrough~   ```monospace```
// Plus URL auto-linking and newline handling. Intentionally small & safe
// (no dangerouslySetInnerHTML).
// ============================================================================

const URL_RE = /(https?:\/\/[^\s]+)/g;

type Token = { t: "text" | "b" | "i" | "s" | "code"; v: string };

// Order matters: monospace first (so its contents aren't re-parsed), then the
// single-char wrappers.
const WRAPPERS: { char: string; tag: Token["t"] }[] = [
  { char: "*", tag: "b" },
  { char: "_", tag: "i" },
  { char: "~", tag: "s" },
];

function parseInline(input: string): Token[] {
  // Handle ```mono``` blocks first.
  const out: Token[] = [];
  const parts = input.split(/(```[\s\S]*?```)/g);
  for (const part of parts) {
    if (part.startsWith("```") && part.endsWith("```") && part.length >= 6) {
      out.push({ t: "code", v: part.slice(3, -3) });
    } else if (part) {
      out.push(...parseWrappers(part));
    }
  }
  return out;
}

function parseWrappers(input: string): Token[] {
  for (const { char, tag } of WRAPPERS) {
    const re = new RegExp(
      `\\${char}(?=\\S)([\\s\\S]*?\\S)\\${char}`
    );
    const m = input.match(re);
    if (m && m.index !== undefined) {
      const before = input.slice(0, m.index);
      const inner = m[1];
      const after = input.slice(m.index + m[0].length);
      return [
        ...(before ? parseWrappers(before) : []),
        { t: tag, v: inner },
        ...(after ? parseWrappers(after) : []),
      ];
    }
  }
  return [{ t: "text", v: input }];
}

function linkify(text: string, keyBase: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  text.replace(URL_RE, (url, _g, offset: number) => {
    if (offset > last) nodes.push(text.slice(last, offset));
    nodes.push(
      <a
        key={`${keyBase}-l${i++}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-wa-link underline break-all"
        onClick={(e) => e.stopPropagation()}
      >
        {url}
      </a>
    );
    last = offset + url.length;
    return url;
  });
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function renderToken(tok: Token, key: string): React.ReactNode {
  const inner = linkify(tok.v, key);
  switch (tok.t) {
    case "b":
      return (
        <strong key={key} className="font-semibold">
          {inner}
        </strong>
      );
    case "i":
      return (
        <em key={key} className="italic">
          {inner}
        </em>
      );
    case "s":
      return (
        <s key={key} className="line-through">
          {inner}
        </s>
      );
    case "code":
      return (
        <code
          key={key}
          className="font-mono text-[13px] bg-black/20 rounded px-1 py-[1px]"
        >
          {tok.v}
        </code>
      );
    default:
      return <React.Fragment key={key}>{inner}</React.Fragment>;
  }
}

/** Render a string with WhatsApp markdown + newlines into React nodes. */
export function formatText(text: string): React.ReactNode {
  const lines = text.split("\n");
  return lines.map((line, li) => (
    <React.Fragment key={`ln-${li}`}>
      {li > 0 && <br />}
      {parseInline(line).map((tok, ti) => renderToken(tok, `t-${li}-${ti}`))}
    </React.Fragment>
  ));
}

/** True if text is only emoji (1–3 of them) — WhatsApp renders these large. */
export function isEmojiOnly(text: string): boolean {
  const stripped = text.replace(/\s/g, "");
  if (!stripped) return false;
  const emojiRe =
    /^(\p{Extended_Pictographic}|\p{Emoji_Component}|\u200d|\uFE0F){1,9}$/u;
  try {
    if (!emojiRe.test(stripped)) return false;
    const count = [...new Intl.Segmenter().segment(stripped)].length;
    return count <= 3;
  } catch {
    return false;
  }
}
