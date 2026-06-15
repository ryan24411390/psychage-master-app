# Review: Bookmarks (Saved Items)

**Spec ID:** bookmarks
**Reviewed:** 2026-06-15
**Mode:** Regular
**Verdict:** Pass with notes — implementation can begin; two Block-tier findings were resolved in-spec during this review.

## Summary

Mechanical audit is fully clean. The qualitative subagent raised two Block-tier items (B-1: SR-3
lacked a reviewable copy artifact; B-2: AC-5.3 was untestable and contradicted locked design
decision #1). Both were resolved in-spec during review — the actual EN copy set was landed in
design.md and AC-5.3 was tightened to the single auto-complete branch — so the net verdict is
**Pass with notes**. SR-4 handling is exemplary (AC-N.4b inference-guard) and App Store 5.1.1(v)
account-deletion is directly tested (T-012). Remaining items are Warnings to address before merge.

## Mechanical findings (parent skill)

### File-isolation intersection check
- Parallel-eligible tasks: 13
- Sequential-only tasks: 0
- Intersections found: **0** (all 13 task file-sets are disjoint) → no Block.

### Sequential-only file enforcement
- `workspace.json.review.sequentialOnlyFiles` = [package.json, tsconfig.json, biome.json,
  .github/pull_request_template.md, CLAUDE.md, AGENTS.md, PROJECT_CONTEXT.md, .claude/workspace.json,
  pnpm-lock.yaml, supabase/migrations/*.sql, apps/mobile/app.json]
- Violations: **0** (no task touches any sequential-only file; no package.json change).

### Status-line consistency
- Mismatches: **0**. tasks.md "Tasks complete — ready for /spec-review" ↔ INDEX `tasks-complete`;
  brief/requirements/design status lines all consistent with furthest-along.

## Qualitative findings (audit subagent)

### Block tier (both RESOLVED in-spec during review)
- **B-1 — SR-3 lacked an inspectable copy artifact.** Sign-in/toast/label strings existed only as
  i18n key names; constitution flags `sr3_diagnostic_language.sh` as a seed-scan only.
  **Resolved:** design.md now carries the full EN string set ("Copy strings (EN) — SR-3 reviewable
  artifact"), content-neutral and person-first, as T-003's verbatim source.
- **B-2 — AC-5.3 untestable + contradicted locked design.** It permitted an abandoned-intent branch
  the design rules out. **Resolved:** requirements.md AC-5.3 tightened to the single auto-complete
  branch with a measurable success condition + EC-1 failure path.

### Warning tier (address before merge; non-blocking)
- **W-1** T-003 15m estimate is tight given the SR-3 copy surface. (mitigated — strings now pre-written.)
- **W-2** EN-only at ship; PT/ES/SV/FR deferred until `packages/i18n` (CLAUDE.md §2). Disclosed.
- **W-3** Three open design decisions (clay-figure empty-state, optional `motion.spring.savePop`,
  Saved-entry placement) — all explicitly non-blocking/cosmetic.
- **W-4** requirements.md US-3 EARS still says "grouped or filterable"; design decision #3 locked
  single-list-with-filter-chips. Cosmetic text drift; implementation unambiguous.
- **W-5** EC-8 large-list pagination is conditional ("if needed"); Q-1 fetches unbounded. Acceptable
  for a per-user bookmark table in V1; revisit if a user exceeds ~a few hundred rows.
- **Gap** S-2 sign-in *failure* (vs dismiss) and system back-gesture on the sheet/route lack an
  explicit AC. Implement: failed auth → return to detail unsaved; back-gesture dismisses sheet
  without firing the save.
- **Store** 5.1.1 consent is asserted ("covered by existing account consent") not evidenced; 4.8
  (Sign in with Apple) is inherited from the reused `(auth)` flow. Confirm both at implementation —
  bookmarks adds no new consent/provider obligation but should not assume the inherited flow is clean.

## Sacred Rule audit (combined)

| Sacred Rule | Compliance evidence in spec | Verdict |
|---|---|---|
| SR-1 (Navigator confidence cap) | Declared N/A (brief L43, req L116, design L304); feature returns no confidence. | ✓ N/A |
| SR-2 (Crisis bypass) | Declared N/A (brief L43, req L117, design L305); no crisis/Navigator surface. | ✓ N/A |
| SR-3 (No diagnostic language) | req AC-N.3, design Sacred-Rules map + **now the full EN copy set** (content-neutral, person-first); sr3 hook gates commits. | ✓ (post-resolution) |
| SR-4 (Symptom data) | req AC-N.4 + **AC-N.4b** telemetry inference-guard; design telemetry table empty `{}` payloads + MUST-NOT-FIRE list; T-011 + T-002 DoD. | ✓ exemplary |

## Decision

- [x] **Pass with notes** — Implementation can begin. The two Block-tier findings were resolved
  in-spec (design.md copy set; requirements.md AC-5.3). Address the Warnings/gaps before the
  integration PR merges: S-2 auth-failure + back-gesture handling, 5.1.1 consent confirmation,
  4.8 inherited-auth confirmation, clinical (Dr. Dobson) sign-off on the empty-state/sign-in copy.

## Next step

Implement per tasks.md (waves 1→5). T-009 tool `resource_id` = route slug (resolved, see tasks.md
Open items #1). Final integration PR runs `/mobile-design-audit` (S-1/S-2/S-3) + review.
