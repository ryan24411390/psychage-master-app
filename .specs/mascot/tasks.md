# Tasks: Mascot — Clay Companion

**Spec ID:** mascot
**Status:** Tasks complete — ready for /spec-review
**Reads from:** brief.md, requirements.md, design.md
**Created:** 2026-06-08

## Task table

`Files` uses the structured format: `<path> (create|modify|delete), ...` — comma-separated, no
globs. Ownership = files the task writes, NOT files it imports.

| ID | Title | Files | Depends on | Parallelizable | Est. | DoD summary |
|---|---|---|---|---|---|---|
| T-001 | Mascot types | `packages/shared/mascot/types.ts (create)` | — | ✓ | 25m | MoodBand, MascotLoopEvent, MascotPose, MascotLine, PoseSpec defined + exported |
| T-002 | Pose state set | `packages/shared/mascot/states.ts (create)` | T-001 | ✓ | 30m | 9 PoseSpecs + mood→pose map; one-teal-per-scene flag |
| T-003 | resolve() machine | `packages/shared/mascot/machine.ts (create)` | T-001, T-002 | ✓ | 35m | pure resolve(mood,event)→{pose,line?}; crisis wins; RNG-free pickLine |
| T-004 | Line registry (EN source) | `packages/shared/mascot/lines.ts (create)` | T-001 | ✓ | 35m | ≥3 lines/state; anti-nag welcome-back; person-first; SR-3 clean |
| T-005 | Shared barrel exports | `packages/shared/mascot/index.ts (modify)` | T-001, T-002, T-003, T-004 | ✓ | 15m | export types, resolve, POSE_SPECS, line registry |
| T-006 | Add mascot to shared tsconfig include | `packages/shared/tsconfig.json (modify)` | — | ✗ (sequential-only file: tsconfig.json) | 10m | `include` lists `mascot`; typecheck + vitest see the module |
| T-007 | Machine unit tests | `packages/shared/mascot/__tests__/machine.test.ts (create)` | T-003 | ✓ | 35m | totality, determinism, crisis-wins, pose mappings (AC-1/2/4) |
| T-008 | Line tests incl. missed-day no-punish | `packages/shared/mascot/__tests__/lines.test.ts (create)` | T-004 | ✓ | 40m | no-punish predicate over returned_after_absence (AC-3.1); ≥3/state; rotation; SR-3 |
| T-009 | Pose renderers (primitive, swap-later) | `apps/mobile/features/mascot/renderers/ClayFigure.tsx (create), apps/mobile/features/mascot/renderers/index.ts (create)` | T-001 | ✓ | 45m | hand-authored RN-SVG/Skia primitives; pose→renderer registry; token-bound colors (imports shared types only) |
| T-010 | Mascot component | `apps/mobile/features/mascot/Mascot.tsx (create)` | T-005, T-009 | ✓ | 40m | mounts {mood,event}; consumes resolve+registry; two-tier useReducedMotion; a11y label |
| T-011 | Mobile feature barrel | `apps/mobile/features/mascot/index.ts (modify)` | T-010 | ✓ | 10m | export Mascot + re-export MoodBand/MascotLoopEvent |
| T-012 | Dev gallery screen | `apps/mobile/app/dev-mascot.tsx (create)` | T-011 | ✓ | 30m | renders full pose set; reduce-motion verification surface (DoD) |
| T-013 | Component tests | `apps/mobile/features/mascot/__tests__/Mascot.test.tsx (create)` | T-010 | ✓ | 35m | renders every (mood,event) w/o throw; no telemetry call sites (SR-4); reduce-motion path |
| T-014 | i18n line localization (PT/ES/SV/FR) **(blocked: packages/i18n — Phase 6)** | `packages/i18n/translations/mascot/en.json (create), packages/i18n/translations/mascot/pt.json (create), packages/i18n/translations/mascot/es.json (create), packages/i18n/translations/mascot/sv.json (create), packages/i18n/translations/mascot/fr.json (create)` | T-004 | ✓ | 45m | migrate EN registry → i18n JSON + 4 translations + EN fallback. **DEFERRED until packages/i18n exists** |

