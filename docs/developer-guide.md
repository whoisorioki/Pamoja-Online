# Nguvu Pamoja Online Platform — Developer Guide

Welcome to the **Nguvu Pamoja Online Platform** developer guide. This document explains how the application is architected, how key components function, and how developers can extend and improve the platform.

---

## 1. High-Level Architecture Overview

Nguvu Pamoja Online is a **jamstack web application** designed for zero operational overhead, privacy-first participant safety, and sub-second page performance.

```
                    ┌─────────────────────────────────────────┐
                    │          Eleventy Static Site           │
                    │  (HTML, CSS, Nunjucks, Passthrough JS)  │
                    └────────────────────┬────────────────────┘
                                         │
                         Client Browser (Vanilla JS)
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        │                                │                                │
┌───────▼────────┐             ┌─────────▼────────┐             ┌─────────▼────────┐
│  localStorage  │             │   Jitsi Meet     │             │   Supabase BaaS  │
│ 3-word token   │             │   Video Embed    │             │ PostgreSQL + RLS │
│ Space pass     │             │ (No auth req'd)  │             │   PostgREST API  │
└────────────────┘             └──────────────────┘             └──────────────────┘
```

### Core Technologies
- **Static Site Generator**: [Eleventy 3.x (`@11ty/eleventy`)](https://www.11ty.dev/) compiling Nunjucks templates in `src/` to `_site/`.
- **Backend-as-a-Service (BaaS)**: [Supabase](https://supabase.com/) (PostgreSQL + PostgREST + Row Level Security).
- **Video Meeting**: Jitsi Meet External API (`external_api.js`).
- **Test Framework**: Vitest (unit/contract/integration) + Playwright (headless E2E browser tests).
- **Styling**: Vanilla CSS (`src/assets/css/style.css`) with curated design tokens.

---

## 2. Repository Layout & File Responsibilities

```text
├── eleventy.config.cjs      # Eleventy configuration & passthrough asset copy rules
├── package.json             # NPM dependencies & test/build scripts
├── playwright.config.js     # Playwright E2E configuration
├── vitest.config.js         # Vitest test framework configuration
├── src/                     # Source directory for Eleventy
│   ├── _data/               # Dynamic data files
│   │   ├── env.js           # Injects SUPABASE_URL & SUPABASE_ANON_KEY into templates
│   │   ├── sessions.json    # Single Source of Truth for 8-week curriculum
│   │   └── spaces.json      # Configuration for Men's and Women's forum spaces
│   ├── _includes/           # Reusable layouts and partials
│   │   └── base.njk         # Main HTML layout, head metadata, nav badge, script imports
│   ├── assets/              # Static assets copied directly to _site/
│   │   ├── css/style.css    # Site-wide responsive styles
│   │   └── js/              # Client-side scripts
│   │       ├── token.js     # 3-word anonymous token generator & localStorage state
│   │       └── supabase.js  # Supabase client wrapper with custom security headers
│   ├── _headers             # Cloudflare Pages custom security & CSP response headers
│   ├── check-in.njk         # Paginated weekly check-in form page (/check-in/:week/)
│   ├── forum.njk            # Passphrase-gated men's & women's forum spaces (/forum/:space/)
│   ├── index.njk            # Home page displaying weekly curriculum overview
│   ├── journal.njk          # Private reflection journal (/journal/)
│   ├── resources.njk        # Crisis support contacts & helplines (/resources/)
│   └── week.njk             # Paginated weekly session detail & Jitsi room (/week/:week/)
├── supabase/                # Database migrations & configuration
│   ├── config.toml          # Supabase CLI local development configuration
│   ├── seed.sql             # Default seed data (space passphrases)
│   ├── migrations/          # Versioned PostgreSQL migration scripts
│   │   ├── 20260904000000_schema_and_rls.sql      # Core schema & RLS policies
│   │   └── 20260905000000_harden_flag_policy.sql  # Hardened flag policy
│   └── tests/               # Database SQL isolation tests
└── tests/                   # Automated test suite
    ├── build/               # Static build artifact verification script
    ├── contract/            # Database schema contract tests
    ├── e2e/                 # Playwright end-to-end browser tests
    ├── integration/         # Live PostgreSQL RLS isolation integration tests
    └── unit/                # Vitest unit tests (token generation, escapeHtml, client)
```

---

## 3. Key Subsystems Explained

### A. Anonymous Token Authentication Flow (`src/assets/js/token.js`)
- **No Real Identities**: The application collects **zero** names, emails, passwords, or IP logs.
- **Token Format**: A 3-word hyphenated string randomly sampled without replacement from a 90-word curated pool (`704,880` unique combinations).
- **Storage**: Saved strictly in browser `localStorage` (`nguvu_token`).
- **UI State**: Automatically updates `#user-token-badge` in the navigation header across all pages.

### B. Supabase Dynamic Security Header Client (`src/assets/js/supabase.js`)
The `getSupabaseClient(token, passphrase, spaceName)` function creates a Supabase client instance configured with custom HTTP headers:
- `x-participant-token`: Evaluated by PostgreSQL RLS functions (`current_participant_token()`).
- `x-mens-passphrase` / `x-womens-passphrase` / `x-forum-passphrase`: Evaluated by PostgreSQL function `is_valid_space_passphrase(space, passphrase)`.

### C. Database Security & Row Level Security (RLS)
All database access uses the public Supabase `anon` key. Access control is enforced 100% inside PostgreSQL:
- **`check_ins`**: `token = current_participant_token()` (Participant-isolated).
- **`journal_entries`**: `token = current_participant_token()` (Participant-isolated).
- **`forum_posts`**: Requires `is_valid_space_passphrase() = true`. Mutations require matching `token` AND valid space passphrase AND `nickname <> token`. Flagging is restricted to setting `flagged = true` while preserving all other column values intact.

---

## 4. How to Extend & Improve the Platform

### 1. Adding or Editing Weekly Curriculum Content
All 8 weekly sessions are driven by `src/_data/sessions.json`. To add a new week or edit scripture/reflection questions, update `sessions.json`:
```json
{
  "week": 9,
  "title": "New Session Title",
  "theme": "Session theme summary",
  "scripture": "Bible Verse Reference",
  "scripture_text": "Full scripture passage...",
  "reflection": "Weekly reflection prompt...",
  "look_back": "Check-in look-back prompt...",
  "look_into_question": "Deep reflection question...",
  "look_up_questions": ["Question 1", "Question 2"],
  "prayer": "Closing prayer...",
  "jitsi_room_id": "nguvu-pamoja-week-9"
}
```
Eleventy will automatically generate `/week/9/` and `/check-in/9/` via pagination without touching template code.

### 2. Extending Database Schema or RLS Policies
When adding a new feature requiring database storage:
1. Create a new versioned migration in `supabase/migrations/YYYYMMDDHHMMSS_feature_name.sql`.
2. Explicitly execute `ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;`.
3. Define strict `CREATE POLICY` statements for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.
4. Add schema contract tests in `tests/contract/schema-contract.test.js`.
5. Apply migration locally (`npx supabase db reset`) or to remote linked project (`npx supabase db push`).

### 3. Adding New Automated Tests
- **Unit Tests**: Add `.test.js` files to `tests/unit/` for helper functions.
- **Integration Tests**: Add `.test.js` files to `tests/integration/` for Supabase query testing.
- **E2E Tests**: Add `.spec.js` files to `tests/e2e/` using Playwright to test browser UI flows.

---

## 5. Running & Testing Locally

```bash
# Install dependencies
npm install

# Start Eleventy development server (http://localhost:8080)
npm start

# Run full automated test suite (Vitest + Build Audit + Playwright E2E)
npm test
```
