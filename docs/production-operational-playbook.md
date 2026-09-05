# Nguvu Pamoja — Production Deployment & Operational Security Playbook

**Document Purpose:** Production deployment setup, HTTP security headers, WAF rate limiting, CORS configuration, CSP justification, and facilitator passphrase rotation procedures.  
**Target Environment:** Cloudflare Pages + Supabase Cloud  
**Authority Reference:** SOT v1.4 (§7, §8, §9)

---

## 1. Hosting & Cloudflare Pages Build Configuration

The project uses Eleventy static generation published via Cloudflare Pages.

### Cloudflare Pages Build Settings

| Setting | Value |
|---|---|
| **Build Command** | `npm run build` (runs `npx @11ty/eleventy`) |
| **Output Directory** | `_site` |
| **Environment Variables** | `SUPABASE_URL` = `https://ehhxoanfbisdzkumsmwf.supabase.co` |
| | `SUPABASE_ANON_KEY` = `(production anon key)` |

### Active HTTP Headers (`src/_headers`)
Eleventy automatically copies `src/_headers` to `_site/_headers` during build:

```http
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; connect-src 'self' https://*.supabase.co; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;
```

### CSP `'unsafe-inline'` Architectural Justification
The Content Security Policy includes `'unsafe-inline'` for `script-src` and `style-src`. This is an **intentional trade-off**:
- **Script State Hydration**: `base.njk` injects `window.SUPABASE_URL` and `window.SUPABASE_ANON_KEY` dynamically via inline `<script>` tags at build time.
- **Page Logic**: Pages (`forum.njk`, `journal.njk`, `check-in.njk`) rely on inline `<script>` blocks for client-side rendering, token management, and Supabase interaction.
- **Micro-Animations & Styling**: Templates utilize inline CSS properties for layout components.
- **Mitigation**: XSS risk is mitigated through mandatory `escapeHtml()` sanitization on all dynamic DOM insertions and client/DB token firewalls.

### Subresource Integrity (SRI) Recommendation for Supabase CDN
When referencing the Supabase CDN library in `src/_includes/base.njk`, pin the release version and include the SRI hash:

```html
<script 
  src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.48.1/dist/umd/supabase.js" 
  integrity="sha384-..." 
  crossorigin="anonymous">
</script>
```

---

## 2. API Rate Limiting & CORS Configuration

### Cloudflare WAF Rate Limiting Rules
Because `is_valid_space_passphrase()` is called internally by PostgreSQL RLS policies during table queries, rate limits must target PostgREST table endpoints directly.

1. Navigate to **Cloudflare Dashboard** → **Security** → **WAF** → **Rate Limiting Rules**.
2. **Rule Name**: `Pamoja PostgREST Table Rate Limit`
3. **Filter Expression**:
   ```text
   (http.request.uri.path contains "/rest/v1/forum_posts") or (http.request.uri.path contains "/rest/v1/check_ins") or (http.request.uri.path contains "/rest/v1/journal_entries")
   ```
4. **Rate Limit Threshold**: 15 requests per minute per IP address.
5. **Action**: Block for 1 hour or trigger Managed Challenge.

### Supabase CORS Restrictions
1. Navigate to **Supabase Dashboard** → **Project Settings** → **API**.
2. Under **CORS Headers Settings**, set **Allowed Headers** and restrict **Access-Control-Allow-Origin** to your production domain:
   ```text
   https://pamoja-online.pages.dev, https://nguvupamoja.org
   ```

---

## 3. Facilitator 8-Week Passphrase Rotation Playbook

Space passphrases (`mens` and `womens`) gate access to group discussions. Passphrases must be rotated at the start of each new 8-week cohort cycle.

### Execution Procedure

1. Log into **Supabase Dashboard** → **SQL Editor** (or run via `supabase` CLI linked to production).
2. Execute the passphrase update query:
   ```sql
   -- Rotate passphrases for the new 8-week cycle
   UPDATE forum_passphrases
   SET passphrase = 'new_mens_phrase_here', updated_at = now()
   WHERE space = 'mens';

   UPDATE forum_passphrases
   SET passphrase = 'new_womens_phrase_here', updated_at = now()
   WHERE space = 'womens';
   ```
3. Distribute the new passphrases to facilitators via secure out-of-band communication.

---

## 4. Pre-Deployment Verification Checklist

Run the automated verification suite locally prior to deployment:

```bash
npm test
```

### Verified Test Suite Breakdown (29 Vitest + 1 Build Audit + 10 E2E)
- [x] **Unit Tests (19)**: Token generation (7), `escapeHtml` sanitization (8), Supabase client initialization (4).
- [x] **Schema Contract Tests (7)**: SQL table definitions and RLS policy names.
- [x] **Live Database RLS Tests (3)**: Cross-token check-in isolation, cross-token journal isolation, cross-space forum isolation against Supabase (`ehhxoanfbisdzkumsmwf`).
- [x] **Build Output Verification (1)**: `_site/_headers` presence, environment variable injection, zero `service_role` leaks.
- [x] **Playwright E2E Browser Tests (10)**: Token generation, two-stage passphrase gating, DOM XSS sanitization, and clean page renders across all 10 site routes.
