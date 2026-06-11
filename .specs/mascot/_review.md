# Review: Mascot — Clay Companion

**Spec ID:** mascot
**Reviewed:** 2026-06-08
**Mode:** Regular
**Verdict:** Block — must fix before /spec-implement

## Summary

Mechanical audit is **clean** — zero file-isolation intersections, zero sequential-only violations,
zero status-line mismatches. The spec is well-structured, and two of its trickiest calls are handled
exemplary: the **dot-eye-vs-faceless brand exception** (flagged at every phase, renderer-isolated,
gated on Dr. Dobson + brand as a ship-blocker) and the **crisis-adjacency SR-2 boundary** (mascot
consumes a `crisis_adjacent` event, never owns detection; AC-4.1/4.3/4.4 keep it non-celebratory).

It blocks on **four issues, three of the same shape**: the spec attributes its SR-3 and SR-4
guarantees (and transitively App Store 1.4.1) to deterministic hooks that `constitution.md` itself
documents as **structurally blind to this feature's copy-paraphrases and variable names**. The
*designs* are compliant (props-only, no telemetry, grounding copy, Dobson-gated) — but the spec must
demote the hooks to backstops and elevate the real controls (Dobson clinical review; the
no-call-site unit test T-013) to primary. Plus a genuinely untestable rotation AC (B-1) and an
AC↔design schema mismatch on absence length. All fixes are **spec-text edits, not design rework.**

## Mechanical findings (parent skill)

### File-isolation intersection check
- Parallel-eligible tasks: 12 (T-001–T-005, T-007–T-014)
- Sequential-only tasks: 1 (T-006, `tsconfig.json`)
- Intersections found: **0**. Every parallel task owns a disjoint file set. `packages/shared/mascot/index.ts` (T-005) and `apps/mobile/features/mascot/index.ts` (T-011) are distinct paths — no collision.

### Sequential-only file enforcement
- Violations: **0**. Only T-006 touches a sequential-only file (`packages/shared/tsconfig.json`), correctly marked `✗`. No parallel task touches one.

### Status-line consistency
- Mismatches: **0**. brief=Discovery-complete, requirements=Requirements-complete, design=Design-complete, tasks=Tasks-complete — all ≤ INDEX `tasks-complete`.

## Qualitative findings (audit subagent)

### Findings (Block tier)

