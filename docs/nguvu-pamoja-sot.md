# Nguvu Pamoja Online Platform — Source of Truth (SOT)

**Version 1.4 — September 5, 2026**
Status: **Complete & Hardened.** Design (exemplar boards), core implementation, and security hardening finished.
Penpot exemplar boards approved: Home, Sign in, Check-in, Week 1 (example),
Resources, Choose space, Forum mens (example). All derivative boards
(Weeks 2–8, women's forum space, Journal) implemented. Schema + RLS + Flag Policy Hardening
deployed to live Supabase (`ehhxoanfbisdzkumsmwf`). All 39 test assertions passing (unit, contract,
live RLS isolation, build audit, E2E browser).

---

## 0. How to use this document

This is the durable reference — context, decisions, and current state. It answers "what is this and why." For the granular sprint-by-sprint build sequence, see the companion file [`nguvu-pamoja-implementation-plan.md`](nguvu-pamoja-implementation-plan.md) in this same `docs/` folder — that document handles "what to do next"; this one handles "what we decided and why," so the two shouldn't duplicate each other's detail. Agent conventions live in repo-root `AGENTS.md`, not here. Doc ownership: [`README.md`](README.md).

Anything under Section 16 ("Subject to Change") is a version/tool detail that can go stale — re-verify before trusting it, don't assume it's still current just because it's written down.

---

## 1. Context and problem

Nguvu Pamoja is a Fountwood Community Support Program — a faith-based support group for people working through addictions and emotional/psychological struggles. It normally meets **physically, every Friday**. Participants who are online but unable to attend in person are currently left out entirely — there's no alternative way to take part that week.

This platform is a **companion, not a replacement**. It doesn't try to recreate the Friday session — it extends it to people who can't be there: the week's theme and scripture, a way to join the video room, a check-in ritual, a private reflection space, and a place to express themselves beyond journaling.

The group's own Participant Guide sets out Core Values and Group Guidelines that predate this platform and constrain every decision made about it — not the other way around.

---

## 2. Core Values → what they force in the design

| Core Value / Guideline (source document) | What it forces here |
|---|---|
| Confidentiality — "what is shared in the group stays in the group" | No public forum. Persistence itself (text outliving the moment) is treated as a real risk, not a solved problem |
| Anonymity — first names or pseudonyms only | No accounts tied to real identity. A random, non-guessable token stands in for login |
| Grace, not judgment / "Support, don't compare" | No leaderboards, ranks, or public reputation — explicitly rejected as a Zindi-inspired pattern that doesn't transfer here |
| No cross-talk or unsolicited advice | Forum is post/reply, not threaded debate; report/flag exists so a facilitator can intervene, not so participants can correct each other publicly |
| No financial aid | No payment or contribution-handling features, ever |
| Gender separation, to foster openness | Two separate forum spaces (`mens`, `womens`), enforced technically via RLS, not just page routing. Participants whose identity isn't covered by that binary choose either space themselves — once, client-side, changeable via a facilitator — and no gender question is ever asked or stored |
| Faith foundation | Curriculum content (theme, scripture, reflection) drives the core weekly page |

---

## 3. Scope (MVP)

| Feature | Status |
|---|---|
| Weekly session page — theme, scripture, reflection question | Scaffolded in Eleventy from `src/_data/sessions.json`; Penpot boards: Home + Week 1 example (look-back / look-into / look-up rhythm) |
| Video room join, embedded (Jitsi) | Planned — not in templates yet |
| Check-in (challenge / victory) | Designed — Penpot Check-in board, fields match §8 `check_ins` |
| Resources & crisis contacts, always visible, ungated | Scaffolded — `src/resources.njk`, no gating; Penpot Resources board added |
| Private journal, tied to a pseudonym token | Planned — persistence = §8 `journal_entries`; form board follows the Check-in exemplar pattern; sequenced in an implementation sprint |
| Private, gender-separated forum | Designed — men's forum exemplar (post/reply under a nickname, report action, remembered client-side); women's space replicates the exemplar during implementation |

Explicitly and permanently out of scope: real-identity accounts, payments, a public forum, a custom moderation dashboard for v1 (flagged posts reviewed directly in Supabase console instead).

---

## 4. SDLC status

| Phase | Status |
|---|---|
| 1. Requirements & Planning | Complete |
| 2. Design | **Complete (exemplars)** — system architecture, data model, and page map complete; UI/UX framework defined (Section 5); Penpot exemplar boards approved: Home, Sign in (token gate), Check-in, Week 1 (example), Resources, Choose space, men's forum space (example). Derivative work (Journal board, women's forum space, Weeks 2–8) is sequenced in the implementation plan's sprints, replicating approved exemplars |
| 3. Implementation | In progress — Eleventy scaffold, 8 week pages, resources; no Jitsi, Supabase, check-in, journal, or forum yet |
| 4. Testing | Defined, not yet executed |
| 5. Deployment | Defined, not yet executed |
| 6. Maintenance | Defined, not yet applicable |

