# Tasks: Clarity Journal (mobile)

**Spec ID:** clarity-journal
**Status:** Tasks complete — ready for /spec-review
**Reads from:** brief.md, requirements.md, design.md
**Created:** 2026-06-16

24 tasks across 5 slices (S1 shared+hub → S2 capture sections → S3 screening+toolbox → S4 insights → S5 report). 23 parallelizable, 1 sequential-only (T-008 touches `packages/shared/package.json`). All TDD (RED→GREEN per /spec-implement). All clinical copy ships as CT4 fixture pending Dr. Dobson (SR-3 DoD on copy/screen tasks).

## Task table

`Files` format: `<path> (create|modify|delete), …` — ownership = files the task writes, not imports.

| ID | Title | Files | Depends on | Parallelizable | Est. | DoD summary |
|---|---|---|---|---|---|---|
| T-001 | Shared: entry + result + DI-seam types | `packages/shared/clarity-journal/types.ts (create)` | — | ✓ | 30m | All 9 entity shapes + screener/insights/report types + Storage/Clock/IdFactory seams |
| T-002 | Shared: LocalCalendarDate helpers | `packages/shared/clarity-journal/dates.ts (create)` | — | ✓ | 20m | Branded date builders mirroring check-in/sleep dates |
| T-003 | Shared: constants (tags, distortions, wellness cats, 6 safety sections, 988, prompts) | `packages/shared/clarity-journal/constants.ts (create)` | T-001 | ✓ | 30m | Ported from web constants.ts + data/prompts.ts |
| T-004 | Shared: screener scoring (PHQ-2/GAD-2/PSS-4/WHO-5) | `packages/shared/clarity-journal/scoring.ts (create)` | T-001 | ✓ | 35m | Byte-parity formulas+thresholds; tests assert vs web values |
| T-005 | Shared: MMKV record-store + migrator | `packages/shared/clarity-journal/record-store.ts (create), packages/shared/clarity-journal/migrate.ts (create)` | T-001, T-002 | ✓ | 40m | DI store, one-per-day, SCHEMA_VERSION, quarantine-on-corrupt, safety-flag store |
| T-006 | Shared: insights (trend/distortion/coping/streak) | `packages/shared/clarity-journal/insights.ts (create)` | T-001, T-004 | ✓ | 35m | Pure on-device computations; tests |
| T-007 | Shared: report-engine data assembly | `packages/shared/clarity-journal/report.ts (create)` | T-001, T-004, T-006 | ✓ | 40m | Ports web reportEngine.ts ReportData outputs; tests |
| T-008 | Shared: barrel + exports + version bump | `packages/shared/clarity-journal/index.ts (create), packages/shared/package.json (modify)` | T-001–T-007 | ✗ (sequential-only file: package.json) | 15m | `./clarity-journal` subpath added; 0.8.0→0.9.0 |
| T-009 | App: CT4 fixture copy | `apps/mobile/features/clarity-journal/copy.ts (create)` | T-001 | ✓ | 30m | All section/screener/safety/insight strings; marked FIXTURE pending Dobson |
| T-010 | App: store singleton wiring | `apps/mobile/lib/clarity-journal-store.ts (create)` | T-008 | ✓ | 20m | App MMKV singleton over shared store (mirror lib/sleep-store) |
| T-011 | App: crisis-scanned field + section-form scaffold | `apps/mobile/features/clarity-journal/components/CrisisScannedField.tsx (create), apps/mobile/features/clarity-journal/components/SectionForm.tsx (create)` | T-008, T-009 | ✓ | 40m | Free-text field runs precheckCrisis→crisis surface; reusable form |
| T-012 | App: journal hub screen | `apps/mobile/features/clarity-journal/ClarityJournalHub.tsx (create)` | T-009, T-010, T-011 | ✓ | 35m | Lists 7 sections + insights + report; today's-incomplete markers; CrisisPill |
| T-013 | App: route + Compass entry | `apps/mobile/app/tools/clarity-journal.tsx (create), apps/mobile/app/(tabs)/compass.tsx (modify)` | T-012 | ✓ | 20m | Expo Router entry; add to Compass tools list (confirm exact compass surface at implement) |
| T-014 | Section: daily check-in (S-2) | `apps/mobile/features/clarity-journal/sections/DailyCheckInSection.tsx (create)` | T-010, T-011 | ✓ | 35m | mood/energy/sleep/note/tags; one-per-day edit; distinct from S4 store |
| T-015 | Section: weekly screening (S-3) | `apps/mobile/features/clarity-journal/sections/WeeklyScreeningSection.tsx (create)` | T-010, T-011, T-004 | ✓ | 40m | Stepped items; educational level + trend; no score until complete |
| T-016 | Section: thought record (S-4, signature) | `apps/mobile/features/clarity-journal/sections/ThoughtRecordSection.tsx (create)` | T-010, T-011 | ✓ | 45m | CBT steps; balanced-thought reveal (motion.duration.calm, Reduce-Motion fallback) |
| T-017 | Section: behavioral activation (S-5) | `apps/mobile/features/clarity-journal/sections/BehavioralActivationSection.tsx (create)` | T-010, T-011 | ✓ | 35m | predicted/actual mood, type; unrated = draft |
| T-018 | Section: trigger log (S-6) | `apps/mobile/features/clarity-journal/sections/TriggerLogSection.tsx (create)` | T-010, T-011 | ✓ | 35m | severity/category/effectiveness; free-text scanned |
| T-019 | Section: weekly reflection (S-8) | `apps/mobile/features/clarity-journal/sections/WeeklyReflectionSection.tsx (create)` | T-010, T-011 | ✓ | 30m | 5 free-text fields; all scanned; distinct from S9 terrain |
| T-020 | Section: wellness toolbox + safety plan (S-7) | `apps/mobile/features/clarity-journal/sections/WellnessSafetySection.tsx (create)` | T-010, T-011, T-003 | ✓ | 45m | 4 cats + 6 Stanley-Brown sections; 988 pre-seed; crisis dialer reuse |
| T-021 | App: insights screen (S-9) | `apps/mobile/features/clarity-journal/ClarityJournalInsights.tsx (create)` | T-010, T-006 | ✓ | 40m | Trends/distortions/coping/streak; no person-verdict label; svg charts |
| T-022 | App: report screen + PDF | `apps/mobile/features/clarity-journal/ClarityJournalReport.tsx (create), apps/mobile/features/therapist/pdf/build-html.ts (modify)` | T-010, T-007 | ✓ | 45m | On-device assembly; user-initiated OS share only; extend build-html |
| T-023 | Test: SR-4 no-telemetry / no-network guard | `apps/mobile/features/clarity-journal/__tests__/no-telemetry.test.ts (create)` | T-005, T-007 | ✓ | 25m | Asserts store + report never call Supabase/Sentry/analytics |
| T-024 | E2E: Maestro journal smoke | `apps/mobile/.maestro/clarity-journal.yaml (create)` | T-012–T-022 | ✓ | 30m | Open hub → complete a thought record → see it persisted |

