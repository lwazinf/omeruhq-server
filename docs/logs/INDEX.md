# Omeru Ecosystem — Master Log Map

> **Single source of truth for every changelog in the ecosystem.**
> Every app has exactly one canonical log, listed here. App-root `CHANGELOG.md` files are pointers only — never write entries there.

*Last updated: 2026-07-01 · Maintained alongside every release entry.*

---

## Log Map

| App | Codebase | Canonical log | Current version | Status | Last entry | Domain |
|-----|----------|---------------|:---------------:|--------|:----------:|--------|
| **OmeruWA** (bot backend) | `OmeruWA/` | [`omeruhq-backend.md`](./omeruhq-backend.md) | v1.14.0 | 🟢 Live | 2026-07-01 | WhatsApp Business number |
| **OmeruIO** (storefront + landing) | `OmeruIO/` | [`hq-storefront.md`](./hq-storefront.md) | v1.17.0 | 🟢 Live | 2026-07-01 | omeru.io |
| **OmeruHQ** (merchant portal) | `OmeruHQ/` | [`merchant-portal.md`](./merchant-portal.md) | v0.6.0 | 🟡 Beta | 2026-07-01 | hq.omeru.io |
| **OmeruDs** (Omeru Design — demo & design studio) | `OmeruDs/` | [`omeru-ds.md`](./omeru-ds.md) | v0.4.1 | 🟢 Live | 2026-07-01 | ds.omeru.io |
| **OmeruCR** (Control Room — platform admin, incl. `intel/` MCP + vault sync) | `OmeruCR/` | [`control-room.md`](./control-room.md) | v0.3.0 | 🟡 Beta / pre-launch | 2026-07-01 | cr.omeru.io |

Status key: 🟢 Live in production · 🟡 Beta / partial rollout · 🔴 Broken, do not deploy · ⚪ Archived

---

## How the mapping works

1. **One app → one log.** Each application's full history lives in a single file in `docs/logs/`. The `CHANGELOG.md` at each app root is a one-line pointer to it (see `OmeruIO/CHANGELOG.md` for the pattern).
2. **Every log links back here.** Each canonical log carries a `📍 Log map` line under its rules block pointing to this index, so any log can be navigated to any other in two clicks.
3. **This table is part of the release checklist.** When a versioned entry is added to any log, the *Current version* and *Last entry* columns here are updated in the same commit. A stale row means an incomplete release.
4. **Rollbacks update this table too.** After executing a rollback, set *Current version* to the restored version and add a one-line note in the History section below.

## Entry format (all logs)

Every versioned entry must contain, in order:

```
### vX.Y.Z — YYYY-MM-DD HH:MM SAST — one-line summary
**What changed:**   (per-file bullets, exact identifiers)
**Why:**            (the problem, not the solution restated)
**Score impact:**   (recalculate the scorecard when behaviour changes)
### Rollback to v[previous]
| File | Change to reverse |   (exact before-state of every line touched)
```

## Shared conventions

- **Versioning:** semver per app. Bump *minor* for features, *patch* for fixes, *major* for breaking schema/API changes.
- **Timezone:** all timestamps SAST.
- **Scorecards:** Usability · Design · Reliability · Security · Performance · SEO (web apps) — each 1–10, recalculated on behaviour-changing releases.
- **Surgical changes only** — the first rule in every log applies ecosystem-wide.

## Cross-cutting entries

Changes that span multiple apps (e.g. a shared schema migration, a brand token change) get an entry **in every affected log**, each cross-referencing the others by version, plus a row in the History section below.

## History (index-level events)

| Date | Event |
|------|-------|
| 2026-07-01 | Index created. OmeruDs integrated into ecosystem (`omeru-ds.md` v0.3.0). Cross-cutting release: self-hosted fonts + perf flags shipped to OmeruIO (v1.16.0), OmeruHQ portal (v0.5.0), OmeruDs (v0.3.0). |
| 2026-07-01 | **Flat pricing** shipped to OmeruIO (v1.17.0): one price, 0% commission, single `FLAT_PRICE_ZAR` constant. |
| 2026-07-01 | **OmeruCR created** (`control-room.md` v0.1.0 → v0.2.0): registration-locked admin app at cr.omeru.io — ecosystem KPIs, operator RBAC, segmented WhatsApp broadcast, fraud & anomaly reports, admin-only platform-mode chip. |
| 2026-07-01 | **Ecosystem direction**: OmeruHQ is the full merchant suite; OmeruWA becomes WhatsApp Lite for merchants (v1.14.0 — daily snapshot + broadcasts + notifications; everything else points to HQ). Demo mode added, only ever visible inside cr.omeru.io. |
| 2026-07-01 | **OmeruShowcase renamed OmeruDs** (v0.4.0): read-only share links, /share conversion viewer with mobile fullscreen. Mobile polish pass across portal (v0.6.0), CR (v0.2.0), Ds. |
| 2026-07-01 | **omeru-intel absorbed into OmeruCR** (`OmeruCR/intel/`, CR v0.3.0) — one home for all platform-admin tooling; intel's pre-merge history stays in merchant-portal.md § v0.4.0. **OmeruDs domain set to ds.omeru.io** (v0.4.1). |
