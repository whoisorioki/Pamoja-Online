# Nguvu Pamoja Online — Briefing for Fountwood Community Leaders

*For presentation to church leadership and the facilitator team.*
**Prepared:** September 2026 · **Status:** Platform complete & hardened; pre-launch gates apply (see §9).
**Companion docs:** [`nguvu-pamoja-sot.md`](nguvu-pamoja-sot.md) (architecture authority),
[`user-guide.md`](user-guide.md) (participant-facing), [`production-operational-playbook.md`](production-operational-playbook.md) (ops).

---

## 1. Executive summary

Nguvu Pamoja Online extends the Friday support session to participants who
cannot attend in person. It is a **companion, not a replacement**: each week
it makes available the theme and scripture, the video session, a private
check-in, a private journal, and the gender-separated forum.

It was designed from the ground up around the group's **Core Values** —
confidentiality, anonymity, grace-not-judgment, gender separation — and
around **privacy-by-design**: there are **no accounts, no names, no IP logs,
and no way to connect a user's data to a real person**.

The platform is **built, tested, and security-hardened**. Before real
participant data goes live, two compliance items must be cleared (§9).
This document explains what exists, how it scales, and what it takes —
legally and operationally — to launch responsibly.

## 2. What participants can do

| Feature | What it is | Privacy model |
|---|---|---|
| Week pages | Theme, scripture, reflection rhythm for the week | Public (no sensitive data) |
| Video session | Live weekly room embedded in the page (8x8 JaaS video) | Room password from facilitator; no account |
| Check-in | One challenge + one victory per week | Private to the participant's token |
| Journal | Private reflection notes + history | Private to the token; **auto-deleted after 90 days** |
| Forum (mens / womens) | Post/reply under a chosen nickname, with a report/flag action | Passphrase-gated spaces; technically enforced separation |
| Resources | Crisis & support contacts, always visible | Ungated by design |

## 3. Anonymity model — the cornerstone

Instead of accounts, each participant gets a **random 3-word token**
(e.g. `hope-peace-grace`).

- generated on their own device and stored in their own browser only;
- **not mapped to any identity** — there is no database column connecting a
  token to a person, email, or phone number;
- non-recoverable by design (nobody — including us — can look it up);
- data access is enforced **inside the database** (Row-Level Security), so
  even a direct query can only see rows whose token matches the token a
  request presents.

For leaders, this means: **even a full database export does not reveal who
anyone is.** The system's data-minimization is structural, not a policy that
could be forgotten.

## 4. Safety, moderation, and gender separation

- **Gender separation** is enforced at the database level (not just hidden
  buttons). Men's and women's forum spaces are technically isolated.
- **Moderation** is post-moderation and private: participants can flag a
  post; facilitators review flags in the Supabase console and can remove or
  respond. No public call-outs, no cross-talk.
- **Video rooms** are password-protected by the facilitator for each session
  (password distributed out-of-band, rotated with each cycle).
- **No recording** is available in the video embed (disabled at the UI level).

## 5. Scale — designed for growth at near-zero cost

| Concern | How the platform handles it |
|---|---|
| Site traffic | **Static site** (Eleventy → Cloudflare Pages CDN). Static pages effectively scale to any read volume with no server to tune |
| Database | Supabase (managed Postgres) on the free tier; a **keep-alive cron** prevents idle suspension; rate limiting (WAF) protects the API endpoints |
| Data growth | 90-day automatic retention keeps storage bounded; forum retention window is an open decision (see §9) |
| Video | **8x8 JaaS** hosted video — no self-hosted media servers; removes the 5-minute limit of the public demo service, and a `meet.jit.si` fallback keeps the site working if the paid tenant is ever unavailable |
| Staff load | No servers to operate, no accounts to administer; daily moderation load is tiny at this size |
| Growth path | If participant numbers grow, Cloudflare Pages stays free to a high ceiling; Supabase can upgrade tiers without re-architecting |

## 6. Compliance — data protection by design (Kenya)

Under **Kenya's Data Protection Act, 2019**, disclosures about addiction and
emotional/psychological struggle are treated as **sensitive personal data**.
That has real consequences, and the platform was shaped by two of them:

1. **Processing rule:** sensitive data requires lawful basis, clear purpose
   limitation, and strong safeguards. Our safeguards are structural:
   anonymity by design (no PII collected at all), least-privilege database
   access, and automatic deletion.
