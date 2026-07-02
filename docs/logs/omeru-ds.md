# OmeruDs (Omeru Design) — WhatsApp Demo & Design Studio CHANGELOG

> **Rules that govern every entry in this file:**
> 1. **Surgical changes only.** Touch nothing outside the scope of the stated fix.
> 2. **Always start from a working state.** No commit may leave the app broken or undeployable.
> 3. **We do not create bugs.** Every change is reviewed against the Known Issues list and the scores below.
> 4. **Every entry must include:** what changed · why · date · time · version bump.
> 5. **Scores are recalculated** on every release that materially changes behaviour.
> 6. **Priority order for fixes** is defined in the Roadmap section. Do not reorder without discussion.
> 7. **Every code change entry must include a Rollback block** — the exact before-state of every line touched, so any version can be restored by reversing the diff. No entry is complete without it.

> 📍 **Log map:** this file is indexed in [`docs/logs/INDEX.md`](./INDEX.md) alongside every other app log in the ecosystem.

---

## Rollback Protocol

To roll back to any previous version, say: **"roll back to vX.Y.Z"**

Each changelog entry below contains a `### Rollback` block listing every file and the exact code that was in place *before* that version's changes. Changes are reversed in **reverse version order** — newest first — until the target version is reached.

> **Current rollback state: v0.4.1** — rename to OmeruDs, read-only share links, the /share conversion viewer with mobile fullscreen, plus everything from v0.3.0 are live.

---

## About This App

### What OmeruDs Is

OmeruDs (`ds.omeru.io`, folder `OmeruDs/`) is the **sales and demonstration layer of the Omeru platform** — a Next.js 14 app that renders faithful, animated WhatsApp-style bot conversations for prospects. It plays scripted demo flows (JSON), generates new flows with AI (Claude API with a deterministic offline fallback), and lets prospects interact with a live improvising bot — all inside a phone frame that mirrors the real WhatsApp experience.

Where `OmeruWA` *is* the bot and `OmeruIO` *sells* the platform on the open web, OmeruShowcase closes the gap between them: it shows a merchant exactly what *their* store would feel like on WhatsApp before they ever apply.

### Why It Matters

WhatsApp commerce is invisible until you experience it. Screenshots don't convey typing indicators, read receipts, interactive lists, or checkout speed. A 60-second animated demo — of the prospect's own business category, in South African locale, with ZAR prices — is the strongest conversion asset the platform has.

### Business Use Cases

| Use Case | Route | Mechanism |
|----------|-------|-----------|
| Sales demo playback | `/chat/[id]` | Scripted flow plays with transport controls |
| Prospect-specific demos | `/builder` | AI generates a flow from a business description |
| Live improvised demos | `/chat/[id]` (interactive) | Claude responds in-character in real time |
| Demo sharing | `/chat/[id]` | Copy link, PNG export, JSON export, video download |
| Lead capture | "Book a Call" CTA | Conversion form on every demo |
| Discovery entry point | `/` | Curated flagship flows incl. `omeru-discovery` |

### Architecture

| Layer | Technology | Role |
|-------|-----------|------|
| Framework | Next.js 14 (App Router) | Client-heavy SPA-style routes |
| Styling | Tailwind CSS + CSS custom properties | WhatsApp theme tokens in `globals.css` |
| Animation | Framer Motion | Message reveal, typing, reactions |
| AI | Claude API (server routes) + offline deterministic generator | Flow generation, analysis, interactive mode |
| Persistence | localStorage | Custom flows, analytics — zero-config, offline |
| Fonts | next/font (Syne + DM Sans, self-hosted) | Omeru brand chrome; chat surface uses the system font stack |

### Architecture Decisions (carried from v0.2.0)

| Decision | Rationale |
|----------|-----------|
| No external state library | Minimal bundle; React hooks + Context sufficient |
| localStorage for persistence | Zero-config, works offline, no auth needed yet |
| Deterministic seeded RNG | Same input = same demo; repeatable pitches |
| Node editor built from scratch | No heavy graph-lib dependency |
| SA locale as default | Primary market |
| Analytics via localStorage | Privacy-friendly; no third-party tracking |
| Chat surface on system font stack | Native messaging apps render in the OS font — matching it is what makes the clone read as real |

---

## Quality Scorecard

