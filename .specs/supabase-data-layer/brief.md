# Brief: Supabase Data Layer (V1 [A])

**Spec ID:** supabase-data-layer
**Created:** 2026-06-07
**Status:** Discovery complete — ready for /spec-requirements

## Problem

The four V1 native features (Daily Check-In, Symptom Navigator, My Therapist + Share, Crisis)
have nowhere to persist or read account-scoped data. `ARCHITECTURE.md` §2–4 designs the schema,
RLS, and migration strategy, but nothing is implemented: no `supabase/` dir, no migrations, and
`packages/shared/data/index.ts` is an empty reserved barrel. Until a typed, RLS-protected data
layer exists, no [A] feature can ship its persistence path, and the security review that gates
ADR-001 has no concrete RLS/encryption design to review.

## Users

Indirect — this serves the [A] feature builders (parallel sessions) and the platform itself, not
an end persona. Downstream beneficiaries: **Aisha** (24, anxiety — Daily Check-In streaks/history),
**Sofia** (38, Navigator-first — summary history), and any user linking a therapist. The data
layer is the substrate their flows write through.

## Why now

Mobile is the **sole writer** of personal data in V1 (ARCHITECTURE.md §1 cross-app contract);
web reads it. Every [A] feature past Crisis needs account-scoped reads/writes, so the schema +
RLS + data-access surface is a hard prerequisite that blocks all of them. It also produces the
artifact the ADR-001 security review needs (exact RLS policy + which therapist fields are
encrypted at rest).

## Scope

**In:**
- Six personal-data tables (ARCHITECTURE.md §3), each carrying the §2 forward-compat fields
  (`id`, `user_id`, `created_at`, `updated_at`, `device_id`, `client_version`, `schema_version`):
  `profiles`, `check_ins` (**schema only — write path OFF, ADR-001-gated**), `navigator_history`
  (summary only, SR-4), `therapist_links` (contact encrypted at rest), `share_history`,
  `journal_entries` (forward-compat; no V1 [A] writer yet).
- RLS per ARCHITECTURE.md §4: default-deny on all six; read = `auth.uid() = user_id`; write =
  `auth.uid() = user_id AND auth.jwt()->>'platform' = 'mobile'` on the five non-profile tables;
  `profiles` writable by both platforms (§4 exception).
- Column-level encryption-at-rest for `therapist_links` contact fields (email, phone) — key in
  Supabase Vault, owner-scoped decrypt via `SECURITY DEFINER` RPC (keeps the web read contract).
- Data-access layer in `packages/shared/data`: typed row interfaces + read/write wrappers,
  adapter-injected (no runtime deps, no direct env/IO per package convention). Check-in **write
  wrapper flag-gated OFF** (`CHECKIN_PERSISTENCE_ENABLED = false`) / unexported.
- Migration plan + ordered files under `supabase/migrations/` (designed; created at implement).

**Out:**
- `events` / analytics table — analytics vendor undecided; scope BLOCKED per CLAUDE.md §5.
- `audit_events` — auth/security track; schema is an open security question (targetPhase 6).
- Enabled `check_ins` write path — blocked pending ADR-001 = Accepted (Dr. Dobson + security review).
- Reference tables (articles, conditions, symptoms, crisis_resources, providers) — web-owned, read-only.
- Supabase Realtime (ARCHITECTURE.md §7 — V2), WebView token edge functions (§6 — separate scope).
- Web-side write policies / V2 bidirectional path (designed-for, not built).
- **Implementation** — this spec stops at /spec-review. No migrations or code written.

## Success metric

Every [A] feature data need has a typed, RLS-protected access path; **0 RLS default-deny escapes**
(all six tables deny without an explicit policy); **0 enabled mood-data write paths** (check_ins
write provably OFF by grep); therapist contact encrypted at rest (decrypt only via owner-scoped
RPC). Verified at implement by migration lint + RLS default-deny test + grep; verified at this
spec stage by documented checks in `design.md` and confirmation in `_review.md`.

## Sacred Rules in play

- **SR-4 — Symptom data on device.** `navigator_history` stores **summary only** (matched
  conditions, outcome, crisis_triggered count); raw symptom selections/severity/duration never
  reach Supabase. Per ADR-001, mood/check-in data is a *distinct, consented* category — NOT
  SR-4-protected — but its write path stays OFF until ADR-001 is Accepted. The SR-4 telemetry
  hook is unchanged; no mood/symptom identifiers in any analytics/Sentry call site.
- **SR-11 (CLAUDE.md) — PII isolation.** Email/phone/name live only on `profiles` and
  `therapist_links` (encrypted); never on other personal tables. Foreign keys use `user_id` UUID.
- **SR-13 (CLAUDE.md) — versioned migrators.** Every personal row carries `schema_version`;
  forward-only migration runner per ARCHITECTURE.md §9.
- **SR-1 / SR-2 / SR-3** — no surface (no confidence values, no crisis-flow gating, no
  user-facing copy in the data layer). Listed as N/A for completeness.

## Open questions

1. **Encryption primitive reconciliation** — workspace.json declares `databaseEncryption: pgsodium`;
   user chose "pgcrypto + Vault key." Supabase Vault is pgsodium-backed, so the column-encryption
   primitive (pgsodium `crypto_aead_*` vs pgcrypto `pgp_sym_encrypt`, key referenced from Vault)
   is a **security-review decision** — feeds ADR-001's open "encryption at rest, exactly which
   fields" item. Resolve in /spec-design with the security-review framing; final sign-off is
   Dr. Dobson + security review (ADR-001 gate). *Resolver:* security review.
2. **ADR-001 status** — `check_ins` write path stays designed-but-OFF until ADR-001 moves
   Proposed → Accepted (7-day cooling-off + Dr. Dobson + security review). The spec is
   complete *because* it scopes the write path off; it does not wait on ADR-001. *Resolver:*
   Dr. Lena Dobson + security review.
3. **`rules/regulatory.md` encryption-at-rest standard** — resolved (phase5 prereq complete,
   SHA 7fda85c); /spec-design must read it to confirm the therapist-field encryption meets the
   committed standard. *Resolver:* read at design time.

## Next step

Run `/spec-requirements supabase-data-layer` to expand into user stories and acceptance criteria.
