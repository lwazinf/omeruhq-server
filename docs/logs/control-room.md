# OmeruCR — Control Room CHANGELOG

> **Rules that govern every entry in this file:**
> 1. **Surgical changes only.** Touch nothing outside the scope of the stated fix.
> 2. **Always start from a working state.** No commit may leave the app broken or undeployable.
> 3. **We do not create bugs.** Every change is reviewed against the Known Issues list and the scores below.
> 4. **Every entry must include:** what changed · why · date · time · version bump.
> 5. **Scores are recalculated** on every release that materially changes behaviour.
> 6. **Priority order for fixes** is defined in the Roadmap section. Do not reorder without discussion.
> 7. **Every code change entry must include a Rollback block** — the exact before-state of every line touched, so any version can be restored by reversing the diff. No entry is complete without it.

> 📍 **Log map:** this file is indexed in [`docs/logs/INDEX.md`](./INDEX.md) alongside every other app log in the ecosystem.

---

## Rollback Protocol

To roll back to any previous version, say: **"roll back to vX.Y.Z"**

> **Current rollback state: v0.3.0** — fraud & anomaly reports, commerce KPIs, admin-only mode chip, mobile polish, and the absorbed intel toolkit are live.

---

## About This App

### What OmeruCR Is

OmeruCR (`cr.omeru.io`, folder `OmeruCR/`, port 3002) is the **platform owner's command centre** — a locked-down Next.js app for the people who run Omeru itself, not for merchants or customers. It surfaces ecosystem health (merchants, customers, revenue, pending orders), manages the small set of Control Room operators and their permissions, and sends WhatsApp broadcasts to any slice of the platform through the same business number OmeruWA uses.

Where OmeruHQ is a *merchant's* view of *their* store, OmeruCR is the *platform's* view of *everything*.

### The security model in one paragraph

Self-registration works exactly once: while zero operators exist, `/register` creates the **root operator** and then locks forever — the API re-checks the count on every call, so the lock holds even if the page is reached later. The root operator is immutable (cannot be edited, disabled, or stripped of permissions) and implicitly holds every permission. All other operators are created inside the app by someone holding `MANAGE_OPERATORS`, with per-permission checkboxes. Sessions are 8-hour JWTs in `httpOnly` `SameSite=Strict` cookies; middleware gates every route; login and registration are rate-limited per IP; broadcasts are rate-limited per operator and require explicit confirmation above 25 recipients; every login (including failures), operator change, and broadcast is written to an audit table with IP; the whole app is de-indexed and un-frameable with strict CSP and HSTS.

### Architecture

| Layer | Technology | Role |
|-------|-----------|------|
| Framework | Next.js 16 (App Router) | Server components for stats/audit, client composer for broadcast |
| Auth | jose JWT + bcryptjs (cost 12) | No native deps; runs in edge middleware |
| DB | Prisma → shared ecosystem Supabase Postgres | CR-owned `cr_` tables + read-only mirrors of Merchant / MerchantCustomer / Order |
| Messaging | WhatsApp Cloud API (graph.facebook.com v21.0) | Same env contract and 150 ms pacing as OmeruWA's sender |
| Styling | CSS custom properties, Archivo + Hanken Grotesk via next/font | Dark control-room theme on Omeru brand tokens |

### Data ownership rule

The `cr_operator`, `cr_audit_log`, and `cr_broadcast` tables are owned by this app and created by `prisma/migrations/001_control_room.sql`. The `Merchant`, `MerchantCustomer`, and `Order` models in `prisma/schema.prisma` are **read-only mirrors** of tables owned by OmeruWA — never run `prisma migrate` from OmeruCR.

### Broadcast audiences

| Audience | Resolution (lib/segments.ts) |
|----------|------------------------------|
| All merchants | Active merchants' `wa_id`s |
| All customers | `opt_out = false`, de-duplicated across merchants |
| Everyone | Union of both, de-duplicated |
| Individual | One validated 9–15 digit number |
| Merchants · revenue band | Paid-order revenue in `min ≤ r < max` over a window (default 30d) |
| Merchants · category | Exact `store_category` match |
| Merchants · churn risk | ≥ min revenue over the window **and** zero orders in the quiet period — "high sellers who may leave" |
| Customers · top spenders | Lifetime `total_spend` ≥ threshold |

