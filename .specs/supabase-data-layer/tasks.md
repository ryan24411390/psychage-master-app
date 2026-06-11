# Tasks: Supabase Data Layer (V1 [A])

**Spec ID:** supabase-data-layer
**Status:** Tasks complete — ready for /spec-review
**Reads from:** brief.md, requirements.md, design.md
**Created:** 2026-06-08

> Scope owned: `supabase/migrations/`, RLS policies, the gated check-in-write file, and the
> `packages/shared/data` submodule (+ its package.json semver bump). Out of scope (not owned):
> apps/mobile injection of the real Supabase client, packages/api (absent), tab layout, barrel
> structure outside `data/`, check-in/mascot/safety submodules.
>
> **Migration ordering note:** every `supabase/migrations/*.sql` is sequential-only
> (workspace.json `review.sequentialOnlyFiles`) → all migration tasks are `Parallelizable=✗`.
> They are distinct files (no intersection), so they don't hard-fail review; they simply run as a
> single ordered chain. The gated file `supabase/policies-gated/check_ins_write.sql.gated` is **not**
> under the `*.sql` glob, so it is NOT sequential-only.

## Task table

| ID | Title | Files | Depends on | Parallelizable | Est. | DoD summary |
|---|---|---|---|---|---|---|
| T-001 | Extensions migration (pgsodium) | `supabase/migrations/0001_extensions.sql (create)` | — | ✗ (sequential-only: supabase/migrations/*.sql) | 15m | pgsodium enabled; gen_random_uuid available |
| T-002 | `profiles` table + RLS (both-platform write) | `supabase/migrations/0002_profiles.sql (create)` | T-001 | ✗ (sequential-only) | 30m | table + §2 fields + RLS read-own + both-platform write (§4 exception) |
| T-003 | `check_ins` table + RLS read-only (write OFF) | `supabase/migrations/0003_check_ins.sql (create)` | T-001 | ✗ (sequential-only) | 30m | table + RLS enable + **read policy only**; no insert/update policy |
| T-004 | `navigator_history` table + RLS (summary-only) | `supabase/migrations/0004_navigator_history.sql (create)` | T-001 | ✗ (sequential-only) | 30m | summary-only cols; read-own + mobile-write; confidence ≤0.75 documented |
| T-005 | `journal_entries` table + RLS | `supabase/migrations/0005_journal_entries.sql (create)` | T-001 | ✗ (sequential-only) | 25m | table + RLS read-own + mobile-write; length cap |
| T-006 | `therapist_links` encrypted table + RLS + RPCs | `supabase/migrations/0006_therapist_links.sql (create)` | T-001 | ✗ (sequential-only) | 45m | encrypted bytea cols; pgsodium key; get_/upsert_ SECURITY DEFINER RPCs |
| T-007 | `share_history` table + RLS (FK → therapist_links) | `supabase/migrations/0007_share_history.sql (create)` | T-001, T-006 | ✗ (sequential-only) | 25m | table + RLS read-own + mobile-write; FK on delete set null |
| T-008 | Gated check-in write policy (NOT applied) | `supabase/policies-gated/check_ins_write.sql.gated (create)` | T-003 | ✓ | 15m | mobile-write policy held out of apply glob; ADR-001 header |
| T-009 | Data-layer record types | `packages/shared/data/types.ts (create)` | — | ✓ | 30m | 6 record interfaces incl. §2 fields |
| T-010 | DI adapter interfaces + safe defaults | `packages/shared/data/adapters.ts (create)` | — | ✓ | 25m | SupabaseLike + PlatformClaimProvider; no-op defaults |
| T-011 | Read/write wrappers (live) | `packages/shared/data/wrappers.ts (create)` | T-009, T-010 | ✓ | 45m | typed wrappers; stamp device_id/client_version/schema_version; therapist via RPC |
| T-012 | Check-in gate (write OFF) | `packages/shared/data/checkin-gate.ts (create)` | T-009, T-010 | ✓ | 20m | CHECKIN_PERSISTENCE_ENABLED=false; writeCheckIn throws; not exported |
| T-013 | Schema-version migration-runner contract | `packages/shared/data/migrations.ts (create)` | T-009 | ✓ | 25m | forward-only runner contract; empty registry; ships at v1 |
| T-014 | Barrel exports (exclude gated write) | `packages/shared/data/index.ts (modify)` | T-009, T-010, T-011, T-013 | ✓ | 15m | exports types/adapters/live wrappers/runner; NOT writeCheckIn |
| T-015 | Data-layer unit tests | `packages/shared/data/__tests__/data.test.ts (create)` | T-011, T-012, T-013, T-014 | ✓ | 40m | gate OFF proven; DI no-op default; §2-field stamping; barrel surface |
| T-016 | RLS default-deny + no-mood-write check | `supabase/tests/rls_default_deny.sql (create)` | T-002, T-003, T-004, T-005, T-006, T-007, T-008 | ✓ | 40m | default-deny proven; grep check_ins → no insert/update policy |
| T-017 | Bump packages/shared semver (minor) | `packages/shared/package.json (modify)` | T-014 | ✗ (sequential-only: package.json) | 10m | 0.3.0 → 0.4.0 (additive `./data` surface) |

## Per-task detail

### T-001 — Extensions migration (pgsodium)
**Files:** `supabase/migrations/0001_extensions.sql` (create) · **Depends on:** none ·
**Parallelizable:** ✗ (sequential-only) · **Estimated:** 15m
**Description:** Enable `pgsodium` (and confirm `gen_random_uuid` availability) as the first migration.
**DoD:** [ ] `create extension if not exists pgsodium;` · [ ] applies cleanly (dry-run) · [ ] SR: N/A ·
[ ] never edited after publish (§9) · [ ] PR refs design §Migration plan.

### T-002 — `profiles` table + RLS
**Files:** `supabase/migrations/0002_profiles.sql` (create) · **Depends on:** T-001 ·
**Parallelizable:** ✗ · **Estimated:** 30m
**Description:** PII-home table per ARCHITECTURE §3; RLS read-own + **both-platform** write (§4 exception).
**DoD:** [ ] table + check constraints (language/premium enums) · [ ] RLS enabled · [ ] read-own +
both-platform write policies · [ ] SR-11 (PII lives here only) · [ ] schema_version present (SR-13) ·
[ ] maps US-1/AC-1.1..1.4.

### T-003 — `check_ins` table + RLS read-only
**Files:** `supabase/migrations/0003_check_ins.sql` (create) · **Depends on:** T-001 ·
**Parallelizable:** ✗ · **Estimated:** 30m
**Description:** check_ins schema + §2 fields + constraints; RLS enabled with **read policy only** — no
insert/update policy in this file (default-deny denies writes).
**DoD:** [ ] table + constraints (mood 1..10, prompt_response ≤2000) · [ ] RLS enabled + read-own ·
[ ] **no insert/update policy** (grep-clean) · [ ] SR-13 schema_version · [ ] maps US-2/AC-2.1..2.3.

### T-004 — `navigator_history` table + RLS
**Files:** `supabase/migrations/0004_navigator_history.sql` (create) · **Depends on:** T-001 ·
**Parallelizable:** ✗ · **Estimated:** 30m
**Description:** Summary-only table (no raw-symptom column); RLS read-own + mobile-write.
**DoD:** [ ] summary-only cols per §3 · [ ] **no raw-symptom column** (SR-4) · [ ] persisted confidence
≤0.75 documented (SR-1) · [ ] RLS read-own + mobile-write claim · [ ] maps US-3/AC-3.1..3.4.
**Sacred Rule refs:** SR-4 (AC-3.1), SR-1 (AC-3.2).

### T-005 — `journal_entries` table + RLS
**Files:** `supabase/migrations/0005_journal_entries.sql` (create) · **Depends on:** T-001 ·
**Parallelizable:** ✗ · **Estimated:** 25m
**Description:** Forward-compat journal table (no V1 [A] writer); RLS read-own + mobile-write.
**DoD:** [ ] table + content length cap 1..50000 · [ ] RLS read-own + mobile-write · [ ] SR-13 ·
[ ] documented: unused by V1 product flows · [ ] maps US-6/AC-6.1..6.2.

### T-006 — `therapist_links` encrypted table + RLS + RPCs
**Files:** `supabase/migrations/0006_therapist_links.sql` (create) · **Depends on:** T-001 ·
**Parallelizable:** ✗ · **Estimated:** 45m
**Description:** Table with `email_enc`/`phone_enc`/`notes_enc` bytea; named pgsodium key (Vault-managed);
`upsert_therapist_link()` (encrypt + auth.uid()+platform check) and `get_therapist_links()` (owner-only
decrypt), both SECURITY DEFINER; RLS read-own on the table (ciphertext).
**DoD:** [ ] encrypted bytea cols; **no plaintext email/phone/notes** (AC-4.1) · [ ] pre-encrypt
format/length validation in RPC (AC-4.4) · [ ] decrypt owner-scoped only (AC-4.2) · [ ] non-sensitive
cols normal RLS (AC-4.3) · [ ] SR-11 + regulatory §2.3 (AES-256-equiv, server-side, not E2EE) ·
[ ] maps US-4/AC-4.1..4.5.
**Sacred Rule refs:** SR-11 (AC-4.1).

### T-007 — `share_history` table + RLS
**Files:** `supabase/migrations/0007_share_history.sql` (create) · **Depends on:** T-001, T-006 ·
**Parallelizable:** ✗ · **Estimated:** 25m
**Description:** share_history per §3; FK `shared_with_therapist_id → therapist_links(id) on delete set null`.
**DoD:** [ ] table + check constraints (share_type/format) · [ ] payload_summary high-level only (no raw
symptom) · [ ] RLS read-own + mobile-write · [ ] FK set null (EC-8) · [ ] maps US-5/AC-5.1..5.3.

### T-008 — Gated check-in write policy (NOT applied)
**Files:** `supabase/policies-gated/check_ins_write.sql.gated` (create) · **Depends on:** T-003 ·
**Parallelizable:** ✓ · **Estimated:** 15m
**Description:** The mobile-write insert/update policy for `check_ins`, held outside the `*.sql` apply
glob via `.sql.gated` extension, with a `-- DO NOT APPLY until ADR-001 Accepted` header.
**DoD:** [ ] file extension not `.sql` (proves un-applied) · [ ] ADR-001 header + lift instructions ·
[ ] contents = the mobile-platform insert/update policy · [ ] maps US-2/AC-2.5.

### T-009 — Data-layer record types
**Files:** `packages/shared/data/types.ts` (create) · **Depends on:** none · **Parallelizable:** ✓ ·
**Estimated:** 30m
**Description:** Six TS interfaces (`ProfileRecord`, `CheckInRecord`, `NavigatorHistoryRecord`,
`TherapistLinkRecord` plaintext-facing, `ShareHistoryRecord`, `JournalEntryRecord`), each with §2 fields.
**DoD:** [ ] tsc-clean, no `any` · [ ] §2 fields on every record · [ ] no runtime deps · [ ] maps US-8/AC-8.1.

### T-010 — DI adapter interfaces + safe defaults
**Files:** `packages/shared/data/adapters.ts` (create) · **Depends on:** none · **Parallelizable:** ✓ ·
**Estimated:** 25m
**Description:** `SupabaseLike` (`{ from, rpc }`) + `PlatformClaimProvider`; safe no-op defaults
(throwing client, `() => 'web'`). No import of `@supabase/supabase-js`.
**DoD:** [ ] tsc-clean · [ ] no runtime deps; no env/IO read · [ ] no-op defaults run in shared tests ·
[ ] maps US-8/AC-8.2.

### T-011 — Read/write wrappers (live)
**Files:** `packages/shared/data/wrappers.ts` (create) · **Depends on:** T-009, T-010 ·
**Parallelizable:** ✓ · **Estimated:** 45m
**Description:** Typed read/write functions for profiles, navigator_history, share_history, journal,
check-in **read**, and therapist via `get_/upsert_` RPCs. Every write stamps device_id/client_version/
schema_version. Imports types + adapters (does not own them).
**DoD:** [ ] tsc-clean · [ ] writes stamp §2 fields (AC-8.3) · [ ] therapist via RPC (Q-4/Q-5) ·
[ ] confidence never raised (SR-1) · [ ] SR-4: no symptom id to any sink · [ ] maps US-8/AC-8.3.
**Sacred Rule refs:** SR-1, SR-4.

### T-012 — Check-in gate (write OFF)
**Files:** `packages/shared/data/checkin-gate.ts` (create) · **Depends on:** T-009, T-010 ·
**Parallelizable:** ✓ · **Estimated:** 20m
**Description:** `export const CHECKIN_PERSISTENCE_ENABLED = false;` + `writeCheckIn()` that early-throws
while OFF. Lives outside the barrel export.
**DoD:** [ ] flag = false · [ ] writeCheckIn throws/no-ops when OFF · [ ] NOT re-exported by index.ts ·
[ ] maps US-2/AC-2.4, AC-8.4.

### T-013 — Schema-version migration-runner contract
**Files:** `packages/shared/data/migrations.ts` (create) · **Depends on:** T-009 · **Parallelizable:** ✓ ·
**Estimated:** 25m
**Description:** Forward-only runner contract per §9 (read schema_version → apply v1→v2→… in-memory →
persist on next write). Empty migrator registry; ships at schema_version 1.
**DoD:** [ ] runner interface + empty registry · [ ] tsc-clean · [ ] SR-13 · [ ] maps US-9/AC-9.1..9.2.

### T-014 — Barrel exports (exclude gated write)
**Files:** `packages/shared/data/index.ts` (modify) · **Depends on:** T-009, T-010, T-011, T-013 ·
**Parallelizable:** ✓ · **Estimated:** 15m
**Description:** Replace `export {}` with exports of types, adapters, live wrappers, runner contract.
**Does NOT** export `writeCheckIn`.
**DoD:** [ ] barrel exports live surface · [ ] writeCheckIn absent from barrel · [ ] deep-import-free
consumers · [ ] maps US-8/AC-8.4.

### T-015 — Data-layer unit tests
**Files:** `packages/shared/data/__tests__/data.test.ts` (create) · **Depends on:** T-011, T-012, T-013,
T-014 · **Parallelizable:** ✓ · **Estimated:** 40m
**Description:** Vitest: CHECKIN_PERSISTENCE_ENABLED false + writeCheckIn throws + not on barrel; DI no-op
default behavior; §2-field stamping on a write; runner empty-registry passthrough.
**DoD:** [ ] `vitest run` green · [ ] gate-OFF asserted (AC-2.4) · [ ] §2 stamping asserted (AC-8.3) ·
[ ] no symptom id reaches a telemetry stub (SR-4) · [ ] maps US-2/US-8/US-9.
**Sacred Rule refs:** SR-4, SR-13.

### T-016 — RLS default-deny + no-mood-write check
**Files:** `supabase/tests/rls_default_deny.sql` (create) · **Depends on:** T-002..T-008 ·
**Parallelizable:** ✓ · **Estimated:** 40m
**Description:** pgTAP-style / documented SQL check: anon → 0 rows on all six; user A cannot read user B;
web-claim write to a mobile-only table denied; grep/SQL assertion that `check_ins` has no insert/update
policy.
**DoD:** [ ] default-deny proven on all six (AC-7.2) · [ ] platform-claim write gate proven (EC-3) ·
[ ] check_ins no-write asserted (AC-2.3) · [ ] maps US-7/AC-7.1..7.3.
**Sacred Rule refs:** SR-4 (no enabled mood write path).

### T-017 — Bump packages/shared semver (minor)
**Files:** `packages/shared/package.json` (modify) · **Depends on:** T-014 ·
**Parallelizable:** ✗ (sequential-only: package.json) · **Estimated:** 10m
**Description:** Minor bump 0.3.0 → 0.4.0 — `./data` barrel is now an additive populated surface
(packages/shared/CLAUDE.md semver discipline).
**DoD:** [ ] version 0.4.0 · [ ] no other package.json change · [ ] exports map already declares `./data`.

## Parallelization plan

### Migration chain (single-thread, sequential-only)
T-001 → (T-002, T-003, T-004, T-005, T-006) → T-007 → T-016. Run in one worktree, in order. They are
distinct files (no review intersection) but `supabase/migrations/*.sql` is sequential-only, so do not
parallelize across worktrees.

### Data-layer cluster (parallelizable)
```bash
# First wave — no deps
git worktree add ../psychage-master-app-T-009 main   # data/types.ts
git worktree add ../psychage-master-app-T-010 main   # data/adapters.ts
git worktree add ../psychage-master-app-T-008 main   # gated check-in file
# Second wave (after T-009, T-010 merge): T-011, T-012, T-013
# Third wave: T-014 (barrel) → T-015 (tests)
```

### Sequential tail
T-017 (`package.json`) after T-014 merges. Run after all parallel waves.

### Practical recommendation
Two tracks in parallel: **(A)** the migration chain in one worktree (sequential), **(B)** the
data-layer cluster across ~3 worktrees (T-009/T-010/T-008 first). Converge at T-016 (needs migrations)
and T-015 (needs data cluster). Single-thread T-017 last.

## File-creation summary
```
supabase/migrations/
  0001_extensions.sql            (T-001)
  0002_profiles.sql              (T-002)
  0003_check_ins.sql             (T-003)
  0004_navigator_history.sql     (T-004)
  0005_journal_entries.sql       (T-005)
  0006_therapist_links.sql       (T-006)
  0007_share_history.sql         (T-007)
supabase/policies-gated/
  check_ins_write.sql.gated      (T-008)   ← NOT applied (ADR-001 gate)
supabase/tests/
  rls_default_deny.sql           (T-016)
packages/shared/data/
  types.ts                       (T-009)
  adapters.ts                    (T-010)
  wrappers.ts                    (T-011)
  checkin-gate.ts                (T-012)
  migrations.ts                  (T-013)
  index.ts                       (T-014, modify)
  __tests__/data.test.ts         (T-015)
packages/shared/
  package.json                   (T-017, modify)
```

## Definition of Done — feature
- [ ] T-001..T-017 merged on `main`.
- [ ] `pnpm -r test` (Vitest) green across packages.
- [ ] Migration dry-run/lint passes; no published migration edited.
- [ ] RLS default-deny proven on all six tables (T-016).
- [ ] **No enabled mood-data write path:** grep applied migrations → no `insert`/`update` policy on
      `check_ins`; `CHECKIN_PERSISTENCE_ENABLED === false`; `writeCheckIn` absent from barrel.
- [ ] Therapist email/phone/notes encrypted at rest; owner-only decrypt verified.
- [ ] All Sacred Rule hooks pass on every commit (SR-4 especially).
- [ ] ADR-001 security review (Dr. Dobson + security) consumes this spec before any check-in-write PR.
- [ ] /ultrareview pass on each implementation PR.

## Next step
1. Run `/spec-review supabase-data-layer` to audit for gaps + file-isolation before implementation.
2. After review passes, run `/spec-implement supabase-data-layer <task-id>` per the parallelization plan.
