# OmeruHQ Merchant Portal — CHANGELOG

> 📍 **Log map:** this file is indexed in [`docs/logs/INDEX.md`](./INDEX.md) alongside every other app log in the ecosystem.

## About This App

### What the Merchant Portal Is

The Omeru Merchant Portal (`hq.omeru.io`) is a **web-first dashboard for merchants** who need a screen-sized control centre — a complement to the existing WhatsApp-native tools. It authenticates via OTP sent to the merchant's registered WhatsApp number, then exposes a full command surface: real-time order Kanban, product catalogue management, revenue dashboards, and store open/close control.

It connects to the same Supabase PostgreSQL database as `OmeruWA` (the backend bot) and `OmeruIO` (the customer storefront), but is a completely separate Next.js application. No shared code, no API gateway — direct Prisma queries, JWT session in an HTTP-only cookie.

### Why It Exists

The WhatsApp bot is optimised for low-latency single-command responses. Merchants managing orders during a lunch rush, editing product catalogues, or reviewing analytics need something faster and more visual. The portal replaces the WhatsApp dashboard commands with a real-time, always-on web UI — without replacing the bot for notifications and broadcast.

### Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, App Router, React 19, TypeScript |
| Styling | Custom CSS design system (same tokens as storefront) |
| Database | Shared Supabase PostgreSQL via Prisma 6 |
| Auth | OTP via WhatsApp → HS256 JWT in HTTP-only cookie (`omeru_session`) |
| Deployment | Vercel (target: `hq.omeru.io`) |

---

> **Rules that govern every entry in this file:**
> 1. **Surgical changes only.** Touch nothing outside the scope of the stated fix.
> 2. **Always start from a working state.** No commit may leave the portal in a broken condition.
> 3. **We do not create bugs.** Every change is reviewed against the Known Issues list and the scores below.
> 4. **Every entry must include:** what changed · why · date · time · version bump.
> 5. **Scores are recalculated** on every release that materially changes behaviour.
> 6. **Priority order for fixes** is defined in the Build Phases section. Do not reorder without discussion.
> 7. **Every code change entry must include a Rollback block** — the exact before-state of every line touched, so any version can be restored by reversing the diff. No entry is complete without it.

---

## Rollback Protocol

To roll back to any previous version, say: **"roll back to vX.Y.Z"**

Each changelog entry below contains a `### Rollback` block listing every file and the exact code that was in place *before* that version's changes. To restore a state, changes are reversed in **reverse version order** — newest first — until the target version is reached.

**Rollback entry format (required on every code-change entry):**

```
### Rollback
| File | Line(s) | Before |
|------|---------|--------|
| path/to/file.ts | 12 | `const otpStore = new Map()` |
```

For multi-line changes, the full before-block is pasted verbatim in a fenced code block beneath the table.

> **Current rollback state: v0.1.0** — Phase 1 scaffold live: login, dashboard, orders, products.

---

## Vision & Build Map

### What the Portal Is Building Towards

A **merchant-first control centre** — everything the WhatsApp bot commands can do, but on a screen, with real-time data, drag-and-drop Kanban, charts, and bulk actions. Phase by phase it closes the gap between a raw WhatsApp commerce tool and a full merchant operating system.

### Platform Goals

| Goal | Target | Current State |
|------|--------|---------------|
| Merchants log in with WhatsApp OTP | ✅ OTP via Meta Cloud API | Achieved v0.1.0 |
| Real-time order kitchen | ✅ Kanban board + Server Actions | Achieved v0.1.0 |
| Product catalogue CRUD | ✅ Grid view + add form + toggle | Achieved v0.1.0 |
| Revenue dashboard | ✅ KPIs + top products | Achieved v0.1.0 |
| Store open/close toggle | ✅ Live button on dashboard | Achieved v0.1.0 |
| Customer WA notifications on status change | ✅ advanceOrderAction sends WA | Achieved v0.1.0 |
| Services & booking management | ⏳ Phase 2 | Not started |
| Broadcast campaigns | ⏳ Phase 2 | Not started |
| Team/staff management | ⏳ Phase 2 | Not started |
| Analytics & search query data | ⏳ Phase 3 | Not started |
| Customer list & segmentation | ⏳ Phase 3 | Not started |
| Reviews management | ⏳ Phase 3 | Not started |