## Per-task detail

**Shared DoD (applies to every task):** code TS-clean (`tsc --noEmit`); tests written RED→GREEN and pass (targeted Vitest — full suite OOMs); Biome clean; `/ultrareview` on PR; PR references US/AC. Below lists only the per-task deltas (applicable Sacred Rule, token/anti-slop applicability).

### T-001–T-008 (shared, `packages/shared/clarity-journal/`)
Pure TypeScript, no UI → token/anti-slop = N/A. **SR-4** (DoD): store (T-005) + report (T-007) expose no network/telemetry path; `sr4` hook passes. **SR-3** N/A (no user-facing strings in shared; copy lives in app T-009). T-004/T-006/T-007 carry byte-parity tests vs web (`psychage-v2/src/components/tools/ClarityJournal/{scoring,lib/reportEngine}.ts`). T-008 non-parallel (package.json); semver minor (additive `./clarity-journal`).

### T-009 — CT4 fixture copy
**SR-3** (DoD): all strings educational, person-first, run against the 30-term filter; `sr3` hook passes; file marked `FIXTURE — pending Dr. Dobson`. Screener result copy = level words, never instrument-name verdicts. Token/anti-slop N/A (strings only).

### T-010 — store singleton
Mirrors `apps/mobile/lib/sleep-store.ts`. **SR-4** (DoD): MMKV-only, no sync path. Token/anti-slop N/A.

### T-011 — crisis-scanned field + form scaffold
**SR-2** (DoD): `CrisisScannedField` runs `precheckCrisis` from `@psychage/shared/safety` on every free-text blur/submit; on match routes to `features/crisis` surface; detection has no disable flag; `sr2` hook + unit test. **Token discipline:** all values token-bound. **Anti-slop:** `/mobile-design-audit` static pass.

