# Nguvu Pamoja documentation hub

Canonical product docs live in this folder. Agents and humans should
update these files rather than creating a third copy of the same fact.

Two questions decide where something lives: **is this "why / what we
decided" or "what to do next"?** and **is this a durable decision or a
tool version that will go stale?**

| File | Owns | Does not own |
|---|---|---|
| [nguvu-pamoja-sot.md](nguvu-pamoja-sot.md) | Context, core values, architecture, data model, security, page map, decision log | Sprint task order or developer walkthroughs |
| [nguvu-pamoja-implementation-plan.md](nguvu-pamoja-implementation-plan.md) | Build sequence, testing/deploy/maintenance checklists, open items | A second architecture document |
| [developer-guide.md](developer-guide.md) | Technical subsystem explanations, codebase navigation, developer extensibility guides | Core architecture decisions or sprint history |
| [../CONTRIBUTING.md](../CONTRIBUTING.md) | Community contribution rules, PR workflow, code of conduct | Internal subsystem technical walkthroughs |
| [../AGENTS.md](../AGENTS.md) | Operational guidelines for AI coding agents | Architecture authority (links to SOT) |
| [gap-closeout-plan.md](gap-closeout-plan.md) | Post-audit gap registry + close-out sequencing (2026-09-10) | Architecture (SOT) or build sequence (implementation plan) |
| [user-guide.md](user-guide.md) | Participant-facing usage guide (token, check-in, journal, forum, video, privacy FAQ) | Architecture, sprint order, or operator internals |
| [fountwood-leaders-briefing.md](fountwood-leaders-briefing.md) | Community-leader presentation & briefing — scale and compliance (Kenya DPA / ODPC) | Sprint task order or technical walkthroughs |

If a fact is asserted in more than one place and they disagree, that is
a bug: the SOT wins for architecture; the implementation plan wins for
order of work; `AGENTS.md` is updated to match code inspection.

Stale-prone tool versions belong only in SOT Section 16.

---

## Status

Sprint 0-4 complete. Schema + RLS deployed to live Supabase
(`ehhxoanfbisdzkumsmwf`). Test suite: 27 unit/contract + 3 live RLS +
1 build audit + 20 browser E2E.

2026-09-10 audit found gaps (Jitsi production CSP, retention cron, keep-alive
workflow, nav uniformity, doc drift) — close-out tracked in
[`gap-closeout-plan.md`](gap-closeout-plan.md).

**2026-09-10 close-out + video upgrade shipped:** nav uniformity, Jitsi
lazy-load + production CSP, retention cron migration, keep-alive workflow,
passphrase env-ization, `test:local`, doc reconciliation (SOT v1.7), and
8x8 JaaS video (`8x8.vc`) with `meet.jit.si` fallback — removes the public
demo 5-minute disconnect limit. Remaining items are the operator-only ones
(rotate live passphrases, deploy retention + workflow, ODPC gate).

**Participant & leader docs added:** [`user-guide.md`](user-guide.md)
(plain-language usage guide) and [`fountwood-leaders-briefing.md`](fountwood-leaders-briefing.md)
(scale & compliance briefing for church leadership).

## Test files

| File | What it verifies |
|---|---|
| `tests/unit/token.test.js` | Token generation (3-word format, randomness, dedup) |
| `tests/unit/escapeHtml.test.js` | XSS escaping across all 5 critical entities |
| `tests/unit/supabase-client.test.js` | Custom header injection in Supabase client |
| `tests/contract/schema-contract.test.js` | Schema SQL structure and RLS policy names |
| `tests/integration/rls-live.test.js` | Live RLS isolation against Supabase |
| `tests/build/verify-build.js` | File existence, env injection, service_role audit |
| `tests/e2e/*.spec.js` | Browser rendering, token flow, XSS, passphrase gate |

Run all: `npm test`

---

## Naming

- Lowercase, hyphenated filenames in `docs/`
- One canonical file per concern — update it; do not add a parallel doc
- Agent instructions stay in repo-root `AGENTS.md` (Cline: `.clinerules` symlink)
