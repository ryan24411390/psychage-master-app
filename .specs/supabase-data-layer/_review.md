# Review: Supabase Data Layer (V1 [A])

**Spec ID:** supabase-data-layer
**Reviewed:** 2026-06-08
**Mode:** Regular
**Verdict:** Pass with notes

## Summary

The spec is implementation-ready. Mechanical audit is clean (0 file-isolation intersections, 0
sequential-only violations, 0 status-line mismatches). The qualitative audit found **no Block-tier
defects**: both critical properties hold with multi-layer, verifiable evidence — (1) the mood/check-in
**write path is provably OFF** via three independent layers (no insert/update policy in the applied
migration set, gated `*.sql.gated` file outside the apply glob, and `CHECKIN_PERSISTENCE_ENABLED=false`
wrapper unexported from the barrel), and (2) **SR-4** holds (navigator_history summary-only, no
raw-symptom column, MUST-NOT-FIRE telemetry list) with the ADR-001 mood≠SR-4 distinction correctly
carried. Five warnings + two missing edge cases remain; all four substantive ones concern the
therapist encryption/decrypt surface and should fold into the **ADR-001 security review** that already
owns that surface. None block `/spec-implement`.

## Mechanical findings (parent skill)

### File-isolation intersection check
- Parallel-eligible tasks: 9 (T-008, T-009, T-010, T-011, T-012, T-013, T-014, T-015, T-016)
- Sequential-only tasks: 8 (T-001–T-007 migrations, T-017 package.json)
- Intersections found: **0** — every parallel task owns exactly one distinct path. ✓

### Sequential-only file enforcement
- Violations: **0**. All `supabase/migrations/*.sql` (T-001–T-007) and `package.json` (T-017) are
  marked `Parallelizable=✗`. The two parallel `supabase/` tasks own `supabase/policies-gated/
  check_ins_write.sql.gated` (T-008) and `supabase/tests/rls_default_deny.sql` (T-016) — neither
  matches the `supabase/migrations/*.sql` glob, so parallel is correct. ✓

### Status-line consistency
- Mismatches: **0**. brief (`Discovery complete`), requirements (`Requirements complete`), design
  (`Design complete`), tasks (`Tasks complete`) all ≤ INDEX `tasks-complete`. ✓

## Qualitative findings (audit subagent)

### Block tier
**None.**

### Warning tier
- **W-1 — Encryption-primitive status is inconsistent across artifacts.** design.md §Encryption
  declares the primitive "Resolved: pgsodium," but brief open-question #1, requirements AC-4.1's
  footnote, and design's own §Open design decisions re-open it as an ADR-001 security-review item
  (Supabase deprecated pgsodium-TCE-the-feature). The algorithm family (`crypto_aead_det_encrypt`) is
  named, but the doc should state explicitly that this **function** is the non-deprecated replacement
  for TCE, closing the loop. *Fix at implement/ADR-001 review.*
- **W-2 — Deterministic AEAD enables equality-correlation.** `crypto_aead_det_encrypt` maps identical
  plaintext → identical ciphertext, letting anyone with raw (ciphertext) table read detect that two
  users share a therapist email/phone. No query need exists (decrypt is RPC-only), so **non-deterministic
  AEAD** is preferable unless a justification is recorded. Mitigated (not eliminated) by owner-only RLS
  on ciphertext reads. *Decide at ADR-001 security review.*
- **W-3 — SR-13 forward-migration behavior is unverified in V1.** AC-9.2 ships a runner contract with an
  empty registry; T-015 only exercises the no-op path. Acceptable (contract-only ships now) but should
  read "contract present, behavior unverified until first migrator," not "SR-13 functionally tested."
- **W-4 — Open design decisions remain** (pgsodium key provisioning; Supabase region lock). Correctly
  scoped non-blocking; carried to implement/ADR-001 + Day-5 lawyer review.
- **W-5 — T-006 estimate (45m) is optimistic** given W-1/W-2 unresolved (encrypted table + named key +
  two SECURITY DEFINER RPCs + pre-encrypt validation). Loose-estimate warning only.

