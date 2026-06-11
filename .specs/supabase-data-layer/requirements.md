# Requirements: Supabase Data Layer (V1 [A])

**Spec ID:** supabase-data-layer
**Status:** Requirements complete — ready for /spec-design
**Reads from:** brief.md
**Created:** 2026-06-07
**Brief read at:** 2026-06-07

> Infrastructure spec — no UI, no user-facing strings. "The system" below means the Supabase
> schema + RLS policies + the `packages/shared/data` access layer. User stories trace to the
> data needs of the four V1 [A] features and the cross-app contract in ARCHITECTURE.md §1–4.

## User stories

### Story US-1: Profile read/write (bidirectional)

**As a** the platform serving Aisha and Sofia
**I want** a `profiles` row per account holding preferences, language, region, premium status
**So that** every [A] feature can read account context and both apps can edit the profile.

**EARS:** When an authenticated user reads or writes their profile, the system shall scope the
operation to `auth.uid() = user_id` and allow writes from both mobile and web platforms.

**Acceptance criteria:**
- AC-1.1: `profiles` has RLS enabled; a user can `select`/`insert`/`update` only the row where
  `user_id = auth.uid()`; no row of another user is ever returned.
- AC-1.2: `profiles` write policy is the §4 **exception** — it does **not** require the
  `platform = 'mobile'` JWT claim (web edits profiles too).
- AC-1.3: PII (`display_name`) and identity-bearing fields live only on `profiles`; no other
  personal table carries email/phone/name columns.
- AC-1.4: `preferred_language` constrained to `('en','pt','es','sv','fr')`; `premium_status` to
  `('free','premium')`; invalid values rejected by check constraint.

### Story US-2: Check-in history read — write path OFF (ADR-001-gated)

**As a** Aisha (daily check-in user)
**I want** my check-in history to be readable by my account once persistence is unblocked
**So that** I can see streaks/trends across devices — but only after consent is ratified.

**EARS:** While ADR-001 is not Accepted, the system shall expose **no enabled write path** for
`check_ins`; when ADR-001 becomes Accepted, a separate migration shall add the mobile-platform
write policy without altering the table schema.

**Acceptance criteria:**
- AC-2.1: The `check_ins` table schema exists (per ARCHITECTURE.md §3) with the §2 forward-compat
  fields and check constraints (`mood_score between 1 and 10`, `length(prompt_response) <= 2000`).
- AC-2.2: `check_ins` has RLS enabled and a **read** policy (`auth.uid() = user_id`).
- AC-2.3: `check_ins` has **no `insert` or `update` policy** in the V1 migration set →
  default-deny denies all writes. Verifiable by grep: no `for insert`/`for update` policy on
  `check_ins` in any applied migration.
- AC-2.4: The `packages/shared/data` check-in **write** wrapper is gated by
  `CHECKIN_PERSISTENCE_ENABLED = false` (and/or not exported from the barrel) and, if invoked,
  throws/no-ops rather than calling Supabase. Verifiable by grep + unit test.
