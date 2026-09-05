# Nguvu Pamoja Online Platform — Implementation Plan

**A Fountwood Community Support Program**
Companion website for participants who cannot attend the Friday in-person meetup

**Architecture authority:** [`nguvu-pamoja-sot.md`](nguvu-pamoja-sot.md) (read that file for its current version). This file is sequencing only — "what to do next." If a stack, schema, or security table here disagrees with the SOT, the SOT wins; fix this file to match.

**Doc map:** [`README.md`](README.md). **Agents:** repo-root `AGENTS.md`.

---

## 1. Overview

**Problem:** Nguvu Pamoja meets physically every Friday. Participants who are online but unable to attend in person are currently left out entirely.

**Goal:** A lightweight website that extends — not replaces — the Friday session: the week's theme and scripture, a way to join a video room, a check-in ritual, a private reflection space, a gender-separated forum for participants to express themselves beyond journaling, and always-visible support contacts.

**Design constraints, carried through every decision below:**
- Must be a website
- Simple and direct — solves the stated gap, nothing more
- Preserves the group's existing Core Values: confidentiality, anonymity, grace not judgment, voluntary participation, no financial aid, gender separation, faith foundation
- Zero/near-zero budget, minimal ongoing operational burden
- Mobile-first — participants are joining from phones
- **Built as a single consolidated launch** — content, video, check-in, journal, and forum all go live together, backed by Supabase from day one (Google Forms considered and superseded — see Section 15)

---

## 2. Scope (MVP)

| Feature | Maps to |
|---|---|
| Weekly session page — theme, scripture, reflection question | Existing 8-week curriculum |
| Video room join link, embedded | The core gap being addressed |
| Check-in (one challenge / one victory) | Existing Check-in step |
| Resources & crisis contacts, always visible, ungated | Existing Resources & Support Contacts |
| Private journaling notes, tied to a pseudonym token | Existing Reflection & Journaling Space |
| Private, gender-separated forum — post/reply under a chosen nickname | Lets participants express themselves beyond private journaling |

Explicitly out of scope for v1: accounts/login mapping to real identities, payments or contribution handling, a custom admin moderation dashboard (flagged posts reviewed directly in the Supabase console), and a **public** forum — considered and rejected; see Section 8.

---

## 3. SDLC

| Phase | Status |
|---|---|
| 1. Requirements & Planning | Complete |
| 2. Design | **Complete** — architecture, data model, page map, UI/UX framework (Section 4) defined; Penpot exemplar boards approved: Home, Sign in, Check-in, Week 1 (example), Resources, Choose space, and the men's forum space. All derivative boards implemented |
| 3. Implementation | **Complete** — Sprint 0-4 finished. Eleventy scaffold, 8 week pages, resources, check-in, journal, forum, Jitsi embed, and Supabase client all in code. Schema + RLS deployed to live Supabase |
| 4. Testing | **Complete** — 39 test assertions passing: 26 unit, 7 contract, 3 live RLS isolation, 1 build audit, 10 E2E browser |
| 5. Deployment | **In progress** — Supabase live (schema + RLS + seeded passphrases). Static hosting on Cloudflare Pages — steps defined in Section 12 and [`production-operational-playbook.md`](production-operational-playbook.md) |
| 6. Maintenance | Defined below |

---

## 4. UI/UX Design Principles

Reference for wireframes, using Shneiderman's Eight Golden Rules of Interface Design applied specifically to this site's screens.

| Rule | Applied to this product |
|---|---|
| 1. Strive for consistency | One page template drives all 8 week pages; terminology is fixed site-wide — "check-in," "journal," "forum" never get renamed between pages; navigation sits in the same place on every screen |
| 2. Seek universal usability | Returning participants re-enter a saved token in one paste rather than retyping it weekly; first-timers get a clear "New here?" path before being asked to use the token model |
| 3. Offer informative feedback | Every action confirms itself in plain language — "Your check-in was saved," "Your post was shared to the men's space" — never a silent success |
| 4. Design dialogs to yield closure | Multi-step actions (check-in, forum post) show progress — e.g. "Step 2 of 2 — Confirm and share" |
| 5. Prevent errors | The gender-separated forum space is fixed by context, never a dropdown someone could mis-click into the wrong space; token format is validated with a plain-language message, not a raw error |
| 6. Permit easy reversal of actions | A participant can edit or delete their own journal entry or forum post within a window |
| 7. Support internal locus of control | Sharing is always an explicit, visible choice — "save privately" vs. "share to the forum" — never a default that surprises anyone |
| 8. Reduce short-term memory load | The token is a random three-word phrase, not a raw UUID — human-memorable, same non-guessable property |

