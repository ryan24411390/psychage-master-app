# Security posture — the rule file

> **Scope:** This file defines Psychage Mobile V1's security posture: what we secure, how, what we don't, and what would re-open the posture in Phase 5+. Loaded by Claude Code whenever auth, schema, secrets, encryption, infrastructure, or incident-response decisions are made. Closes the `phase5Prerequisites.security-posture-resolved` gate in `.claude/workspace.json`.
>
> **Last decided:** 2026-05-12 (Day-3 lock; underlying decision locked Day 1, 2026-05-09 per `learnings.md`).
> **Posture:** **Posture B — HIPAA-equivalent technical controls without the HIPAA claim.** The control set matches what a HIPAA covered entity would deploy; the regulatory regime is FTC + state + GDPR (see `rules/regulatory.md` §1).
> **Authority:** This file is authoritative for V1. V2 changes require updating this file *before* the implementation, not after. Consistent with `rules/regulatory.md` — security posture is the technical-controls layer; the regulatory file is the regime layer.
>
> **Reading order:** §1 is what we secure. §2 is how. §3 is what we don't. §4 lists concrete triggers that re-open posture. §5 maps to Sacred Rules. §6 is what this file does not cover.

---

## 1. What we secure

### 1.1 Posture summary

Posture B per `learnings.md` 2026-05-09 "Decisions locked Day 1": HIPAA-equivalent technical controls applied to the FTC + state + GDPR regime. The why: the technical controls are sound regardless of regulatory framing, and the cost of building them once (early) is lower than the cost of retrofitting them when V2 may convert to a covered entity (per the §4 trigger).

### 1.2 Data classes secured

Cross-references `rules/regulatory.md` §3. Each class maps to a storage rule and a transmission rule:

- **Sensitive personal data** — check-ins, journal entries, navigator history summaries, therapist contact info, profile email. RLS-protected, encrypted at rest, sanitized before telemetry.
- **Symptom data (raw)** — Navigator selections, severity, duration, frequency, mood. Device-only per Sacred Rule #4. Never transmitted, never persisted server-side, never breadcrumb'd to Sentry.
- **Auth secrets and session tokens** — Supabase access/refresh tokens, MFA TOTP secrets, OAuth refresh tokens. `expo-secure-store` per `rules/auth.md` §6 and Sacred Rule #11. Never MMKV, never AsyncStorage.
- **Telemetry pre-sanitization** — analytics and error reports filtered before emit per `ARCHITECTURE.md` §8.
- **Audit events** — `audit_events` table on auth + premium events per `CLAUDE.md` Procedure B item 5; schema lands Phase 6 with auth.

### 1.3 Security perimeter

- **Device boundary** — mobile app (iOS / Android, Expo SDK 54 per `.claude/workspace.json.tooling.expoSdk`).
- **Network boundary** — TLS to Supabase API, Supabase Edge Functions, the chosen analytics endpoint, Sentry endpoint, HaveIBeenPwned k-anonymity endpoint.
- **Backend boundary** — one Supabase project (auth + Postgres + Edge Functions + Storage). One auth source per `ARCHITECTURE.md` §5.
- **WebView boundary** — 6 WebView surfaces in V1 (Sleep, Relationship, Med Tracker, Clarity Score, Provider Directory, plus one reserved). Session-bridged via the `/webview-token-issue` Edge Function per `ARCHITECTURE.md` §6.

### 1.4 Sensitive surfaces

These surfaces get extra-care review before merge:

- Auth flows: signup, signin, MFA enrollment, MFA challenge, account deletion, password reset.
- Therapist linking, therapist edit, therapist share generation.
- Premium upgrade, subscription management, refund.
- Account export.
- Crisis flow — Sacred Rule #2 requires it to work in any state; security posture cannot introduce a gate. See `rules/auth.md` §1 Tier 1 and `rules/offline.md` §1.

---

## 2. How we secure it

Posture only. Tool and library names appear when they are locked in `.claude/workspace.json.tooling`. Implementation specifics (cert pinning library, severity-classification scheme, etc.) defer to Phase 6 / 8 / 9.

### 2.1 At-rest encryption

