# Review: Clarity Journal (mobile)

**Spec ID:** clarity-journal
**Reviewed:** 2026-06-16
**Mode:** Regular
**Verdict:** Pass with notes — implementation can begin; warnings addressed before merge

> First pass returned **Block** (5 blockers). All were closed via direct spec edits; this re-review confirms resolution. History retained below for the audit trail.

## Mechanical findings (parent skill) — CLEAN
- File-isolation intersection: **0** (23 parallel tasks, pairwise-disjoint path sets).
- Sequential-only enforcement: **0** violations (only T-008 touches `package.json`, marked `✗`).
- Status-line consistency: **0** mismatches.

## Blockers from first pass — all RESOLVED
- **B-1 (brand font) — RESOLVED.** design.md anti-slop row now "No" + "IBM Plex Sans + Fraunces per CLAUDE.md §7 / DD-001; Inter not used on mobile." (Was wrongly citing Inter as the brand — that's the web convention.)
- **B-2 (AC-2.3 testability) — RESOLVED.** Fixed per-instrument screener label sets (PHQ-2/GAD-2, PSS-4, WHO-5) + fixture-score→label assertion.
- **B-3 (AC-9.2 testability) — RESOLVED.** Directional categorical labels + date/week chart axes + regex/scalar assertion.
- **B-4 (crisis-mid-entry recovery) — RESOLVED.** design.md error table: auto-save draft → full-screen crisis overlay → dismiss restores draft; text never transmitted.
- **B-5 (daily-checkin ↔ S4 reconciliation) — RESOLVED.** AC-1.3 + design data-model: separate store, may coexist, hub "Journal check-in" CTA opens the journal entry, labeled distinctly.

## Warnings — folded into spec
- **EC-10** partial screener across week boundary (requirements). ✓
- **AC-12.3** on-device consent notice (App Store 5.1.1). ✓
- **App Store 1.4.1** now scopes thought-record / behavioral-activation educational copy. ✓
- **ES/FR crisis** documented as a V1 known limitation. ✓

## Remaining (non-blocking) notes for implementation
- **W (signature motion curve)** — balanced-thought reveal is pinned to opacity+subtle-translate / `motion.duration.calm` / `easing.standard`; exact translate distance at implement (T-016). Keep it the feature's single signature moment.
- **W (T-022 estimate)** — check the web report `build-html` path for network/DOM deps before assigning; may exceed 45m.
- **Open design decisions** in design.md (clay-figure placeholders pending library ETA 2026-07-08, report HTML schema layout) are non-blocking.

## Sacred Rule audit (combined)

| Sacred Rule | Compliance evidence | Verdict |
|---|---|---|
| SR-1 (Navigator confidence cap) | Declared N/A (no Navigator path). | ✓ |
| SR-2 (crisis bypass) | US-11/AC-11.3, design Sacred-Rules map, T-011 (`precheckCrisis`, no disable flag, sr2 hook + test). | ✓ |
| SR-3 (no diagnostic language) | AC-2.3 (now testable), AC-N.3, T-009 fixture + sr3 hook + Dr. Dobson gate. | ✓ |
| SR-4 (symptom data on device) | AC-12.2/12.3, "zero network surface", telemetry MUST-NOT-FIRE, T-023 no-telemetry guard + sr4 hook. | ✓ |

## Decision

- [x] **Pass with notes** — Implementation can begin. Address the non-blocking notes before merge. Spin up worktrees per tasks.md parallelization plan; run `/spec-implement clarity-journal <task-id>`.

## Next step

Implement per the tasks.md parallelization plan (Wave 1: T-001, T-002, T-009). Clinical copy ships as CT4 fixture pending Dr. Dobson; safety-plan/crisis copy also needs App-Store crisis-content review before ship.
