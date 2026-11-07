# SECURITY_CHECKLIST.md

Definition of done for every full-stack project (web app + payments + cloud + database + AI features).
Each item has an ID so humans and AI agents can report PASS / FAIL / N/A against it.

Legend: **[C]** Critical (block launch) · **[H]** High · **[M]** Medium

---

## 1. Authentication and Sessions
- [ ] **AUTH-1 [C]** Use a proven auth provider/library (Auth0, Clerk, Supabase Auth, NextAuth, Passport). No home-made crypto.
- [ ] **AUTH-2 [C]** Passwords hashed with Argon2id or bcrypt. Never MD5/SHA-1/plain SHA-256.
- [ ] **AUTH-3 [H]** MFA available, mandatory for admin accounts.
- [ ] **AUTH-4 [C]** Session cookies are `HttpOnly`, `Secure`, `SameSite=Lax/Strict`.
- [ ] **AUTH-5 [H]** JWTs short-lived; refresh tokens rotated; logout invalidates sessions.
- [ ] **AUTH-6 [H]** Rate limiting on login, signup, password reset, OTP endpoints. Lockout or backoff after repeated failures.
- [ ] **AUTH-7 [M]** Password reset tokens are single-use, expiring, and don't reveal whether an email exists.

## 2. Authorization
- [ ] **AUTHZ-1 [C]** Every API route/server action checks permissions on the server, not only in the UI.
- [ ] **AUTHZ-2 [C]** No IDOR/BOLA: every object access verifies ownership (e.g. `/orders/123` belongs to current user).
- [ ] **AUTHZ-3 [H]** Role-based access control with least privilege. Admin routes have separate, stricter checks.
- [ ] **AUTHZ-4 [H]** Mass-assignment protection: users cannot set fields like `role`, `isAdmin`, `price`, `userId` through request bodies.

## 3. Input, Output and Web Vulnerabilities (OWASP Top 10)
- [ ] **INP-1 [C]** Parameterized queries / ORM only. No string-concatenated SQL or NoSQL queries.
- [ ] **INP-2 [H]** Server-side schema validation on all inputs (Zod, Pydantic, Joi, etc.).
- [ ] **INP-3 [C]** Output encoding; no unsafe `dangerouslySetInnerHTML` / `innerHTML` / `v-html` with user data.
- [ ] **INP-4 [H]** CSRF protection on state-changing requests (SameSite + token where cookies are used).
- [ ] **INP-5 [H]** SSRF protection: server-side fetches of user-supplied URLs use allowlists and block internal IP ranges.
- [ ] **INP-6 [H]** File uploads: type/size limits, content-type verification, random filenames, stored in a private bucket, never executed.
- [ ] **INP-7 [M]** No `eval`, `exec`, or shell commands built from user input. Safe redirect handling (no open redirects).