## Per-task detail

### T-001 — Mascot types
**Files:** `packages/shared/mascot/types.ts` (create) · **Depends on:** none · **Parallelizable:** yes · **Est.:** 25m
**Description:** Define the interface contract: `MoodBand = 1|2|3|4|5`; closed union `MascotLoopEvent`
(AC-6.1); `MascotPose` (9-member union); `MascotLine`; `PoseSpec` (eyes/body/moodBand/tealAccent).
**DoD:** [ ] TS-clean · [ ] exported · [ ] Sacred Rule: N/A · [ ] Token discipline: N/A · [ ] Anti-slop: N/A · [ ] /ultrareview · [ ] PR cites US-5/US-6/AC-6.1–6.2
**Sacred Rule refs:** none.

### T-002 — Pose state set
**Files:** `packages/shared/mascot/states.ts` (create) · **Depends on:** T-001 · **Parallelizable:** yes · **Est.:** 30m
**Description:** Encode the 9 PoseSpecs from design S-1 and the `mood→pose` map
(1→gentle…5→bright, null/3→resting). Exactly one teal accent on `celebrate`/`bright` (one-teal lock).
**DoD:** [ ] TS-clean · [ ] tests (via T-007) · [ ] Sacred Rule: N/A · [ ] Token discipline: pose color fields name `color.mood.*`/`color.charcoal.*`/`color.teal.600` token IDs, no raw hex · [ ] Anti-slop: N/A (data) · [ ] /ultrareview · [ ] PR cites US-1/AC-1.1–1.4
**Sacred Rule refs:** none.

### T-003 — resolve() machine
**Files:** `packages/shared/mascot/machine.ts` (create) · **Depends on:** T-001, T-002 · **Parallelizable:** yes · **Est.:** 35m
**Description:** Pure `resolve(mood, event) → { pose, line? }`. Precedence: `crisis_adjacent`→steady
(wins over mood, AC-4.1); saved/milestone→celebrate; returned→welcome_back; opened→attentive;
idle/mood_selected→mood-band pose. `pickLine(state, rotationIndex)` selects RNG-free, no immediate
repeat (AC-3.3). No `Math.random`/`Date.now` (AC-1.3).
**DoD:** [ ] TS-clean · [ ] tests (T-007/T-008) · [ ] Sacred Rule: SR-2 boundary — no crisis flag/branch (AC-4.3) · [ ] Token discipline: N/A · [ ] Anti-slop: N/A · [ ] /ultrareview · [ ] PR cites US-2/US-4
**Sacred Rule refs:** SR-2 boundary (AC-4.3).

### T-004 — Line registry (EN source)
**Files:** `packages/shared/mascot/lines.ts` (create) · **Depends on:** T-001 · **Parallelizable:** yes · **Est.:** 35m
**Description:** `Record<LineState, MascotLine[]>` with ≥3 EN lines per emitting state
(check_in_saved, streak_milestone, returned_after_absence, steady; optional idle/mood). Welcome-back
lines are warm, never streak-shaming (anti-nag). Grounding-only steady set. Person-first. This `.ts`
file is scanned by the SR-3 hook (`**/*.ts`).
**DoD:** [ ] TS-clean · [ ] tests (T-008) · [ ] Sacred Rule: SR-3 hook passes; **steady + welcome_back sets queued for Dr. Dobson review (ship-gate)** · [ ] Token discipline: N/A · [ ] Anti-slop: N/A · [ ] /ultrareview · [ ] PR cites US-3/AC-3.1–3.6
**Sacred Rule refs:** SR-3 (AC-3.4), person-first (AC-3.5).

