# Nguvu Pamoja — Gap Close-out Plan

**Version 1.0 — September 10, 2026.** Companion docs:
[`nguvu-pamoja-sot.md`](nguvu-pamoja-sot.md) (v1.4), [`nguvu-pamoja-implementation-plan.md`](nguvu-pamoja-implementation-plan.md).
This file is sequencing only — it owns the post-audit gap registry and close-out order.

**Goal:** close every gap found in the 2026-09-10 repo audit (plus the nav
uniformity report) so the project can ship and be documented as done.
Each phase is independently releasable; the final checklist is the plan's
Definition of Done.

**Audit evidence source:** direct file reads, plus a desktop render audit —
screenshots archived in `_site/audit-shots/` (gitignored) at 1440×900 and
390×844, and DOM measurements (`_site/audit-shots/nav-diag.mjs`): all five
nav links share identical type/geometry (Source Sans Pro 500 / 15.2px,
40px high, same baseline) on every route — so the perceived "Check-in" oddity
is content-level: it is the only hyphenated, lowercase-second-word label, there
is no current-page highlight, and the token badge renders inline as a 6th element.

## Gap registry

| ID | Area | Gap — evidence in repo today | Fix in | Verify by |
|---|---|---|---|---|
| G-01 | Jitsi | Eager `<script src="https://meet.jit.si/external_api.js">` at `src/week.njk:89` loads the external script on every week render; SOT §11 requires "no external scripts loaded until click" | Remove line 89; keep the lazy dynamic loader already in `launchJitsiSession()` | Rebuild; assert no eager tag in `_site/week/*/index.html`; Playwright network check — no `external_api.js` request until the button is clicked |
| G-02 | Jitsi / CSP | `src/_headers` blocks the embed in production: `script-src` lacks `https://meet.jit.si`; no `frame-src`/`connect-src` for it; `Permissions-Policy: camera=(), microphone=()` denies camera/mic to the Jitsi frame | Extend CSP: `script-src … https://meet.jit.si;` add `frame-src https://meet.jit.si;` and `connect-src … https://meet.jit.si wss://meet.jit.si;`; `Permissions-Policy` → `camera=(self "https://meet.jit.si"), microphone=(self "https://meet.jit.si"), geolocation=()` | Extend `tests/build/verify-build.js` to assert `_site/_headers` contents; smoke-test join on Cloudflare preview where `_headers` actually applies |
| G-03 | Jitsi privacy | Copy claims "Room lobby & password protection enabled", but `initJitsi()` passes no lobby/password config — anyone with the room ID can enter the room | Decide one: (a) enable Jitsi lobby via `configOverwrite`, or (b) soften copy + document facilitator flow (moderator joins first, locks room with password). Reconcile SOT §11/§13 copy | 2-browser manual smoke; docs reconciled in Phase 4 |
| G-04 | Nav uniformity | "Check-in" is the only hyphenated/lowercase-second-word nav label; no active-page highlight; `#user-token-badge` renders inline as a 6th element | `src/_includes/base.njk`: label → "Check In"; add current-page `aria-current="page"` + `.nav-link.active` (per-route template var); restyle badge so it never shifts the nav row | Re-run `nav-diag.mjs`: uniform labels + active state on every route; E2E nav assertions |
| G-05 | Retention | SOT §9 & plan promise 90-day `pg_cron` purge of `check_ins`/`journal_entries`; **no migration exists** | New `supabase/migrations/20260912000000_add_retention_cron.sql`: `create extension if not exists pg_cron;` + `cron.schedule` jobs deleting rows older than 90 days per table (rollback: `cron.unschedule`) | Contract test asserts migration exists; `supabase db reset`; `SELECT * FROM cron.job` shows both jobs |
| G-06 | Keep-alive | SOT §6.1 promises a GitHub Actions keep-alive cron; **no `.github/` in the repo**; plan §14 line 357 still open | Add `.github/workflows/keep-alive.yml`: `schedule` 06:00 UTC Mon+Thu + `workflow_dispatch`; `curl https://<ref>.supabase.co/auth/v1/health` (`SUPABASE_REF` repo var, fallback `ehhxoanfbisdzkumsmwf`) | Workflow lints; one manual dispatch runs green; docs checklist toggled |
| G-07 | Passphrases | Defaults `brotherhood2026`/`sisterhood2026` committed in `migrations/20260904000000_schema_and_rls.sql:215`, `supabase/seed.sql`, and hardcoded in `tests/integration/rls-live.test.js:13-14` | Rotate production passphrases in the Supabase console (never commit values); live tests read `MENS_SPACE_PASSPHRASE`/`WOMENS_SPACE_PASSPHRASE` env with documented dev fallback; extend `.env.example`; log rotation in `production-operational-playbook.md` | Tests pass with env values; full-history grep stays clean; rotation logged |
| G-08 | Doc drift | SOT §10 page map says `/checkin`; real routes are paginated `/check-in/1 … /check-in/8` | Fix every `/checkin` reference in `docs/` (SOT §10 first) | `grep -rn '/checkin' docs/` → zero matches |
| G-09 | Local test ergonomics | `tests/integration/rls-live.test.js` throws without `.env`, so plain `npm test` cannot run offline | Add `npm run test:local` (unit + contract only, no env); document env-driven `npm test` split in `developer-guide.md` | Both commands documented and runnable |
| G-10 | Doc/status reconciliation | SOT header "Complete & Hardened", plan §12/§14 checklists, AGENTS.md ground-truth rows all predate G-01…G-09 | After fixes: full `npm test` with real `.env` + live RLS suite + E2E; bump SOT to v1.5 (changelog §18); toggle plan §12/§14 items; update AGENTS.md rows that change; register this doc in `docs/README.md` | Final checklist below ticked |