2. **Registration gate:** as a core activity, the program may need to
   **register with the ODPC** (or obtain a determination that it is exempt).
   This is a **hard pre-launch gate** (§9) — it must be confirmed with ODPC
   or a qualified data-protection advisor *before* real participant data
   goes live, not alongside it.

**What the platform already does for compliance:**

| Control | Status |
|---|---|
| No names, emails, phones, or addresses collected | ✅ Built-in |
| No IP logging | ✅ Built-in |
| Tokens can never be mapped to identities | ✅ Built-in |
| Access control enforced at database level (RLS) | ✅ Built-in & tested |
| 90-day auto-deletion of check-ins/journal | ✅ Migration written (deploy is an operator step) |
| Moderation & flag review trail | ✅ Post-moderation via console |
| 1–2 named admins, MFA required | ✅ Process defined |
| ODPC registration / exemption confirmation | ⛔ **Open — pre-launch gate** |
| Forum retention window decision | ⛔ Open decision (impact is limited; see below) |

**Note on the forum retention open item:** the 90-day deletion currently
applies to check-ins and journal entries. Because forum posts are
pseudonymous by a nickname and no identity is recoverable, retaining them
across cycles carries lower *identity* risk than the check-in/journal data;
the leadership decision is simply **whether cross-cycle forum continuity is
worth keeping** vs. deleting with everything else.

## 7. Governance & operating model

| Role | Who | Responsibilities |
|---|---|---|
| Participants | Members (online + attending) | Use token, check-in, journal, forum; follow group guidelines |
| Facilitators | Existing Friday facilitators | Open & lock video rooms, distribute room passwords & forum passphrases (out-of-band), review flags, mediate space changes |
| Admins / maintainers | **1–2 trusted people only, MFA required** | Supabase console access, passphrase rotation each 8-week cycle, moderation review, deployment |
| Hosting | Managed | Cloudflare Pages (static), Supabase (DB), 8x8 JaaS (video) — no self-operated servers |

Weekly cadence for facilitators: share the room password before the Friday
session; review any flagged posts after; rotate passphrases each new 8-week
cycle.

## 8. Costs & effort

- **Platform services:** near-zero recurring cost (Cloudflare Pages free
  tier; Supabase free tier with keep-alive; 8x8 JaaS usage-based). No servers
  to buy or run.
- **People effort:** 1–2 admins for ~1 hour/week of monitoring/rotation; a
  few minutes per facilitator per session. No content maintenance beyond the
  curriculum file.

## 9. Launch readiness — what is done vs. what gate remains

**Done (verified):** full platform implementation; schema + RLS deployed to
live Supabase; automated test suite (27 unit/contract + 3 live RLS + build
audit + 20 browser E2E) passing; security headers & CSP; 8x8 JaaS video with
fallback; retention migration and keep-alive workflow written.

**Required before real participant data goes live:**

- [ ] **ODPC / data-protection advisor confirmation** — *hard gate* (§6).
- [ ] Rotate the seed forum passphrases to real cohort passphrases (never
      commit them); set `MENS_SPACE_PASSPHRASE` / `WOMENS_SPACE_PASSPHRASE`.
- [ ] Deploy the retention migration and keep-alive workflow (a one-time
      operator step; code is ready).
- [ ] Deploy to Cloudflare Pages with env vars; restrict Supabase CORS to
      the production domain; enable WAF rate limiting; enforce HTTPS.
- [ ] Decide the forum retention window (same 90 days vs. longer).
- [ ] Confirm the 1–2 named admins and the passphrase distribution plan.

## 10. Presentation outline (if using this doc for a talk)

1. **The need** — participants who can't attend on Fridays are shut out.
2. **The answer** — a companion website, not a replacement (values kept).
3. **Privacy is the product** — no accounts, no names, tokens, RLS, 90-day
   deletion.
4. **Scale & cost** — static hosting + managed services; grows with the
   group; near-zero cost.
5. **Compliance** — Kenya DPA: sensitive data; ODPC gate before launch.
6. **Ask** — leadership decisions (ODPC route, admin names, forum retention)
   and the go-live date for the Friday sessions.

*Nguvu Pamoja Online — Briefing for Fountwood Community Leaders*