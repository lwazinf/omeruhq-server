# OmeruWA — WhatsApp Bot Backend CHANGELOG

> 📍 **Log map:** this file is indexed in [`docs/logs/INDEX.md`](./INDEX.md) alongside every other app log in the ecosystem.

## About This App

### What OmeruWA Bot Is

OmeruWA is the **backend engine of the Omeru WhatsApp commerce platform** — a Node.js/TypeScript server that turns a single WhatsApp number into a full-featured e-commerce system for South African merchants. It processes every incoming WhatsApp message, routes it to the correct business logic, and responds with the appropriate UI (buttons, lists, images, text) — all in real time.

There is no separate customer-facing app, no merchant portal, and no POS terminal. The bot replaces all three. Merchants manage their entire business — inventory, orders, customer broadcasts, bookings, analytics — from their personal WhatsApp. Customers browse, cart, and pay without ever downloading anything.

### Why It Is Important

South Africa has **47 million WhatsApp users** — a higher per-capita penetration than any other messaging platform. The vast majority of small SA businesses have no web presence, no payment infrastructure, and no order management system. Omeru solves all three with a single WhatsApp number, collapsing a €500+/month software stack into a R199–R999/month service that works on any Android or iPhone.

The bot is the primary product. Without it, the web storefronts (`hq.omeru.io`) are empty shells and the platform has no value. Every feature the merchant sees, every rand a customer spends, and every audit trail the platform admin relies on is processed here.

### Business Use Cases

| Use Case | How It Works | Value |
|----------|-------------|-------|
| **Merchant onboarding** | Guided 15-step setup via WhatsApp — store name, photo, KYC, banking, first product | Merchant is live in < 24 hours, no technical skill needed |
| **Product catalogue management** | Add/edit/archive products with photos, prices, variants, categories — all from WhatsApp | Replaces a website CMS |
| **Order management (Kitchen)** | Merchant receives instant order notifications, marks orders Ready/Collected | Replaces a POS and order management system |
| **Customer cart & checkout** | Customers browse, add to cart, apply address, pay via Stitch instant EFT | Replaces a shopping app |
| **Services & bookings** | Merchants offer bookable time slots; customers pick day/time; merchant confirms | Replaces a booking platform (Calendly/Fresha) |
| **Customer broadcasts** | Merchant sends promotions to opted-in customers via WhatsApp | Replaces email marketing, at higher open rates |
| **Analytics & stats** | Revenue by period, top sellers, customer count, pending orders — all in one dashboard message | Replaces a reporting dashboard |
| **Platform administration** | Admin invites merchants, manages branding, monitors all activity via audit logs | Full platform control without a web admin panel |
| **Review & feedback loop** | Customers rate completed orders; merchant sees feedback; low ratings trigger alerts | Replaces a reviews platform |
| **Multi-staff management** | Merchant owners can invite staff via WhatsApp; staff complete a guided orientation tour | Replaces HR onboarding for store operations |

---