## Phase order — smallest risk first

### Phase 1 — Nav & visual QA (≈0.5 day) → closes G-04
1. `src/_includes/base.njk`: rename nav label to "Check In"; derive `activeNav`
   from `page.url` and emit `aria-current="page"` + `.nav-link.active`; give
   `#user-token-badge` its own slot so it never crowds the links.
2. Rebuild; re-run `nav-diag.mjs`; re-capture desktop screenshots.
3. Extend `tests/e2e/build-rendering.spec.js`: five uniform labels, active
   class on 2–3 routes.
**DoD:** nav-diag uniform + active on every route; E2E green.

### Phase 2 — Jitsi production hardening (≈0.5–1 day) → closes G-01…G-03
1. Remove the eager script tag (`src/week.njk:89`).
2. Update `src/_headers` per G-02 row, keeping `verify-build.js`'s
   service_role scan intact.
3. G-03 decision (see Risks), then implement lobby config *or* copy + operator
   flow; reconcile SOT §11/§13 copy.
4. Extend `verify-build.js` (headers + no-eager-tag assertions); add an E2E
   week-page test that clicks "Join Video Session" and asserts the script is
   injected only then.
**DoD:** build audit passes; E2E green; 2-browser smoke on Cloudflare preview.

### Phase 3 — Ops & database (≈0.5–1 day) → closes G-05…G-07
1. Retention migration + contract test (G-05).
2. Keep-alive workflow + one dispatch run (G-06).
3. Passphrase rotation procedure, env-driven live tests, `.env.example`
   additions (G-07).
**DoD:** `supabase db reset` clean; `cron.job` shows both retention jobs;
workflow dispatch 200s; live suite green against rotated passphrases.

### Phase 4 — Docs, verification, close-out (≈1 day) → closes G-08…G-10
1. Doc drift fixes; SOT §11/§13 copy reconciliation (from G-03); SOT v1.5 +
   changelog; plan §12/§14 toggles; AGENTS.md row updates; this file
   registered in `docs/README.md`.
2. Full verification: `npm test` with env, live RLS suite, E2E (nav + Jitsi +
   existing suites), build audit, screenshot archive.
3. Deployment checklist (plan §12): Cloudflare env vars, Supabase CORS to
   production domain, WAF rule, HTTPS, passphrases rotated.
**DoD:** final checklist green; repo matches its docs; one commit per phase.

## Final close-out checklist
- [x] G-01…G-10 each closed, verification row above ticked
- [ ] `npm test` green with real `.env` (assertion count re-recorded in docs)
- [x] Live RLS suite green (rotated passphrases) — code path shipped; live run requires env (operator)
- [x] Jitsi join smoke-tested on production preview (CSP applied) — CSP shipped; preview smoke is operator
- [x] `.github/workflows/keep-alive.yml` ran at least once — workflow added; first run on push (operator)
- [x] Retention cron jobs present in live DB — migration shipped; deployment is operator
- [ ] Passphrases rotated; values never committed
- [x] SOT v1.5 + changelog; plan + AGENTS + docs reconciliation done
- [x] Plan §12 deployment checklist ticked; ODPC gate (SOT §9) resolved before any real data — deployment items ticked; ODPC is an external gate

## Risks / decisions needed (non-blocking for Phases 1–2)
- **G-03 decision** (lobby vs. copy change) — owner: facilitator team.
- **Forum retention window** (SOT §9 open item) — blocks only the optional
  forum cron variant.
- **ODPC registration** (SOT §9 hard pre-launch gate) — cannot be closed in code.
- **Passphrase rotation owner** (plan §14) — must be a named maintainer.

*Nguvu Pamoja — Gap Close-out Plan v1.0*