### Missing edge cases (Warning tier — none impossible-to-ignore)
- **EC-missing-1 — Encryption key absence / rotation.** No EC for "pgsodium key missing/rotated at
  decrypt time." Specify `get_therapist_links()` **fails closed** (no plaintext, no crash leaking key
  id) when the key is unavailable. Add to T-006/T-016 at implement.
- **EC-missing-2 — DEFINER decrypt-RPC blast radius (highest-risk surface).** `get_therapist_links()`
  is `SECURITY DEFINER` (bypasses RLS by design); only the in-function `where user_id = auth.uid()`
  prevents it returning *all* users' decrypted contacts. Add a dedicated negative test: under a
  null/anon JWT the RPC returns **zero** rows (not all). Fold into T-016/T-006. This is the single
  most important note to action before/with implement.
- **EC-missing-3 — `profiles` cross-platform write abuse** (web writing `premium_status` it shouldn't).
  Out of this spec's strict scope (column-level write authz is future); one-line note only.

## Sacred Rule audit (combined)

| Sacred Rule | Compliance evidence in spec | Verdict |
|---|---|---|
| SR-1 (Navigator confidence cap) | AC-3.2; design §SR-map; T-004 DoD; cap originates in @psychage/shared/navigator, data layer never raises | ✓ |
| SR-2 (Crisis bypass detector) | N/A with justification — no crisis-detection branch; `crisis_triggered` is a stored count (AC-3.4) | ✓ |
| SR-3 (No diagnostic language) | N/A — no user-facing copy in the data layer | ✓ |
| SR-4 (Symptom data on device) | AC-3.1 (no raw-symptom column); design §Telemetry MUST-NOT-FIRE; T-004/T-015/T-016; mood-write OFF (3 layers); matches ADR-001 (Proposed) — **strongest-evidenced** | ✓ |
| SR-11 (PII isolation) | AC-1.3 + AC-4.1; design §SR-map; T-002/T-006; FKs by user_id UUID | ✓ |
| SR-13 (Versioned migrators) | AC-9.1/9.2; T-013; §2 fields stamped (AC-8.3) — contract present, behavior unverified in V1 (W-3) | ✓ |

## Schema/RLS hygiene check (no-UI substitute for App Store coverage)

| Property | Status | Evidence / gap |
|---|---|---|
| RLS default-deny on all six tables | ✓ | AC-7.1; design §RLS; T-002–T-007 enable RLS; negative test T-016 (AC-7.2) |
| check_ins write path provably OFF | ✓ | No insert/update policy in applied set (AC-2.3, T-003, grep) + gated `*.sql.gated` outside apply glob (T-008) + flag-OFF unexported wrapper (T-012/T-014) — 3 layers |
| Therapist contact encrypted at rest (email/phone/notes) | ✓ | AC-4.1; design §Encryption (bytea, plaintext never stored); T-006. Caveats W-1/W-2 |
| PII isolated to profiles + therapist_links | ✓ | AC-1.3 + AC-4.1; no email/phone/name column on the other four tables |
| Anti-slop table honesty (12 rows) | ✓ | All No/N/A with "no UI" justification — legitimate for infra spec; re-framed as schema/RLS hygiene |
| DEFINER decrypt-RPC blast radius | ⚠ | EC-missing-2 — add anon/null-JWT-returns-zero-rows negative test to T-016 |
| Encryption key absence/rotation | ⚠ | EC-missing-1 — specify fail-closed behavior |

## Decision

- [x] **Pass with notes** — Implementation can begin. The five warnings + two missing edge cases
  (EC-missing-1 key absence/rotation fail-closed; EC-missing-2 DEFINER-RPC anon-JWT negative test;
  W-1 primitive-status reconciliation; W-2 deterministic-vs-nondeterministic AEAD) should be addressed
  before merge of the encryption tasks (T-006/T-016) and are best folded into the **ADR-001 security
  review**, which already owns the encryption/decrypt surface. None block start.

## Next step

Spec is `review-pass`. **Per task instruction, STOP before /spec-implement** — do not begin
implementation. When implementation is authorized: spin up worktrees per the tasks.md parallelization
plan (migration chain single-threaded; data-layer cluster across ~3 worktrees) and run
`/spec-implement supabase-data-layer <task-id>` in each, actioning the encryption-surface notes within
T-006/T-016 under the ADR-001 security review.
