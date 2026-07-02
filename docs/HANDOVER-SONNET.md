# HANDOVER — for the next Claude session (Sonnet 4.5)

*Written 2026-07-01 (updated same day: intel merged into OmeruCR; OmeruDs domain is ds.omeru.io) by the previous session. Read this top to bottom before touching anything.*

## 0 · Your first job: migrate this code into the user's existing repo

The user has an **old local repo folder** with git history. This archive is the new
source of truth. Do exactly this:

1. Identify the user's old repo folder (ask if the path isn't given). Confirm it
   contains a `.git/` directory.
2. **Delete everything in that folder EXCEPT `.git/`** (and any `.env` files the
   user wants to keep — ask first; `.env` files are not in this archive).
3. Copy the **contents** of `omeru-ecosystem/omeruHQ/` from this archive into the
   old repo folder (so `OmeruWA/`, `OmeruIO/`, `OmeruHQ/`, `OmeruDs/`, `OmeruCR/`
   (which now contains `intel/`), `omeru-vault/`, `docs/` sit at the repo root — mirror whatever
   layout the old repo used; if the old repo root *was* `omeruHQ/`'s contents,
   copy contents, not the wrapper folder).
4. The delete-then-copy is deliberate: this release **renamed
   `OmeruShowcase/` → `OmeruDs/`** and **moved `omeru-intel/` → `OmeruCR/intel/`** and previously **deleted a stale nested
   duplicate** (`whatsapp-bot-showcase/`). A plain overwrite-copy would leave
   both ghosts behind.
5. Then the user runs: `git add -A && git commit -m "..." && git push`.
   (`git add -A` — not `git add .` from a subfolder — so deletions and the
   rename are staged too.)
6. Do NOT copy any `node_modules/` (none are in the archive) and do NOT commit
   real `.env` files.

## 1 · What this ecosystem is

WhatsApp-commerce platform for South Africa. One shared Supabase Postgres.

| App | Folder | Domain | Port | What it is |
|-----|--------|--------|------|------------|
| OmeruWA | `OmeruWA/` | WhatsApp number | 8080 | The bot. Customers shop here. Merchants get **WhatsApp Lite** only (see §3) |
| OmeruIO | `OmeruIO/` | omeru.io | 3000 | Public storefront + landing. **Flat pricing: R499/mo, 0% commission** — one constant `FLAT_PRICE_ZAR` in `components/Pricing.tsx` |
| OmeruHQ | `OmeruHQ/` | hq.omeru.io | 3001 | **The full merchant suite.** All merchant administration lives here by direction |
| OmeruDs | `OmeruDs/` | ds.omeru.io | 3000 | Omeru Design — WhatsApp simulator, flow design studio, and `/share` read-only sales pages |
| OmeruCR | `OmeruCR/` | cr.omeru.io | 3002 | Platform admin Control Room. Registration-locked (first user = immutable root), RBAC, broadcasts, fraud reports. Also houses `intel/` — the MCP + vault-sync toolkit (own package.json; runs from `OmeruCR/intel`) |

## 2 · House rules (non-negotiable)

- **Changelogs**: every app has ONE canonical log in `docs/logs/` (map:
  `docs/logs/INDEX.md`). Every entry needs what/why/date/version/score-impact
  **and a Rollback block** with the exact before-state. App-root `CHANGELOG.md`
  files are pointers only. Update `INDEX.md` in the same commit as any entry.
- **Surgical changes only.** Never leave the tree broken.
- Scores are honest 1–10 diagnostics — do not inflate them; move them by
  shipping the roadmap items listed in each log.
- OmeruWA was untouched until v1.14.0; treat it with extra care — everything
  there is feature-flagged (see §3) with a full rollback table in
  `docs/logs/omeruhq-backend.md`.

## 3 · Platform mode & merchant direction (new this release — understand before editing)

`OmeruWA/src/config/mode.ts` + `.env.example`:

- `MERCHANT_ACTIONS_VIA_HQ` (default true): merchants on WhatsApp get **Lite**
  — sale-alert notifications, a `menu` daily snapshot (today's sales/open
  orders), and full **broadcasts**. Everything else replies with an Omeru HQ
  pointer. Gate lives in `merchantEngine.ts` ("WhatsApp Lite for merchants"),
  after onboarding routing so signup still completes on WhatsApp.
- `DEMO_MODE` (default false) + `DEMO_STORE_HANDLE` (default `stitch`): in demo
  mode, customer browse/discovery resolves ONLY to the Stitch demo store, and
  `SwitchOmeru` offers that store to everyone (`sw_demo_store`). In live mode
  the demo store is excluded from browse (reachable by direct `@handle` only).
- **Secrecy rule:** front users (customers/merchants) must NEVER see the words
  demo/maintenance or any mode hint. The ONLY mode indicator in the whole
  ecosystem is the chip in OmeruCR's header (`lib/mode.ts`, mirrors `DEMO_MODE`
  in CR's own env). Keep it that way in any copy you write.
- Demo prerequisite the code can't create: a merchant row with
  `handle = 'stitch'`, status ACTIVE, with products **and product images**
  (relevant items/services), plus Stitch **TEST** client credentials in env.
  Verify this seed exists before demoing.

## 4 · OmeruCR quick facts

- First run: apply `OmeruCR/prisma/migrations/001_control_room.sql` ONCE (cr_
  tables + RLS). **Never `prisma migrate` from CR** — its Merchant/Order/
  MerchantCustomer models are read-only mirrors of OmeruWA-owned tables.
- Env: `DATABASE_URL`, `DIRECT_URL`, `CR_JWT_SECRET` (≥32 chars), WhatsApp
  creds (same as OmeruWA), `DEMO_MODE` mirror.
- `/register` works only while zero operators exist → creates immutable root →
  locks forever. Permissions: VIEW_ANALYTICS, BROADCAST_CUSTOMERS,
  BROADCAST_MERCHANTS, MANAGE_OPERATORS, VIEW_AUDIT, FRAUD_REPORTS.
- `/fraud`: anonymised signals (velocity, cross-store fan-out, serial
  cancellations, ticket spikes) + abandoned checkouts + CSV export (audited).
- Broadcast: preview and send share one resolver (`lib/segments.ts`); >25
  recipients requires explicit confirm; 10/hour/operator.

## 5 · Verification debt (do early)

No `node_modules` shipped, so **no app has been built**. Run per app:
`npm install && npm run build` (OmeruWA: `npm install && npx tsc --noEmit`
with its own local typescript — the repo's tsconfig trips a deprecation error
under bleeding-edge tsc; use the pinned devDependency). Fix any type errors
before deploy. Also: OmeruWA's Prisma `status: { in: [...] as any }` casts in
the Lite gate follow the file's existing style; if `READY_FOR_PICKUP` vs
`READY` enum values differ between models, trust `merchantDashboard.ts`'s
PAID_STATES as the reference.

## 6 · Open roadmap (in priority order, from the logs)

1. OmeruCR: TOTP 2FA; password reset; session revocation on disable
2. OmeruDs: hosted share links (server-stored, short URLs), node-editor polish
3. OmeruHQ: keep absorbing merchant features now that WA is Lite
4. intel (`OmeruCR/intel`): point it at the new cr_ tables for ops summaries; consider surfacing vault summaries inside the CR web UI

## 7 · Where everything is written down

`docs/logs/INDEX.md` → per-app logs → each entry has its rollback.
`docs/Omeru-Ecosystem-Change-Report-2026-07-01.pdf` is the 2026-07-01 report.
Trust the logs over memory — including yours.