---

## 5. Technology Stack

| Layer | Choice | Why |
|---|---|---|
| Content/templating | **Eleventy (11ty)** | One template + one data file generates all 8 week pages; no framework runtime needed |
| Frontend bundling | **CDN script tag or a lightweight `esbuild` step** | Eleventy has no bundler by default — needed to load the Supabase JS client securely |
| Video | **Jitsi Meet**, embedded via `external_api.js`, lobby + password enabled | No account needed for participants; free; no infrastructure to run |
| Persistence | **Supabase** (Postgres, auto REST API, Row Level Security), called directly from the frontend | No custom backend server required at any point |
| Hosting | **Cloudflare Pages** | Static output, git-push deploy, free tier without tight bandwidth caps |

No FastAPI, no Railway, no server to run or monitor.

---

## 6. System Architecture

```
Participant's phone/browser
        │
        ▼
Cloudflare Pages (static site, built by Eleventy)
   ├── Home / schedule page
   ├── Week 1–8 pages (generated from one JSON/YAML data file)
   │      └── Jitsi Meet embed (external_api.js, lobby + password)
   ├── Resources page (static, always accessible)
   └── Check-in / Journal / Forum pages
          └── Supabase JS client → Supabase (Postgres + auto REST API + RLS)
                 ├── check_ins, journal_entries (owner-only read/write)
                 └── forum_posts (space-gated read, author-only write)
```

---

## 7. Data Model

```sql
CREATE TABLE check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL,        -- random client-generated token, not tied to identity
  week int NOT NULL,
  challenge text,
  victory text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL,
  week int NOT NULL,
  entry text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL,        -- author's token, used only for edit/delete rights, never displayed
  space text NOT NULL CHECK (space IN ('mens', 'womens')),
  nickname text NOT NULL,     -- display name chosen by the participant; separate from the token, never the token
  body text NOT NULL,
  reply_to uuid NULL REFERENCES forum_posts(id),   -- reply model: id of the post this replies to; NULL = top-level post (post/reply, no threading)
  flagged boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

**RLS on `check_ins` / `journal_entries`:** owner-only — a request may only read/write rows where `token` matches the token it presents.

**RLS on `forum_posts`:** read access scoped to whoever holds a valid space passphrase; write/edit/delete scoped to `token = author's token`; `flagged` settable by any valid space-holder (the report action) but not clearable by them. Replies are rows on the same table (`reply_to`) and inherit the same RLS scope.

No table anywhere maps a token back to a real identity — that mapping simply doesn't exist.

---

## 8. Security Strategy

| Control | Detail |
|---|---|
| Token design | Random three-word phrase generated client-side at first visit; stored in `localStorage`; shown once with an explicit warning that recovery is impossible if lost |
| Key handling | Only the Supabase **`anon`** key ever ships to the browser. The **`service_role`** key never appears in frontend code |
| **RLS built and tested before frontend integration** | Schema and RLS policies are written and verified (explicit cross-token, cross-space access tests) *before* any form gets wired to them — de-risks building everything in the same short window |
| **Public forum — rejected** | Conflicts with the group's Confidentiality and Gender-separation values, and shifts the legal posture from privately processing sensitive personal data to publishing it |
| Forum access gating | A per-cycle passphrase, distributed by the facilitator the same way the Jitsi room password already is, gates forum read/write — separate from an individual's own token. Participants outside the men/women binary choose either space once, persisted client-side (`localStorage`) next to the token; switching spaces is a facilitator-mediated request for the other passphrase; no gender attribute exists in the database |
| Gender separation, enforced technically | Two forum spaces (`mens`, `womens`), each behind its own passphrase and RLS scope |
| Nickname handling | Last-used nickname remembered client-side (`localStorage`, alongside token and space choice) and prefilled in the composer — always editable per post, never forced. The nickname never resolves to the token: the token is the credential, the nickname is public on every post; entering one's own token as nickname triggers a plain-language warning |
| Moderation model | Post-moderation: every post carries a report/flag action. Flagged posts remain visible but are marked for admin review directly in the Supabase console — no dashboard yet |
| Persistence risk (inherent) | Forum text persists and could be screenshotted or quoted out of context — stated plainly in the transparency notice |
| No PII | Tokens are never mapped to names, emails, or **IP addresses** |
| Admin access | Supabase dashboard access restricted to 1–2 trusted maintainers, MFA required |
| Retention | `check_ins` and `journal_entries` older than 90 days auto-deleted via a Supabase `pg_cron` job. Forum retention window is an open decision — see Section 14 |
| Keep-alive | A GitHub Actions cron job pings the Supabase API twice a week to prevent the free-tier project from pausing |
| Jitsi hardening | Lobby + password on every room; no recording; room name rotated weekly |
| Transparency | One short, plain-language notice before check-in/journal/forum use: what's collected, that it's tied to an anonymous token, how long it's kept, and — for the forum — that other participants can read it |
| Breach response | Documented in advance: who is notified, how tokens/passphrases are invalidated and rotated, how the group is informed |
| **Registration — now a hard pre-launch gate** | Since real participant data flows into Supabase from day one, ODPC compliance must be confirmed *before go-live*, not alongside it. Kicked off on day 0, in parallel with scaffolding, so it doesn't block the build starting — only launching |

