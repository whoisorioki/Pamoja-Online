# Contributing to Nguvu Pamoja Online Platform

Thank you for your interest in contributing to the **Nguvu Pamoja Online Platform**! This project is an open-source companion website for faith-based community support groups.

---

## 1. Core Principles & Code of Conduct

All contributors must respect the founding principles of Nguvu Pamoja:
1. **Strict Anonymity & Confidentiality**: Never introduce features that log, collect, or store personal identifiable information (PII), real names, email addresses, phone numbers, or IP addresses.
2. **Grace, Not Judgment**: No leaderboards, scoring, ranks, public reputation badges, or competitive mechanics.
3. **Gender Separation**: Forum discussions must remain passphrase-gated into isolated spaces (`mens` and `womens`).
4. **No Financial Transactions**: No donation buttons, fee processing, or financial handling integrations.

---

## 2. Hard Security & Architectural Rules

Before submitting any code changes, ensure your Pull Request adheres to these non-negotiable rules:

- ❌ **NO `service_role` Key**: Never commit or reference the Supabase `service_role` key anywhere in frontend or build scripts. Only the `anon` key is permitted.
- 🔒 **RLS Before Wiring**: Every database table must have Row Level Security (RLS) enabled with explicit policies before connecting frontend forms.
- 🛡️ **Mandatory XSS Escaping**: All dynamic user-generated content rendered into the DOM must be sanitized via `escapeHtml()`.
- 🔑 **Token Firewall**: Login tokens must never be used as nicknames or displayed publicly in the forum.
- ⚡ **Zero Custom Backend Server**: All client operations communicate directly with Supabase via PostgREST and custom HTTP headers. Do not add express/fastapi servers.

---

## 3. Getting Started & Development Workflow

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- Docker (optional, required only for local Supabase CLI database emulation)

### Local Environment Setup
1. **Fork and clone** the repository:
   ```bash
   git clone https://github.com/your-username/Pamoja-Online.git
   cd Pamoja-Online
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the project root (see `.env.example`):
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Start the local Eleventy server**:
   ```bash
   npm start
   # Local site will be available at http://localhost:8080/
   ```

---

## 4. Running Tests

All contributions must pass 100% of the test suite prior to review:

```bash
# Run full verification suite (Unit + Contract + Live RLS + Build Audit + Playwright E2E)
npm test
```

### Test Breakdown
- **Unit Tests**: `tests/unit/` (Vitest)
- **Contract Tests**: `tests/contract/` (Vitest)
- **Live RLS Integration**: `tests/integration/` (Vitest)
- **Build Output Audit**: `tests/build/verify-build.js`
- **End-to-End Browser Tests**: `tests/e2e/` (Playwright)

---

## 5. Pull Request Guidelines

1. **Branch Naming**: Use descriptive branch names: `feature/short-description` or `fix/short-description`.
2. **Commit Messages**: Keep commit messages clear and descriptive:
   ```text
   feat: add support helpline card for addiction recovery
   fix: harden flag policy against column tampering
   docs: update developer guide with deployment steps
   ```
3. **Verification Checklist**:
   - [ ] Verified `npm test` passes without errors.
   - [ ] Verified no secret keys or `service_role` credentials are committed.
   - [ ] Added tests for any new features or bug fixes.
   - [ ] Updated relevant documentation in `docs/` if architectural choices changed.

---

## 6. Git Commit Standards & Conventions

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification for clear, readable repository history.

### Commit Message Structure
```text
<type>(<scope>): <short summary in imperative mood>

[optional body providing deeper technical rationale]
```

### Supported Commit Types
| Type | Description | Example |
|---|---|---|
| `feat` | New feature or user capability | `feat(forum): add nickname prefill and token firewall check` |
| `fix` | Bug fix or issue resolution | `fix(forum): resolve innerText entity escaping in reply target banner` |
| `security` | Security hardening or RLS policy updates | `security(db): harden forum_posts_update_flag policy against column tampering` |
| `docs` | Documentation additions or updates | `docs(dev): add comprehensive developer guide and contribution standards` |
| `test` | Adding or updating automated tests | `test(rls): add live database PostgreSQL RLS isolation test suite` |
| `refactor` | Code restructuring without behavior changes | `refactor(eleventy): update passthrough rules for security headers` |
| `chore` | Maintenance tasks or dependency updates | `chore(pkg): configure vitest and playwright test scripts` |

### General Guidelines
- Keep the summary title under 70 characters.
- Use imperative present tense: `"add feature"` not `"added feature"`.
- Do not end the title line with a period.

