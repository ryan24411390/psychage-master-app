# Regulatory regime — the rule file

> **Scope:** This file defines the regulatory regime Psychage Mobile V1 operates under, and the four architectural commitments that flow from it. Loaded by Claude Code whenever auth, schema, retention, marketing copy, cross-border data, or vendor-agreement decisions are made. Resolves `constitution.md` §Regulatory commitments items 1–4 and closes the `phase5Prerequisites.regulatory-architecture-resolved` gate in `.claude/workspace.json`.
>
> **Last decided:** 2026-05-12 (Day-3 lock; underlying decision locked Day 1, 2026-05-09 per `learnings.md`).
> **Lawyer review:** scheduled Day 5 (2026-05-14). Outputs of that review amend this file via ADR.
> **Authority:** This file is authoritative for V1. V2 changes require updating this file *before* the implementation, not after.
>
> **Reading order:** §1 is the regime. §2 is the four architectural commitments. §3–6 are the operating consequences. §7 is what this file does not cover.

---

## 1. The regime

Psychage operates as an **FTC-regulated consumer health information service**, subject to state consumer health privacy laws and EU/UK/BR personal-data laws. It is not a healthcare provider, not a HIPAA-covered entity, not a HIPAA business associate.

### What we are

- An FTC-regulated consumer service (FTC Act §5, FTC Health Breach Notification Rule where applicable).
- Subject to **state consumer health privacy laws**: Washington My Health My Data Act (MHMDA), California CCPA + CMIA, New York SHIELD Act, Connecticut Data Privacy Act, plus the rolling set of state laws on the same model.
- Subject to **GDPR** (EU users), **UK GDPR**, and **LGPD** (Brazilian and Portuguese-speaking users where applicable).
- A publisher of educational content. PEAF articles, Symptom Navigator, Crisis surface — all framed as education, not diagnosis or treatment, per `CLAUDE.md` §1 and the four Sacred Rules.

### What we are not

- **Not a HIPAA covered entity.** No claims billing, no provider portal handling treatment data, no payment for clinical services in V1.
- **Not a HIPAA business associate.** We do not process PHI on behalf of any covered entity.
- **Not a Software as a Medical Device (SaMD).** Outputs are educational. The Symptom Navigator's 0.75 confidence cap (Sacred Rule #1) and non-diagnostic language requirement (Sacred Rule #3) are the structural commitments that keep the product outside SaMD scope.

### What this means concretely

User-generated wellness data is **consumer health data** under state law and **personal data** under GDPR. It is not PHI as a regulatory category, because Psychage is not a covered entity. The distinction matters: PHI rules attach to the entity, not the data type. State consumer-health rules apply regardless.

Citations: `learnings.md` 2026-05-09 "Decisions locked Day 1" — Regulatory regime: FTC + state consumer health laws + GDPR; not HIPAA. `.claude/workspace.json.phase5Prerequisites.regulatory-architecture-resolved`.

---

## 2. The four architectural commitments

These resolve `constitution.md` §Regulatory commitments items 1–4. Numbered to match the constitution exactly.

### 2.1 HIPAA covered-entity status: **NO**

Psychage does not treat, diagnose, or bill for clinical services. There is no provider portal in V1, no claims transactions, no payment for treatment.

The therapist contact information stored in `therapist_links` (per `ARCHITECTURE.md` §3) is the user's own contact list — analogous to a contacts app entry — not a covered transaction between healthcare entities.

We do not seek to become a covered entity in V1. The cost asymmetry (covered-entity controls + audit cadence + BAA chain) does not justify the absence of a covered transaction.

### 2.2 42 CFR Part 2 default posture: **out of scope for V1**

Psychage has no substance use disorder (SUD) treatment program. Substance use education content (articles describing alcohol use disorder, opioid use, etc.) does not trigger 42 CFR Part 2 because we do not hold ourselves out as providing SUD diagnosis or treatment, and we do not maintain SUD treatment records.

This posture is re-evaluated if V2 introduces SUD-program features (provider portal with SUD treatment plans, prescription tracking, MAT support, etc.).

### 2.3 Encryption-at-rest standard: **AES-256-equivalent for all personal data at rest**

The standard applies to every layer that persists user personal data:

- **Server (Supabase Postgres):** column-level encryption for sensitive fields (therapist email/phone, therapist notes) per `.claude/workspace.json.tooling.databaseEncryption: pgsodium`. Standard managed at-rest encryption for non-flagged columns.
- **Device-local (mobile):** `react-native-mmkv` encrypted instance per `.claude/workspace.json.tooling.localStorage`. Encryption key stored in iOS Keychain / Android Keystore.
- **Auth tokens and session secrets:** `expo-secure-store` per `.claude/workspace.json.tooling.secretsStorage` and `rules/auth.md` §6. Backed by iOS Keychain / Android Keystore.
- **Backups and replicas:** inherit Supabase managed encryption-at-rest defaults.

The standard does not require FIPS 140-2 / 140-3 certified modules (out of scope per `rules/security.md` §3).

### 2.4 BAA chain audit trail: **not required for V1**

Because Psychage is not a covered entity (§2.1), no Business Associate Agreement chain is needed. Vendors do not process PHI; they process consumer health data and personal data.

We instead maintain a **GDPR Article 28 Data Processing Agreement (DPA) chain**:

- Supabase DPA (data infrastructure, auth, storage)
- PostHog DPA (product analytics) per `.claude/workspace.json.tooling.analytics`
- Sentry DPA (error tracking) per `.claude/workspace.json.tooling.errorTracking`
- EAS / Expo DPA (build infrastructure, EAS Update payloads)
- Apple / Google subprocessor DPAs (push, identity, App Store / Play Store distribution)
- Any future subprocessor takes effect only after its DPA is countersigned

