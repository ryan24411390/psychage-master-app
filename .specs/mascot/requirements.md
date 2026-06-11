# Requirements: Mascot — Clay Companion

**Spec ID:** mascot
**Status:** Requirements complete — ready for /spec-design
**Reads from:** brief.md
**Created:** 2026-06-07
**Brief read at:** 2026-06-07

## Resolution of brief open questions

| # | Brief open question | Resolution carried into these requirements |
|---|---|---|
| 1 | Crisis-adjacency behavior | Specified behaviorally (US-4): `steady` pose + grounding line, never cheerful, never suppresses/competes with the Crisis surface. **Clinical sign-off by Dr. Dobson is a DoD gate, not a blocker to writing requirements.** |
| 2 | Dot-eye exception sign-off | Design-phase gate + DoD item (Dr. Dobson + brand). Requirements assume dot-eyes as intended default; state machine specced face-agnostic-capable (US-1, EC-7). |
| 3 | Mood scale mapping | Locked: mascot consumes a **5-band `MoodBand` (1–5)**; the Daily Check-In session owns the 1–10 → 5-band mapping (US-6). |
| 4 | Line rotation / repetition policy | Locked: **≥3 lines per line-emitting state**, deterministic rotation, **no immediate repeat** of the previous line for the same state (US-3, AC-3.3). |
| 5 | Loop-event source of truth | This spec **defines** the canonical `MascotLoopEvent` set as the interface contract; the check-in session maps its lifecycle onto it (US-5, US-6). |

No new dependency surfaced → **Path A (complete)**.

## User stories

### Story US-1: Mood-reactive expression

**As** Aisha
**I want** the companion to visibly reflect how I said I'm doing
**So that** the check-in feels met, not transactional.

**EARS:** When a `MoodBand` (1–5) is provided, the system shall render the corresponding
mood-expression pose deterministically.

**Acceptance criteria:**
- AC-1.1: Given `mood ∈ {1,2,3,4,5}`, `resolve(mood, 'idle')` returns exactly one pose from the
  finite pose set; the mapping is total over all five bands.
- AC-1.2: Given `mood = null` (no check-in yet today), the system renders a defined neutral/resting
  pose (no crash, no empty render).
- AC-1.3: The same `(mood, event)` input always yields the same pose (pure, deterministic — no
  `Math.random`/`Date.now` in `resolve`).
- AC-1.4: The lowest band (1, "Awful") renders as calm/settled presence, **not** a clinical
  sad-face; expression conveys steadiness, not pity. (Verified by snapshot of pose params + Dobson
  review.)

### Story US-2: Event-driven poses and milestone moments

**As** Aisha
**I want** the companion to react to the rhythm of showing up
**So that** finishing a check-in and hitting a milestone feels acknowledged.

**EARS:** When a `MascotLoopEvent` is emitted, the system shall resolve the matching pose and,
where defined, an accompanying line.

**Acceptance criteria:**
- AC-2.1: `resolve(mood, 'check_in_saved')` returns the `celebrate` pose.
- AC-2.2: `resolve(mood, 'streak_milestone')` returns the `celebrate` pose and a milestone line.
- AC-2.3: `resolve(mood, 'returned_after_absence')` returns the `welcome_back` pose and a
  welcome-back line.
- AC-2.4: `resolve(mood, 'check_in_opened')` returns the `attentive` pose.
- AC-2.5: Every `MascotLoopEvent` member resolves to a defined pose (total mapping; no `undefined`).
- AC-2.6: The celebrate pose is **visually** coherent with the check-in's signature haptic moment;
  the mascot itself fires no haptic (US-7, EC-5).

### Story US-3: Scripted line registry (anti-nag, Finch model)

**As** Aisha
**I want** the companion's words to be warm and never make me feel judged
**So that** a bad day or a missed day is safe.

**EARS:** When a line-emitting state is resolved, the system shall return a line drawn from that
state's registry set, and shall never return a line that scores, shames, or guilts.