- **Supabase Postgres** — column-level encryption for sensitive fields (`therapist_links.email`, `therapist_links.phone_e164`, `therapist_links.notes`) per `.claude/workspace.json.tooling.databaseEncryption: pgsodium`. Standard managed at-rest encryption for non-flagged columns.
- **Device-local persistence** — `react-native-mmkv` encrypted instance per `.claude/workspace.json.tooling.localStorage`. Encryption key generated per-install, stored in iOS Keychain / Android Keystore. Two MMKV instances per `rules/auth.md` §5 (`psychage-anonymous`, `psychage-account`); each gets its own key.
- **Auth tokens and session secrets** — `expo-secure-store` per `.claude/workspace.json.tooling.secretsStorage`, `rules/auth.md` §6, Sacred Rule #11. Backed by iOS Keychain / Android Keystore.
- **Standard** — AES-256-equivalent per `rules/regulatory.md` §2.3.

### 2.2 In-transit encryption

- **TLS 1.2+** on every network call. No plaintext fallback paths.
- **Certificate pinning** on production Supabase API + Edge Function endpoints. Per `CLAUDE.md` Procedure B item 1 (security checklist for auth + premium PRs). Implementation method deferred to Phase 8.
- **HSTS** on `psychage.com` web origins. Relevant to WebView surfaces per `ARCHITECTURE.md` §6.

### 2.3 Authentication and authorization

- **Auth provider** — Supabase Auth per `.claude/workspace.json.tooling.auth`. No custom auth flow.
- **Methods (V1)** — email + password, Sign in with Apple, Sign in with Google. Per `rules/auth.md` §3.
- **MFA policy** — optional in V1 with premium-month incentive, per `.claude/workspace.json.auth.mfaPolicy`. **Mandatory** before data export, therapist link change, account deletion, password change per `.claude/workspace.json.auth.mfaMandatoryFor`.
- **Factor types** — TOTP, biometric (`expo-local-authentication` per `.claude/workspace.json.tooling.biometric`), passkeys. Per `.claude/workspace.json.auth.factorTypes`.
- **SMS MFA** — never. `.claude/workspace.json.auth.smsMfa: false`. SIM-swap attack surface + cost + spam vector.
- **Password rules** — 8-character minimum, no complexity requirements (NIST SP 800-63B), no expiry. Per `rules/auth.md` §3 + §9.
- **Breached password check** — HaveIBeenPwned k-anonymity at signup and password change per `.claude/workspace.json.tooling.breachedPasswordCheck`. Reject top-50K. Suggest passphrase if rejected.
- **Authorization** — Row-Level Security default-deny on every personal-data table per `ARCHITECTURE.md` §4. V1 enforces a mobile-platform JWT claim (`auth.jwt() ->> 'platform' = 'mobile'`) on writes; V2 relaxes once web ships personal-data writes.

### 2.4 Secrets management

- **Production secrets** — EAS Secrets only per `CLAUDE.md` Procedure B item 2. No secrets in code, in git history, or in committed `.env` files.
- **Public-by-design** — Supabase project URL + anon key ship in mobile binaries. RLS is the enforcement layer; the anon key alone never authorizes a read or write of another user's data.
- **Service role keys** — never ship in mobile binaries. Restricted to Supabase Edge Functions.
- **Build-time vs runtime** — build-time secrets (Sentry DSN, analytics keys) injected at EAS build; runtime secrets (auth tokens) flow through `expo-secure-store`.

### 2.5 Logging and telemetry

- **Error tracking** — Sentry per `.claude/workspace.json.tooling.errorTracking`. Strict `beforeSend` filter strips PII (email, phone, full name) and strips symptom-data identifiers per `constitution.md` SR-4 `symptom_identifier_seeds`. Per `CLAUDE.md` §4 + Sacred Rule #11.
- **Product analytics** — PostHog per `.claude/workspace.json.tooling.analytics`. Event properties sanitized via `packages/shared/sensitivity/` before emit per `ARCHITECTURE.md` §8. Symptom selections, journal content, navigator raw choices, therapist contact info — none ever appear in event payloads.
- **Audit events** — `audit_events` Supabase table per `CLAUDE.md` Procedure B item 5. Emits on auth + premium events with: `user_id`, `event_type`, IP, `device_id`, timestamp, success/failure. Schema lands Phase 6 with auth.
- **Crisis flow telemetry** — usage counts only per Sacred Rule #11. Never content. Counts stay device-local until explicit user opt-in to analytics.
- **Sentry hook enforcement** — every telemetry call site is scanned by `.claude/hooks/sr4_no_symptom_telemetry.sh` per `constitution.md` SR-4. Adding a new telemetry call site without sanitization is blocked at PreToolUse.

### 2.6 Application hardening

