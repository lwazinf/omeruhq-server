# OmeruCR — Control Room

Private platform-administration app for **cr.omeru.io**. Ecosystem health at a
glance, operator management with granular permissions, and WhatsApp broadcasts
to any slice of the platform — all behind a locked-down, audited surface.

## First run

1. `npm install`
2. Copy `.env.example` → `.env` and fill in:
   - `DATABASE_URL` / `DIRECT_URL` — the shared ecosystem Supabase Postgres
   - `CR_JWT_SECRET` — `openssl rand -base64 48`
   - `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_ACCESS_TOKEN` — same values OmeruWA uses
3. Apply `prisma/migrations/001_control_room.sql` once (Supabase SQL editor or psql).
   Never run `prisma migrate` here — the Merchant/Order/MerchantCustomer models are
   read-only mirrors of tables owned by OmeruWA.
4. `npm run dev` (port 3002) → open `/register` and create the **root operator**.
   Registration locks permanently the moment that account exists.

## Security model

- **Registration lock** — self-registration works only while zero operators exist;
  the first account becomes the immutable root operator. Everyone else is created
  inside the app by someone holding `MANAGE_OPERATORS`.
- **Sessions** — 8-hour JWT in an `httpOnly`, `SameSite=Strict` cookie; middleware
  gates every route and API.
- **Permissions** — `VIEW_ANALYTICS`, `BROADCAST_CUSTOMERS`, `BROADCAST_MERCHANTS`,
  `MANAGE_OPERATORS`, `VIEW_AUDIT`, `FRAUD_REPORTS`. Enforced server-side on every
  route; the root operator implicitly has all and cannot be edited or disabled.
- **Rate limits** — login 8/15 min per IP, registration 5/15 min per IP,
  broadcasts 10/hour per operator.
- **Large-send confirmation** — any broadcast above 25 recipients requires an
  explicit second confirmation carrying the exact resolved count.
- **Audit trail** — logins (including failures), operator changes, and every
  broadcast are written to `cr_audit_log` with IP.
- **Headers** — `noindex` everywhere, `frame-ancestors 'none'`, strict CSP, HSTS.

## Fraud & anomaly reports

`/fraud` (permission `FRAUD_REPORTS`) surfaces anonymised signals — order
velocity, cross-store fan-out, serial cancellations, ticket spikes — plus
7-day abandoned-checkout volume, with a one-click CSV export
(`/api/fraud/report`, audited). Customer subjects are always masked numbers.

## Platform mode chip

The header shows a `demo mode` / `live` chip driven by this deployment's
`DEMO_MODE` env (mirror OmeruWA's value). **This chip is the only place the
platform's mode is ever revealed** — customer- and merchant-facing surfaces
never mention demo or maintenance state.

## Broadcast audiences

| Audience | Resolves to |
|----------|-------------|
| All merchants | Active merchants' WhatsApp numbers |
| All customers | Opted-in customers, de-duplicated |
| Everyone | Union of both, de-duplicated |
| Individual | One validated number |
| Segment · revenue band | Merchants with paid revenue in `[min, max)` over a window |
| Segment · category | Merchants by exact `store_category` |
| Segment · churn risk | High sellers (≥ min revenue over window) with no orders for N quiet days |
| Segment · top spenders | Customers with lifetime spend ≥ threshold |

Preview and send resolve through the same code path (`lib/segments.ts`), so the
count you confirm is the count that receives the message. Sends are paced at
150 ms per message to match OmeruWA's Cloud API throttling.

## Intel (absorbed from omeru-intel)

`intel/` is the ecosystem-intelligence toolkit — an MCP server plus sync
scripts that write platform stats into the shared `omeru-vault/` at the repo
root. It has its own `package.json` (Node + tsx, not Next):

```bash
cd OmeruCR/intel
npm install
npm run sync            # full vault sync (platform, merchants, payouts, daily, applications)
npm run sync:daily      # just today's snapshot
npm start               # MCP server (register in your MCP client config)
```

Vault location defaults to `../../../omeru-vault` (repo root); override with
`OMERU_VAULT_PATH`. Intel uses its own `DATABASE_URL` (same shared Postgres).

## Changelog

See [`../docs/logs/control-room.md`](../docs/logs/control-room.md) — indexed in
[`../docs/logs/INDEX.md`](../docs/logs/INDEX.md).