### T-005 — Shared barrel exports
**Files:** `packages/shared/mascot/index.ts` (modify) · **Depends on:** T-001–T-004 · **Parallelizable:** yes (sole writer of this file) · **Est.:** 15m
**Description:** Replace the reserved `export {}` stub with public exports: types, `resolve`,
`POSE_SPECS`, the line registry. No deep imports allowed downstream (CLAUDE.md barrel rule, AC-5.2).
**DoD:** [ ] TS-clean · [ ] `@psychage/shared/mascot` resolves · [ ] Sacred Rule: N/A · [ ] /ultrareview · [ ] PR cites AC-5.2
**Sacred Rule refs:** none.

### T-006 — Add mascot to shared tsconfig include
**Files:** `packages/shared/tsconfig.json` (modify) · **Depends on:** none · **Parallelizable:** ✗ (sequential-only file: tsconfig.json) · **Est.:** 10m
**Description:** Add `"mascot"` to `include` so typecheck + vitest cover the module (currently lists
navigator/peaf/sensitivity only).
**DoD:** [ ] `pnpm --filter @psychage/shared typecheck` sees mascot · [ ] vitest discovers mascot tests · [ ] /ultrareview
**Sacred Rule refs:** none.

### T-007 — Machine unit tests
**Files:** `packages/shared/mascot/__tests__/machine.test.ts` (create) · **Depends on:** T-003 · **Parallelizable:** yes · **Est.:** 35m
**Description:** Assert: total mapping over all (mood,event) (AC-2.5); determinism (AC-1.3); crisis
wins over mood (AC-4.1, AC-4.4); each event→expected pose (AC-2.1–2.4); null→resting (AC-1.2).
**DoD:** [ ] RED→GREEN · [ ] pass locally · [ ] Sacred Rule: asserts no crisis-bypass refs (SR-2) · [ ] /ultrareview · [ ] PR cites US-1/US-2/US-4
**Sacred Rule refs:** SR-2 boundary.

### T-008 — Line tests incl. missed-day no-punish
**Files:** `packages/shared/mascot/__tests__/lines.test.ts` (create) · **Depends on:** T-004 · **Parallelizable:** yes · **Est.:** 40m
**Description:** The load-bearing missed-day test: a `no-punish` predicate (rejects streak-loss
counts, "you missed", "don't break", guilt phrasing) asserted over **every** `returned_after_absence`
line for **every** absence length (AC-3.1). Also: ≥3 lines/state (AC-3.2); no-immediate-repeat
rotation (AC-3.3); SR-3 forbidden-phrase scan over the registry (AC-3.4); person-first (AC-3.5).
**DoD:** [ ] RED→GREEN · [ ] pass locally · [ ] Sacred Rule: SR-3 unit assertion passes · [ ] /ultrareview · [ ] PR cites US-3/AC-3.1–3.5
**Sacred Rule refs:** SR-3 (AC-3.4), person-first.

### T-009 — Pose renderers (primitive, swap-later seam)
**Files:** `apps/mobile/features/mascot/renderers/ClayFigure.tsx` (create), `apps/mobile/features/mascot/renderers/index.ts` (create) · **Depends on:** T-001 · **Parallelizable:** yes · **Est.:** 45m
**Description:** Hand-authored react-native-svg/Skia primitive clay figure consuming `PoseSpec`
(matte body + two charcoal dot-eyes + optional single teal accent). `POSE_RENDERERS: Record<MascotPose,
PoseRenderer>` registry is the illustrator swap-later seam. Colors bind to token leaves
(`color.charcoal.*`, `color.mood.*`, `color.teal.600`) via the mobile color layer — no raw hex.
**DoD:** [ ] TS-clean · [ ] every pose has a renderer · [ ] Sacred Rule: N/A · [ ] Token discipline: no raw hex/px; token IDs only · [ ] Anti-slop: matte clay, no gradients/shadows; one teal element max · [ ] /mobile-design-audit static pass · [ ] /ultrareview · [ ] PR cites S-1
**Sacred Rule refs:** none. **Ship-gate:** dot-eye exception → Dr. Dobson + brand sign-off.