## 4. Payment Gateway
- [ ] **PAY-1 [C]** Use hosted checkout or tokenization (Stripe Checkout/Elements, Razorpay, etc.). Raw card data never touches your server.
- [ ] **PAY-2 [C]** Prices, totals, discounts calculated on the server. Client-sent amounts are never trusted.
- [ ] **PAY-3 [C]** Webhook signatures verified using the gateway's secret.
- [ ] **PAY-4 [H]** Webhook handlers are idempotent (event IDs stored; replays don't double-credit or double-ship).
- [ ] **PAY-5 [C]** Payment success confirmed from gateway/webhook, never from browser redirect or client state.
- [ ] **PAY-6 [C]** Gateway secret keys are server-side only; test and live keys separated per environment.
- [ ] **PAY-7 [M]** Transactions, refunds and failures logged (without sensitive card data); alerts on anomalies.

## 5. Database
- [ ] **DB-1 [C]** Database not publicly reachable. Private network/VPC or strict IP allowlist.
- [ ] **DB-2 [H]** App uses a least-privilege DB user (not root/superuser).
- [ ] **DB-3 [H]** TLS in transit; encryption at rest; sensitive fields (PII) additionally encrypted where appropriate.
- [ ] **DB-4 [C]** Supabase/Firebase: Row Level Security / security rules enabled on every table/collection. No open `true` policies.
- [ ] **DB-5 [H]** Automated backups enabled and a restore has been tested.
- [ ] **DB-6 [M]** Migrations are version-controlled; no destructive migrations run without review.

## 6. Cloud and Infrastructure
- [ ] **INF-1 [C]** HTTPS everywhere, HTTP redirects to HTTPS, HSTS enabled.
- [ ] **INF-2 [C]** Secrets in a secrets manager or platform env vars. `.env` files gitignored; no secrets in repo history.
- [ ] **INF-3 [H]** Least-privilege IAM roles; no wildcard `*` actions/resources.
- [ ] **INF-4 [C]** Storage buckets private by default; public access only for intentionally public assets.
- [ ] **INF-5 [M]** WAF/CDN (e.g. Cloudflare) for DDoS and bot protection.
- [ ] **INF-6 [H]** MFA on cloud, GitHub, domain registrar, payment dashboard and email accounts.
- [ ] **INF-7 [M]** Docker images run as non-root, use pinned minimal base images, no secrets baked in.

## 7. Headers and Configuration
- [ ] **CFG-1 [H]** Content-Security-Policy set (no broad `unsafe-inline`/`unsafe-eval` unless justified).
- [ ] **CFG-2 [M]** `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `frame-ancestors` / `X-Frame-Options`, `Permissions-Policy`.
- [ ] **CFG-3 [H]** CORS locked to known origins. Never `*` together with credentials.
- [ ] **CFG-4 [C]** Debug mode off in production; no stack traces or verbose errors returned to users.
- [ ] **CFG-5 [M]** Cookies, CORS and URLs configured per environment (dev/staging/prod separated).

## 8. Supply Chain and Code Quality
- [ ] **SUP-1 [H]** Dependency scanning enabled (Dependabot/Renovate, `npm audit`/`pip-audit`, Snyk). Lockfiles committed.
- [ ] **SUP-2 [C]** Secret scanning in CI (gitleaks / GitHub secret scanning). No leaked keys.
- [ ] **SUP-3 [M]** SAST in CI (Semgrep / CodeQL). Code review required for merges to main.
- [ ] **SUP-4 [M]** New packages vetted (maintainer, downloads, typosquatting check). No unnecessary dependencies.
- [ ] **SUP-5 [M]** CI/CD secrets scoped; third-party GitHub Actions pinned to commit SHA.

## 9. Logging, Monitoring and Response
- [ ] **LOG-1 [H]** Log auth events, permission failures, payment events, admin actions.
- [ ] **LOG-2 [C]** Never log passwords, tokens, API keys, full card data or other secrets.
- [ ] **LOG-3 [M]** Error tracking and alerting (Sentry + cloud monitoring).
- [ ] **LOG-4 [M]** Written incident plan: who to notify, how to rotate keys, how to restore from backup.

## 10. Privacy and Compliance
- [ ] **PRI-1 [M]** Collect only data you need; privacy policy and terms published.
- [ ] **PRI-2 [M]** Users can delete their account/data; retention periods defined.
- [ ] **PRI-3 [M]** Awareness of applicable laws (GDPR, India DPDP Act, PCI-DSS SAQ-A for hosted payments).
- [ ] **PRI-4 [M]** Cookie consent / tracking disclosure where required.

## 11. Agentic AI and LLM Security
- [ ] **AI-1 [C]** All text an LLM reads (web pages, emails, documents, tool output, user input) treated as untrusted. Prompt injection assumed possible.
- [ ] **AI-2 [C]** Agents/tools get least privilege: narrow scopes, read-only by default.
- [ ] **AI-3 [C]** Human approval required for destructive, financial, or externally visible actions (deletes, payments, emails, deploys).
- [ ] **AI-4 [C]** No secrets in prompts, system messages, or agent-readable context. Keys live in the tool/server layer.
- [ ] **AI-5 [H]** LLM output validated/sanitized before it reaches a database, shell, file system, or HTML.
- [ ] **AI-6 [H]** MCP servers, plugins, and skills vetted like third-party code (source, permissions, network access).
- [ ] **AI-7 [C]** RAG retrieval enforces per-user/tenant permissions at query time (filters by user/org, not just by similarity).
- [ ] **AI-8 [H]** AI endpoints rate-limited with per-user and global budget caps; max token and tool-call limits set.
- [ ] **AI-9 [M]** AI-generated code reviewed for missing auth checks, insecure defaults, hardcoded secrets, outdated packages.
- [ ] **AI-10 [M]** Prompts, tool calls and decisions logged for audit (without sensitive data).
- [ ] **AI-11 [H]** Outbound data from agents (URLs fetched, images rendered, links) restricted to prevent data exfiltration.

## 12. Pre-Launch Attack Drill (manual)
- [ ] **DRILL-1** Change IDs in URLs/API calls while logged in as user A to access user B's data.
- [ ] **DRILL-2** Tamper with price, quantity, currency, and role fields in requests.
- [ ] **DRILL-3** Replay a payment webhook and send one with a bad signature.
- [ ] **DRILL-4** Hit admin routes as a normal user and while logged out.
- [ ] **DRILL-5** Paste `<script>`, SQL meta-characters, and prompt-injection text into every input.
- [ ] **DRILL-6** Search the repo and git history for keys (`git log -p | grep -iE "key|secret|token"`).
- [ ] **DRILL-7** Run a baseline scan (OWASP ZAP) against staging.

---

## Learning Resources
- OWASP Top 10 · OWASP API Security Top 10 · OWASP Top 10 for LLM Applications
- PortSwigger Web Security Academy · OWASP Juice Shop · TryHackMe