- **Linter security rules** — Biome v2 with security rules enabled per `.claude/workspace.json.tooling.linter`. Surfaces dangerous patterns (eval, unsafe HTML, plain-text secrets) at lint time.
- **Jailbreak / root detection** — warn-only per `.claude/workspace.json.tooling.jailbreakDetection: react-native-jail-monkey (warn-only)`. Does not gate access. Logged as an audit signal so anomaly review can correlate.
- **Error messages** — must not leak account existence. Per `CLAUDE.md` Procedure B item 3: signin failures return a generic "invalid credentials" regardless of whether the email exists.
- **Versioned migrators** — every persisted shape gets a `schema_version` field and a forward-migration function per Sacred Rule #13 and `ARCHITECTURE.md` §9. No silent data loss on schema change.
- **WebView bridge hardening** — one-time WebView token, 60-second TTL, exchanged for `Secure HttpOnly SameSite=Strict` cookie scoped to the WebView origin per `ARCHITECTURE.md` §6. WebView cannot write to mobile-only personal data tables (RLS denies by platform claim).
- **Account-existence enumeration** — signup also returns a generic acknowledgment; existing-email signals are sent via the email channel only, not the API response.

### 2.7 Incident response posture

- **Breach disclosure timeline** — 72 hours per GDPR Article 33. Align with state law equivalents (WA MHMDA, CT DPA) — counsel specifies exact windows at Day-5 review.
- **Internal severity classification** — Sev0–Sev3 scheme to be defined Phase 9 (observability) per `ARCHITECTURE.md` "deliberately omits" section.
- **Out-of-band coordination channel** — to be defined Phase 9.
- **Post-mortem cadence** — public post-mortem for any Sev0 or Sev1 with user-data impact. Template lands Phase 9.

---

## 3. What we don't secure (V1 explicit exclusions)

Each item below is a posture commitment that we are explicitly **not** doing in V1. None of these are accidents; they trace to either the regulatory regime (`rules/regulatory.md` §2), the V1 scope (`V1_FEATURE_SCOPE.md`), or a cost asymmetry recorded here.

- **HIPAA covered-entity controls beyond the technical posture.** No BAA chain — `rules/regulatory.md` §2.4 uses a DPA chain instead. No HIPAA audit log retention requirements — we log per §2.5 above, just not under HIPAA standards.
- **42 CFR Part 2 SUD disclosure controls.** Out of V1 scope per `rules/regulatory.md` §2.2.
- **Enterprise SSO (SAML, SCIM, OIDC SSO).** No V1 enterprise tier. Revisits when an enterprise customer pipeline emerges (re-opens posture per §4).
- **FIPS 140-2 / 140-3 cryptographic module certification.** Not required for FTC + state + GDPR regime per `rules/regulatory.md` §2.3.
- **Air-gapped or on-prem deployment.** Cloud-only V1. Supabase managed infrastructure.
- **Formal threat model and pen-test.** Deferred to pre-V1-launch security review per `rules/auth.md` "What this file deliberately omits". Not blocked at Phase 5.
- **DLP scanning of user-uploaded content.** No file uploads in V1. `journal_entries.attachments` (per `ARCHITECTURE.md` §3) stores file *references*, not the files themselves; V1 has no upload UI.
- **Bug bounty program.** V1.5+ when budget exists.
- **Multi-tenant data isolation beyond RLS.** Single-tenant Supabase project. RLS is the isolation boundary. No per-tenant database, no per-tenant schema, no shared-nothing tenancy.
- **Field-level encryption of journal content with user-derived keys (E2EE).** V1 uses server-side encryption at rest per §2.1. E2EE adds key-recovery complexity that breaks the "user installs on new device → data appears" promise from `ARCHITECTURE.md` §1. V3+ if scoped.
- **Hardware token MFA (YubiKey, hardware FIDO2 keys).** Passkey support per §2.3 covers platform authenticators; standalone hardware tokens are V2+ if requested by users.
- **Cross-app SSO (web + mobile via a third-party IdP).** V1 uses a single Supabase Auth source per `ARCHITECTURE.md` §5; no enterprise-style SSO bridging.
- **Real-time anomaly detection / fraud scoring.** V1 has audit events; analysis on top of them lands Phase 9.

---

## 4. What changes Phase 5+

Trigger conditions that re-open this posture. Each trigger fires an ADR + amendment commit before code lands.