- AC-2.5: The ADR-gated write policy is delivered as a **separate, clearly-named migration file**
  that is **not** part of the applied V1 set (a stub/`.gated` file or documented "do not apply
  until ADR-001 Accepted").

### Story US-3: Navigator history summary (SR-4 boundary)

**As a** Sofia (Navigator-first user) with an account
**I want** a summary of my Navigator sessions saved to my account
**So that** I can revisit outcomes — without any raw symptom data ever leaving my device.

**EARS:** When a Navigator session summary is written, the system shall persist **summary fields
only** (matched conditions, duration category, flow/crisis booleans, outcome) and shall reject
any payload containing raw symptom selections, severity, duration, or frequency.

**Acceptance criteria:**
- AC-3.1: `navigator_history` columns are summary-only per ARCHITECTURE.md §3; there is **no**
  column for raw symptom IDs, severity, or per-symptom data.
- AC-3.2: `matched_conditions` jsonb stores `[{condition_id, confidence, tier}]`; any persisted
  `confidence` value is ≤ 0.75 (SR-1 carried from the scoring layer — the data layer never
  raises it).
- AC-3.3: RLS read = `auth.uid() = user_id`; write requires `platform = 'mobile'` claim.
- AC-3.4: `crisis_triggered` is a boolean count signal only; no crisis-flow content is stored.

### Story US-4: Therapist link with encrypted contact

**As a** a user linking their therapist
**I want** my therapist's name, email, and phone stored privately
**So that** I can share with them later, and no one but me can read the contact details.

**EARS:** When a therapist link is written, the system shall encrypt `email`, `phone_e164`, and
`notes` at rest to the AES-256-equivalent standard, decryptable only by the owning user.

**Acceptance criteria:**
- AC-4.1: `therapist_links.email`, `therapist_links.phone_e164`, and `therapist_links.notes` are
  **encrypted at rest** per rules/security.md §2.1 + rules/regulatory.md §2.3 (AES-256-equivalent,
  pgsodium). No plaintext copy of these three fields persists in the table.
- AC-4.2: Decryption is owner-scoped: only `auth.uid() = user_id` can obtain plaintext (via the
  read path / decrypt RPC). Web reads via the same owner-scoped path (cross-app read contract).
- AC-4.3: `display_name`, `role`, `treats_tags`, `session_frequency` follow normal RLS (read-own;
  mobile-write). `role` constrained to `('therapist','psychiatrist','primary_care','other')`.
- AC-4.4: `phone_e164` validated by check constraint `~ '^\+[1-9]\d{1,14}$'`; `display_name`
  capped at 200, `notes` at 2000 (DoS cap, ARCHITECTURE.md §2).
- AC-4.5: Encryption is server-side-at-rest, **not** E2EE (rules/security.md §3 — E2EE excluded
  to preserve the "new device → data appears" promise).

### Story US-5: Share history

**As a** a user who exported/shared a summary
**I want** a record of what I shared and with which therapist link
**So that** the app can show share history and I retain control.

**EARS:** When a share/export occurs, the system shall record a `share_history` row scoped to the
user, referencing the therapist link by id and storing a high-level payload summary only.

**Acceptance criteria:**
- AC-5.1: `share_history` columns per ARCHITECTURE.md §3; `payload_summary` stores high-level
  metadata, **not** full shared content; no raw symptom data.
- AC-5.2: `shared_with_therapist_id` is a FK to `therapist_links(id) on delete set null`.
- AC-5.3: `share_type` and `format` constrained by check constraints; RLS read-own + mobile-write.

### Story US-6: Journal entries (forward-compat schema, no V1 [A] writer)

**As a** the platform preparing for a future journaling feature
**I want** the `journal_entries` table + RLS in place now
**So that** V2 journaling needs no schema rewrite (forward-compat per ARCHITECTURE.md §12).

**Acceptance criteria:**
- AC-6.1: `journal_entries` schema + RLS (read-own, mobile-write) exist per ARCHITECTURE.md §3.
- AC-6.2: No V1 [A] feature calls a `journal_entries` write wrapper; the table is unused by V1
  product flows (documented, not a blocker). `content` length-capped 1..50000.

### Story US-7: Default-deny RLS across the data layer (cross-cutting)

**As a** the security reviewer (ADR-001 gate)
**I want** every personal table to deny by default
**So that** no row is ever visible or writable without an explicit, reviewed policy.

**EARS:** The system shall enable RLS on all six personal tables and shall expose no row absent an
explicit policy.

**Acceptance criteria:**
- AC-7.1: All six tables (`profiles`, `check_ins`, `navigator_history`, `therapist_links`,
  `share_history`, `journal_entries`) have `enable row level security`.
- AC-7.2: With no matching policy, both read and write are denied (default-deny). Verified by a
  documented negative test: an authenticated user gets 0 rows / permission-denied for another
  user's data, and an anonymous request gets nothing.
- AC-7.3: Every write policy on the five non-profile tables includes
  `auth.jwt() ->> 'platform' = 'mobile'` (V1 mobile-only-writer); `profiles` is the exception.

### Story US-8: Typed, adapter-injected data-access layer

**As a** an [A] feature developer
**I want** typed read/write wrappers in `@psychage/shared/data`
**So that** features access Supabase through one reviewed surface, not ad-hoc queries.

**Acceptance criteria:**
- AC-8.1: `packages/shared/data` exports typed row interfaces for the six tables
  (`ProfileRecord`, `CheckInRecord`, `NavigatorHistoryRecord`, `TherapistLinkRecord`,
  `ShareHistoryRecord`, `JournalEntryRecord`) via the existing `./data` barrel.
- AC-8.2: Per packages/shared convention, the layer has **no runtime dependencies** and reads no
  env/IO directly: the Supabase client and the platform claim are **injected** as parameters
  (DI seam), defaulting to safe no-ops so shared tests run without consumer wiring.
- AC-8.3: Write wrappers stamp the §2 fields (`device_id`, `client_version`, `schema_version`)
  on every write.
- AC-8.4: The check-in write wrapper is gated OFF per AC-2.4. All other write wrappers are live.

### Story US-9: Per-row schema versioning (SR-13)

**As a** a user returning after weeks away with stale local data
**I want** the data layer to version every row
**So that** schema changes never cause silent data loss.

**Acceptance criteria:**
- AC-9.1: Every personal row carries `schema_version int not null default 1`.
- AC-9.2: The data-access layer defines the forward-only migration runner contract per
  ARCHITECTURE.md §9 (read `schema_version`, run v1→v2→… in-memory, persist on next write).
  V1 ships at `schema_version = 1` with no migrators yet (contract present, registry empty).

## Sacred Rules → Acceptance criteria

| Sacred Rule | Acceptance criterion | How to verify |
|---|---|---|
| SR-1 (Navigator confidence cap) | AC-3.2: Any `confidence` persisted in `navigator_history.matched_conditions` is ≤ 0.75; the data layer never raises a confidence value. | Unit test on the write wrapper; cap originates in @psychage/shared/navigator |
| SR-2 (Crisis detection cannot be bypassed) | N/A — the data layer has no crisis-detection branch to gate. `crisis_triggered` is a stored count only (AC-3.4); crisis flow itself is reference-data + offline (ARCHITECTURE.md §10). | Inspection; no crisis-gating code in scope |
| SR-3 (No diagnostic language) | N/A — no user-facing copy in this spec. | Inspection (no strings) |
| SR-4 (Symptom data on device) | AC-3.1: `navigator_history` is summary-only; no raw symptom column exists. AC-8.x: no data-layer write wrapper passes symptom identifiers to any telemetry call site. | sr4_no_symptom_telemetry.sh hook + schema inspection + integration test |
| SR-11 (PII isolation) | AC-1.3 (PII only on `profiles`); AC-4.1 (therapist contact encrypted at rest). | Schema inspection + encryption test |
| SR-13 (Versioned migrators) | AC-9.1 / AC-9.2 (`schema_version` on every row; migration-runner contract present). | Schema inspection + unit test |

## Edge cases

- EC-1: **Anonymous request to any personal table** → default-deny returns nothing (AC-7.2). No
  policy grants `anon` access.
- EC-2: **Authenticated user requests another user's row** → 0 rows (RLS), never an error that
  leaks existence.
- EC-3: **Write attempt with a web-platform JWT to a mobile-only table** (e.g. `check_ins`,
  `navigator_history`) → denied by the `platform = 'mobile'` claim (AC-7.3). `profiles` excepted.
- EC-4: **Check-in write attempted while ADR-001 still Proposed** → wrapper gate OFF returns
  without calling Supabase; even if called, default-deny (no insert policy) rejects it. Two
  independent layers (AC-2.3 + AC-2.4).
- EC-5: **Therapist row read on a fresh device (new login)** → contact fields decrypt for the
  owner via the read path; no plaintext was ever stored (AC-4.1/4.2).
- EC-6: **Account deletion** → FK `on delete cascade` from `auth.users` removes all six tables'
  rows; verification job confirms within the 30-day window (rules/regulatory.md §4).
- EC-7: **Row written by an older `client_version`** → accepted; `schema_version` lets the runner
  migrate on read (AC-9.2). No write is rejected for being an older known schema_version.
- EC-8: **`shared_with_therapist_id` points to a deleted therapist link** → `on delete set null`
  keeps the share-history row valid (AC-5.2).

## Out of scope (carry-forward)

- `events` / analytics table — analytics vendor undecided; BLOCKED per CLAUDE.md §5.
- `audit_events` — auth/security track; schema lands Phase 6 (rules/security.md §2.5, §6).
- Enabled `check_ins` write path — pending ADR-001 Accepted.
- Reference tables (articles, conditions, symptoms, crisis_resources, providers) — web-owned, read-only.
- Supabase Realtime (V2, ARCHITECTURE.md §7); WebView token edge functions (§6 — separate scope).
- Web-side write policies / V2 bidirectional path (designed-for, not built).
- E2EE / user-derived-key field encryption (rules/security.md §3 — excluded for V1).
- **Implementation** — no migrations or code written; spec stops at /spec-review.

## Constraints

- **Performance:** Indexed access per ARCHITECTURE.md §3 (`(user_id, created_at desc)` etc.);
  point reads by `user_id` are index-backed. No N+1 in the access-layer wrappers.
- **Accessibility:** N/A — no UI surface.
- **Localization:** N/A — no user-facing strings. (`profiles.preferred_language` is a stored enum,
  not a translatable string.)
- **App Store:** N/A directly — no UI. Crisis/health-claim guidelines apply to consuming features.
- **Privacy:** Data classification = **Sensitive personal data** (check-ins, navigator summaries,
  therapist contact, profile email) per rules/regulatory.md §3; **raw symptom data = device-only**
  (never in this schema, SR-4). RLS-protected + encrypted at rest.
- **Regulatory:** Regime = FTC + state consumer-health (WA MHMDA, CA CCPA/CMIA, NY SHIELD, CT DPA)
  + GDPR/UK/LGPD; **not HIPAA**, not SaMD (rules/regulatory.md §1–2). Encryption-at-rest standard
  = AES-256-equivalent (rules/regulatory.md §2.3). Account deletion 30-day window + FK cascade
  (§4). Security posture B — HIPAA-equivalent controls without the claim (rules/security.md).

## Definition of Done (feature-level)

The data layer ships (at implement, out of this spec's scope) when all are true:
- [ ] All migrations apply cleanly (dry-run/lint passes); never edit a published migration.
- [ ] RLS default-deny proven on all six tables (negative test or documented check).
- [ ] No enabled `check_ins` write path: grep finds no `insert`/`update` policy on `check_ins`
      and the check-in write wrapper is gated OFF/unexported.
- [ ] Therapist `email`/`phone_e164`/`notes` encrypted at rest; owner-only decrypt verified.
- [ ] `packages/shared/data` exports typed records + wrappers; no runtime deps; adapters injected;
      vitest green.
- [ ] Every write stamps `device_id`, `client_version`, `schema_version`.
- [ ] Reviewed by SME for the ADR-001 gate: Dr. Lena Dobson (clinical-privacy) + security review
      (RLS policy + encryption + exact stored fields).
- [ ] /ultrareview pass on the implementation PR.

## Open questions for design phase

- Encryption mechanism specifics: workspace-locked tool is **pgsodium**; resolve the exact
  primitive (pgsodium `crypto_aead_*` / Transparent Column Encryption vs pgcrypto `pgp_sym_encrypt`),
  Vault key id management, and the owner-scoped decrypt path (`SECURITY DEFINER` RPC vs view).
  Note: Supabase deprecated pgsodium-TCE-the-feature — design must pick a non-deprecated primitive
  that still satisfies "key in Vault, owner-only decrypt." This is the ADR-001 security-review item.
- Exact migration file order/naming under `supabase/migrations/` and the gated check-in-write file
  convention (separate `.gated` file vs documented hold).
- Data-access wrapper surface: exact function signatures + the DI adapter interface (Supabase
  client + platform-claim provider) exported from the `./data` barrel.
- Migration-runner contract location (`packages/shared/data` vs a `migrations/` subdir) and the
  empty-registry shape for V1.

## Next step

Run `/spec-design supabase-data-layer` to translate these requirements into a concrete schema +
RLS + encryption + data-access design.
