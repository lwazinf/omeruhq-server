// ============================================================================
// lib/types.ts
// The complete JSON schema that drives the WhatsApp showcase.
// Every conversation is just a `Flow` object — author it by hand, with the
// in-app Builder, or generate it from your own tooling.
// ============================================================================

export type Sender = "bot" | "user";

export type DeliveryStatus = "sending" | "sent" | "delivered" | "read";

/** A quoted / replied-to message shown above a bubble (the colored bar). */
export interface Quote {
  /** Name shown in the quote header (e.g. the bot or contact name). */
  author: string;
  /** Quoted text (truncated automatically if long). */
  text: string;
  /** Accent color of the quote bar. Defaults to a sensible green/teal. */
  color?: string;
}

/** One row inside an interactive list message. */
export interface ListRow {
  id: string;
  title: string;
  description?: string;
  /** Render greyed-out & unselectable (used for "Coming soon" items). */
  disabled?: boolean;
}

export interface ListSection {
  title?: string;
  rows: ListRow[];
}

/** A reply/quick-reply button under an interactive message. */
export interface Button {
  id?: string;
  title: string;
  /** Optional emoji/icon rendered before the label. */
  icon?: string;
  /** If set, tapping inserts this text as the user's reply bubble. */
  reply?: string;
  /** Render as already-selected (greyed) — matches WhatsApp's chosen state. */
  selected?: boolean;
}

export interface PollOption {
  text: string;
  /** Pre-filled vote count for the showcase. */
  votes?: number;
}

/** The canonical message content types. */
export type MessageType =
  | "text"
  | "image"
  | "video"
  | "voice"
  | "audio"
  | "document"
  | "sticker"
  | "buttons"
  | "list"
  | "poll"
  | "location"
  | "contact"
  | "cta"
  | "card"
  | "product"
  | "reaction"
  | "date"
  | "system";

/**
 * A single message. Most fields are optional — include only what the content
 * type needs. `type` can be omitted; it is inferred from the fields present
 * (e.g. an `image` field implies type "image").
 */
export interface Message {
  id?: string;
  from?: Sender; // default "bot"
  type?: MessageType;

  /** Body text / caption. Supports WhatsApp markdown: *bold* _italic_ ~strike~ ```mono``` */
  text?: string;

  // --- media ---
  image?: string; // url
  video?: string; // url (or a poster image url if `poster` set)
  poster?: string; // optional video thumbnail
  sticker?: string; // url (transparent png/webp)
  voice?: VoiceData | string; // string = duration shorthand "0:12"
  audio?: VoiceData | string;
  document?: DocumentData;

  // --- interactive ---
  buttons?: (Button | string)[];
  list?: ListData;
  poll?: PollData;
  location?: LocationData;
  contact?: ContactData;
  cta?: CtaData;
  card?: CardData;
  product?: ProductData;

  /** Emoji reaction attached to the *previous* message. */
  reaction?: string;

  // --- chrome ---
  time?: string; // "10:32" — auto-generated if omitted
  status?: DeliveryStatus; // ticks for outgoing messages
  quote?: Quote; // quoted reply shown above the bubble
  forwarded?: boolean; // "Forwarded" label
  starred?: boolean; // star glyph in meta row

  // --- playback (the motion showcase) ---
  /** ms to wait after the previous message before this one appears. */
  delay?: number;
  /** ms to show a typing indicator before this message (bot messages). */
  typing?: number;
  /** If true, autoplay pauses here until the viewer taps a button/row. */
  waitForInput?: boolean;

  /** Authoring-only note explaining an edit. Never rendered in the chat. */
  note?: string;
}

export interface VoiceData {
  duration?: string; // "0:14"
  /** 0..1 heights for the waveform bars; auto-generated if omitted. */
  waveform?: number[];
  /** Show the small play count / "viewed" dot. */
  played?: boolean;
}

export interface DocumentData {
  name: string;
  size?: string; // "36 kB"
  ext?: string; // "DOCX" — badge text
  pages?: string; // "12 pages"
}

export interface ListData {
  header?: string;
  body?: string;
  footer?: string;
  /** The pill label that opens the bottom sheet (e.g. "Choose"). */
  button: string;
  sections: ListSection[];
}

export interface PollData {
  question: string;
  options: PollOption[];
  multiple?: boolean; // "Select one or more"
}

export interface LocationData {
  name?: string;
  address?: string;
  lat?: number;
  lng?: number;
  /** Optional static map image url; a styled placeholder is drawn otherwise. */
  map?: string;
}

export interface ContactData {
  name: string;
  phone?: string;
  org?: string;
  avatar?: string;
}

export interface CtaData {
  text?: string; // body text above the button
  display: string; // button label
  url: string; // destination (shown only, not navigated)
  header?: string;
}

export interface CardData {
  image?: string;
  title?: string;
  subtitle?: string;
  body?: string;
  buttons?: (Button | string)[];
}

export interface ProductData {
  image?: string;
  name: string;
  price?: string;
  description?: string;
  catalog?: string; // "View catalog" label
}

export type Theme = "dark" | "light";

export interface Avatar {
  initials?: string;
  color?: string; // background for initials avatar
  image?: string; // overrides initials
}

/** A complete conversation. This is the top-level JSON object. */
export interface Flow {
  id: string;
  name: string;
  /** Sub-line under the name: presence, "Business Account", etc. */
  subtitle?: string;
  avatar?: Avatar;
  /** Green verified check next to the name (business verified badge). */
  verified?: boolean;
  /** Status-bar clock, e.g. "20:19". */
  phoneTime?: string;
  /** Battery percentage shown in the status bar (0–100). */
  battery?: number;
  theme?: Theme;
  /** "default" doodle wallpaper, a solid color, or an image url. */
  wallpaper?: string;
  /** Global playback speed multiplier (1 = realtime). */
  speed?: number;
  /** Preview text for the home chat list. Auto-derived if omitted. */
  preview?: string;
  messages: Message[];
}

// ---------------------------------------------------------------------------
// Inference: let authors omit `type` and just supply the relevant field.
// ---------------------------------------------------------------------------
export function inferType(m: Message): MessageType {
  if (m.type) return m.type;
  if (m.image) return "image";
  if (m.video || m.poster) return "video";
  if (m.sticker) return "sticker";
  if (m.voice || m.audio) return "voice";
  if (m.document) return "document";
  if (m.list) return "list";
  if (m.poll) return "poll";
  if (m.location) return "location";
  if (m.contact) return "contact";
  if (m.cta) return "cta";
  if (m.card) return "card";
  if (m.product) return "product";
  if (m.buttons) return "buttons";
  if (m.reaction) return "reaction";
  return "text";
}

export function isSystem(m: Message): boolean {
  const t = inferType(m);
  return t === "date" || t === "system";
}