### Build Phases

| Phase | Scope | Status |
|-------|-------|--------|
| **Phase 1** | Login · Dashboard · Orders Kanban · Products CRUD | ✅ v0.1.0 |
| **Phase 2** | Services · Bookings · Broadcast · Team · Settings | ⏳ Planned |
| **Phase 3** | Analytics · Customers · Reviews | ⏳ Planned |

---

## Impact Scores

Scores measure how much each module benefits a merchant on a 1–10 scale.

| Module | Score | Reason |
|--------|-------|--------|
| Orders Kanban | 10 | Real-time order flow is the core daily operation |
| Dashboard KPIs | 9 | Revenue + pending count at a glance = merchant stays in control |
| Products grid + toggle | 8 | Instant availability toggle replaces WhatsApp command |
| Store open/close | 8 | Critical during rush — one tap instead of a WA command |
| Login (WA OTP) | 8 | Friction-free entry using existing WhatsApp number |
| Services & bookings | 7 | High value for salons, fitness, food |
| Broadcast | 7 | WA open rates 90%+ — direct revenue driver |
| Team management | 6 | Needed as stores add staff |
| Analytics deep-dive | 6 | Strategic; lower urgency than operational tools |
| Customer list | 5 | Useful but secondary to order flow |
| Reviews | 5 | Trust signal; lower daily urgency |

---

## Known Issues

| ID | Description | Severity | Status |
|----|-------------|----------|--------|
| P1 | OTP in-memory store: hot reload can flush codes (dev only) | Low | Mitigated — `global.__otpStore` persists across HMR |
| P2 | No rate limiting on `/api/auth/send-otp` | Medium | Open — add in Phase 2 |
| P3 | Orders page shows max 60 orders; no pagination | Low | Open — sufficient for Phase 1 |
| P4 | Product images are raw URLs; no upload UI | Low | Open — Supabase storage upload in Phase 2 |

---

## Changelog

---

### v0.1.0 — Phase 1: Merchant Portal Foundation
**Date:** 2026-06-25 · **Time:** 00:00 SAST

**Changes:**