Preview and send share one resolution path, so the number the operator confirms is the number that receives the message.

---

## Quality Scorecard

| Metric | Score (1-10) | Notes |
|--------|:------------:|-------|
| **Usability** | 8 | Live recipient preview, one-screen composer, per-permission checkboxes that save on change |
| **Design** | 8 | Coherent dark CR theme on brand tokens; accessible focus states, reduced-motion support |
| **Reliability** | 7 | Sequential paced sends with per-recipient failure counts; in-memory rate limiter is single-instance only |
| **Security** | 9 | Registration lock, immutable root, server-side permission gates, strict cookies/CSP/HSTS, full audit trail. 2FA not yet implemented — see roadmap |
| **Performance** | 8 | Server components, self-hosted fonts, no client state library |
| **SEO** | n/a | Deliberately de-indexed — headers, metadata, and robots.ts all say no |

**Overall: 8.2 / 10** (was 8.0 at v0.1.0)

---

## Version History

### v0.1.0 — 2026-07-01 SAST — Initial release: auth lock, RBAC, ecosystem dashboard, segmented WhatsApp broadcast

**What shipped (new app, 29 source files):**

*Auth & registration lock*
- `app/api/auth/register/route.ts` — POST creates an operator **only while the operator count is zero**; that account is flagged `is_root`. Any later attempt returns 403 and writes a `REGISTER_BLOCKED` audit event. GET exposes `{open}` so the UI can hide the form. Rate-limited 5/15 min per IP; password ≥ 12 chars; bcrypt cost 12.
- `app/api/auth/login/route.ts` — rate-limited 8/15 min per IP; identical failure message whether the account exists, is disabled, or the password is wrong; audits `LOGIN` / `LOGIN_FAILED` with IP.
- `lib/auth.ts` — 8-hour JWT sessions, `omeru_cr_session` cookie (`httpOnly`, `SameSite=Strict`, secure in prod); `requirePermission()` helper throwing 401/403 responses; refuses to start without a ≥ 32-char `CR_JWT_SECRET`.
- `middleware.ts` — everything except `/login`, `/register`, and the two auth APIs requires a valid session; APIs get 401, pages get redirected.

*RBAC*
- `lib/permissions.ts` — `VIEW_ANALYTICS`, `BROADCAST_CUSTOMERS`, `BROADCAST_MERCHANTS`, `MANAGE_OPERATORS`, `VIEW_AUDIT`; root implicitly holds all.
- `app/api/operators/*` — list/create behind `MANAGE_OPERATORS`, permissions whitelist-filtered server-side; PATCH edits permissions/disabled state but refuses to touch the root operator or the caller's own account.
- `app/operators/page.tsx` — operator table with live per-permission checkboxes, disable/re-enable, and a create form (temp password ≥ 12 chars).

*Ecosystem health*
- `app/dashboard/page.tsx` — server-rendered, `VIEW_ANALYTICS`-gated: active merchants, open stores, opted-in customers, 30d/7d paid revenue (ZAR) with order counts, pending orders, newest-merchants table. Paid statuses: `PAID/READY/COLLECTED/COMPLETED`.

*Broadcast*
- `lib/segments.ts` — all audiences and the four analytical segments resolve to de-duplicated `wa_id` lists (table above).
- `app/api/broadcast/preview/route.ts` + `send/route.ts` — permission gates derived from the audience's composition (merchant-targeting needs `BROADCAST_MERCHANTS`, customer/individual needs `BROADCAST_CUSTOMERS`, `EVERYONE` needs both); messages 1–1024 chars; > 25 recipients returns 412 until re-sent with `confirm: true`; 10 broadcasts/hour per operator; sequential sends via `lib/wa.ts` (Cloud API v21.0, same env vars and 150 ms pacing as OmeruWA); results stored in `cr_broadcast` as `SENT/PARTIAL/FAILED`; `BROADCAST_SENT` audited.
- `app/broadcast/page.tsx` — audience picker, per-segment parameter forms, debounced live recipient count, character counter, red two-step confirmation for large sends.

*Audit*
- `lib/audit.ts` — never-throwing writer with client-IP capture; `app/audit/page.tsx` — broadcast history + latest 200 security events, `VIEW_AUDIT`-gated.