The DPA registry lives at `docs/vendor-dpas/`, created at Phase 5 kickoff. Each entry stores the signed DPA PDF and a one-page summary of data flows and retention.

---

## 3. Data classification

The classes that drive all storage, transmission, and telemetry decisions. Cross-referenced by `rules/security.md` §1.

| Class | Examples | Storage rules |
|---|---|---|
| **Sensitive personal data** | check-ins, journal entries, navigator history summaries, therapist contact info, profile email | Encrypted at rest per §2.3. RLS-protected per `ARCHITECTURE.md` §4. Sacred Rule #11 (no PII in unexpected places). |
| **Symptom data (raw)** | Navigator selections, severity ratings, durations, frequencies, mood selections | **Never leaves device.** MMKV-only. Sacred Rule #4. Not eligible for server persistence regardless of consent. |
| **Reference data** | Articles, conditions, crisis resources, provider directory | Public-read; no PII. Cached aggressively per `rules/offline.md` §2. |
| **Telemetry** | Analytics events, error reports | Sanitized pre-emit per `ARCHITECTURE.md` §8 and `constitution.md` SR-4. Symptom identifiers stripped; PII stripped via Sentry `beforeSend`. |
| **Auth secrets** | Supabase tokens, MFA secrets, OAuth refresh tokens | `expo-secure-store` (Keychain/Keystore). Never MMKV. Never AsyncStorage. Per `rules/auth.md` §6 and Sacred Rule #11. |
| **Audit events** | Auth and premium event log (per `CLAUDE.md` Procedure B item 5) | Supabase `audit_events` table (schema lands Phase 6). Stores user_id, event_type, IP, device_id, timestamp, success/failure. No PII payload beyond user_id and IP. |
| **Transactional records** | Subscription billing entries, refund records | Retained for tax-law period (typically 7 years). Not subject to GDPR Article 17 deletion within that window. |

---

## 4. Retention and deletion

### Account deletion

- **GDPR Article 17** — account deletion completes from the user's perspective within 30 days. Aligned with `rules/auth.md` §7 (same window).
- **Washington MHMDA, California CMIA, New York SHIELD, Connecticut DPA** — same right of deletion. The single 30-day window satisfies all of them.
- **Server-side cascade** — Supabase foreign-key cascades from `auth.users`. Verification job runs 7 days post-deletion to confirm.
- **Local-side wipe** — `psychage-account` MMKV instance cleared, secure-store tokens cleared per `rules/auth.md` §7.

### What we retain post-deletion (and disclose)

- **Anonymized aggregate analytics** — no `user_id`, no PII, no journal content.
- **Transactional billing records** — required by tax law, typically 7 years.
- **Crisis flow usage counts** — counts only, never content. Per Sacred Rule #11.
- **DPA-required audit trail entries** — minimum data required to evidence vendor compliance, typically for the contractual term.

### Local-only anonymous data lifecycle

TTLs per `rules/auth.md` §5 — 7-day check-ins, 30-day Navigator summaries, 90-day article reading history. These windows are the same data the user can see and clear via Settings → "Clear all my data" at any moment.

---

## 5. Cross-border data

- **Primary data region** — Supabase project region. **Region lock deferred to lawyer review Day 5.** Until locked, all schema work assumes EU adequacy or SCCs in place.
- **EU users (GDPR)** — covered under GDPR adequacy decisions where applicable, otherwise Standard Contractual Clauses (SCCs) in the Supabase DPA. No transfer to countries without adequacy or SCCs.
- **UK users (UK GDPR)** — same posture; UK ICO-recognized SCCs / IDTAs in vendor DPAs where applicable.
- **Brazil (LGPD)** — covered under Supabase DPA's general personal-data clauses.
- **State-law specifics** — Washington MHMDA cross-border transfer rules require explicit consent for some data classes; consent UX lands Phase 6 alongside auth onboarding.

---

## 6. Marketing claims and FTC posture (string-level rules deferred to Phase 11)

The architectural commitments in §2 are V1 blockers. **String-level rules** are deferred to Phase 11 when real user-facing strings exist to calibrate against, per `constitution.md` §Regulatory and `learnings.md` 2026-05-06.

Deferred to Phase 11:

- SaMD trigger-phrase enforcement (the eventual SR-5).
- State-law AI-therapy disclosure copy (e.g., California AI-therapy disclosure requirements).
- FTC marketing claim guardrails ("results not typical", endorsement disclosures, "clinically proven" prohibitions).
- Forbidden marketing phrase enumeration.

This file does not enumerate forbidden marketing phrases. Phase 11 produces that enumeration against shipped strings; this file is amended to reference it.

---

## 7. What this file deliberately omits

- **The privacy policy itself.** Dr. Lena Dobson + counsel territory. Lawyer-reviewed Day 5.
- **Specific Supabase project region.** Locked at lawyer review; this file updated via ADR.
- **String-level marketing rules.** Deferred to Phase 11 per §6.
- **HIPAA-style controls listing.** Not applicable per §2.1.
- **Audit cadence and pen-test schedule.** Phase 9 (observability) territory; the threat-model + pen-test is a pre-V1-launch deliverable per `rules/auth.md` "What this file deliberately omits".
- **Audit events schema.** Implementation lands Phase 6 with auth.
- **State-law breach notification timelines.** Counsel determines per state at Day-5 review.
- **Children's data (COPPA / age-gating).** V1 is 18+; age gate enforced at signup. Children's data posture revisits if a teen tier is ever scoped.
- **Provider-portal data flow (V2).** Out of V1 scope; covered-entity reassessment trigger documented in `rules/security.md` §4.
