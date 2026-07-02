# OmeruDs — Omeru Design · WhatsApp Demo & Design Studio

**Show the conversation before you build the bot.**

A pixel-accurate WhatsApp clone for pitching animated bot prototypes to clients.
It works like an **expert WhatsApp-bot agent**: brief it on your business, it tells
you **what it understands** and how it would design the bot, you **correct it**, and
it generates a complete, on-brand WhatsApp conversation — then plays it back with
typing indicators, ticks, buttons, lists, voice notes and a checkout. Refine either
party's wording in **Review & refine** with live feedback, and **export client-ready
screenshots**. You can also write conversations by hand as a JSON *Flow*.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS** and **Framer Motion**.

---

## Quick start

You need Node.js 18.18+ (Node 20 LTS recommended).

```bash
npm install      # install dependencies
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
```

Open <http://localhost:3000>. You'll land on the **agent**: enter your business name,
what it does, the bot's goal and (optionally) contacts; it replies with its
understanding for you to correct, then generates and plays the conversation. Open the
**Builder** (top-right) to refine the wording or edit JSON.

---

## What's inside

| Route | What it does |
|-------|--------------|
| `/` | The agent — intake, then "here's what I understand", then generate |
| `/chat/[id]` | Plays a Flow with transport controls + screenshot export |
| `/builder` | Review & refine (inline editing + live feedback) and a JSON editor |
| `/api/understand` | Agent's read of the business (only active with an API key) |
| `/api/generate` | Generates the Flow from the brief (only active with an API key) |
| `/api/analyze` | Reviews one wording change (only active with an API key) |

```
app/            pages (agent wizard, chat player, builder), api/{understand,generate,
                analyze}, global theme
components/      PhoneFrame, StatusBar, PlayerControls, chats list, ReviewEditor, and
                 components/chat/* (header, bubbles, renderers, list sheet, ChatExportView)
lib/             types.ts (schema), generator.ts (idea/intake -> Flow), agent.ts (agent
                 types + offline heuristics + callers), agentServer.ts (persona + Claude),
                 useGenerator.ts, capture.ts (PNG export), usePlayer.ts, flows.ts, format.tsx
data/flows/      three bundled demos (.json)
```

---

## The agent workflow

The landing page is the agent — a senior WhatsApp Business Platform developer and
business analyst. Instead of generating blindly, it works in three steps:

1. **Brief it.** Business name, a short description, the bot's primary goal (bookings,
   orders, leads, questions, checkout, viewings), an optional tone, and optional
   contacts (phone, website, email, hours, address) that it weaves into the chat.
   Tap an example to pre-fill and jump straight to its read.
2. **See what it understands.** It replies with a brief you can check first: a summary,
   business type, audience, primary goal, the proposed conversation step by step, the
   WhatsApp features it'll use and *why*, honest platform constraints, and up to three
   questions. A line shows whether it came from the AI agent or offline analysis.
3. **Correct, then generate.** Put fixes/answers in the corrections box —
   *“pickup only, no delivery”* — then **Re-analyze with my notes** or
   **Looks good — generate the bot**. The result saves to your chats and plays.

The generated conversation detects the category (restaurant, café, grocery, retail,
beauty, fitness, clinic, real estate, hotel, education, automotive, events, or
professional services), uses your name and contacts, themes everything to the business
(*“a restaurant that sells fruit”* → a fruit menu, currency £/$/€ from the wording),
and demonstrates many bot functions: welcome buttons, a list menu with prices, a
product/card, a CTA, plus a mix of voice note, location, contact card, reaction and a
receipt. It's **deterministic offline** (same brief → same demo). **Skip — just
generate** bypasses step 2; the Builder also keeps a quick *Generate from an idea* box.

## Review & refine (edit either party, with live feedback)

Open a flow in the Builder and it opens in **Review & refine** (toggle to **JSON** for
raw editing). Every message is listed and tagged *Customer*, *Bot* or *System*, so you
can rewrite the words **either side** says:

- **Edit any message's text** in place — customer lines and bot replies alike.
- **The agent reviews each change** and returns a verdict — *Looks good*, *Tip*, or
  *Heads up* — with a short note and optional suggestion, grounded in WhatsApp reality
  (all-caps, over-long bubbles, missing CTAs, button titles over 20 chars, …).