| Metric | Score (1-10) | Notes |
|--------|:------------:|-------|
| **Usability** | 9 | Intuitive flows, interactive demos, scenario switching, consistent read receipts |
| **Design** | 9 | Faithful WhatsApp-style rendering (curved tails, chips, accurate tokens), premium Omeru chrome |
| **Reliability** | 7 | Offline AI fallback, localStorage persistence, deterministic generation |
| **Security** | 9 | Server-only API keys, no `dangerouslySetInnerHTML` in chat, security headers, API/builder de-indexed |
| **Performance** | 8 | Self-hosted fonts, compression, immutable static caching, prod console stripping |
| **SEO** | 8 | Full metadata, OG/Twitter cards, JSON-LD, robots.ts, dynamic sitemap |

**Overall: 8.4 / 10** (was 8.2 at v0.3.0)

---

## Version History

### v0.3.0 — 2026-07-01 SAST — Ecosystem integration, fonts, SEO, perf, fidelity

**OmeruDs (then OmeruShowcase) joins the omeruHQ monorepo as a first-class app.**

**What changed:**

*Repository structure*
- App moved into the ecosystem at `omeruHQ/OmeruShowcase/`
- Deleted the stale nested duplicate `whatsapp-bot-showcase/` folder (an older copy of the entire app — every file diverged from the root version; keeping it risked edits landing in the dead copy)
- `CHANGELOG.md` in the app root converted to a pointer at this file, matching the `OmeruIO`/`OmeruWA` convention

*`app/layout.tsx` — SEO + fonts*
- Added `Syne` + `DM_Sans` via `next/font/google` (`--font-syne` / `--font-dm-sans`, `display: swap`); removed the render-blocking Google Fonts `<link>` stylesheet and its preconnects
- Full `Metadata` object: title template, description, keywords, canonical, `metadataBase` from `NEXT_PUBLIC_SITE_URL` (default `https://demo.omeru.io`), OpenGraph + Twitter cards, robots directives
- `WebApplication` JSON-LD schema
- `themeColor` moved to `#0a0a0a` to match the app chrome

*`app/robots.ts` (new)*
- Allows all crawling except `/api/` and `/builder` (internal tool)

*`app/sitemap.ts` (new)*
- Homepage + one entry per bundled demo flow (`/chat/[id]`), generated from `bundledFlows`