*Hardening*
- `next.config.ts` — `X-Robots-Tag: noindex`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, HSTS preload, CSP with `frame-ancestors 'none'`; compress, no powered-by, prod console stripping. `app/robots.ts` disallows everything.

*Data*
- `prisma/schema.prisma` — CR-owned `CrOperator`/`CrAuditLog`/`CrBroadcast` (mapped to `cr_` tables) + read-only mirrors. `prisma/migrations/001_control_room.sql` creates the `cr_` tables and enables RLS on them.

**Why:** The platform owner needs one place to watch ecosystem health and reach any group on WhatsApp — separate from the merchant portal, with an attack surface as small as possible. The first-user-then-lock registration flow means the app can be deployed publicly at cr.omeru.io without an invite system: the owner registers once, the door closes, and every subsequent account is provisioned from inside with explicit permissions.

**Score impact:** Initial scorecard above (overall 8.0).

### Rollback to (nothing)

| Item | Change to reverse |
|------|------------------|
| `OmeruCR/` | Delete the entire folder |
| Database | `DROP TABLE cr_broadcast; DROP TABLE cr_audit_log; DROP TABLE cr_operator;` (in that order — FK dependencies). No shared table was touched |
| `docs/logs/INDEX.md` | Remove the OmeruCR row and its History line |

---

## Roadmap (priority order)

1. **TOTP two-factor auth** for all operators — the single biggest remaining security gain
2. Password change / reset flow (operators currently need an admin to recreate their account)
3. Redis-backed rate limiting for multi-instance deploys
4. Broadcast scheduling and message templates
5. Dashboard trend charts (7/30/90-day series) and per-merchant drill-down
6. Session revocation list (sign out an operator everywhere on disable)

## Known Limitations