> **Rules that govern every entry in this file:**
> 1. **Surgical changes only.** Touch nothing outside the scope of the stated fix.
> 2. **Always start from a working state.** No commit may leave the bot in a broken condition.
> 3. **We do not create bugs.** Every change is reviewed against the Known Issues list and the scores below.
> 4. **Every entry must include:** what changed · why · date · time · version bump.
> 5. **Scores are recalculated** on every release that materially changes behaviour.
> 6. **Priority order for fixes** is defined in the Roadmap section. Do not reorder without discussion.
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
| path/to/file.ts | 291 | `message.image.id` |
```

For multi-line changes, the full before-block is pasted verbatim in a fenced code block beneath the table.

> **Current rollback state: v1.12.0** — all changes through the security, load-balancing, Redis rate limiter, Sentry, and test suite phases are live.

---

## Vision & Build Map

### What Omeru Bot Is Building Towards

Omeru is a **zero-friction WhatsApp commerce platform** for South African merchants. The bot is the transaction layer — it replaces a mobile app, a website, and a POS terminal for small businesses, all operating inside a WhatsApp conversation.

### Platform Goals

| Goal | Target | Current State |
|------|--------|---------------|
| Merchant live in < 24h from invite | ✅ Onboarding flow complete | Achieved — web KYC removes upload friction |
| Zero-downtime deployments | ✅ SIGTERM graceful shutdown | Achieved v1.9.0 |
| Verified webhook security | ✅ HMAC timing-safe comparison | Achieved v1.7.0 |
| Bot handles 100+ msg/min safely | ✅ Per-wa_id rate limiting | Achieved v1.7.0; Redis persistence pending |
| Full audit trail for every action | ✅ PlatformEvent + OrderStatusHistory | Live since v1.0.0 |
| Multi-instance horizontal scaling | ⚡ Redis-ready but REDIS_URL not set | Rate limiter ready, needs env provisioning |
| No double-charges on retry | ⚡ Dedup guard live; old links not voided | Partially — issue #4 open |
| Error visibility in production | ✅ Sentry wired | Achieved v1.11.0; needs DSN in Koyeb env |

### User Roles

| Role | Description | Entry Point |
|------|-------------|-------------|
| **Customer** | Browses stores, adds to cart, buys products or books services | Any message to the bot number |
| **Merchant** | Manages their WhatsApp store: products, orders, broadcasts, settings | `@handle_admin` or `switch` |
| **Platform Admin** | Manages the entire Omeru platform: invites, merchants, branding | `PLATFORM_ADMIN_NUMBERS` env var |

### Implemented Flows

| Module | File | Status |
|--------|------|--------|
| Message routing & session management | `handler.ts` | ✅ Live |
| Webhook HMAC signature verification | `index.ts` | ✅ Live — v1.7.0 |
| Per-user rate limiting (30 msg/min) | `lib/rateLimit.ts` | ✅ Live — v1.7.0 |
| Input sanitization (null bytes, 1000-char cap) | `handler.ts` | ✅ Live — v1.7.0 |
| Status summary (`status` / `where` command) | `handler.ts` | ✅ Live — v1.8.0 |
| In-store product search fallback | `customerDiscovery.ts` | ✅ Live — v1.8.0 |
| Merchant onboarding (15+ step guided setup) | `onboardingEngine.ts` | ✅ Live |
| Web KYC onboarding alternative | `onboardingEngine.ts` | ✅ Live — v1.6.0 |
| Merchant dashboard (2-bubble consolidated) | `merchantDashboard.ts` | ✅ Live — v1.3.0 |
| Product/inventory management | `merchantInventory.ts` | ✅ Live |
| Kitchen — split Unpaid / To Prepare / Ready | `merchantKitchen.ts` | ✅ Live — v1.2.0 |
| Merchant settings | `merchantSettings.ts` | ✅ Live |
| Broadcasts to customers | `merchantBroadcast.ts` | ✅ Live |
| Services & bookings (merchant side) | `merchantServices.ts` | ✅ Live |
| Customer store discovery & cart | `customerDiscovery.ts` | ✅ Live |
| Customer orders & feedback | `customerOrders.ts` | ✅ Live |
| Customer bookings | `customerBookings.ts` | ✅ Live |
| Customer address management | `customerAddress.ts` | ✅ Live |
| Platform admin panel | `platformAdmin.ts` | ✅ Live |
| Platform branding (white-label) | `platformBranding.ts` | ✅ Live |
| Stitch payment integration | `payments/stitch.ts` | ✅ Live |
| Order stale reminders (cron) | `jobs/orderAlerts.ts` | ✅ Live |
| Booking reminders (cron) | `jobs/bookingReminders.ts` | ✅ Live |
| Abandoned cart nudge (cron, 2–2.5h window) | `index.ts` | ✅ Live |
| Audit logging | `auditLog.ts` | ✅ Live |
| WhatsApp media persistence | `media/storage.ts` | ✅ Live |
| Multi-staff / invite system | `handler.ts` | ✅ Live |
| Wishlist & bookmarks | `customerDiscovery.ts` | ✅ Live |
| Customer reviews / ratings | `customerOrders.ts`, `merchantKitchen.ts` | ✅ Live |
| Product variants (size/colour) | `merchantInventory.ts`, `customerDiscovery.ts` | ✅ Live |
| Product categories (merchant) | `merchantInventory.ts` | ✅ Live |
| Platform-level store categories (browse) | `customerDiscovery.ts` | ✅ Fixed — v1.1.0 |
| Browse-by-category tappable list | `customerDiscovery.ts` | ✅ Fixed — v1.4.0 |
| Redis-backed rate limiter (multi-instance) | `lib/rateLimit.ts` | ⚡ Ready — REDIS_URL not provisioned |
| Sentry error tracking | `index.ts` | ⚡ Wired — SENTRY_DSN not provisioned |
| Unit test suite | `src/lib/rateLimit.test.ts` | ✅ Live — v1.12.0 |
| Discount codes / promotions | — | ❌ Roadmap |
| Scheduled broadcasts | — | ❌ Roadmap |
| Global product text search | — | ❌ Roadmap |
| Analytics export (CSV) | — | ❌ Roadmap |
| Multi-location support | — | ❌ Roadmap |
| Payout management | — | ❌ Roadmap |

---

## Current Scores

> Last updated: **2026-06-24** | Version: **v1.12.0**

| Dimension | Score | Justification |
|-----------|-------|---------------|
| **Usability** | 8.5/10 | Global commands (`status`, `cart`, `where`) surface context anywhere. In-store search works. Orders paginated. Category browse tappable. Deductions: no global product text search, no back nav in onboarding, product detail loses page position. |
| **Security** | 9.0/10 | Webhook HMAC with timing-safe comparison. Per-wa_id sliding-window rate limiter. Input sanitization (null bytes, 1000-char). ADMIN_SETUP_KEY guard. Trust-proxy correct IP detection. Deductions: rate limiter in-memory (Redis not provisioned), SENTRY_DSN not in env. |
| **Reliability** | 9.0/10 | KYC permanently persisted. Dedup guard prevents double-orders. Hours validated. Graceful SIGTERM shutdown drains in-flight requests. keepAliveTimeout above LB idle. Sentry wired. Deductions: old payment links not voided on retry, no session-state timeout, Redis not live. |
| **User Experience** | 8.5/10 | Dashboard consolidated. Kitchen split. Cart prompt shows count+value. Deep-link bot commands (`prod_`, `cbk_svc_`, `c_book_`) open correct flows from web CTAs. sendStatusSummary gives clear context. Deductions: store listing noisy (5–6 bubbles/page), feedback rating text format. |
| **Logical Pathways** | 8.75/10 | Category routing correct. Kitchen state machine clean. Orders pagination routed. Dedup guard in correct place. `ADDR_FLOW` escape covers known cases. Deductions: `active_prod_id` overloaded, no flow-state timeout, `ADDR_FLOW` escape still narrow. |
| **Overall Average** | **8.75/10** | Platform is production-ready for all core flows. Security posture is strong. Infrastructure gaps (Redis, Sentry DSN) are env-var provisioning tasks, not code gaps. Remaining code gaps are UX polish. |

---

## Known Issues

### ✅ RESOLVED

| # | Issue | Fixed In | Fix Summary |
|---|-------|----------|-------------|
| 1 | Category slug/value mismatch — browse returned 0 results | v1.1.0 | Aligned slugs to display names in onboarding + discovery |
| 2 | KYC images stored as expiring WhatsApp media IDs | v1.2.0 | `persistWhatsAppImage` downloads to permanent storage |
| 3 | Order creation not idempotent — double-tap duplicate orders | v1.3.0 | 2-minute dedup window checks for existing order before create |
| 6 | Kitchen mixed unpaid and paid orders | v1.2.0 | Split into Unpaid (read-only) / To Prepare (PAID) / Ready |
| 7 | Dashboard sent 4 sequential bubbles | v1.3.0 | Consolidated to 2 messages (main card + list) |
| 10 | Browse-by-category stores shown as plain untappable text | v1.4.0 | `sendListMessage` where row id = `@handle` |
| 12 | Customer orders capped at 5, no pagination | v1.5.0 | Full pagination with Prev/Next buttons |
| 15 | Hours input accepted garbage values | v1.4.0 | `parseHoursInput` regex validates HH:MM format |
| 16 (partial) | No in-store product text search | v1.8.0 | Free-text search queries last-visited merchant's catalogue |
| 19 | Cart-switch prompt showed no context | v1.8.0 | Prompt now shows existing cart count + total value |

---

### 🔴 CRITICAL

*No critical issues currently open.*

---

### 🟠 HIGH

| # | Issue | File | Impact |
|---|-------|------|--------|
| 4 | **Multiple valid payment links per order** — Each `retry_payment_` call creates a new Stitch link without voiding the previous one. Both links can succeed, causing a double-charge on the same order. | `handler.ts` | Double-charge risk — financial liability |
| 5 | **Booking slots use server-local time** — Slot generation uses `date.getDay()` / `date.getHours()` in Node.js process timezone. No `merchant_timezone` stored. Slots shown incorrectly if server runs outside SAST (UTC+2). | `customerBookings.ts` | Wrong availability on Koyeb EU/US regions |

---

### 🟡 MEDIUM

| # | Issue | File | Impact |
|---|-------|------|--------|
| 8 | **Store product listing creates 5–6 message bubbles per page** — Each page sends: 3 product cards + nav + bookings bubble + bookmarks bubble. Opens a flood on every store visit. | `customerDiscovery.ts` | Message clutter, poor first impression |
| 9 | **No back navigation in onboarding** — Zero `← Back` buttons across all 15+ onboarding steps. A mistake at step 8 requires completing the entire flow before re-entering. | `onboardingEngine.ts` | Merchant drop-off during setup |
| 11 | **No expiry on abandoned flow states** — `ADDR_FLOW`, `cart_qty_*`, `feedback_text_*` states persist indefinitely if user abandons mid-flow. Re-entering the bot days later finds them stuck in an address prompt. | `handler.ts` | Users get trapped; confusing re-entry experience |
| 13 | **`active_prod_id` is overloaded** — Used simultaneously for UI flow state (`ADDR_FLOW`, `cart_qty_*`) and onboarding step tracking. The dual purpose makes routing logic hard to follow and test. | `handler.ts`, `merchantEngine.ts` | Code complexity; future routing bugs likely |
| 14 | **`ADDR_FLOW` escape is too narrow** — Only 3 hardcoded button IDs break out of the address flow. Any unexpected button press traps the user until they send one of the magic IDs. | `handler.ts` | Users get stuck; requires manual intervention |
| 20 | **Rate limiter is in-memory and resets on restart** — `REDIS_URL` is not provisioned in the Koyeb environment. Every deploy or crash resets all rate-limit counters. Rate limits also don't coordinate if >1 instance runs. | `lib/rateLimit.ts` | Security gap on deploys; ineffective at scale |

---

### 🔵 LOW

| # | Issue | File | Impact |
|---|-------|------|--------|
| 16 | **No global product text search across merchants** — In-store search (v1.8.0) searches only the last-visited merchant's catalogue. A customer who doesn't know which merchant sells X cannot search platform-wide. | `customerDiscovery.ts` | Low product discoverability for new users |
| 17 | **No back button from product detail** — Tapping back on a product card returns to page 1 of the store, losing the user's pagination position. | `customerDiscovery.ts` | Breaks browsing flow on large catalogues |
| 18 | **Feedback rating format non-obvious** — Rating is a free-text message: `5 - Great food`. A button-based 1–5 star rating would be lower friction and produce more consistent data. | `customerOrders.ts` | Low feedback completion rate |
| 21 | **No integration tests for bot flows** — Unit tests cover the rate limiter only. Core bot commands (cart, checkout, kitchen, broadcasts) have no automated coverage. | `src/lib/` | Regressions possible on refactors |
| 22 | **SENTRY_DSN not set in Koyeb env** — Sentry is wired in code but the DSN env var is absent. All unhandled exceptions log to console only; no alert reaches the team. | `src/index.ts` | No production error visibility |

---

## Changelog Entries

### v1.0.0 — 2026-06-21 09:00 SAST
**Initial codebase audit and baseline scoring. No code changes.**

- Full audit of all 28 source files under `src/services/whatsapp/`, `src/services/payments/`, `src/services/jobs/`, `src/lib/`
- Established baseline scores across all four dimensions
- Documented 19 known issues (2 critical, 4 high, 8 medium, 5 low)
- Created this CHANGELOG.md as the persistent project memory document
- No regressions introduced — no code was changed

**What the app can do at v1.0.0:** All flows operational except browse-by-category (silently returns 0 results for all categories). KYC images stored but will expire ~30 days after submission. Kitchen mixes unpaid and paid orders. Dashboard sends 4 message bubbles. All other flows functional.

---

### v1.1.0 — 2026-06-21 17:15 SAST
**Fix #1 — Category slug/value mismatch. Browse-by-category now works.**

**Score impact:** UX 6→7 · Logical 7→8

**What the app can do at v1.1.0:** Browse-by-category is fully functional. Customers can filter by Food & Drink, Fashion, Beauty, Tech, Home, Services, General. Merchants onboarded before v1.1.0 still appear under "All Stores" until a one-time DB migration aligns historical category strings.

### Rollback to v1.0.0
| File | Lines | Before |
|------|-------|--------|
| `onboardingEngine.ts` | 197–198 | `cat_food: 'Food & Drink', cat_fashion: 'Fashion', cat_beauty: 'Beauty & Wellness', cat_electronics: 'Electronics', cat_home: 'Home & Garden', cat_other: 'Other'` |
| `customerDiscovery.ts` | 413 | `if (activeSlugs.has(cat.slug)) {` |
| `customerDiscovery.ts` | 434 | `whereClause.store_category = slug;` |

---

### v1.2.0 — 2026-06-21 17:45 SAST
**Fix #2 — KYC images permanently persisted. Fix #6 — Kitchen split into Unpaid / To Prepare.**

**Score impact:** Reliability 6→8 · UX 6→7

**What the app can do at v1.2.0:** KYC compliance documents are safe. Merchants see a clean split between orders awaiting payment and orders to prepare.

### Rollback to v1.1.0
| File | Lines | Before |
|------|-------|--------|
| `onboardingEngine.ts` | 289–290 | `data: { kyc_id_doc_url: message.image.id }` |
| `onboardingEngine.ts` | 298–301 | `data: { kyc_bank_proof_url: message.image.id, kyc_submitted_at: new Date() }` |
| `merchantKitchen.ts` | 22–38 | Kitchen counted `{ in: ['PENDING', 'PAID'] }` as one `newCount`; single "New Orders" button |
| `merchantKitchen.ts` | 85 | `where: { merchant_id: merchant.id, status: { in: ['PENDING', 'PAID'] } }` |

---

### v1.3.0 — 2026-06-21 17:50 SAST
**Fix #3 — Duplicate order prevention. Fix #7 — Dashboard consolidated 4 bubbles → 2 messages.**

**Score impact:** Reliability 8→8.5 · UX 7→8

**What the app can do at v1.3.0:** Double-tapping checkout no longer creates duplicate orders. Merchant dashboard is clean — 2 messages instead of 4.

### Rollback to v1.2.0
| File | Lines | Before |
|------|-------|--------|
| `customerDiscovery.ts` | 709–713 | No dedup check before `db.order.create` |
| `merchantDashboard.ts` | 160–181 | Four `sendButtons` calls; no `sendListMessage` |

---

### v1.4.0 — 2026-06-21 17:55 SAST
**Fix #10 — Category browse now shows tappable store list. Fix #15 — Hours input validated with HH:MM regex.**

**Score impact:** Usability 7→8 · Reliability 8.5→8.75

**What the app can do at v1.4.0:** Customers tap to open stores from browse results. Hours data is always valid HH:MM format for new merchants.

### Rollback to v1.3.0
| File | Lines | Before |
|------|-------|--------|
| `customerDiscovery.ts` | 461–488 | `sendTextMessage` with plain text `@handle — Name` list |
| `onboardingEngine.ts` | 244–267 | `if (input.includes('-'))` only; no `parseHoursInput` helper |

---

### v1.5.0 — 2026-06-21 18:00 SAST
**Fix #12 — Customer orders list paginated (was capped at 5).**

**Score impact:** Usability 8→8.5

**What the app can do at v1.5.0:** Customers can page through their full order history.

### Rollback to v1.4.0
| File | Lines | Before |
|------|-------|--------|
| `customerOrders.ts` | 10–39 | `take: 5`, no pagination, `sendButtons` with first 3 orders as buttons |
| `handler.ts` | 345 | No `c_my_orders_p` prefix routing |

---

### v1.6.0 — 2026-06-21 20:10 SAST
**New feature — Web KYC onboarding. Merchants complete identity verification on a secure web page.**

**Score impact:** Usability 8.5→9 · Reliability 8.75→9

**What the app can do at v1.6.0:** New merchants choose WhatsApp or web link for KYC. Link is UUID-gated, 7-day expiry, resumable. Bot detects completion and continues onboarding.

### Rollback to v1.5.0
| File | Lines | Before |
|------|-------|--------|
| `prisma/schema.prisma` | 90–93 | No `kyc_token`, `kyc_token_expires_at`, `kyc_draft_json`, `kyc_online_completed` fields |
| `onboardingEngine.ts` | NEXT_STEP map | `ob_hours_sat: 'ob_kyc_intro'` — no `ob_kyc_method` or `ob_kyc_waiting` |

*New files to delete on rollback:* `OmeruIO/app/kyc/[token]/page.tsx`, `KycForm.tsx`, `app/api/kyc/[token]/route.ts`

---

### v1.7.0 — 2026-06-23 14:00 SAST
**Security hardening — webhook HMAC verification, per-user rate limiting, input sanitization, admin guard.**

**Why this mattered:** The WhatsApp webhook endpoint was unauthenticated — any HTTP client could forge messages and trigger bot flows, place orders, or consume sessions without being a real WhatsApp user. The `/admin/stitch-setup` endpoint had no access control. Input passed directly from the message body to DB queries and message templates with no length or content sanitization.

**What changed:**

*`src/index.ts`*
- Added `import crypto from 'crypto'`
- Added `verifyMetaSignature(rawBody, sig, secret)` — timing-safe HMAC-SHA256 comparison using `crypto.timingSafeEqual`; prevents timing-based signature forgery
- Moved WhatsApp POST webhook handler to before `express.json()` using `express.raw({ type: 'application/json' })` — same pattern as the existing Stitch webhook, required to access raw Buffer for HMAC
- Signature check runs *after* `res.status(200).send('OK')` to satisfy Meta's 20-second acknowledgement requirement; invalid requests are silently dropped
- Added `ADMIN_SETUP_KEY` guard to `/admin/stitch-setup` — checks `x-admin-key` header before exposing webhook registration endpoint

*`src/lib/rateLimit.ts`* (new file)
- Sliding-window in-memory rate limiter using a `Map<string, {count, resetAt}>`
- Exports `isRateLimited(key, maxRequests, windowMs): boolean`
- `setInterval(...).unref()` sweeps expired entries every 5 min — prevents unbounded memory growth without keeping the process alive

*`src/services/whatsapp/handler.ts`*
- Added `import { isRateLimited } from '../../lib/rateLimit'`
- Added rate limiting at message entry: `if (isRateLimited(\`wa:${from}\`, 30, 60_000)) return;` — drops messages from any number sending >30/min
- Added input sanitization: `String(buttonId || listId || textBody || '').replace(/\0/g, '').trim().slice(0, 1000)` — strips null bytes, trims whitespace, caps at 1000 chars before any routing logic

**Score impact:** Security 0→9 (new dimension) · Reliability 9→9

### Rollback to v1.6.0

```
// src/index.ts — remove these imports:
import crypto from 'crypto';

// src/index.ts — remove verifyMetaSignature function (lines 17–23)

// src/index.ts — the WhatsApp POST handler was registered AFTER express.json()
// and had no signature check; delete the new handler and restore the old position

// src/index.ts — remove ADMIN_SETUP_KEY guard block from /admin/stitch-setup
```

*Files to delete on rollback:* `src/lib/rateLimit.ts`

| File | Lines | Before |
|------|-------|--------|
| `handler.ts` | top of `handleIncomingMessage` | No rate-limit check |
| `handler.ts` | input extraction | `const input = ...` with no `.replace(/\0/g, '').trim().slice(0, 1000)` |

---

### v1.8.0 — 2026-06-23 15:30 SAST
**Bot UX — `status` command, in-store search, cart-switch context, deep-link bot commands.**

**Why this mattered:** Customers had no way to see their session context without visiting a specific store. Free-text messages that didn't match a command fell through silently instead of searching. The cart-switch prompt showed no context about what the user would lose. WhatsApp CTAs on the web storefronts all sent `@handle`, losing the specific product/service context the user was viewing.

**What changed:**

*`src/services/whatsapp/handler.ts`*
- Added `sendStatusSummary(from, session)` function — sends a contextual summary card showing current cart, last merchant, and 2–3 recovery buttons
- Added global keyword routing: `status`, `where` → `sendStatusSummary`; `cart` → `c_cart` handler
- Added merchant-in-customer greeting detection: if a merchant number messages the bot while not in merchant mode, routes them to merchant dashboard

*`src/services/whatsapp/customerDiscovery.ts`*
- In-store search fallback: when free text doesn't match a button ID or command, the bot now queries `db.product.findMany` against the last-visited merchant's catalogue using `contains` search on name + description. Returns up to 5 product cards. Replaces the silent no-op fallthrough.
- Improved cart-switch prompt: shows existing cart item count and total value (`3 items · R 450`) so the customer knows what they'd be replacing before tapping "Switch Store"
- Improved cart-switch button labels: "Keep (3 items)" instead of generic "Keep cart"

*Bot command protocol aligned with web CTA deep-links:*
- Web storefront "Order on WhatsApp" now sends `prod_{productId}` — bot handles with `prod_` prefix routing to open that exact product
- Web "Book on WhatsApp" sends `cbk_svc_{serviceId}` — bot opens booking flow for that service
- Web "Book a service" hero sends `c_book_{merchantId}` — bot opens full services list for that merchant

**Score impact:** UX 8→8.5 · Usability 8.5 (maintained)

### Rollback to v1.7.0
| File | Lines | Before |
|------|-------|--------|
| `handler.ts` | — | No `sendStatusSummary` function; no `status`/`where`/`cart` keyword routing |
| `customerDiscovery.ts` | free-text fallthrough | Silent return; no product search query |
| `customerDiscovery.ts` | cart-switch prompt | Generic text: "You already have items in your cart" with no count/value; buttons: generic labels |

---

### v1.9.0 — 2026-06-23 16:00 SAST
**Load balancing readiness — trust proxy, keepAliveTimeout, SIGTERM graceful shutdown.**

**Why this mattered:** The server ran `app.listen()` with no reference captured. `req.ip` returned the load balancer's IP, breaking all per-IP rate limiting. keepAliveTimeout was at Node's default (5s), below typical load balancer idle timeout (60s), causing random 502 errors. No SIGTERM handler meant rolling deploys killed in-flight requests mid-response.

**What changed:**

*`src/index.ts`*
- `app.set('trust proxy', 1)` — tells Express to read `X-Forwarded-For`; first hop is the load balancer, so `req.ip` now returns the real client IP
- Changed `app.listen(...)` to `const server = app.listen(...)` — captures server reference for timeout + shutdown control
- `server.keepAliveTimeout = 65_000` — above Koyeb/typical LB idle timeout of 60s; prevents 502 errors on idle connections
- `server.headersTimeout = 66_000` — must exceed keepAliveTimeout; prevents Node from closing a connection before LB considers it alive
- Added `process.on('SIGTERM', ...)` handler — calls `server.close()` to stop accepting new connections, awaits DB disconnect, then exits. 15s forced-exit safety timeout with `.unref()`.

**Score impact:** Reliability 9→9 (ceiling maintained — deployment safety gap closed)

### Rollback to v1.6.0 (before v1.7.0 security changes)
| File | Lines | Before |
|------|-------|--------|
| `index.ts` | after `const app = express()` | No `app.set('trust proxy', 1)` |
| `index.ts` | server start | `app.listen(Number(PORT), '0.0.0.0', () => { ... })` — result not captured |
| `index.ts` | end of file | No `server.keepAliveTimeout`, `server.headersTimeout`, or SIGTERM handler |

---

### v1.10.0 — 2026-06-24 10:00 SAST
**Redis-backed rate limiter — ioredis with in-memory fallback. `isRateLimited` now async.**

**Why this mattered:** The in-memory rate limiter resets on every deploy and crash. When the app runs on more than one instance, each instance has its own counter — a single user could send 30 × N messages per minute, where N is the number of instances. The fix uses Redis INCR + PEXPIRE for atomic, shared, persistent counters.

**What changed:**

*`src/lib/rateLimit.ts`* (full rewrite)
- Added `import Redis from 'ioredis'` — package was already installed
- Creates ioredis client only when `REDIS_URL` env var is set; silently falls back to in-memory if not set or if Redis errors
- Redis path: `INCR key` → if count === 1, `PEXPIRE key windowMs` (atomic first-write sets TTL) → return `count > maxRequests`
- In-memory path: unchanged sliding-window logic with Map + sweep interval
- `isRateLimited` changed from `(): boolean` to `(): Promise<boolean>` — required to await Redis I/O

*`src/services/whatsapp/handler.ts`*
- `if (isRateLimited(...))` → `if (await isRateLimited(...))` — no behaviour change since `handleIncomingMessage` is already async

**Env var required to activate Redis:** `REDIS_URL=redis://...` in Koyeb environment. Without it, behaviour is identical to v1.7.0.

**Score impact:** Security 9→9 (ceiling raised toward 9.5 once REDIS_URL is provisioned)

### Rollback to v1.9.0

```typescript
// src/lib/rateLimit.ts — restore full in-memory only version:
interface Entry { count: number; resetAt: number }
const store = new Map<string, Entry>();
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        if (entry.resetAt <= now) store.delete(key);
    }
}, 5 * 60 * 1000).unref();

export function isRateLimited(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = store.get(key);
    if (!entry || entry.resetAt <= now) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return false;
    }
    if (entry.count >= maxRequests) return true;
    entry.count++;
    return false;
}
```

| File | Lines | Before |
|------|-------|--------|
| `handler.ts` | rate limit check | `if (isRateLimited(\`wa:${from}\`, 30, 60_000)) {` (sync, no await) |

---

### v1.11.0 — 2026-06-24 11:00 SAST
**Sentry error tracking — `@sentry/node` v10, `setupExpressErrorHandler`, opt-in via `SENTRY_DSN`.**

**Why this mattered:** Unhandled Express errors and uncaught promise rejections logged to stdout only. On Koyeb, stdout logs are ephemeral — a crash that's not caught in the monitoring window leaves no trace. The team had no alert when the bot threw a 500.

**What changed:**

*`src/index.ts`*
- `import * as Sentry from '@sentry/node'` added as the first import after `dotenv/config`
- `Sentry.init({ dsn: process.env.SENTRY_DSN, environment, tracesSampleRate: 0.1 })` — only runs when `SENTRY_DSN` is set; silently no-ops in local dev
- `Sentry.setupExpressErrorHandler(app)` registered immediately before `app.listen()` — must be last middleware, after all routes

**Env var required:** `SENTRY_DSN=https://...@sentry.io/...` in Koyeb environment.

**Score impact:** Reliability 9→9.5 (ceiling) once SENTRY_DSN is provisioned

### Rollback to v1.10.0
| File | Lines | Before |
|------|-------|--------|
| `index.ts` | line 1–2 | `import 'dotenv/config';` — no Sentry import or init block |
| `index.ts` | before `app.listen` | No `Sentry.setupExpressErrorHandler(app)` call |

---

### v1.12.0 — 2026-06-24 11:30 SAST
**Test suite — Jest + ts-jest, 5 unit tests for rate limiter, `npm run test`.**

**Why this mattered:** Zero automated tests. Any change to routing or utility code had no safety net. The rate limiter in particular is a correctness-critical piece (wrong logic = security gap) that deserves unit coverage.

**What changed:**

*New files:*
- `jest.config.ts` — preset `ts-jest`, env `node`, roots `src/`, matches `**/*.test.ts`
- `src/lib/rateLimit.test.ts` — 5 tests: allows first request, counts to max, blocks on exceed, resets after window, tracks keys independently. Mocks `ioredis` to avoid needing a live Redis.

*`package.json`*
- Added `"test": "jest"` to scripts

**Coverage:** Rate limiter unit tested. Integration tests for bot flows remain a roadmap item.

### Rollback to v1.11.0

*Files to delete:* `jest.config.ts`, `src/lib/rateLimit.test.ts`

| File | Before |
|------|--------|
| `package.json` scripts | No `"test"` entry |

---

### v1.13.0 — 2026-06-30 SAST
**OmeruWA: WhatsApp bot number updated from 27750656348 → 27705736794 across code, env files, and context docs.**

**What changed:**

*`src/index.ts`*
- Hardcoded fallback in `waLink` construction updated from `27750656348` to `27705736794`

*`.env.example`*
- `WHATSAPP_PHONE_NUMBER` default updated from `27750656348` to `27705736794`

*`context/OMERU_PROJECT_CONTEXT.md` and `context/platformTechnical.md`*
- Example/reference values for `WHATSAPP_PHONE_NUMBER` updated to `27705736794`

**Note:** Live `.env` already contained the correct value (`27705736794`) — only the fallback and documentation references were stale.

### Rollback to v1.12.0

| File | Change to reverse |
|------|------------------|
| `src/index.ts` | Revert `waLink` fallback to `'27750656348'` |
| `.env.example` | Set `WHATSAPP_PHONE_NUMBER="27750656348"` |
| `context/OMERU_PROJECT_CONTEXT.md` | Revert `WHATSAPP_PHONE_NUMBER` example to `27750656348` |
| `context/platformTechnical.md` | Revert `WHATSAPP_PHONE_NUMBER` default column to `27750656348` |

---

## Roadmap — Next Fixes (Priority Order)

> All fixes must be surgical. Each fix gets its own changelog entry with before/after scores.

### Immediate — Infrastructure (no code changes, env-var provisioning only)

| Priority | Item | Action | Unlocks |
|----------|------|--------|---------|
| 1 | Provision `SENTRY_DSN` | Add to Koyeb env | Production error visibility — v1.11.0 activates |
| 2 | Provision `REDIS_URL` | Add to Koyeb env (Redis add-on or Upstash) | Persistent multi-instance rate limiting — v1.10.0 activates |

### Code — Open Issues

| Priority | Issue # | Status | Fix Description | Score Impact |
|----------|---------|--------|-----------------|--------------|
| 3 | #4 | 🔲 Next | Void old Stitch payment link on `retry_payment_` | Reliability +0.5 |
| 4 | #11 | 🔲 Next | Session state timeout — ADDR_FLOW, cart_qty_* expire after 30 min of inactivity | Reliability +0.5, UX +0.5 |
| 5 | #8 | 🔲 Next | Reduce store listing to 1 consolidated message (list + nav in one bubble) | UX +0.5 |
| 6 | #5 | 🔲 Next | Store `merchant_timezone` (default SAST), use it for booking slot generation | Reliability +0.5 |
| 7 | #18 | 🔲 Next | Button-based 1–5 star feedback rating | Usability +0.5 |
| 8 | #9 | 🔲 Next | Back navigation in onboarding (← Back at each step) | UX +0.5 |
| 9 | #17 | 🔲 Next | Back button from product detail restores pagination position | UX +0.25 |
| 10 | #14 | 🔲 Next | Widen ADDR_FLOW escape to any non-address input | Reliability +0.25 |
| 11 | #21 | 🔲 Next | Integration test suite (supertest + mocked WhatsApp sender) | Reliability +0.5 |

---

## Enhancement Opportunities (Aspirational — v2.x)

These are forward-looking improvements beyond bug fixes. Each would materially expand the platform's commercial value.

| Enhancement | Why | Complexity | Score Impact |
|------------|-----|------------|--------------|
| **Global product text search** | `search [term]` queries all active merchant catalogues — first step toward a true marketplace UX | Medium | Usability +0.5 |
| **Discount codes / promotions** | Merchant creates a code; customer applies at cart confirm; order total adjusted before Stitch link generated | Medium | Usability +1, UX +0.5 |
| **Scheduled broadcasts** | Merchant sets a time + message; cron sends at that moment | Medium | Usability +0.5 |
| **Analytics export (CSV)** | `send_report csv` command emails or sends a download link with revenue, orders, top products | Medium | Usability +0.5 |
| **WhatsApp template messages** | Register approved templates for sending promotions outside the 24-hour messaging window | High | Business critical for marketing |
| **Appointment cancellation flow** | Customer or merchant cancels a booking; both parties notified; slot freed | Medium | UX +0.5 |
| **Referral tracking** | `ref_[code]` system — merchants earn credit when a referred customer places their first order | High | Revenue model enabler |
| **Multi-location support** | Merchant registers multiple physical locations; customer picks nearest at checkout | High | Expansion enabler |
| **Merchant analytics digest** | Daily WhatsApp digest: "Yesterday: 12 orders, R4,200 revenue, 3 new customers" | Low | Merchant retention |
| **Payout management** | Track what Omeru owes each merchant; mark as paid; merchant sees payout history | High | Financial operations |
| **Integration test suite (full)** | Supertest-based tests for all major bot commands using a mocked WhatsApp sender and in-memory DB | High | Engineering safety net |

### v1.14.0 — 2026-07-01 SAST — Platform mode flags: demo mode + merchant actions via HQ

> ⚠️ First entry authored under the new ecosystem direction: **WhatsApp becomes notifications-only for merchants; Omeru HQ is the full merchant suite.** All changes are feature-flagged and default-safe.

**What changed:**

*`src/config/mode.ts` (new)*
- `isDemoMode()` ← `DEMO_MODE` env ("true"/"false", default false)
- `demoStoreHandle()` ← `DEMO_STORE_HANDLE` (default `stitch`)
- `merchantActionsViaHQ()` ← `MERCHANT_ACTIONS_VIA_HQ` (default **true**)
- `hqUrl()` ← `HQ_URL` (default `https://hq.omeru.io`)
- `storeVisibilityFilter()` — Prisma where-fragment: demo mode → only the demo store is discoverable; live mode → the demo store is **excluded** from browse (the "stitch easter eggs" are hidden)

*`src/services/whatsapp/customerDiscovery.ts`*
- `...storeVisibilityFilter()` spread into all three store-discovery queries: category listing (`store_category not null`), total-store count, and the paged browse `whereClause`
- Direct `@handle` entry is intentionally NOT filtered — the demo store stays reachable by handle in live mode for internal testing, it just never appears in browse

*`src/services/whatsapp/handler.ts`*
- `handleSwitchMode`: in demo mode, the active demo store is fetched by handle and offered to **everyone** in the SwitchOmeru menu — as a `🧵` button (≤ 3 options) or list row (4+). Customer-visible copy is deliberately neutral ("Browse & shop") — **front users are never shown the words demo/maintenance**; platform mode is only ever visible to admins inside cr.omeru.io
- New `sw_demo_store` selection: resets the session to CUSTOMER mode and enters the demo store via the existing `@handle` path (`handleCustomerDiscovery`), so it behaves exactly like a live store — browse, cart, Stitch checkout

*`src/services/whatsapp/merchantEngine.ts`* — **WhatsApp Lite gate** (amended same-day, pre-release)
- New gate in `handleMerchantAction`, placed **after** onboarding routing and **before** dashboards. When `MERCHANT_ACTIONS_VIA_HQ` is on and the merchant is `ACTIVE`:
  - **Broadcasts stay fully on WhatsApp** — `m_broadcast`/`b_` inputs and the `BROADCAST_MESSAGE` flow state route into the existing broadcast engine unchanged
  - **`menu` / `m_dashboard` / `m_stats` / `stats` / `home`** return a *daily snapshot*: today's paid sales (ZAR + order count) and open orders, with `📣 Send Broadcast` / `🔄 Refresh` buttons and an Omeru HQ link for "the full picture" — a deliberate teaser that gives the taste and sells the suite
  - **Everything else** replies with a short pointer to Omeru HQ, reminding them `menu` and `broadcast` still work here
  - Onboarding still completes on WhatsApp, `ob_golive_accept_` still works, and **outbound notifications (sale alerts) are untouched**

*`.env.example`*
- New "Platform mode" section documenting all four variables, including the note to use **Stitch TEST client credentials** in demo mode

**Why:** (1) The ecosystem direction is HQ-as-merchant-suite; the bot keeps merchants close with alerts, a daily snapshot and broadcasts — the superficial layer that makes them want the full stats — while administration converts to HQ at a single reversible choke point. (2) Sales demos need a WhatsApp number where a prospect can type `SwitchOmeru`, tap the Stitch demo store, and experience a full live purchase — without any real merchant leaking into view, and without the demo store ever appearing in production browse.

**Score impact:** Reliability unchanged (flags default to current-safe behaviour except the HQ redirect, which is the new intended behaviour). Ops: one env section to review at deploy.

### Rollback to v1.13.0

| File | Change to reverse |
|------|------------------|
| `src/config/mode.ts` | Delete file |
| `src/services/whatsapp/customerDiscovery.ts` | Remove `import { storeVisibilityFilter } from '../../config/mode';` and remove `, ...storeVisibilityFilter()` from the three queries (restoring `where: { status: 'ACTIVE', show_in_browse: true, store_category: { not: null } }`, `where: { status: 'ACTIVE', show_in_browse: true }`, and `const whereClause: any = { status: 'ACTIVE', manual_closed: false, show_in_browse: true };`) |
| `src/services/whatsapp/handler.ts` | Remove `import { isDemoMode, demoStoreHandle } from '../../config/mode';`; remove the `demoStore` const block in `handleSwitchMode`; restore `const totalOptions = 1 + (isAdmin ? 1 : 0) + stores.length;`; remove the demo-store button push and list-row push; remove the whole `if (input === 'sw_demo_store' && isDemoMode())` block |
| `src/services/whatsapp/merchantEngine.ts` | Remove `import { merchantActionsViaHQ, hqUrl } from '../../config/mode';` and the entire "WhatsApp Lite for merchants" gate block (from its comment banner to the closing `return;` before the going-live disclaimer) |
| `.env.example` | Remove the "Platform mode" section (DEMO_MODE, DEMO_STORE_HANDLE, MERCHANT_ACTIONS_VIA_HQ, HQ_URL) |