*`next.config.mjs`*
- `compress: true`, `poweredByHeader: false`, `compiler.removeConsole` in production (keeps `error`/`warn`)
- `images.formats: ['image/avif', 'image/webp']`
- Security headers on every route: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`
- `Cache-Control: public, max-age=31536000, immutable` on the wallpaper SVGs and phone frame PNG

*`app/globals.css` — chat fidelity*
- Bubble tails upgraded from hard triangles (`polygon` clip-path) to an original curved `path()` clip that mirrors the softly hooked tail shape of real messaging bubbles
- New `.wa-chip` utility for date/system chips (correct radius, padding, shadow depth)
- Font tokens now resolve from the next/font variables

*`data/flows/*.json` — conversation flow consistency*
- Added missing `"status": "read"` to 11 user messages across 6 flows (`bella-booking`, `kasi-kicks`, `mamas-kitchen`, `nimbus-store`, `omeru-discovery`, `thandi-bridal`). Every user bubble in a live conversation carries delivery ticks; missing ticks were the most visible realism break in playback
- Validated all 7 flows for monotonic timestamps and preview presence (all pass)

**Why:**
- The app was orphaned outside the ecosystem with no entry in the log map, a divergent duplicate of itself nested inside, no SEO surface, and remote render-blocking fonts
- Demo realism is the product — tick consistency and tail shape are exactly what a merchant's eye checks against their own WhatsApp

**Score impact:** Design 8→9 · Usability 7→8 · Security 8→9 · SEO (new metric) 8 · Performance (new metric) 8 · Overall 7.4 → 8.2

### Rollback to v0.2.0

| File | Change to reverse |
|------|------------------|
| Repository | Move `OmeruShowcase/` back out of `omeruHQ/`; restore the nested `whatsapp-bot-showcase/` duplicate from the v0.2.0 archive |
| `app/layout.tsx` | Restore original file: simple `metadata` (title `"OMERU — Shop Local on WhatsApp"`, description only), `viewport.themeColor: "#f5f4ef"`, `<head>` with two font preconnects + Google Fonts stylesheet `<link>` for Syne/DM Sans, no JSON-LD, no font imports |
| `app/robots.ts` | Delete file |
| `app/sitemap.ts` | Delete file |
| `next.config.mjs` | Restore: `{ reactStrictMode: true, images: { remotePatterns: [{ protocol: "https", hostname: "**" }, { protocol: "http", hostname: "**" }] } }` only |
| `app/globals.css` | Revert font tokens to `--font-display: 'Syne', sans-serif; --font-body: 'DM Sans', sans-serif;`; revert `.tail-in::before` / `.tail-out::before` to `clip-path: polygon(100% 0, 0 0, 100% 100%)` / `polygon(0 0, 100% 0, 0 100%)`; delete `.wa-chip` |
| `data/flows/*.json` | Remove `"status": "read"` from: bella-booking msgs 7 & 17, kasi-kicks msgs 6 & 15, mamas-kitchen msg 16, nimbus-store msgs 6 & 16, omeru-discovery msgs 10 & 18, thandi-bridal msgs 8 & 19 |
| `CHANGELOG.md` (app root) | Restore full v0.2.0 changelog content (preserved below in this file's history sections) |

---

### v0.2.0 — Flow Editor, Scenarios & SA Locale

#### Done
- South African locale system (ZAR, +27 numbers, SA cities, SA examples)
- Analytics & data collection layer (event tracking, localStorage persistence)
- Node-based visual flow editor (draggable cards, SVG connections, grid layout)
- Multiple scenarios/views for bots with multiple functions
- Interactive bot mode (AI improvises in real time based on bot description)
- Video demonstration download functionality
- Shareable bot demos (copy link, export as image/JSON)
- "Book a Call" CTA component for conversion tracking
- CHANGELOG.md with scoring and progress tracking
- Updated home page with SA locale defaults
- Flow editor page (`/flow-editor`) with node canvas

#### New files in v0.2.0
`lib/locale.ts`, `lib/analytics.ts`, `lib/scenarios.ts`, `lib/flowEditor.ts`, `components/BookCall.tsx`, `components/ShareDemo.tsx`, `components/VideoDownload.tsx`, `components/InteractiveChat.tsx`, `components/ScenarioSelector.tsx`, `app/flow-editor/page.tsx`, `app/api/interactive/route.ts`

#### Modified in v0.2.0
`app/page.tsx` (SA locale, analytics, Book a Call, flow editor nav), `app/chat/[id]/page.tsx` (share, video, interactive, Book a Call), `app/builder/page.tsx` (SA defaults), `app/layout.tsx` (title/lang en-ZA), `lib/generator.ts` (ZAR default, SA cities)

---

### v0.1.0 — Initial Release (Baseline)

- WhatsApp-accurate chat renderer (15+ message types)
- AI-powered flow generation (Claude API with offline fallback)
- Business intake wizard with understanding step
- Chat playback with transport controls (play/pause/speed)
- PNG screenshot export (current view + full chat)
- Flow builder with JSON editor + Review & refine mode
- 3 bundled demo flows (Bella Booking, Pitch Agent, Nimbus Store)
- Dark/light theme support
- Responsive design (mobile full-screen, desktop centred phone frame)
- Message analysis with AI feedback
- Deterministic offline generator (13 business categories)
- Framer Motion animations for message reveal

---

## Roadmap

### Checkpoint 3: Scale (v0.4.x — next)
1. Polish node editor drag interactions and snap-to-grid
2. More SA business-category scenario templates
3. Webhook integration for "Book a Call" (Calendly / Cal.com)
4. Hosted share links (currently self-contained export only)
5. User auth & cloud sync

### Checkpoint 4: Enterprise (v0.5.x — planned)
White-label branding · advanced analytics dashboard · API access · multi-language (Afrikaans, Zulu, Xhosa) · A/B testing framework

## Known Limitations

1. Video download uses canvas-based recording — browser support varies
2. Flow editor connections are visual only (no runtime execution engine yet)
3. Interactive mode requires an API key for best results
4. Analytics stored in localStorage — cleared with browser data
5. No real-time collaboration yet
6. Sharing generates a self-contained export, not a hosted link (yet)

---

*Last updated: 2026-07-01*

### v0.4.0 — 2026-07-01 SAST — OmeruDs: rename, read-only share links, conversion viewer, mobile fullscreen

**What changed:**

*Identity*
- App folder renamed `OmeruShowcase/` → `OmeruDs/` (Omeru Design — the WhatsApp demo & design studio). Canonical log renamed `wa-showcase.md` → `omeru-ds.md`; app-root `CHANGELOG.md` pointer and `README.md` title updated; INDEX row updated

*`lib/shareLink.ts` (new)*
- Read-only share links with zero backend: bundled flows share as short URLs (`/share?id=<flowId>`); custom flows travel as URL-safe base64 JSON in the hash (`/share#f=…`) — the hash never reaches the server, and decode runs through `validateFlow`

*`app/share/page.tsx` (new) — the customer-facing sales page*
- Playback-only viewer: autoplaying phone simulation, Replay control, **no builder or tool navigation anywhere**
- Conversion-optimised: Omeru wordmark → headline "*{flow} — live on WhatsApp*" → phone → lime CTA "**Get this for your business →**" (to omeru.io/#pricing, tracked as `share_cta_clicked`) → "Share this demo" (native share with clipboard fallback) → flat-fee trust line
- **Mobile fullscreen**: `⤢ Expand` takes the simulation over the whole screen (CSS takeover + best-effort `requestFullscreen`), header/footer hide, `✕ Close` restores; `fullscreenchange` listener keeps state honest on system exit
- URL parsed client-side (no `useSearchParams`/Suspense constraint); invalid links get a graceful "Discover Omeru" fallback

*`components/ShareDemo.tsx`*
- Copy link, native share, and Send-via-WhatsApp now hand out the **read-only `/share` URL** (works for custom flows too — previously custom-flow links 404'd for recipients since flows lived only in the sender's localStorage); copy-link description now says "Read-only demo page — safe to send to customers"

*`app/builder/page.tsx`*
- New **Share link** button beside Save: copies the read-only demo link for the current design straight from the editor

*`app/globals.css`*
- Small-screen phone scaling (≤ 380px) and notch-safe padding utility for the fullscreen takeover

**Why:** The share story was the app's weakest link — exports were files, and links to custom flows only worked on the author's own browser. A self-contained read-only URL turns every designed flow into a sendable sales asset, and the `/share` page receives that click with exactly two jobs: convert, or get re-shared.

**Score impact:** Usability 8→9 (share links that actually work for recipients; one-tap fullscreen on phones) · Design 9 (held) · Overall **8.2 → 8.4**

### Rollback to v0.3.0

| File | Change to reverse |
|------|------------------|
| Repository | Rename `OmeruDs/` back to `OmeruShowcase/`; rename this log back to `wa-showcase.md`; restore INDEX row, `CHANGELOG.md` pointer text, and `README.md` line 1 `# WhatsApp Bot Showcase` |
| `lib/shareLink.ts` | Delete file |
| `app/share/page.tsx` | Delete file (and the `app/share/` directory) |
| `components/ShareDemo.tsx` | Remove `import { buildShareUrl } from "@/lib/shareLink";`; restore `const shareUrl = \`${window.location.origin}/chat/${encodeURIComponent(flow.id)}\`;`, `url: \`${window.location.origin}/chat/${encodeURIComponent(flow.id)}\`,`, the WhatsApp-share text using the `/chat/` URL, and description "Share a direct link to this demo" |
| `app/builder/page.tsx` | Remove `import { buildShareUrl } from "@/lib/shareLink";`, the `copyShareLink` function, and the `Share link` toolbar button |
| `app/globals.css` | Remove the "Mobile (v0.4.0)" block (`@media (max-width: 380px)` rule and `.share-fullscreen-safe`) |

### v0.4.1 — 2026-07-01 SAST — Domain: ds.omeru.io

**What changed:** Default `NEXT_PUBLIC_SITE_URL` fallback switched `https://demo.omeru.io` → `https://ds.omeru.io` in `app/layout.tsx` (metadataBase, OG url, canonical, JSON-LD), `app/sitemap.ts`, and `app/robots.ts`. Share links and all in-app URLs are origin-relative, so they follow automatically.

**Why:** OmeruDs is Omeru *Design* — `ds.omeru.io` matches the app's identity. (If `NEXT_PUBLIC_SITE_URL` is set in the deployment env it always wins; this changes only the fallback.) Remember to point DNS + the deployment domain at ds.omeru.io and set up a redirect from demo.omeru.io so previously shared demo links keep working.

**Score impact:** None (metadata only).

### Rollback to v0.4.0

| File | Change to reverse |
|------|------------------|
| `app/layout.tsx`, `app/sitemap.ts`, `app/robots.ts` | Change the fallback string `https://ds.omeru.io` back to `https://demo.omeru.io` (one occurrence per file) |