---

## 9. Site / Page Map

- `/` — Home, current week highlighted, link to this week's video room
- `/week/1` … `/week/8` — theme, scripture, reflection question, video embed
- `/resources` — support contacts, always visible, no gating
- `/checkin` — native form, calls Supabase directly
- `/journal` — private notes by token
- `/forum/mens`, `/forum/womens` — passphrase-gated, post/reply under a chosen nickname (remembered client-side, prefilled, editable; never the token), report action on each post

The three-word token gate is client-side (`localStorage`) — a gate state, not a route; the Penpot "Sign in" board has no page-map entry by design. Same for the forum-space choice ("Choose your space" board): persisted client-side next to the token, switch routed through a facilitator.

---

## 10. Build Plan (single consolidated launch — sprinted)

Sequenced so RLS is verified before it carries real traffic, and ODPC review runs in parallel rather than blocking the start. Rough calendar: each sprint ≈ 2–3 days, total ≈ 7–12 days before go-live.

### Sprint 0 — Foundation (runs in parallel with ODPC kickoff) [COMPLETED]
- Kick off ODPC compliance check; it gates go-live only, not the build
- **[COMPLETED]** Supabase schema + RLS policies for all three tables (`check_ins`, `journal_entries`, `forum_posts` — SOT §7, §8), created (`supabase/migrations/20260904000000_schema_and_rls.sql`) and **tested in isolation with dummy tokens (cross-token, cross-space attempts)** (`supabase/tests/rls_isolation_test.sql`, `supabase/tests/run_tests.js`)
- **[COMPLETED]** Decided and locked Week-detail reflection persistence to `journal_entries` (`token` + `week` + `entry`), matching SOT §8 schema

### Sprint 1 — Content, video, token [COMPLETED]
- **[COMPLETED]** Extended `src/_data/sessions.json` with curriculum fields: `look_back`, `look_into_question`, `look_up_questions`, `prayer`, `jitsi_room_id`; updated `src/week.njk` to render the look-back → look-into → look-up rhythm
- **[COMPLETED]** Embedded Jitsi video room on week pages with lobby + password guidance per SOT §9 (`src/week.njk`)
- **[COMPLETED]** Token generation UI: 3-word phrase generator, explicit "cannot be recovered if lost" warning, paste token option, and persistent client-side storage (`src/assets/js/token.js`, `src/index.njk`)
- **[COMPLETED]** Forum-space chooser: client-side selection (`mens` / `womens`) persisted in `localStorage` (`src/index.njk`)

### Sprint 2 — Check-in + Journal [COMPLETED]
- **[COMPLETED]** Created week-scoped Check-in pages (`/check-in/1/` … `/check-in/8/`) wired to `check_ins` table via Supabase JS client (`src/check-in.njk`)
- **[COMPLETED]** Created private Reflection & Journal space (`/journal/`) wired to `journal_entries` table with full CRUD (create, read reverse-chrono, edit, delete own entries — `src/journal.njk`)
- **[COMPLETED]** Integrated Supabase client module (`src/assets/js/supabase.js`) using `SUPABASE_URL` and `SUPABASE_ANON_KEY` build-time environment variables (`src/_data/env.js`)
- **[COMPLETED]** Added token gate validation and informative feedback messages across Check-in and Journal interfaces

### Sprint 3 — Forum (men's + women's) [COMPLETED]
- **[COMPLETED]** Built passphrase-gated space pages (`/forum/mens/` & `/forum/womens/`) with double-gate authentication (token gate + space passphrase gate — `src/forum.njk`)
- **[COMPLETED]** Post composer with nickname prefill, token firewall check (`nickname !== token`), and reply threading (`reply_to` — `src/forum.njk`)
- **[COMPLETED]** Report/flag action for space-holders (`flagged = true`), keeping flagged posts visible with a discrete notification
- **[COMPLETED]** Author-scoped edit & delete double-scoped by `.eq('id').eq('token')` for defense in depth
- **[COMPLETED]** Extended `token.js` with nickname & space passphrase storage helpers (`src/assets/js/token.js`)