**B-1 — AC-3.3 asserts a no-immediate-repeat property the pure `resolve` cannot own.**
AC-3.3 ("consecutive `resolve` calls for the same state do not return the same line twice in a row")
contradicts AC-1.3 (pure, no memory) + design line ~213 ("rotation index is caller-supplied… not
internal state"). A memoryless pure function can't guarantee a property of *consecutive calls* — that
depends on the caller incrementing the index. As written T-008 can only verify
`pickLine(state, i) !== pickLine(state, i+1)`, not the stated property.
**Fix:** restate AC-3.3 as a property of `pickLine` over indices (`pickLine(s,i) !== pickLine(s,(i+1) mod N)`),
*or* move the no-repeat guarantee into the component (which holds the index) and test it there.

**B-2 — SR-3 verification is over-attributed to a paraphrase-blind hook.**
brief, AC-3.4, design SR-3 row, T-004/T-008 cite `sr3_diagnostic_language.sh` as the SR-3 control,
but constitution.md (≈lines 66–68, 195) documents it as a **10-seed literal scan**; the paraphrase
layer "has never run." Companion copy's real SR-3 risk is soft diagnostic *implication* ("looks like
the anxiety is loud today") containing none of the seeds — which passes silently. The genuine
guarantee is the Dr. Dobson review (correctly in DoD), but the spec frames the hook as primary and
Dobson as supplementary, and scopes Dobson to steady/welcome_back only.
**Fix:** demote the hook to "catches the 10 literal seeds only"; make Dr. Dobson clinical review the
**load-bearing** SR-3 gate for **every** line-emitting state, explicitly because the paraphrase layer
is deferred (constitution).

**B-3 — SR-4 hook seed list does not include this feature's identifiers.**
AC-8.1 / design line ~263 / T-013 cite `sr4_no_symptom_telemetry.sh` as enforcement, but its seeds
(constitution ≈lines 98–110: `symptom`, `moodSelection`, `checkInData`, …) do **not** include the
mascot's prop names `mood` (`MoodBand`) or `event` (`MascotLoopEvent`). `analytics.track('pose', { mood })`
would pass the hook silently. The real SR-4 control is the T-013 no-call-site unit test.
**Fix:** make the absence-of-telemetry-call-sites test (T-013) the **primary** SR-4 control; state the
hook is a backstop that does not match `mood`/`event` by name.

**B-4 — AC-3.1 / T-008 "for every absence length" disagrees with the design line registry schema.**
The missed-day no-punish test is scoped "for every absence length," implying lines vary by absence
length — but the design registry is keyed only by state (`mascot.line.returned_after_absence.1..3`),
with no absence-length axis.
**Fix:** reconcile — either drop "for every absence length" (lines don't vary by gap, so it's
vacuous) or add the absence-length dimension to the registry schema in design.md + types.

### Findings (Warning tier)

- **W-1** — "no perceptible jank" (requirements Constraints) is untestable. Replace with a frame-budget
  assertion measured in the T-012 gallery (UI-thread Reanimated worklet, zero JS-thread drops).
- **W-2** — "feel non-robotic" (brief Q4) is a rationale, not an AC — confirm no AC rests on it (none does).
- **W-3** — EC-3 "no visual glitch" → reframe as a Reanimated `cancelAnimation`/restart assertion.
- **W-4** — EC-8 language-switch: behavior of an *already-displayed* line on switch is unspecified (re-render vs hold). Pick one.
- **W-5** — Screen-reader reading order asserted (design a11y table) but untested. Add to T-013.
- **W-6** — Dynamic Type 100–200% on lines claimed but untested (clip/truncate at 200%). Add to T-012/T-013.
- **W-7** — i18n deferred (T-014, Phase 6) → **V1 ships EN-only**. The feature DoD still lists 5-language
  localization as Done; tighten it to Phase-6-gated (matching tasks). Product note: **Sofia (PT-speaker
  secondary persona) gets no companion warmth in her language at V1** — the brief's "warmth must survive
  translation" premise is unmet at launch.
- **W-8** — Test estimates tight: T-008 (40m) bundles 5 test concerns; T-007 (35m) bundles 4. Realistic but no slack.
- **W-9** — Session-start repetition trap: with N=3 and a caller index reset to 0 each session (likely, since
  index isn't persisted per SR-4), welcome-back is always `line[0]` on return → feels robotic. AC-3.3 guards
  only consecutive repeats. The requirements open-Q ("deterministic seed from a non-mood value") is the right
  instinct but unresolved — resolve before implement.

### Renderer resilience (App Store 4.0)
- An unhandled exception in a `POSE_RENDERERS` entry would crash the check-in surface. Add a renderer-level
  error boundary / fallback-to-`resting` on render failure (design Error-handling covers data/lang, not render).

## Sacred Rule audit (combined)

| Sacred Rule | Compliance evidence in spec | Verdict |
|---|---|---|
| SR-1 (Navigator confidence cap) | Scoped out — mascot computes no confidence (requirements line ~144, design line ~251). Correctly N/A. | ✓ |
| SR-2 (Crisis bypass detector) | US-4 + AC-4.1/4.3/4.4; consumes `crisis_adjacent` event, never owns/suppresses detection; T-003/T-007 assert no crisis-flag refs. Correct by construction. | ✓ |
| SR-3 (No diagnostic language) | Designed compliant (grounding steady set, person-first, Dobson DoD) **but** verification misattributed to a paraphrase-blind hook (B-2). | ✗ (B-2) |
| SR-4 (Symptom data on device) | Designed compliant (props-only, no telemetry/persistence, T-013 no-call-site test) **but** the named hook's seeds don't match `mood`/`event` (B-3). | ✗ (B-3) |

## App Store / Play Store coverage

| Guideline | Applies | Addressed | Gap |
|---|---|---|---|
| Apple 1.4.1 / Play medical-claims | Yes | Yes (no diagnosis/treatment copy; Dobson) | Inherits the B-2 paraphrase gap; the same Dobson review backstops it — make the linkage explicit. |
| Apple 5.1.1 / Play data consent | Yes | **Model case** — mascot collects/transmits nothing | None. |
| Apple 4.0 design / stability | Partially | Implicit via /mobile-design-audit | Add renderer error boundary / fallback-to-resting (above). |
| Apple 2.5.x a11y (VoiceOver, Dynamic Type) | Yes | Partially (claimed, untested) | W-5, W-6. |

## Decision

- [x] **Block** — Fix the following in the relevant spec files and re-run `/spec-review mascot` before any `/spec-implement`:
  1. **B-1** (requirements AC-3.3 + tasks T-008): restate the rotation property so a single unit can own and test it.
  2. **B-2** (requirements SR-3 AC + design SR-3 map + tasks T-004/T-008): demote the SR-3 hook to backstop; make Dr. Dobson review the load-bearing gate across all line states.
  3. **B-3** (requirements AC-8.1 + design telemetry map + tasks T-013): make the no-call-site test the primary SR-4 control; note the hook does not match `mood`/`event`.
  4. **B-4** (requirements AC-3.1 + tasks T-008 + design registry schema): reconcile "for every absence length" with the state-keyed line registry.

All four are spec-text reconciliations; the underlying design (props-only, no telemetry, grounding
copy, Dobson-gated, renderer-isolated dot-eyes) is sound and does not change. Recommended: also clear
W-7 (EN-only-at-launch / Sofia) and W-9 (session-start repetition) while editing.

## Next step

Edit `requirements.md`, `design.md`, and `tasks.md` to resolve B-1…B-4 (and ideally W-7, W-9), then
re-run `/spec-review mascot`. A clean re-review flips INDEX to `review-pass` and unblocks
`/spec-implement mascot <task-id>`.
