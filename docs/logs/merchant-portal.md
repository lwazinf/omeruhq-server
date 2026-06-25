# Omeru Merchant Portal — CHANGELOG

## About This App

### What the Merchant Portal Is

The Omeru Merchant Portal (`hq.omeru.io`) is a **web-first dashboard for merchants** who need a screen-sized control centre — a complement to the existing WhatsApp-native tools. It authenticates via OTP sent to the merchant's registered WhatsApp number, then exposes a full command surface: real-time order Kanban, product catalogue management, revenue dashboards, and store open/close control.

It connects to the same Supabase PostgreSQL database as `OmeruHQ-main` (the backend bot) and `hq.omeru.io-main` (the customer storefront), but is a completely separate Next.js application. No shared code, no API gateway — direct Prisma queries, JWT session in an HTTP-only cookie.

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
- `merchant-portal-main/` — New Next.js 16 App Router project
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

v0.1.0 is the initial commit. Rolling back removes the entire `merchant-portal-main/` directory.

---

*Next entry: v0.2.0 — Phase 2 (Services, Settings, Broadcast, Team)*