- **Explain your change (optional).** Each message has an *“Add a note explaining your
  change”* field; it's passed to the agent as context and saved with the message
  (never shown in the chat). A **Review** button re-checks on demand.

### Optional: a sharper agent with your API key

Everything works offline with built-in heuristics. Provide your own Anthropic API key
and all three agent steps — **understanding**, **generation**, and **edit review** —
are handled by Claude. Create `.env.local` in the project root:

```bash
ANTHROPIC_API_KEY=sk-ant-...
# optional — defaults to a current Sonnet model
ANTHROPIC_MODEL=claude-sonnet-4-6
```

Restart the dev server. If the key is missing, invalid, or slow, the app silently
falls back to the offline analysis, so demos always work. The agent's server routes are
`/api/understand`, `/api/generate`, and `/api/analyze`.

---

## Export screenshots

Open any chat and use the two export actions (desktop: top bar; mobile: floating buttons):

- **Screenshot** — the current phone view exactly as shown (status bar, header, bubbles, composer).
- **Full chat** — the entire conversation as one tall PNG, great for proposals and decks.

Both export at 2× resolution and download straight to your device.

---

## The Flow format

A **Flow** is one conversation. Everything on screen comes from this object.

```json
{
  "id": "bella-booking",
  "name": "Bella Beauty Studio",
  "subtitle": "Business Account",
  "avatar": { "initials": "BB", "color": "#c2185b" },
  "verified": true,
  "phoneTime": "18:42",
  "battery": 68,
  "theme": "dark",
  "wallpaper": "default",
  "speed": 1,
  "messages": [ ... ]
}
```

Each **message** has two independent ideas: **who sent it** (`from`: `bot` | `user` |
`system`) and **what it contains** (`type` — usually inferred from the content field you
set). Shared optional fields: `time`, `status` (`sending`/`sent`/`delivered`/`read`),
`quote`, `forwarded`, `starred`, plus playback hints `delay` (ms) and `typing` (bool).

```json
{ "from": "bot", "text": "Hi! How can I help today?", "time": "09:41" }
```

### Message types

| `type` | Content field(s) |
|--------|------------------|
| `text` | `text` — supports `*bold*`, `_italic_`, `~strike~`, ` ```mono``` ` |
| `image` | `image` (URL), optional `text` caption |
| `video` | `video`, `poster`, optional caption |
| `voice` | `voice: { duration }` — interactive waveform |
| `document` | `document: { name, size, pages, ext }` |
| `sticker` | `sticker` (URL) |
| `buttons` | `text` + `buttons: [{ title, reply?, icon?, selected? }]` |
| `list` | `list: { header, body, footer, button, sections[] }` — opens a bottom sheet |
| `poll` | `poll: { question, multiple, options[] }` — interactive voting |
| `location` | `location: { name, address, map? }` |
| `contact` | `contact: { name, phone, org?, avatar? }` |
| `cta` | `cta: { text, display, url }` |
| `card` | `card: { image, title, subtitle, body, buttons[] }` |
| `product` | `product: { image, name, price, description, catalog }` |
| `reaction` | `reaction` (emoji) — attaches to the previous bubble |
| `date` / `system` | `text` — centred separators, no sender |

See **WhatsApp-Bot-Showcase-Documentation.pdf** for the full reference with an example
of every type, playback/timing details, theming, and deployment notes.

---

## The Builder

`/builder` has two editing modes (toggle at the top) plus a live phone preview
(Edit / Preview tabs on mobile):

- **Review & refine** — edit each message's text inline with live agent feedback and
  optional per-message notes (see above). The default mode.
- **JSON** — edit the raw Flow; click an **Insert message** snippet to append a
  ready-made block, or **Format** the JSON.
- **Live preview** — valid JSON re-plays automatically; press **↻ Replay** any time.
- **Load** a bundled demo or a blank Flow, **Save** to your browser (it then appears in
  the chats list), or **Export / Import** a `.json` file.

Validation runs continuously and lists any errors under the editor; Review & refine
needs valid JSON to operate.

---

## Deployment

It's a standard Next.js app — any Node host works. For Vercel, import the repo or run
`vercel` from the CLI. Remote images are already permitted in `next.config.mjs`; tighten
that list to your own domains for production.

---

*This tool recreates the look of WhatsApp for prototyping. It is not affiliated with or
endorsed by WhatsApp or Meta.*