### T-010 — Mascot component
**Files:** `apps/mobile/features/mascot/Mascot.tsx` (create) · **Depends on:** T-005, T-009 · **Parallelizable:** yes · **Est.:** 40m
**Description:** The mounted surface. Props `{ mood, event }` only (AC-5.1, AC-5.4). Calls `resolve`,
picks the registry renderer, branches on `useReducedMotion()` (idle breath disabled; pose change →
200ms cross-fade). Renders optional line via `Text`. `accessibilityLabel` per pose. Fires no haptics
(AC-7.1).
**DoD:** [ ] TS-clean · [ ] tests (T-013) · [ ] Sacred Rule: SR-4 — no telemetry/persistence of props · [ ] Token discipline: motion via `motion.duration.*`/easing tokens (lib/motion.ts) · [ ] Anti-slop: Reanimated UI-thread only; reduce-* fallbacks present · [ ] /mobile-design-audit · [ ] /ultrareview · [ ] PR cites US-5/US-7/EC-4
**Sacred Rule refs:** SR-4 (AC-8.1), US-7 (AC-7.1).

### T-011 — Mobile feature barrel
**Files:** `apps/mobile/features/mascot/index.ts` (modify) · **Depends on:** T-010 · **Parallelizable:** yes (sole writer) · **Est.:** 10m
**Description:** Replace `export {}` stub: export `Mascot`; re-export `MoodBand`, `MascotLoopEvent`
from shared so the check-in consumer imports the contract from one surface (`@/features/mascot`).
**DoD:** [ ] TS-clean · [ ] `@/features/mascot` resolves Mascot + types · [ ] /ultrareview · [ ] PR cites AC-5.1
**Sacred Rule refs:** none.

### T-012 — Dev gallery screen
**Files:** `apps/mobile/app/dev-mascot.tsx` (create) · **Depends on:** T-011 · **Parallelizable:** yes · **Est.:** 30m
**Description:** `__DEV__` route mirroring the `/dev-navigator` pattern. Grid rendering every pose ×
each line-state through the real `Mascot` component, plus a read-out of OS reduce-motion state — the
DoD surface proving poses render and idle animation disables under reduce-motion.
**DoD:** [ ] TS-clean · [ ] renders full set · [ ] reduce-motion verified visually · [ ] Token discipline: NativeWind classes only · [ ] /mobile-design-audit · [ ] /ultrareview · [ ] PR cites DoD-gallery/EC-4
**Sacred Rule refs:** none.

### T-013 — Component tests
**Files:** `apps/mobile/features/mascot/__tests__/Mascot.test.tsx` (create) · **Depends on:** T-010 · **Parallelizable:** yes · **Est.:** 35m
**Description:** RNTL: renders every (mood,event) combination without throwing (AC-5.3); asserts
**no telemetry/`Haptics.*` call sites** reachable from mascot code (AC-8.1, AC-7.1); reduce-motion
branch produces static pose.
**DoD:** [ ] RED→GREEN · [ ] pass · [ ] Sacred Rule: SR-4 no-telemetry assertion + US-7 no-haptic assertion · [ ] /ultrareview · [ ] PR cites US-5/US-7/SR-4
**Sacred Rule refs:** SR-4 (AC-8.1), US-7 (AC-7.1).

