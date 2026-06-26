---
type: product-overview
product: OmeruWA
updated: 2026-06-26
sync: manual
rating: 8.1/10
---

# OmeruWA — WhatsApp Bot

The conversational commerce layer. Customers browse stores, add to cart, and checkout entirely inside WhatsApp. Merchants receive order and payment alerts. The bot writes the data that OmeruHQ displays and OmeruIO exposes.

## Architecture

| Layer | Tech |
|-------|------|
| Runtime | Node.js, TypeScript |
| WhatsApp provider | Meta Cloud API (v19.0) |
| Payments | Stitch Express (instant EFT, HMAC webhook verification) |
| DB | Prisma → shared Supabase |
| Rate limiting | ioredis-backed (30 msgs/min per user) |
| Jobs | Cron: order alerts, booking reminders |

## User Modes

| Mode | Trigger |
|------|---------|
| `CUSTOMER` | Default for all new numbers |
| `MERCHANT` | Typing "switch" → WhatsApp OTP → portal-linked session |
| `PLATFORM_ADMIN` | `PLATFORM_ADMIN_NUMBERS` env list |

## Customer Flow

```
Browse stores → select merchant → view products/services
→ add to cart → checkout → Stitch payment link
→ payment confirmed (webhook) → order placed in DB
→ merchant notified via WA
```

## Merchant Flow (WA — notification only)

> As of v1.12.0, merchant *management* moved to OmeruHQ portal.
> OmeruWA now sends merchants: new order alerts, payment confirmations, booking requests.

## Key Handlers (32 TypeScript files)

| Handler | Purpose |
|---------|---------|
| `handler.ts` | Message router, rate limiting, input sanitisation |
| `merchantEngine.ts` | Merchant session orchestration |
| `customerDiscovery.ts` | Store browsing, product search |
| `customerOrders.ts` | Cart, checkout, order tracking |
| `paymentService.ts` | Stitch webhook handling (timing-safe HMAC) |
| `onboardingEngine.ts` | New merchant WhatsApp onboarding flow |
| `adminEngine.ts` | Platform admin console |
| `broadcastDelivery.ts` | Segment broadcast from portal → WA delivery |
| `bookingReminders.ts` | Cron: 24h booking reminder messages |
| `orderAlerts.ts` | Cron: overdue order escalation |

## Data Written to Shared DB

- `UserSession` — mode, cart state, active merchant
- `Order` + `OrderItem` — full order lifecycle
- `MerchantCustomer` — customer-merchant relationship, opt-in status
- `Booking` — service appointment records
- `AuditLog` — broadcast sends, admin actions
- `Merchant.manual_closed` — store open/close state (mirrors HQ toggle)

## Known Gaps

- Silent `catch` blocks in several handlers reduce debuggability
- No automatic retry for failed Stitch webhooks (only `retry_payment_` command)
- Stale session cleanup not automated (sessions persist after user inactivity)
- Messages hardcoded in English — no i18n
- No `as any` type safety issues reported but message template strings are inline

## Ratings (2026-06-26)

| Dimension | Score | Notes |
|-----------|-------|-------|
| Completeness | 8.8 | Full commerce flow; retry/cleanup edge cases missing |
| Code quality | 7.5 | Good modular structure; silent catches |
| Security | 8.0 | Rate limiting + HMAC verification solid |
| Performance | 8.0 | Efficient queries; session cleanup gap |
| UX/Flow | 8.0 | Natural conversational flow |
| **Overall** | **8.1** | |

## Links
- [[Platform/Overview|Platform Overview]]
- [[OmeruHQ/Overview|OmeruHQ]]
- [[Merchants/_Index|All Merchants]]