1. Rate limiter is in-memory — resets on redeploy and doesn't share state across instances
2. Broadcasts send free-form text; WhatsApp requires pre-approved templates outside the 24-hour customer-service window, so deliverability to cold recipients depends on Meta policy
3. No 2FA yet (roadmap #1)
4. Disabling an operator blocks their next login but does not revoke an already-issued session (max 8h exposure; roadmap #6)

---

*Last updated: 2026-07-01*

### v0.2.0 — 2026-07-01 SAST — Fraud & anomaly reports, commerce KPIs, admin-only mode chip, mobile polish

**What changed:**

*`lib/fraud.ts` (new)*
- `detectFraudSignals()` — four heuristics over shared order data, all **anonymised** (customers appear as masked numbers via `maskWaId`, merchants as handles):
  1. **Order velocity** — ≥ 5 orders from one customer in 24h (HIGH at ≥ 10)
  2. **Cross-store fan-out** — one customer ordering from ≥ 4 stores in 24h (possible EFT/card testing; HIGH at ≥ 7)
  3. **Serial cancellations** — ≥ 4 cancelled orders per customer over 30d (HIGH at ≥ 8)
  4. **Ticket spike** — a single order ≥ 6× a store's 30-day average ticket and ≥ R2000 (HIGH at ≥ 12×)
- `abandonedCheckouts(days, staleHours)` — PENDING orders that never reached payment within the cutoff: count + rand value left at payment

*`app/fraud/page.tsx` (new) + `app/api/fraud/report/route.ts` (new)*
- `/fraud` page (gated by new permission) — KPI cards (open signals / abandoned checkouts 7d) and a severity-sorted, anonymised signal table
- One-click **CSV report** download; every export writes a `FRAUD_REPORT_EXPORTED` audit event

*`lib/permissions.ts` + operators UI*
- New `FRAUD_REPORTS` permission (root implicit, checkbox added to the operators page)

*Dashboard (`app/dashboard/page.tsx`)*
- Three new anonymised commerce KPIs: **Abandoned checkouts · 7d** (count + ZAR), **Checkout conversion · 30d** (paid ÷ all orders), **Average order · 30d**
- Anonymity note under the heading: all commerce figures are aggregates, no customer identities shown

*`lib/mode.ts` (new) + `components/CrShell.tsx` + all section layouts*
- Header chip shows the platform's mode — `demo mode` (lime) or `live` (green) — read from this deployment's `DEMO_MODE` env (mirror of OmeruWA's). **This chip is the only surface in the entire ecosystem that reveals platform mode**; customer- and merchant-facing apps never mention demo or maintenance state
- New `Fraud` nav item

*`app/globals.css`*
- ≤ 720px: cards tighten, `.cr-table` scrolls horizontally in-card, inputs at 16px (stops iOS zoom), larger button tap targets

*`.env.example` / `README.md`* — `DEMO_MODE` mirror documented; fraud + mode-chip sections added

**Why:** The Control Room's job is the *full picture* the WhatsApp Lite teaser deliberately withholds from merchants — and that picture must include where money leaks (abandoned checkouts), how healthy the funnel is (conversion, AOV), and who's abusing it (fraud signals), all without exposing customer identities to operators who don't need them.

**Score impact:** Usability 8→8 · Security 9 (held — new surface is permission-gated and audited) · **Overall 8.0 → 8.2**

### Rollback to v0.1.0

| File | Change to reverse |
|------|------------------|
| `lib/fraud.ts`, `lib/mode.ts`, `app/fraud/`, `app/api/fraud/` | Delete |
| `lib/permissions.ts` | Remove the `FRAUD_REPORTS` key and its label |
| `app/operators/page.tsx` | Remove the `{ id: 'FRAUD_REPORTS', … }` row from `PERMS` |
| `components/CrShell.tsx` | Remove the `/fraud` NAV entry, the `mode` prop (and its type), and the mode-chip `{mode && (…)}` block |
| `app/dashboard/page.tsx` | Remove the `abandonedCheckouts`/`platformMode` imports, `allOrders30`/`abandoned` from the `Promise.all` (and the two added queries), `conversion30`/`aov30`/`abandoned` from the return, the three new KPI objects, the anonymity `<p>`, and `mode={platformMode()}` from both `CrShell` usages (restore `marginBottom: 20` on the h1) |
| `app/{broadcast,operators,audit}/layout.tsx` | Remove the `platformMode` import and `mode={platformMode()}`; delete `app/fraud/layout.tsx` |
| `app/globals.css` | Delete the appended `/* ── Mobile (v0.1.1)… */` block |
| `.env.example` / `README.md` | Remove the `DEMO_MODE` mirror section and the Fraud/mode-chip README sections |


### v0.3.0 — 2026-07-01 SAST — Absorb omeru-intel; Control Room becomes the whole admin toolkit

**What changed:**

*Repository*
- `omeru-intel/` moved to **`OmeruCR/intel/`** — the MCP server + vault-sync scripts now live inside the Control Room, making OmeruCR the single home for everything platform-admin (web UI + CLI/MCP tooling). The tool keeps its own `package.json`/runtime (Node + tsx); nothing about how it runs changes except its path

*`intel/src/vault.ts`*
- `VAULT_ROOT` updated for the new nesting depth (`../../../omeru-vault` from `intel/src/`) and made overridable via a new `OMERU_VAULT_PATH` env var. The shared `omeru-vault/` stays at the repo root

*`README.md`*
- New "Intel" section: install/run commands from `OmeruCR/intel`, vault-path behaviour, MCP registration note

*Bookkeeping*
- INDEX: the standalone omeru-intel row is folded into the OmeruCR row; intel's pre-merge history remains in `merchant-portal.md` § v0.4.0 (where it was originally logged) and is referenced from here

**Why:** Two admin tools in two places was one too many. Intel reads the same shared Postgres the CR dashboard reads and serves the same person — the platform owner. Housing it inside OmeruCR keeps every admin capability (health KPIs, fraud, broadcasts, operators, vault sync, MCP access) under one folder, one README, one changelog.

**Score impact:** No behaviour change to the web app. Ops clarity up; one fewer top-level project to version.

### Rollback to v0.2.0

| Item | Change to reverse |
|------|------------------|
| Repository | Move `OmeruCR/intel/` back to the repo root as `omeru-intel/` |
| `intel/src/vault.ts` | Restore `export const VAULT_ROOT = resolve(__dirname, '../../omeru-vault');` (remove the `OMERU_VAULT_PATH` branch and the comment) |
| `OmeruCR/README.md` | Remove the "Intel (absorbed from omeru-intel)" section |
| `docs/logs/INDEX.md` | Restore the standalone omeru-intel row (log: merchant-portal.md § v0.4.0, v0.1.0, Live, 2026-06-26) and remove the intel note from the OmeruCR row |