**Acceptance criteria:**
- AC-3.1: For `returned_after_absence`, **no** returned line, for any absence length, contains
  punishing content — asserted by a `no-punish` predicate (rejects streak-loss counts, "you
  missed," "don't break," guilt/obligation phrasing). This is the load-bearing missed-day test.
- AC-3.2: Every line-emitting state has **≥3** distinct lines per in-scope language.
- AC-3.3: Consecutive `resolve` calls for the same state do not return the same line twice in a row
  (deterministic rotation given a caller-supplied index/seed; no RNG inside `resolve`).
- AC-3.4: No line contains SR-3 forbidden diagnostic phrasing (verified by the SR-3 hook over the
  i18n JSON + a unit test over the source registry).
- AC-3.5: All lines are person-first (sensitivity filter passes; no condition-as-noun phrasing).
- AC-3.6: `idle`, `mood_selected` may be silent (line optional); `check_in_saved`,
  `streak_milestone`, `returned_after_absence`, `steady` always emit a line.

### Story US-4: Crisis-adjacent steadiness

**As** Aisha on a hard morning
**I want** the companion to stay calm and grounding, not cheerful
**So that** I feel held, and the real crisis help is never obscured.

**EARS:** While a crisis-adjacent signal is active, the system shall render the `steady` pose with a
grounding line and shall not render any celebratory pose or upbeat line.

**Acceptance criteria:**
- AC-4.1: `resolve(mood, 'crisis_adjacent')` returns the `steady` pose regardless of `mood` value
  (crisis-adjacency wins over mood band).
- AC-4.2: The `steady` line set contains zero cheerful/celebratory phrasing and zero imperatives
  ("you must," "you should"); tone is grounding and gentle (Dobson-reviewed).
- AC-4.3: The mascot never renders content that hides, delays, or visually competes with a Crisis
  surface owned elsewhere; the mascot does not gate, suppress, or alter crisis detection (SR-2
  boundary — N/A to enforce in mascot code, asserted by absence: no crisis-flag references).
- AC-4.4: `crisis_adjacent` never resolves to `celebrate`, `bright`, or `welcome_back`.

### Story US-5: Public mount interface

**As** the Daily Check-In session (consumer)
**I want** a single, documented component with stable props
**So that** I can mount the companion without owning its internals.

**EARS:** The system shall export one mountable component accepting exactly `{ mood, event }` and
shall expose the `MoodBand` and `MascotLoopEvent` types as the interface contract.

**Acceptance criteria:**
- AC-5.1: `@/features/mascot` exports a single component `Mascot` with props
  `{ mood: MoodBand | null; event: MascotLoopEvent }`.
- AC-5.2: `@psychage/shared/mascot` exports `MoodBand`, `MascotLoopEvent`, `MascotPose`,
  `MascotLine`, and the pure `resolve` function via its barrel (no deep imports).
- AC-5.3: The component renders for every `(mood, event)` combination without throwing.
- AC-5.4: Props are the **only** input; the component reads no global mood/streak state itself
  (consumer-driven), keeping SR-4 boundary clean (US-8).

### Story US-6: Coordinated mood + event contract with check-in

**As** the consumer
**I want** the event set and mood band to match what check-in can actually emit
**So that** the interface is real, not aspirational.

**EARS:** The system shall define `MascotLoopEvent` as a closed union the check-in lifecycle maps
onto, and shall accept the 5-band mood the check-in produces.

**Acceptance criteria:**
- AC-6.1: `MascotLoopEvent` is a closed string-literal union: `idle` · `check_in_opened` ·
  `mood_selected` · `check_in_saved` · `streak_milestone` · `returned_after_absence` ·
  `crisis_adjacent`.
- AC-6.2: `MoodBand = 1 | 2 | 3 | 4 | 5`, aligned to `tokens` `color.mood.1..5`.
- AC-6.3: The mascot does **not** implement the 1–10 → 5-band mapping; that is the check-in's
  responsibility (documented in design as a coordination boundary).

### Story US-7 & US-8 are folded into the Sacred Rules and Sensorial tables below.

## Sacred Rules → Acceptance criteria

| Sacred Rule | Acceptance criterion | How to verify |
|---|---|---|
| SR-1 (Navigator confidence cap) | N/A — the mascot computes no confidence and touches no Navigator scoring. | Absence check (no confidence symbols in mascot code) |
| SR-2 (Crisis detection cannot be bypassed) | AC-4.3: Mascot contains no flag/branch/env that disables, gates, or alters crisis detection; it neither owns nor suppresses the crisis surface. | sr2 hook + unit test asserting no crisis-bypass references |
| SR-3 (No diagnostic language) | AC-3.4: All mascot lines (source registry + all i18n JSON) use educational, person-first framing; zero forbidden diagnostic phrasing. New clinical-surface copy (steady/crisis-adjacent set) reviewed by Dr. Lena Dobson. | sr3_diagnostic_language.sh over i18n JSON + unit test over registry + Dobson review |
| SR-4 (Symptom data on device) | AC-8.1: The mascot never logs, persists, or transmits the `mood`/event props. No Sentry breadcrumb, analytics event, or network/Supabase write originates in mascot code carrying mood. Props are render-only. | sr4_no_symptom_telemetry.sh + unit/integration test asserting no telemetry call sites in mascot |

## Edge cases

- **EC-1 (no check-in yet today):** `mood = null` → defined neutral resting pose; idle line optional
  or silent. No crash.
- **EC-2 (unknown/out-of-range mood):** TypeScript prevents it at the type boundary; at runtime a
  defensive default clamps to the resting pose rather than throwing (AC-1.2).
- **EC-3 (rapid event changes):** Successive events within one render cycle resolve to the latest
  event's pose; pose transition is interruptible without visual glitch.
- **EC-4 (Reduce-Motion ON):** Idle "breathing" loop (non-essential) is fully disabled; pose stays
  static and legible. Pose *transitions* (essential) replace transform/scale with a 200ms
  cross-fade. (DESIGN.mobile.md §3.1 two-tier rule.)
- **EC-5 (Reduce-Haptics ON):** No effect on the mascot — it fires no haptics in V1 (US-7). The
  check-in owns its haptic and its own fallback.
- **EC-6 (Reduce-Audio ON):** No effect — the mascot ships no audio in V1.
- **EC-7 (dot-eye exception not yet signed off):** The pose state set is parameterized so the eye
  treatment is a render-layer concern; the state machine and line registry do not depend on the
  eyes existing. If sign-off lands "faceless," only the renderer changes, not the machine.
- **EC-8 (language switch mid-session):** The next resolved line is drawn from the newly-selected
  language's registry; in-flight pose is unaffected (pose is language-independent).
- **EC-9 (missing line set for a language):** Falls back to EN line set for that state rather than
  rendering empty; logged as a content gap (no mood data in the log — SR-4).

## Sensorial requirements (mobile)

| Interaction | Haptic | Audio | Motion | Reduce-Motion fallback | Reduce-Haptics fallback | Reduce-Audio fallback |
|---|---|---|---|---|---|---|
| Idle presence (breathing) | no | no | yes (non-essential loop) | **disabled**, static pose | n/a | n/a |
| Pose transition (mood/event change) | no | no | yes (essential) | 200ms cross-fade, no transform | n/a | n/a |
| Celebrate (check-in saved / milestone) | **no** (mascot); check-in owns the signature haptic | no | yes (essential, `calm` duration) | 200ms cross-fade to celebrate pose | n/a (mascot fires none) | n/a |
| Welcome-back | no | no | yes (essential) | static pose + line | n/a | n/a |
| Steady (crisis-adjacent) | no | no | minimal/none | static pose + line | n/a | n/a |

**US-7 (mascot fires no haptics in V1):** AC-7.1 — mascot code contains no `Haptics.*`/`expo-haptics`
call sites; the single check-in signature haptic is owned by the check-in screen, preserving
"one signature moment per surface."

## Out of scope (carry-forward)

- Conversational/behavioral reactivity, memory, free-text response (V1.5+); AI chat (V2 MindMate).
- The illustrator clay-figure library and its manifest — mascot is a distinct, code-rendered asset
  class for V1.
- Mood-input UI, streak/grace computation, the signature haptic firing (Daily Check-In owns these).
- Editing the check-in screen (this spec defines the interface; check-in mounts it).
- Push notifications, audio/sound design, mascot customization/unlockables.

## Constraints

- **Performance:** `resolve()` is O(1) pure synchronous; mascot render adds no perceptible jank to
  the check-in screen (no main-thread animation work; Reanimated worklets for any motion).
- **Accessibility:** Mascot conveys no information by motion alone — pose/line carries meaning when
  motion is disabled. Mascot has an `accessibilityLabel` describing its state in words (e.g.,
  "Companion, resting") and is not a focus trap; decorative-but-labeled.
- **Localization:** Lines ship in all 5 languages — EN, PT, ES, SV, FR — with EN fallback (EC-9).
- **App Store:** Guideline 1.4.1 (no medical claims) — mascot copy must not imply diagnosis/
  treatment; 5.1.1 (data) — mascot collects/transmits nothing.
- **Privacy:** Mascot handles the mood band as a transient render input classified sensitive; it is
  never persisted/transmitted by mascot code (SR-4).
- **Regulatory:** rules/regulatory.md (FTC + state + GDPR, not HIPAA) — mascot copy falls under
  marketing/consumer-health claim rules; no therapeutic claims. No PHI persistence in mascot →
  Phase-5 regulatory architecture gate does not block this spec.

## Definition of Done (feature-level)

- [ ] All user stories (US-1…US-8) have passing tests.
- [ ] SR-3 AC passes (hook + registry unit test) **and** Dr. Lena Dobson has reviewed the
      steady/crisis-adjacent + welcome-back line sets.
- [ ] SR-4 AC passes (hook + no-telemetry test).
- [ ] The missed-day `no-punish` predicate test (AC-3.1) passes over every `returned_after_absence`
      line in every language.
- [ ] Pose/expression set renders in a dev gallery; Reduce-Motion disables idle animation while
      poses stay legible.
- [ ] Lines localized in EN/PT/ES/SV/FR with EN fallback.
- [ ] **Dot-eye exception** signed off by Dr. Dobson + brand before ship (blocks ship, not spec).
- [ ] Sentry beforeSend excludes mood/event (no mascot-originated events anyway).
- [ ] /mobile-design-audit passes (one teal element per scene; two-tier motion; no anti-slop).
- [ ] /ultrareview pass on the implementation PR.

## Open questions for design phase

- Exact pose-parameter schema (dot-eye position/shape + body posture) and the `pose → renderer`
  registry shape (the illustrator swap-later seam).
- Which token leaves drive each pose's single teal accent and mood color.
- The rotation mechanism: caller-supplied index vs. a deterministic seed derived from a non-mood
  value (must stay RNG-free and SR-4-clean).
- Line content-budget per state per language (≥3 floor set; ceiling TBD with content/clinical).
- The exact `accessibilityLabel` strings per pose (localized).

## Next step

Run `/spec-design mascot` to translate these requirements into a concrete UI/data design with
token-bound specifications.
