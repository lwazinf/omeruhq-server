# Omeru Web — Landing + Merchant Storefronts

The public web surface of Omeru. Two jobs:

1. **Landing page** (`/`) — the marketing site for merchant acquisition.
2. **Merchant storefronts** (`/@handle`) — an SEO-indexed public page for every
   active WhatsApp store, created **automatically at go-live** because this app
   and the WhatsApp bot share one Supabase Postgres database. No sync, no drift.

## How storefronts work

- A merchant finishes onboarding in the WhatsApp bot → status flips to `ACTIVE`
  → `omeru.io/@handle` exists on the next request. The bot tells them the URL.
- Products, services, hours and photos edited in WhatsApp appear on the web
  within the ISR window (5 min storefront / 10 min directory / 60 min sitemap).
- Every storefront CTA deep-links to `wa.me/<platform-number>?text=@handle`,
  which opens the bot with the store handle pre-filled — the web is the
  discovery layer, WhatsApp is the transaction layer.
- SEO: server rendering, per-store metadata + OpenGraph, LocalBusiness/Product
  JSON-LD, dynamic `sitemap.xml`, `robots.txt`, and internal links from `/stores`.

## Routes

| Route | Purpose |
|---|---|
| `/` | Marketing landing |
| `/stores` | Store directory (crawl hub + discovery) |
| `/@{handle}` | Merchant storefront (canonical; bare `/{handle}` 308-redirects) |
| `/sitemap.xml`, `/robots.txt` | Generated |

## Setup

```bash
cp .env.example .env   # point DATABASE_URL at the SAME Supabase DB as the bot
npm install            # postinstall runs `prisma generate`
npm run dev
```

Deploys cleanly on Vercel's free tier. The Prisma schema in `prisma/` is a
copy of the bot's — when the bot's schema changes, copy it over and redeploy
(the bot owns migrations; this app only needs the generated client).
