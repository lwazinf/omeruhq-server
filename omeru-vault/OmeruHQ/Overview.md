---
type: product-overview
product: OmeruHQ
domain: hq.omeru.io
updated: 2026-06-26
sync: manual
rating: 7.2/10
---

# OmeruHQ — Merchant Portal

The merchant-facing management dashboard. Merchants manage orders, products, bookings, customers, analytics, and payouts from here. WhatsApp is now notification-only for merchants — all management is web-based.

## Architecture

| Layer | Tech |
|-------|------|
| Framework | Next.js 16, App Router, Server Components + Server Actions |
| Auth | OTP via WhatsApp → JWT (jose, HS256, 7d expiry), httpOnly cookies |
| DB | Prisma → shared Supabase |
| Styling | CSS variables + inline styles |
| Deploy | Vercel |

## Pages (Phase Status)

| Page | Phase | Status |
|------|-------|--------|
| Login (WA OTP) | 1 | ✅ Live |
| Dashboard (KPIs, revenue, top products) | 1 | ✅ Live |
| Orders (Kanban: Pending → Prepare → Ready → Done) | 1 | ✅ Live |
| Products (CRUD, stock toggle, category) | 1 | ✅ Live |
| Services (create/manage service listings) | 2 | ✅ Live |
| Bookings (calendar view, status advance) | 2 | ✅ Live |
| Broadcast (segment WhatsApp messages) | 2 | ✅ Live |
| Team (invite staff, OWNER/ADMIN/STAFF roles) | 2 | ✅ Live |
| Settings (store info, open/close) | 2 | ⚠️ Partially complete |
| Analytics (14d revenue, day patterns, projections, top customers) | 3 | ✅ Live |
| Customers (list, bookmark, opt-out toggle) | 3 | ✅ Live |
| Payments/Payouts (request payout, payout history) | 3 | ✅ Live |
| Reviews | 3 | ⚠️ Stub/coming-soon |

## Auth Flow

```
Merchant enters WA number → OTP sent via WhatsApp bot
→ 6-digit OTP input → JWT issued → portal access
```

⚠️ **CRITICAL:** `send-otp/route.ts` contains a dev bypass — entering `stitchmoney` as phone logs in without OTP. Must be removed or gated to `NODE_ENV=development` before handling real merchants.

## Payout System

- `Payout` model with `PayoutStatus` enum (PENDING → REQUESTED → PROCESSING → COMPLETED → FAILED)
- Platform fee pulled from `PlatformBranding.platform_fee` (default 5% if null)
- Manual payout request via portal CTA; no auto-scheduled payout yet
- Net = `gross * (1 - fee/100)` per order

## Known Gaps

- Dev bypass in `send-otp/route.ts` — **must fix before real merchant onboarding**
- `as any` cast in `orders/actions.ts:24` — low risk but should be typed properly
- Settings page saves some fields but others are placeholders
- Reviews page has no Review model in schema — cannot show actual reviews
- No trend chart (14-day data exists in analytics but no chart component)
- No pagination on orders (cap at 60)
- OTP stored in `global.__otpStore` — flushes on process restart (only affects dev)

## Ratings (2026-06-26)

| Dimension | Score | Notes |
|-----------|-------|-------|
| Completeness | 9.0 | All phases shipped; settings + reviews partial |
| Code quality | 7.0 | Good structure; dev bypass + `as any` are flags |
| Security | 4.0 | Dev bypass is a production vulnerability |
| Performance | 8.0 | Efficient queries, revalidatePath used well |
| Mobile UX | 8.0 | Sidebar drawer works; all portal pages responsive |
| **Overall** | **7.2** | Security score pulls this down significantly |

## Links
- [[OmeruHQ/Feature Adoption|Feature Adoption]]
- [[Platform/Overview|Platform Overview]]
- [[OmeruIO/Overview|OmeruIO]]
- [[OmeruWA/Overview|OmeruWA]]
- [[Payouts/_Index|Payouts]]