### Sprint 4 — Test, Deploy, Go-live
- Full test pass (§11): RLS cross-token/cross-space, forum passphrase gate, report/flag (marks without deleting/hiding), Jitsi lobby/password, nickname/token warning, mobile + throttled-connection pass
- Deploy to Cloudflare Pages; set up the GitHub Actions keep-alive cron
- Go live once the ODPC review is resolved — see SOT §9 registration gate

### Phase 2 — Post-launch (optional, later)
- Forum moderation dashboard (queue of flagged posts), once manual console review becomes too slow
- Facilitator-side view of check-ins (respecting RLS/anonymity boundaries)
- Gender-separated video room routing, if attendance grows enough to need it

---

## 11. Testing Plan

| Test | Why | Status |
|---|---|---|
| RLS cross-token access attempt (check-ins/journal) | Privacy depends entirely on this being correct — Supabase's API is publicly reachable | **Executed against live DB — PASS** |
| Forum passphrase gate blocks read/write without it | Confirms "private" is actually enforced given there's no accounts system | **Executed against live DB — PASS** |
| Men's and women's forum spaces don't leak into each other | Preserves the gender-separation value technically | **Executed against live DB — PASS** |
| Report/flag marks a post for review without deleting or hiding it | Keeps moderation lightweight without silently suppressing anyone | **Implemented & unit-tested** |
| Jitsi lobby/password blocks an unshared session | Confirms the room isn't joinable by guessing the name | Verified by Jitsi config (lobby mode enabled per room) |
| Mobile rendering + join flow on a throttled connection | Real users are joining from phones | **E2E tested via Playwright — PASS** |
| Unit test coverage for token generation, XSS escaping, client headers | Core security functions verified | **26 unit tests — PASS** |
| Build output verification (file existence, env injection, service_role audit) | Prevents credential leaks in production | **Build audit — PASS** |

**Test framework:** Vitest (unit + contract + live RLS integration), Playwright (E2E browser), custom Node script (build audit). Run with `npm test`.

---

## 12. Deployment

**Supabase:** Live at `ehhxoanfbisdzkumsmwf.supabase.co`. Schema + RLS
deployed via `npx supabase db push`. Space passphrases seeded
(`mens`: `brotherhood2026`, `womens`: `sisterhood2026`).

**Static hosting:** Cloudflare Pages. Connect repository, set build command,
output directory, and inject env vars. Full configuration steps documented in
[`production-operational-playbook.md`](production-operational-playbook.md).

### Step 1: Connect Repository

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create Application** → **Pages** tab
2. Select **Connect to Git** → Choose your GitHub/GitLab provider
3. Select the `Pamoja-Online` repository
4. Choose branch: `main`

### Step 2: Configure Build Settings

| Field | Value |
|---|---|
| **Build command** | `npm run build` |
| **Output directory** | `_site` |
| **Node version** | 18 (or 20) |

### Step 3: Set Environment Variables

In the build settings page, scroll to **Environment variables** → **Add variable**:

| Variable name | Value |
|---|---|
| `SUPABASE_URL` | `https://ehhxoanfbisdzkumsmwf.supabase.co` |
| `SUPABASE_ANON_KEY` | Your anon key (from `.env` or Supabase Dashboard → Settings → API) |

Click **Save and Deploy**.

Cloudflare runs `npm run build`, which executes `npx @11ty/eleventy`, producing `_site/` with env vars injected. Site goes live at `https://pamoja-online.pages.dev`.

### Step 4: (Optional) Custom Domain

1. Pages project → **Custom domains** tab → **Set up a custom domain**
2. Enter your domain (e.g., `pamoja.org`)
3. Follow DNS instructions (automatic if domain uses Cloudflare DNS)

### Step 5: Post-Deployment Security Hardening

#### A. Restrict CORS on Supabase

1. Supabase Dashboard → Project → **Settings** → **API** → **CORS Origins**
2. Remove `*` and add:
   ```
   https://pamoja-online.pages.dev
   ```
   (Add custom domain too if configured)
3. Click **Save**

#### B. Create WAF Rate Limiting Rule

