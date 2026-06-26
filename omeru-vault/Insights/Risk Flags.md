---
type: insights
updated: 2026-06-26
sync: manual
---

# Risk Flags

> Last updated: 2026-06-26 from full ecosystem audit. Red = active risk. Orange = latent. Yellow = watch.

---

## 🔴 Active Risks

### AUTH-001 — Dev bypass in production auth
**File:** `OmeruHQ/app/api/auth/send-otp/route.ts:14-30`
**Risk:** Anyone entering `"stitchmoney"` as a phone number bypasses OTP and gets full merchant portal access. The StitchMoney account is the only live merchant.
**Likelihood:** High if ever shared or discovered.
**Impact:** Full merchant account takeover, order manipulation, customer data exposure.
**Owner:** OmeruHQ
**Fix:** Remove or gate to `NODE_ENV === 'development'`.
**Status:** ⛔ OPEN — must close before any real merchant onboarding.

---

## 🟠 Latent Risks

### PAYMENT-001 — No webhook retry for Stitch failures
**File:** `OmeruWA/src/services/paymentService.ts`
**Risk:** If Meta Cloud API drops a webhook, orders stay in `AWAITING_PAYMENT` indefinitely. Merchant sees no payment, customer paid.
**Likelihood:** Low-moderate (Meta webhooks are reliable but not 100%).
**Impact:** Revenue loss, customer complaints, manual resolution required.
**Owner:** OmeruWA
**Fix:** Cron re-query of Stitch API for stale AWAITING_PAYMENT orders.
**Status:** 🟠 OPEN

### SESSION-001 — In-memory OTP store flushes on restart
**File:** `OmeruHQ/app/api/auth/send-otp/route.ts` + `verify-otp/route.ts`
**Risk:** `global.__otpStore` is process-local. Vercel serverless cold starts will flush it. Merchant sends OTP, serverless function scales to new instance, OTP not found, login fails.
**Likelihood:** Moderate on Vercel (auto-scaling).
**Impact:** Merchant login failures under load. Frustrating but not a data loss risk.
**Owner:** OmeruHQ
**Fix:** Move OTP storage to Supabase table or Upstash Redis with TTL.
**Status:** 🟠 OPEN

### DATA-001 — Schema lacks Refund model
**Risk:** Orders can be COMPLETED but there's no way to record a partial or full refund. All-time revenue figures in Analytics and Payouts overstate real received revenue if any refunds occur manually.
**Likelihood:** Will become relevant as order volume grows.
**Impact:** Financial reporting inaccurate.
**Owner:** Schema (affects OmeruHQ, OmeruWA, omeru-intel)
**Fix:** Add `Refund` model with `order_id`, `amount`, `reason`, `status`.
**Status:** 🟠 WATCH

### SCHEMA-001 — `invite_applications.status` is raw string
**File:** `OmeruHQ/prisma/schema.prisma`
**Risk:** `status` on `invite_applications` has no enum constraint. Invalid status values can be inserted without DB-level protection.
**Likelihood:** Low — only platform admin inserts.
**Impact:** Corrupted application state in omeru-intel queries.
**Fix:** Add `InviteStatus` enum or Postgres CHECK constraint.
**Status:** 🟡 LOW

---

## 🟡 Watch Items

### PERF-001 — Images not optimised
All product and merchant images are raw Supabase CDN URLs served as full-resolution PNGs/JPGs. As product catalogues grow, LCP scores will degrade on mobile.
**Monitor:** Core Web Vitals on `/@[handle]` pages once more merchants are live.

### PERF-002 — No pagination on Orders Kanban
Orders page loads up to 60 orders. Merchants with high volume (100+ active orders/day) will see degraded load time.
**Trigger:** Add pagination when any merchant regularly exceeds 40 active orders.

### SCALE-001 — Single Supabase DB for all apps
OmeruIO, OmeruHQ, OmeruWA, and omeru-intel all hit the same Supabase instance. A poorly optimised query in any one app can starve the others.
**Monitor:** Supabase query latency dashboard. If p95 > 200ms, investigate.

### OBSERV-001 — Silent catch blocks in OmeruWA
Several handlers catch errors silently. Production errors are invisible in logs.
**Action:** Add `console.error` or Sentry capture to all catch blocks before launch.

---

## Links
- [[Insights/Recommendations|Recommendations]]
- [[Platform/Overview|Platform Overview]]
- [[Merchants/_Index|All Merchants]]