### T-012–T-022 (app screens/sections)
**Token discipline** (DoD): no raw hex/px/ms; reference `color.*`/`radius.*`/`motion.*`/`haptic.*`/8pt. **Anti-slop** (DoD): `/mobile-design-audit` static pass. **SR-3** (DoD): any inline copy from T-009 fixture; no diagnostic language; `sr3` passes. **SR-2** for any free-text section (T-014/16/17/18/19/20): free-text uses `CrisisScannedField`. **SR-4**: no telemetry with field content. T-016 owns the single signature moment (balanced-thought reveal) + Reduce-Motion fallback. T-020 crisis-content + safety-plan copy = Dr. Dobson + App-Store 1.4.1/5.1.1 (DoD). T-021 no numeric person-verdict (SR-3). T-022 PDF on-device, user-initiated share only (SR-4).

### T-023 — SR-4 guard test
Integration test: drives store + report, asserts zero calls to any Supabase client, Sentry, or analytics. **SR-4** is the whole point.

### T-024 — Maestro E2E
Per workspace `e2eRunner: Maestro`. Smoke: hub → thought record → persist. Sacred-rule N/A (flow only).

## Parallelization plan

### Wave 1 (no deps)
T-001, T-002, T-009 — `git worktree add` per task off `feat/clarity-journal`.

### Wave 2 (shared, after T-001/T-002)
T-003, T-004 (need T-001); T-005 (T-001,T-002). Then T-006 (T-004) → T-007 (T-006).

### Wave 3 (shared barrel — sequential tail)
T-008 (after all shared; touches package.json → single-thread).

### Wave 4 (app foundation, after T-008)
T-010 → then T-011 (also needs T-009).

### Wave 5 (the big parallel win — after T-010, T-011)
T-012 hub, then sections **T-014, T-015, T-016, T-017, T-018, T-019, T-020 in parallel** (7 distinct files, zero overlap), plus T-021 (needs T-006), T-022 (needs T-007).

### Wave 6 (tail)
T-013 (after hub), T-023 (after T-005/T-007), T-024 (after all screens).

### Practical recommendation
Spin up ~4 worktrees steady-state (workspace cap 8). Highest-value parallel: the 7 section screens (Wave 5). Single-thread T-008.

## File-creation summary

```
packages/shared/clarity-journal/
  types.ts            (T-001)   dates.ts        (T-002)
  constants.ts        (T-003)   scoring.ts      (T-004)
  record-store.ts     (T-005)   migrate.ts      (T-005)
  insights.ts         (T-006)   report.ts       (T-007)
  index.ts            (T-008)
  __tests__/…         (T-004/5/6/7)
packages/shared/package.json    (T-008, modify)
apps/mobile/lib/clarity-journal-store.ts        (T-010)
apps/mobile/features/clarity-journal/
  copy.ts             (T-009)
  components/CrisisScannedField.tsx, SectionForm.tsx (T-011)
  ClarityJournalHub.tsx        (T-012)
  ClarityJournalInsights.tsx   (T-021)
  ClarityJournalReport.tsx     (T-022)
  sections/DailyCheckInSection.tsx        (T-014)
  sections/WeeklyScreeningSection.tsx     (T-015)
  sections/ThoughtRecordSection.tsx       (T-016)
  sections/BehavioralActivationSection.tsx(T-017)
  sections/TriggerLogSection.tsx          (T-018)
  sections/WeeklyReflectionSection.tsx    (T-019)
  sections/WellnessSafetySection.tsx      (T-020)
  __tests__/no-telemetry.test.ts          (T-023)
apps/mobile/app/tools/clarity-journal.tsx (T-013, create)
apps/mobile/app/(tabs)/compass.tsx        (T-013, modify)
apps/mobile/features/therapist/pdf/build-html.ts (T-022, modify)
apps/mobile/.maestro/clarity-journal.yaml (T-024)
```

## Definition of Done — feature

- [ ] All T-001–T-024 merged on `main` (via `feat/clarity-journal`)
- [ ] `pnpm -r test` passes (targeted during dev; full in CI)
- [ ] Maestro E2E (T-024) passes iOS sim + Android emulator
- [ ] All Sacred Rule hooks pass on every commit (SR-2 crisis, SR-3 copy, SR-4 telemetry)
- [ ] `/mobile-design-audit` passes
- [ ] `/ultrareview` pass per PR
- [ ] PR references App Store 1.4.1 + 5.1.1
- [ ] No Supabase/Sentry/analytics write contains any journal/screener/safety content (T-023 + sr4 hook)
- [ ] Dr. Dobson clinical review of all copy (screener levels, safety plan, insights) before ship
- [ ] Manual QA: dark mode, Reduce Motion, Reduce Haptics, empty states

## Next step

1. Run `/spec-review clarity-journal` to audit for gaps + mechanically verify file isolation across the parallel section tasks.
2. On review pass, spin up worktrees per the plan and `/spec-implement clarity-journal <task-id>`.