### T-014 — i18n line localization (PT/ES/SV/FR) — DEFERRED
**Files:** `packages/i18n/translations/mascot/en.json` (create), `…/pt.json` (create), `…/es.json` (create), `…/sv.json` (create), `…/fr.json` (create) · **Depends on:** T-004 · **Parallelizable:** yes · **Est.:** 45m
**Description:** Migrate the EN source registry (T-004) into per-language i18n JSON under the
per-feature namespace, add PT/ES/SV/FR translations (culturally-sensitive, not literal), and wire EN
fallback (EC-9). **DEFERRED — `packages/i18n` does not exist yet (Phase 6 deliverable per
workspace.json `monorepo.packages.i18n.exists: false`).** Until then, lines ship EN-only from the
shared registry; that is functional and SR-3-clean. This task does not block /spec-review or the
core implementation tasks.
**DoD (DEFERRED until packages/i18n exists):** [ ] 5 JSON files · [ ] SR-3 hook passes on all i18n JSON · [ ] Dr. Dobson reviews steady + welcome_back across languages · [ ] EN fallback verified (EC-9) · [ ] /ultrareview
**Sacred Rule refs:** SR-3 (AC-3.4) across all languages.

## Parallelization plan

### First wave (no deps)
```bash
git worktree add ../psychage-master-app-T-001 feat/mascot-system   # T-001 types
# T-006 (tsconfig, sequential-only) can also run now but must NOT overlap other tsconfig edits.
cd ../psychage-master-app-T-001 && claude /spec-implement mascot T-001
```

### Second wave (after T-001 merges) — parallel
T-002 (states), T-004 (lines), T-009 (renderers) — disjoint files, run concurrently.

### Third wave
T-003 (needs T-002) → T-005 (barrel; needs T-001–T-004) ; T-008 (needs T-004) ; T-007 (needs T-003).

### Fourth wave (mobile)
T-010 (needs T-005, T-009) → T-011 (needs T-010) → {T-012 gallery, T-013 tests}.

### Sequential-only
T-006 (`tsconfig.json`) single-threaded, any time, never concurrent with another tsconfig writer.

### Deferred
T-014 (i18n) — after `packages/i18n` lands (Phase 6).

### Practical recommendation
Spin up **3** parallel worktrees for the second wave (T-002, T-004, T-009 — the highest-value
independent surfaces). Single-thread the barrel (T-005) and tsconfig (T-006). Mobile wave after the
shared package is green.

## File-creation summary
```
packages/shared/mascot/
  types.ts                          (T-001)
  states.ts                         (T-002)
  machine.ts                        (T-003)
  lines.ts                          (T-004)
  index.ts                          (T-005, modify)
  __tests__/machine.test.ts         (T-007)
  __tests__/lines.test.ts           (T-008)
packages/shared/
  tsconfig.json                     (T-006, modify, sequential-only)
apps/mobile/features/mascot/
  renderers/ClayFigure.tsx          (T-009)
  renderers/index.ts                (T-009)
  Mascot.tsx                        (T-010)
  index.ts                          (T-011, modify)
  __tests__/Mascot.test.tsx         (T-013)
apps/mobile/app/
  dev-mascot.tsx                    (T-012)
packages/i18n/translations/mascot/  (T-014, DEFERRED — Phase 6)
  en.json pt.json es.json sv.json fr.json
```

## Definition of Done — feature
- [ ] T-001–T-013 merged on `feat/mascot-system` → main (T-014 deferred to Phase 6).
- [ ] Vitest (shared) + RNTL (mobile) green across the module.
- [ ] All Sacred Rule hooks pass on every commit (SR-3 on lines.ts; SR-4 on Mascot.tsx).
- [ ] Missed-day no-punish test (T-008/AC-3.1) green.
- [ ] Pose set renders in `/dev-mascot`; reduce-motion disables idle animation, poses stay legible.
- [ ] /mobile-design-audit passes (one teal/scene; two-tier motion; no anti-slop).
- [ ] /ultrareview pass on the implementation PR(s).
- [ ] **Ship-gates (block ship, not merge of code tasks):** dot-eye exception + steady/welcome_back
      line sets signed off by Dr. Dobson + brand.
- [ ] No telemetry/persistence carries mood/event (T-013 + sr4 hook).

## Next step
1. Run `/spec-review mascot` to audit this spec before implementation.
2. After review passes, spin up worktrees per the plan and run `/spec-implement mascot <task-id>`.