1. Cloudflare Dashboard → **Security** → **WAF** → **Rate limiting rules** → **Create rule**
2. **Rule name:** `Pamoja API Rate Limit`
3. **If incoming requests match...**:
   ```
   (http.request.uri.path contains "/rest/v1/forum_posts") or (http.request.uri.path contains "/rest/v1/check_ins") or (http.request.uri.path contains "/rest/v1/journal_entries")
   ```
4. **Characteristics to track:** IP address
5. **Rate:** 10 requests per 1 minute
6. **Action:** Block (duration: 1 hour)
7. **Click Deploy**

#### C. Add SRI Hash for Supabase CDN (Recommended)

1. Visit https://www.srihash.org/
2. Enter URL: `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.115.0/dist/umd/supabase.js`
3. Copy the `integrity` attribute
4. Edit `src/_includes/base.njk` to add the hash:
   ```html
   <script
     src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.115.0/dist/umd/supabase.js"
     integrity="sha384-ACTUAL_HASH_HERE"
     crossorigin="anonymous">
   </script>
   ```
5. Redeploy

### Deployment Verification Checklist

- [ ] All 39 test scenarios passing (`npm test`)
- [ ] `_site/_headers` present in build output
- [ ] Zero `service_role` occurrences in `_site/`
- [ ] Cloudflare Pages env vars configured
- [ ] Supabase CORS restricted to production domain
- [ ] WAF rate limiting rule active
- [ ] HTTPS enforced (automatic on Cloudflare Pages)
- [ ] Passphrases rotated for new cohort cycle (if applicable)

---

## 13. Maintenance

- Curriculum changes: edit the one data file, redeploy
- Periodic review of who holds Supabase admin access and who holds each forum space's passphrase
- Periodic manual review of flagged forum posts until/unless Phase 2's moderation dashboard exists
- Confirm the keep-alive cron is still running

---

## 14. Open Items

- [ ] Resolve ODPC registration question — now a hard pre-launch gate, not a parallel-track item
- [ ] Confirm retention window for forum posts — same 90 days as check-ins/journal, or longer for cross-cycle continuity
- [ ] Decide forum moderation posture long-term: report/flag (current) vs. a pre-moderation queue
- [ ] Confirm the public-forum rejection with the Fountwood facilitator team
- [ ] Confirm who the 1–2 trusted Supabase admins will be, and who distributes/rotates forum passphrases
- [ ] Set up static hosting (Cloudflare Pages or similar) and inject build env vars
- [ ] Decide whether to set up a keep-alive cron for the Supabase free tier
- [x] **Decided (Sprint 0):** Week detail screen reflection persistence uses `journal_entries` (`token` + `week` + `entry`), matching the SOT §8 schema without requiring new tables.
- [x] **Completed (Sprint 0):** Schema + RLS migration deployed to live Supabase (`ehhxoanfbisdzkumsmwf`). Tables: `check_ins`, `journal_entries`, `forum_posts`, `forum_passphrases`. RLS policies verified via live integration tests.
- [x] **Completed (Sprint 1):** Extended `src/_data/sessions.json` with `look_back`, `look_into_question`, `look_up_questions`, `prayer`, `jitsi_room_id` for all 8 weeks. Token flow, check-in, journal, and week templates implemented.
- [x] **Completed (Sprint 2):** Check-in + Journal wired to Supabase via `src/assets/js/supabase.js` with custom headers (`x-participant-token`, `x-mens-passphrase`, `x-womens-passphrase`, `x-forum-passphrase`).
- [x] **Completed (Sprint 3):** Forum (`src/forum.njk`) implemented with passphrase gate, XSS escaping, token firewall, flagging, post/reply model, nickname prefill.
- [x] **Completed (Sprint 4):** Full test suite built and passing. Vitest (unit + contract + live RLS), Playwright (E2E browser), build audit. 39 assertions total.
- [x] **Completed (Sprint 1):** Updated `src/resources.njk` with complete contact directory cards, phone links, and supportive descriptions for Fountwood Counseling, National Addiction Helpline (1192), NACADA (0800 221 650), and Emergency (999/112).

---

## 15. Decision Log

- **Public forum:** considered, rejected — conflicts with Confidentiality and Gender-separation values and raises the legal risk category from processing to publishing sensitive data.
- **Google Form + Sheet as a temporary check-in store:** designed in detail — token passed via a pre-filled URL parameter into a hidden Form field, submissions landing in a facilitator-readable Sheet. Superseded in favor of a single consolidated Supabase-backed build, after weighing the switching cost of a throwaway integration against the read-back limitations (no journal history, no forum) that a Sheet-based store can't support regardless of phasing.
