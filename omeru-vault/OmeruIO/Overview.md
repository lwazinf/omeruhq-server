---
type: product-overview
product: OmeruIO
domain: omeru.io
updated: 2026-06-26
sync: manual
rating: 8.3/10
---

# OmeruIO — Public Storefront

The SEO and discovery layer for the Omeru platform. WhatsApp transactions aren't indexed by search engines — OmeruIO gives every merchant a Google-indexable storefront and a web-native onboarding path for new customers.

## Architecture

| Layer | Tech |
|-------|------|
| Framework | Next.js 16, App Router, ISR |
| DB | Prisma → shared Supabase (reads what OmeruWA writes) |
| Styling | CSS variables + inline styles + minimal Tailwind |
| Animation | Framer Motion + GSAP + ScrollTrigger |
| Scroll | Lenis smooth scroll |
| i18n | next-intl v4, `localePrefix: as-needed` |
| Deploy | Vercel |

## Pages

| Route | Revalidate | Purpose |
|-------|-----------|---------|
| `/` | static | Marketing landing page |
| `/stores` | 600s | Searchable merchant directory |
| `/@[handle]` | 300s | Merchant storefront with product/service cards |
| `/@[handle]/products/[id]` | 300s | Product detail page with JSON-LD |
| `/apply` | no-cache | Merchant application form |
| `/kyc/[token]` | no-cache | Token-gated KYC document form |
| `/privacy` | static | Privacy policy (POPIA-aligned) |

## Languages

- English (default)
- Afrikaans
- Zulu

## Current Feature State

| Feature | Status |
|---------|--------|
| Merchant storefronts (auto-generated) | ✅ Live |
| Product + service card accordion | ✅ Live, mobile-fixed |
| Store directory + category search | ✅ Live |
| SEO (JSON-LD, OG, canonical, sitemap) | ✅ Live |
| Multi-language (en/af/zu) | ✅ Live |
| Merchant apply form (self-serve) | ✅ Live |
| KYC upload flow | ✅ Live |
| Preview mode (from HQ portal) | ✅ Live |
| Customer reviews display | ❌ Not started (no Review model) |
| Product social proof | ❌ Not started |
| WebP image optimisation | ⚠️ Raw URLs only |
| PWA manifest | ❌ Not started |

## Known Gaps

- No Review model in schema — reviews page promised on pricing but not built
- Images are raw Supabase URLs, no `next/image` WebP conversion
- `SITE_URL` env default points to hq.omeru.io (wrong) — should be omeru.io
- `whiteSpace: nowrap` on `.btn-lime` was causing mobile overflow — fixed in v1.14.0

## Ratings (2026-06-26)

| Dimension | Score | Notes |
|-----------|-------|-------|
| Completeness | 8.5 | Core storefront solid; reviews/PWA missing |
| Code quality | 8.0 | Clean TS, good validation; minor env config issue |
| Security | 9.0 | Strong CSP, HSTS, rate limiting, no raw SQL |
| Performance | 7.5 | Good ISR; images not optimised; no bundle analysis |
| Mobile UX | 8.5 | Responsive, swipe-fixed; tested to 375px |
| **Overall** | **8.3** | |

## Links
- [[OmeruIO/Applications|Invite Applications]]
- [[Platform/Overview|Platform Overview]]
- [[OmeruHQ/Overview|OmeruHQ]]
- [[OmeruWA/Overview|OmeruWA]]