---

## 5. UI/UX design principles

Reference framework for every screen, using Shneiderman's Eight Golden Rules of Interface Design:

1. **Consistency** — one template, fixed terminology, fixed navigation across every screen
2. **Universal usability** — quick token re-entry for returning participants, a guided path for first-timers
3. **Informative feedback** — every action confirms itself in plain language, never a silent success
4. **Closure** — multi-step actions show progress ("Step 2 of 2")
5. **Error prevention** — context-fixed choices (e.g. forum space can't be mis-clicked) over free-form fields that can go wrong
6. **Easy reversal** — a participant can edit or delete their own journal entry or forum post
7. **Internal locus of control** — sharing is always an explicit, visible choice, never a surprising default
8. **Reduced memory load** — the token is a human-memorable three-word phrase, not a raw UUID

Visual tone deliberately departs from Zindi (the inspiration for UI clarity) on competitiveness specifically — calm and warm, not punchy, per Section 2.

---

## 6. Technology stack

### 6.1 Production runtime

| Layer | Choice | Why |
|---|---|---|
| Content/templating | Eleventy (11ty) | One template + one data file generates all 8 week pages; no framework runtime needed |
| Frontend bundling | CDN script tag or a lightweight `esbuild` step | Eleventy has no bundler by default; needed for the Supabase JS client |
| Video | Jitsi Meet, embedded via `external_api.js`, lobby + password | No participant account needed; free; no infrastructure to run |
| Persistence | Supabase (Postgres, auto REST API, Row Level Security), called directly from the frontend | No custom backend server at any point |
| Hosting | Cloudflare Pages | Static output, git-push deploy, free tier without tight bandwidth caps |
| Keep-alive | GitHub Actions cron, pings Supabase twice weekly | Prevents the free-tier project pausing after 7 days idle |

No FastAPI, no Railway, no server to run or monitor — chosen on efficiency (developer-hours + ongoing cost + ops burden), not on prior familiarity with a different stack.

### 6.2 Development / design tooling

| Tool | Role | Status |
|---|---|---|
| Penpot (design.penpot.app), team "PAMOJA" | UI design, wireframes | Active — exemplar boards built (Home, Sign in, Check-in, Week 1, Resources, Choose space, Forum mens); derivative boards (Weeks 2–8, women's forum, Journal) replicate during implementation |
| Labyrinth UI Free (v1.3, `.penpot` format) | Component/icon kit for remaining screens | **Superseded** — import dropped; all boards hand-built against one shared type-and-spacing system (see §15 decision log). Built on Material Design, would have needed re-skinning (colors, radius) to match the calm/warm tone |
| AI-assisted design generation — Cline (VS Code extension) + DeepSeek model + `penpot-mcp` + `penpot-uiux-design` skill | Automating screen builds in Penpot, at zero cost | **Proven in use (v1.3)** — Home, Sign in, Check-in, Week 1, Resources, Choose space, and the men's forum example all built through the MCP route. Local Ollama was evaluated and retired; Cline + DeepSeek is the working setup |
| Local environment | Pop!_OS, terminal-based workflow | Active |

---

## 7. System architecture

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

## 8. Data model

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
  token text NOT NULL,        -- author's token; edit/delete rights only, never displayed
  space text NOT NULL CHECK (space IN ('mens', 'womens')),
  nickname text NOT NULL,     -- display name chosen by the participant; separate from the token, never the token
  body text NOT NULL,
  reply_to uuid NULL REFERENCES forum_posts(id),   -- reply model: id of the post this replies to; NULL = top-level post (post/reply, no threading)
  flagged boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

**RLS on `check_ins` / `journal_entries`:** owner-only — a request may only read/write rows where `token` matches the token it presents.

**RLS on `forum_posts`:** read scoped to whoever holds a valid space passphrase; write/edit/delete scoped to `token = author's token`; `flagged` settable by any valid space-holder (the report action), not clearable by them. Replies are rows on the same table (`reply_to`) and inherit the same RLS scope.

No table anywhere maps a token back to a real identity.

---

## 9. Security strategy

| Control | Detail |
|---|---|
| Token design | Random three-word phrase, generated client-side, stored in `localStorage`, shown once with a "cannot be recovered if lost" warning |
| Key handling | Only the Supabase `anon` key ships to the browser; `service_role` never appears in frontend code |
| RLS build order | Schema and RLS written and tested (explicit cross-token, cross-space access attempts) *before* any frontend form is wired to them |
| Public forum | Rejected — conflicts with Confidentiality and Gender-separation values; shifts legal posture from processing sensitive data to publishing it |
| Forum access gating | Per-cycle passphrase, facilitator-distributed the same way the Jitsi password is — the only way "private" means anything without an accounts system. Space choice (for participants outside the men/women binary) is made once and persisted client-side in `localStorage` next to the token; switching spaces is a facilitator-mediated request for the other passphrase. No gender attribute exists in the database |
| Nickname handling | The last-used nickname is remembered client-side (`localStorage`, alongside the token and space choice) and prefilled in the composer — always editable per post, never forced. The token is never used as, suggested as, or accepted as a nickname: the nickname is public on every post, the token is the credential; entering one's own token in the nickname field triggers a plain-language warning |
| Gender separation | Enforced via RLS scope, not just page routing |
| Moderation | Post-moderation: report/flag, reviewed manually in the Supabase console (no dashboard for v1) |
| No PII | Tokens never mapped to names, emails, or IP addresses |
| Admin access | Supabase dashboard restricted to 1–2 trusted maintainers, MFA required |
| Retention | `check_ins` / `journal_entries` auto-deleted after 90 days via `pg_cron`. Forum retention window: open decision |
| Registration | Kenya's Data Protection Act treats health-adjacent disclosures as sensitive personal data; small-entity registration exemptions tend not to hold once that becomes a core activity. **Hard pre-launch gate** — must be confirmed with the ODPC or a qualified advisor before real participant data goes live, not alongside it |

---

## 10. Site / page map

- `/` — Home, current week highlighted, link to this week's room
- `/week/1` … `/week/8` — theme, scripture, reflection, video embed
- `/resources` — support contacts, always visible, no gating
- `/checkin` — native form → Supabase
- `/journal` — private notes by token
- `/forum/mens`, `/forum/womens` — passphrase-gated, nickname posts, report action. Nickname is remembered client-side and prefilled (editable per post); it never resolves to the token

The three-word token gate is client-side (`localStorage`) — it is a gate state, not a route. The Penpot "Sign in" board designs that state and intentionally has no page-map entry. The same applies to the forum-space choice ("Choose your space" board): a client-side gate state, persisted in `localStorage` next to the token, no route.

---

## 11. Build plan (summary — see companion implementation plan for the sprint-by-sprint sequence)

Single consolidated build delivered in sprints (see companion implementation plan): ODPC check starts in Sprint 0 in parallel; schema + RLS built and tested before any frontend wiring; content, video, check-in, journal, and forum ship together rather than in separate phases. A prior two-phase (Google Form first) approach was designed in detail and superseded — see Section 15.

---

## 12. Testing plan

- RLS cross-token / cross-space access attempts (privacy depends entirely on this)
- Forum passphrase gate actually blocks unauthorized read/write
- Report/flag marks a post without deleting or hiding it
- Jitsi lobby/password blocks an unshared session
- Mobile rendering and join flow on a throttled connection
- Keep-alive cron actually prevents a Supabase pause

---

## 13. Deployment (development → production)

**Development:** Penpot for design (team PAMOJA), local Pop!_OS environment, Eleventy dev server, Supabase project in development mode for schema/RLS testing before real data ever touches it.

**Production:** git push → Cloudflare Pages build → live static site. Supabase project promoted from test schema to holding real (anonymous) participant data only once the ODPC question (Section 9) is resolved. GitHub Actions keep-alive cron active from launch.

---

## 14. Maintenance

- Curriculum changes: edit the one data file, redeploy
- Periodic review of who holds Supabase admin access and who distributes forum passphrases
- Manual review of flagged forum posts until/unless a moderation dashboard is built
- Confirm the keep-alive cron is still running

---

## 15. Decision log

- **Public forum:** considered, rejected — conflicts with Confidentiality and Gender-separation values, raises legal risk from processing to publishing sensitive data.
- **Google Form + Sheet as a temporary check-in store:** designed in detail (token passed via pre-filled URL into a hidden Form field, submissions landing in a facilitator-readable Sheet). Superseded by a single consolidated Supabase-backed build — the switching cost of a throwaway integration was smaller than the read-back limitations (no journal history, no forum) a Sheet-based store can't support regardless of phasing.
- **Design tool — Figma vs. Penpot:** Penpot chosen — open-source, matches stated tooling preference, sufficient capability for this scope without Figma's account/seat model.
- **Component kit — Labyrinth UI Free vs. building from scratch:** kit adopted for the form-heavy remaining screens (check-in, journal, forum), not for Home (low cost to hand-build). Known tradeoff: Material Design foundation needs re-skinning. **Superseded (v1.2):** all screens are hand-built directly in Penpot against one shared type-and-spacing system, which the Material-based kit could not match without full re-skinning; kit import dropped.
- **Design automation — MCP + AI agent:** explored as a way to keep building consistent screens without manual Penpot work. Claude Code ruled out (no free tier). **Cline (VS Code) + DeepSeek model via `penpot-mcp` (v1.3)** is the working setup — all seven exemplar boards were built through the MCP route. Local Ollama (early option) was evaluated and retired as unnecessary.
- **Forum space routing for participants outside the men/women binary (v1.2):** the strict binary assignment would exclude them entirely; instead they choose either space themselves. Decision: the choice is made once and persisted **client-side** (`localStorage`, next to the token) — never server-side, so no gender attribute is ever recorded against a token. Switching spaces is facilitator-mediated (the other passphrase), keeping §9's access mechanism intact. Known limits, stated plainly: the choice is per-device (new device = paste token + choose again, same as the token model), and the gate remains trust-based — nothing technical prevents passphrase sharing. No third space; §8 schema unchanged.
- **Nickname behavior (v1.2):** two rules, complementary. (1) The composer prefills the participant's last-used nickname, remembered client-side alongside the token and space choice — identity consistency inside a space and reduced memory load — but it is prefilled, never locked: editable per post (internal locus of control). (2) The nickname never resolves to the login token: the token is the credential, the nickname is public on every post; merging them would burn the credential in front of the whole space, so the token is never shown as, suggested as, or accepted as a nickname (plain-language warning instead). Persistence is per-device, like the token itself.
- **Canonical docs location:** SOT and implementation plan live in `docs/`, not the repo root. `AGENTS.md` remains at the root (with `.clinerules` as a symlink) so Cursor, Copilot, and Cline share one instruction file.

---

## 16. Subject to change — re-verify before trusting

Anything below is a specific version, tag, or tool state that can go stale. Written down here for traceability, not as a guarantee it's still accurate:

- Penpot platform version (2.13 as of research; check `design.penpot.app` for current)
- Labyrinth UI Free kit version (v1.3) — **superseded**; kit import dropped (see §15)
- Cline (VS Code) model in use: **DeepSeek** (tag as configured in the Cline extension; re-check the current default). Local Ollama / `qwen2.5-coder:3b` retired — no longer used
- Cline extension version and its MCP configuration format
- `penpot-mcp` package (PyPI `penpot-mcp`) — installation and auth method
- Eleventy (`@11ty/eleventy` ^3.1.6 in `package.json` as of the scaffold — re-check the lockfile)
- Supabase JS client (`@supabase/supabase-js` ^2.115.0 in `package.json`) and `dotenv` versions

---

## 17. Version and change log

- **v1.4 — September 5, 2026** — Security Hardening & Audit Completion: Deployed `20260905000000_harden_flag_policy.sql` to live Supabase (`ehhxoanfbisdzkumsmwf`) enforcing column-level immutability during post flagging. Reconciled token pool sampling math (704,880 combinations). Integrated Supabase CLI (`config.toml`, `seed.sql`), live PostgreSQL RLS isolation test suite (`tests/integration/rls-live.test.js`), and Cloudflare Pages custom security headers (`src/_headers`). All 39 test assertions passing across unit, contract, live integration, build audit, and Playwright E2E suites.

- **v1.3 — September 4, 2026** — Design phase closed as **Complete (exemplars)**; derivative boards (Weeks 2–8, women's forum, Journal) moved into the implementation sprints. Data-requirement consistency pass: `forum_posts.reply_to` added to §8 (matches the documented post/reply model); plan §14 gains open items for `sessions.json` curriculum fields (`look_back` / `look_into_question` / `look_up_questions` / `prayer`) and Resources contact-copy confirmation. Tooling facts refreshed: **Cline + DeepSeek via `penpot-mcp`** is the working design-automation setup (§6.2, §15, §16); Labyrinth kit import officially dropped; build plan converted from day-sequenced to sprint-sequenced (§11).

- **v1.2 — September 4, 2026** — Penpot design progressed: Sign in (client-side token gate state, no route — noted in §10), Check-in, Week 1 example (look-back / look-into / look-up rhythm), Resources, and a men's forum example. Labyrinth UI kit superseded by hand-built boards (§15). Implementation plan §3 design status corrected to match this file. Open item added for Week-detail reflection persistence. Forum-space routing added for participants outside the men/women binary: one-time client-side choice, facilitator-mediated switch, no gender data stored (§2, §9, §15). Nickname behavior defined: last-used nickname prefilled client-side (editable), and the nickname never resolves to the token (§8, §9, §15).

- **v1.1 — September 4, 2026** — Docs moved to `docs/`. Status lines updated to match the Eleventy scaffold (home, paginated week pages, resources). Agent instructions consolidated in root `AGENTS.md`.
- **v1.0 — September 4, 2026** — Initial SOT compiled: context, core values mapping, full stack and architecture decisions, security strategy, decision log, and dev/production split.