- **Trigger: V2 ships provider portal with claims billing or treatment delivery.** Re-evaluate HIPAA covered-entity status per `rules/regulatory.md` §2.1. Likely outcome: become a covered entity, add BAA chain, add HIPAA audit log retention (6-year minimum), expand encryption controls to cover backups under HIPAA Security Rule §164.306.
- **Trigger: V2 ships SUD-program features.** Re-evaluate 42 CFR Part 2 posture per `rules/regulatory.md` §2.2. Adds consent gating, disclosure restrictions, separate audit trail for SUD records.
- **Trigger: enterprise customer requires SSO.** Add SAML / SCIM / OIDC SSO per §3 exclusion. Re-evaluate audit log retention against enterprise SLAs.
- **Trigger: Phase 9 observability lands.** Concrete tooling for incident response — severity classification scheme, on-call rotation, post-mortem template, anomaly detection — replaces the placeholder posture in §2.7.
- **Trigger: Phase 10 test harness lands.** Security regression tests against RLS policies, auth flow tampering attempts, WebView bridge replay attacks, MFA-bypass attempts.
- **Trigger: V1 pre-launch security review.** Threat model and pen-test land here per `rules/auth.md` "What this file deliberately omits". This file gets a new section listing pen-test scope and remediation status.
- **Trigger: a `[bypass]` commit crosses a Sacred Rule surface.** Forces a security-posture review entry in `learnings.md` per `constitution.md` §Bypass policy + 30% ceiling.
- **Trigger: any vendor in the DPA chain (per `rules/regulatory.md` §2.4) changes subprocessor list.** Re-evaluate the corresponding control in §2 — most often §2.5 telemetry or §2.4 secrets.
- **Trigger: any Sacred Rule amendment ADR per `constitution.md` §Amendment process.** Sacred Rule changes affect this file directly; SR-4 changes especially.

---

## 5. Sacred Rule alignment

| Rule | How security posture upholds it |
|---|---|
| **SR-1 — Navigator confidence cap 0.75** | Not a security surface, but the cap value lives in `constitution.md` YAML — single source of truth, parseable by hook scripts, no flag or env-var override. |
| **SR-2 — Crisis cannot be disabled** | Crisis surface is offline-capable per `rules/offline.md` §1 and works in any auth state per `rules/auth.md` §1 Tier 1. Security posture cannot introduce an auth gate, an MFA gate, or any other gate to crisis. The `sr2_crisis_bypass_detector.sh` hook blocks attempts. |
| **SR-3 — No diagnostic language** | Haiku-prompt hook `sr3_diagnostic_language.sh` enforces on every commit touching user-facing strings. Cannot be relaxed under any flag. |
| **SR-4 — Symptom data stays on device** | Every telemetry call site scanned by `sr4_no_symptom_telemetry.sh`. Sentry `beforeSend` strips symptom identifiers. PostHog payloads sanitized via `packages/shared/sensitivity/` per `ARCHITECTURE.md` §8. Raw Navigator state never persists to Supabase per `ARCHITECTURE.md` §3 `navigator_history` (summary only). |
| **SR-11 — No PII unsanitized** | Auth tokens in `expo-secure-store` per §2.1. PII isolated to `profiles` + `therapist_links` per `ARCHITECTURE.md` §3. Sentry `beforeSend` strips emails from error reports per §2.5. |
| **SR-13 — Versioned migrators** | Per §2.6 application hardening; per `ARCHITECTURE.md` §9 migration strategy. Every persisted shape has `schema_version`. |

---

## 6. What this file deliberately omits

- **Specific tool / library version pinning.** Defer to `.claude/workspace.json.tooling.*`. This file references tool *names* only when locked there.
- **Specific Supabase project region.** Defer to `rules/regulatory.md` §5 and Day-5 lawyer review.
- **Specific Supabase Edge Function code.** Defer to `supabase/functions/` (lands Phase 5+).
- **Threat model and pen-test results.** Defer to pre-V1-launch security review per `rules/auth.md` "What this file deliberately omits".
- **HIPAA, SOC 2, ISO 27001 control mappings.** Not in scope for V1 regime; see `rules/regulatory.md` §2.
- **Bypass commit lifecycle.** Covered by `constitution.md` §Bypass policy.
- **Sacred Rule amendment process.** Covered by `constitution.md` §Amendment process.
- **`audit_events` schema.** Defer to Phase 6 auth implementation.
- **Certificate pinning library choice.** Defer to Phase 8 (CI/CD).
- **Crisis flow content** — `rules/offline.md` §1 + `rules/auth.md` §1 Tier 1.
- **PII regex set.** Defer to `packages/shared/sensitivity/` (Phase 5 lift).
