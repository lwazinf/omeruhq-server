---
type: insights
updated: 2026-06-26
sync: manual
---

# Recommendations

> Last updated: 2026-06-26 from full ecosystem audit.

---

## 🔴 Critical — Do Before Real Merchant Onboarding

### 1. Remove dev bypass in OmeruHQ auth
**File:** `OmeruHQ/app/api/auth/send-otp/route.ts`
**Issue:** Entering `stitchmoney` as a phone number auto-logs in without OTP. Anyone who knows this can access the Stitch merchant account.
**Fix:** Delete lines 14–30 or wrap in `if (process.env.NODE_ENV === 'development')`.
**Impact:** Security +5 points. This is the single biggest vulnerability in the platform.

### 2. Fix type safety in order actions
**File:** `OmeruHQ/app/(portal)/orders/actions.ts:24`
**Issue:** `status: next_status as any` bypasses TypeScript's enum check on `OrderStatus`.
**Fix:** `status: next_status as OrderStatus` (import `OrderStatus` from Prisma client).
**Impact:** Low-risk bug but correctness matters when statuses expand.

---

## 🟠 High Priority — Before Merchant Growth

### 3. Add Review model to schema
The reviews page, pricing page copy, and product pages all reference reviews. No `Review` model exists in `schema.prisma`. Reviews are a trust signal that drives conversion.
**Action:** Design schema (`Review` — order_id FK, merchant_id, rating: Int, comment: String?, created_at), implement bot flow to request review 24h after order completion, display on storefront.
**Estimate:** 3–4 sessions.

### 4. Implement payment retry for failed Stitch webhooks
OmeruWA has no automatic retry for failed payment webhooks. If Meta drops a webhook, the order never gets marked PAID.
**Action:** Store `stitch_payment_id` on Order; add a 5-minute cron that re-queries Stitch for any order in AWAITING_PAYMENT older than 10 minutes.
**Estimate:** 1 session.

### 5. Add error logging to OmeruWA silent catches
Several handlers in OmeruWA have empty catch blocks. When errors occur in production, they're invisible.
**Action:** Replace `} catch { }` with `} catch (err) { console.error('[HandlerName]', err); }` — or wire to Sentry if already configured.
**Estimate:** 30 minutes.

### 6. Complete Settings page in OmeruHQ
The settings page saves some fields but several sections are placeholder-only. Merchants need to update their business details, hours, and bank account.
**Action:** Audit which fields write to DB vs are display-only, wire up remaining Server Actions.
**Estimate:** 1 session.

---

## 🟡 Medium Priority — Quality & Scale

### 7. Switch to `next/image` throughout OmeruIO
All product/merchant images are raw `<img>` tags pointing to Supabase CDN URLs. `next/image` gives WebP conversion, `srcset`, lazy loading, and LCP hints. Given product images are the hero of every storefront, this is a meaningful Core Web Vitals win.
**Action:** Add Supabase CDN domain to `next.config.ts` `remotePatterns`, replace `<img>` with `<Image>` in `StoreAccordion`, `StoresAccordion`, and `[handle]/page.tsx`.
**Estimate:** 1 session.

### 8. Add structured logging (replace console.log)
Both OmeruHQ and OmeruWA use `console.log/error` throughout. Structured logging (Pino or Winston) with JSON output makes log aggregation (Supabase Logs, Vercel Logs, Sentry) far more useful.
**Estimate:** 1 session.

### 9. OTP: move from in-memory to Redis/DB
`global.__otpStore` flushes on process restart. In production on Vercel serverless this could silently drop OTPs. Move to Supabase table with TTL or Upstash Redis.
**Estimate:** 2 hours.

### 10. Add trend chart to Analytics
14-day revenue data is calculated and returned correctly but displayed as a raw table. A simple CSS/SVG sparkline would make the trend immediately visible.
**Estimate:** 1 session.

### 11. WhatsApp session cleanup cron
`UserSession` rows persist indefinitely. Add a weekly cron that deletes sessions inactive > 90 days.
**Estimate:** 30 minutes.

---

## 🟢 Growth Features — When Volume Justifies

### 12. Merchant review flow (full loop)
Once Review schema exists: bot requests review → customer rates 1–5 stars → displays on storefront → merchant sees in analytics. This drives organic SEO (review rich snippets) and social proof on individual store pages.

### 13. WhatsApp share button on product pages
Native Web Share API on mobile, WA deep-link fallback. Low effort, measurable conversion impact.

### 14. PWA manifest for storefronts
`manifest.json` + service worker allows storefront pages to be installed on home screens. WhatsApp-native users get a fast re-entry path.

### 15. OmeruHQ localization
Merchants operate in various SA languages. Portal UI is English-only. Add Afrikaans and Zulu support to mirror OmeruIO.

### 16. Auto-scheduled payouts
Current payout system is manually requested. Add scheduled automatic payouts on the configured `PlatformBranding.payout_day` and send WhatsApp notification to merchant.

---

## Links
- [[Insights/Risk Flags|Risk Flags]]
- [[Platform/Overview|Platform Overview]]
- [[OmeruHQ/Feature Adoption|Feature Adoption]]