**Infrastructure:**
- `OmeruHQ/` — New Next.js 16 App Router project
- `package.json` — Dependencies: next, react, react-dom, prisma, @prisma/client, jose, framer-motion, tailwindcss
- `tsconfig.json` — Standard Next.js TS config with `@/*` path alias
- `next.config.ts` — Image remote patterns for Supabase CDN domains
- `.env.example` — `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `WA_PHONE_NUMBER_ID`, `WA_PERMANENT_TOKEN`
- `prisma/schema.prisma` — Copy of shared schema (same DB, same Prisma models)

**Auth system:**
- `middleware.ts` — JWT guard on all routes; passes `/login` and `/api/auth/*`
- `lib/auth.ts` — `signSession`, `getSession`, `setSessionCookie`, `clearSessionCookie` using `jose` HS256
- `lib/whatsapp.ts` — `sendWhatsAppText(to, text)` via Meta Graph API v19.0
- `lib/db.ts` — Prisma singleton with `global.__prisma` dev guard
- `app/api/auth/send-otp/route.ts` — Validates E.164, checks merchant active, generates 6-digit OTP, stores in `global.__otpStore`, sends WA
- `app/api/auth/verify-otp/route.ts` — Verifies OTP+expiry, loads merchant/owner, issues JWT cookie
- `app/api/auth/logout/route.ts` — Clears `omeru_session` cookie

**UI — Login:**
- `app/globals.css` — Full design system: same CSS tokens as storefront (lime, dark-gray, off-white), Syne + DM Sans fonts, btn-lime, btn-ghost, btn-outline, card, pill variants, toggle, data-table, input, sidebar layout, noise texture
- `app/layout.tsx` — Root layout with noise texture overlay
- `app/page.tsx` — Server redirect to `/dashboard` or `/login` based on session
- `app/login/page.tsx` — Split layout (dark brand panel + off-white form); framer-motion 2-step OTP flow

**UI — Portal:**
- `components/Sidebar.tsx` — Dark 220px fixed sidebar; active route highlighting; phase-gated nav (Phase 2–3 routes shown but disabled); pending orders badge; store open/close indicator; logout
- `app/(portal)/layout.tsx` — Portal route group; renders Sidebar with merchant name + open state + pending order count
- `app/(portal)/dashboard/page.tsx` — Today revenue, orders, pending count, upcoming bookings KPIs; 7d/30d revenue summary; top 5 products by units sold (bar chart); recent 6 orders table; store open/close toggle button
- `app/(portal)/dashboard/actions.ts` — `toggleShopAction` — flips `merchant.manual_closed` via Server Action
- `app/(portal)/orders/page.tsx` — Loads all non-cancelled orders, passes to Kanban
- `app/(portal)/orders/OrderKanban.tsx` — 4-column client Kanban (Pending / To Prepare / Ready / Done); per-order item list; advance + cancel buttons; elapsed time display
- `app/(portal)/orders/actions.ts` — `advanceOrderAction` (status → next; WA notification on Ready + Complete), `cancelOrderAction` (WA cancellation message)
- `app/(portal)/products/page.tsx` — 3-column grid of all merchant products; inline toggle to show/hide; link to add
- `app/(portal)/products/actions.ts` — `toggleProductAction`, `createProductAction`
- `app/(portal)/products/new/page.tsx` — Add product form: name, price, category, description, image URL

**Bug fix included:**
- `send-otp/route.ts`: replaced module-local `const otpStore = new Map()` with `global.__otpStore` pattern to match `verify-otp/route.ts` — without this fix, OTPs set during send were invisible to verify

### Rollback

v0.1.0 is the initial commit. Rolling back removes the entire `OmeruHQ/` directory.

---

*Next entry: v0.2.0 — Phase 2 (Services, Settings, Broadcast, Team)*

---

### v0.2.0 — 2026-06-25 SAST — Phase 2: Services, Broadcast, Team, Settings
**Full merchant management suite beyond core orders.**

**What changed:**

*Services & Bookings — `app/(portal)/services/page.tsx` + `actions.ts`:*
- Services CRUD: create/edit/delete service listings with name, price, duration, description
- Bookings view with calendar-style status management (PENDING → CONFIRMED → COMPLETED)
- Booking status advance via Server Actions

*Broadcast — `app/(portal)/broadcast/page.tsx` + `actions.ts`:*
- Send WhatsApp messages to opted-in customers
- Segment filters: all customers, opted-in only
- Character count + preview before send
- Audit logged via `AuditLog` table

*Team — `app/(portal)/team/page.tsx` + `actions.ts`:*
- Invite staff by WhatsApp number with role selection (ADMIN/STAFF)
- Role-based access: OWNER sees all, ADMIN manages orders/products, STAFF sees orders
- Remove team member action

*Settings — `app/(portal)/settings/page.tsx`:*
- Store open/close toggle
- WhatsApp number display (read-only)
- Store category, description, location visibility
- Partially complete — saves to DB, some fields still placeholder

*Sidebar — `components/Sidebar.tsx`:*
- Phase 2 nav items enabled: Services, Broadcast, Team, Settings
- `const disabled = phase > 2` (was phase > 1)

### Rollback to v0.1.0

| File | Change to reverse |
|------|------------------|
| `app/(portal)/services/` | Delete directory |
| `app/(portal)/broadcast/` | Delete directory |
| `app/(portal)/team/` | Delete directory |
| `app/(portal)/settings/` | Delete directory |
| `components/Sidebar.tsx` | Restore `phase > 1` threshold |

---

### v0.3.0 — 2026-06-25 SAST — Phase 3: Analytics, Customers, Payments + Preview fix
**Business intelligence, customer management, and payout infrastructure.**

**What changed:**

*Analytics — `app/(portal)/analytics/page.tsx`:*
- 14-day daily revenue + order count (raw data, no chart library — pure CSS)
- Day-of-week buying patterns (7-bar CSS chart, today highlighted)
- Top customers by spend (wa_id join to MerchantCustomer for display name)
- Revenue projection: `sevenDayAvg * 30` displayed as 30-day projection
- Customer overview grid: total, new 30d, new 7d, returning, avg order value
- Growth badge: % change vs previous 30-day period

*Customers — `app/(portal)/customers/page.tsx` + `actions.ts`:*
- Customer table with last-seen date, order count, spend, opt-in badge
- Bookmark toggle and opt-out toggle via `toggleBookmarkAction` / `toggleOptOutAction`
- KPI strip: total customers, opted-in count, bookmarked count

*Reviews — `app/(portal)/reviews/page.tsx`:*
- Coming-soon page with real counts (completed orders, completed bookings, total customers)
- Shows "potential review count" projection
- Placeholder for future star-rating integration

*Payments — `app/(portal)/payments/page.tsx` + `actions.ts`:*
- KPI strip: unpaid gross, net (after platform fee), last payout date
- Bank account on file display
- Unpaid completed orders table with gross/net per order
- "Request Payout" CTA → `requestPayoutAction` (creates `Payout` record, links all unpaid orders)
- Payout history with status badges (PENDING/REQUESTED/PROCESSING/COMPLETED/FAILED)
- Platform fee explainer footer

*Prisma schema — `prisma/schema.prisma`:*
- New `Payout` model with `PayoutStatus` enum (PENDING/REQUESTED/PROCESSING/COMPLETED/FAILED)
- Added `payout_id String?` FK on `Order`
- Added `payouts Payout[]` relation on `Merchant`
- `@@index([payout_id])` on Order

*Preview fix — `components/Sidebar.tsx`:*
- Preview URL corrected from `https://hq.omeru.io/@{handle}` (404) to `https://omeru.io/@{handle}?preview=1`
- Phase 3 nav items enabled: `const disabled = phase > 3`
- Added Payments nav item

### Rollback to v0.2.0

| File | Change to reverse |
|------|------------------|
| `app/(portal)/analytics/page.tsx` | Restore to stub/placeholder |
| `app/(portal)/customers/page.tsx` | Delete file |
| `app/(portal)/customers/actions.ts` | Delete file |
| `app/(portal)/reviews/page.tsx` | Delete file |
| `app/(portal)/payments/page.tsx` | Delete file |
| `app/(portal)/payments/actions.ts` | Delete file |
| `prisma/schema.prisma` | Remove `Payout` model, `PayoutStatus` enum, `payout_id` from Order |
| `components/Sidebar.tsx` | Revert `phase > 2`, remove Payments nav, fix preview URL |

---

### v0.4.0 — 2026-06-26 SAST — omeru-intel MCP + ecosystem vault
**AI-accessible platform intelligence via Model Context Protocol.**

**What changed:**

*New: `omeru-intel/` — standalone MCP server:*
- `src/db.ts` — Raw Postgres queries to Supabase (`DIRECT_URL` from OmeruHQ `.env.local`)
  - `getPlatformSummary()` — merchants by status, GMV 7d/30d/all-time, customers, payouts, applications
  - `getMerchantProfile(handle)` — per-merchant orders/customers/products/services/payout stats
  - `getAllMerchants()` — full merchant list for index
  - `getPayoutIndex()` — merchants with pending payouts
  - `getApplications()` — invite applications by status
  - `getDailyMetrics()` — 14-day revenue, top products, new customers
- `src/vault.ts` — Markdown writers to `omeru-vault/`
  - Builders: `buildPlatformOverview`, `buildMerchantNote`, `buildMerchantIndex`, `buildPayoutIndex`, `buildDailySnapshot`, `buildApplicationsNote`
  - All notes include YAML frontmatter (`type`, `updated`, `sync: auto`) and bi-directional `[[wiki-links]]`
- `src/index.ts` — MCP server (9 tools): `sync_platform_overview`, `sync_merchant`, `sync_all_merchants`, `sync_payouts`, `sync_daily`, `sync_applications`, `sync_all`, `write_insight`, `read_note`
- `src/sync.ts` — CLI script with `--scope` flag for scheduled runs
- `package.json` — `{ type: "module", deps: @modelcontextprotocol/sdk, postgres, zod, dotenv }`

*New: `omeru-vault/` — Obsidian knowledge base:*
- `.obsidian/app.json` — vault config
- `.obsidian/graph.json` — 7 color-coded node groups (Platform, Merchants, Payouts, OmeruIO, OmeruHQ, OmeruWA, Insights)
- Sections: Platform/, Merchants/, Payouts/, OmeruIO/, OmeruHQ/, OmeruWA/, Insights/
- Placeholder notes in each section with manual context
- Auto-sync writes: Platform/Overview.md, Merchants/_Index.md, Merchants/{handle}.md, Payouts/_Index.md, OmeruIO/Applications.md, Platform/Daily/YYYY-MM-DD.md

*`.mcp.json` — repo root:*
```json
{ "mcpServers": { "omeru-intel": { "command": "npx", "args": ["tsx", ".../src/index.ts"] } } }
```

### Rollback to v0.3.0

| File | Change to reverse |
|------|------------------|
| `omeru-intel/` | Delete entire directory |
| `omeru-vault/` | Delete entire directory |
| `.mcp.json` | Delete file |

### v0.5.0 — 2026-07-01 SAST — Self-hosted fonts + perf flags

**What changed:**

*`app/layout.tsx`*
- Added `Archivo` + `Hanken_Grotesk` via `next/font/google` (`--font-archivo` / `--font-hanken`, `display: swap`), applied on `<html className>`
- Material Symbols icon font moved from a CSS `@import` to a `<link rel="stylesheet">` in `<head>` with `preconnect` hints (the icon font keeps variable axes only the Fonts API serves; a `<link>` is discovered by the preload scanner before CSS parses, unlike `@import`)

*`app/globals.css`*
- Removed both render-blocking `@import url(...)` font lines
- `--font-display` / `--font-body` now resolve from next/font variables with the original families as fallback

*`next.config.ts`*
- `compress: true`, `poweredByHeader: false`, `compiler.removeConsole` in production (keeps `error`/`warn`)

**Why:** Two chained `@import`s at the top of `globals.css` were the largest render-blockers on dashboard first paint. Text fonts are now bundled and preloaded by Next; only the icon font remains remote, and it now starts downloading earlier.

**Score impact:** No behaviour change. Faster first paint on the login and dashboard routes; display face no longer flashes fallback on slow connections.

### Rollback to v0.4.0

| File | Change to reverse |
|------|------------------|
| `app/layout.tsx` | Remove the `Archivo, Hanken_Grotesk` import and both font consts; revert `<html lang={locale} className={...}>` to `<html lang={locale}>`; delete the `<head>` block containing the two `preconnect` links and the Material Symbols `<link rel="stylesheet">` |
| `app/globals.css` | Restore lines 1–2: `@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@700;800;900&family=Hanken+Grotesk:wght@400;500;600;700&display=swap');` and `@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');`; revert font vars to `--font-display: 'Archivo', sans-serif; --font-body: 'Hanken Grotesk', sans-serif;`; remove the explanatory comment |
| `next.config.ts` | Remove `compress`, `poweredByHeader`, and `compiler.removeConsole` keys |

### v0.6.0 — 2026-07-01 SAST — Mobile polish: in-card table scrolling, iOS input zoom fix

**What changed:** (`app/globals.css` only — appended block "Mobile polish (v0.6.0)")
- ≤ 768px: `.data-table` becomes a horizontally scrollable block inside its card (`display:block; overflow-x:auto` with momentum scrolling and a 560px row min-width) instead of stretching the page
- ≤ 768px: `input`/`select`/`textarea` forced to 16px to stop iOS Safari's auto-zoom on focus
- Modal cards capped at `calc(100vw - 24px)`; ≤ 480px grid gaps tightened

**Why:** The portal already had a proper mobile drawer system; wide order/customer tables were the remaining thing that broke small screens, and iOS zoom-on-focus made every form feel janky.

**Score impact:** Usability +0.5 on mobile sessions; no desktop change.

### Rollback to v0.5.0

| File | Change to reverse |
|------|------------------|
| `app/globals.css` | Delete the appended block starting with the comment `/* ── Mobile polish (v0.6.0): tables, inputs, tap targets ── */` through the final `@media (max-width: 480px)` rule |

