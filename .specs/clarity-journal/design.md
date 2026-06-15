# Design: Clarity Journal (mobile)

**Spec ID:** clarity-journal
**Status:** Design complete — ready for /spec-tasks
**Reads from:** brief.md, requirements.md
**Created:** 2026-06-16

**Reference subagent summary (condensed):**
Reuse mobile primitives `Button`, `Card`, `Text`, `Badge`, `Skeleton`, `AnimatedPressable`, `SearchableList`, and the `CheckInSheet`/`AddMomentSheet` sheet pattern (`apps/mobile/components/ui/`, `apps/mobile/components/`). Tokens (IDs only): motion `motion.duration.{swift,base,calm}` + `motion.easing.{out,in,standard}`; haptics `haptic.{tap,affirm,confirm,celebrate,alert}` (no `breath_*`, no `haptic.error`); color `color.text.{primary,secondary,tertiary}`, `color.surface.{default,accent}`, `color.border.{default,accent}`, `color.primary.default`, `color.semantic.{error,success,warning}`, `color.crisis.{red,redDark}` (crisis surface only); `radius.{lg,xl,full}`; 8pt spacing. Mirror the shared domain-layer pattern of `packages/shared/{sleep,check-in,mood-journal}` (index barrel, types, DI-seam `record-store`, `dates`, `migrate` with `SCHEMA_VERSION`+quarantine, pure `scoring`/`insights`, `__tests__`). Crisis pre-check: `precheckCrisis` from `@psychage/shared/safety`; crisis surface + dialer reuse `apps/mobile/features/crisis/`. PDF: extend `apps/mobile/features/therapist/pdf/build-html.ts` (on-device HTML → expo-print). Web scoring to port byte-for-byte: PHQ-2/GAD-2 `clamp(q1+q2,0..6)` (low≤2/mod≤4/else elevated); PSS-4 `clamp(q1+(4-q2),0..8)` (low≤3/mod≤5); WHO-5 `clamp(Σq,0..10)` inverted (good≥7/mod≥4). Gaps → open design decisions: empty-state clay figures (library ETA 2026-07-08 → placeholders), exact balanced-thought reveal curve, report HTML schema. No new audio/haptic tokens. V1 audio empty.

## UI flow

```
[Compass tab] ──► [Clarity Journal hub (S-1)]
   │  lists 7 sections + Insights + Report; marks today's incomplete sections
   ├──► [Daily check-in (S-2)] ──save──► hub
   ├──► [Weekly screening (S-3)] ──submit──► level + trend ──► hub
   ├──► [Thought record (S-4)] ──balanced-thought reveal (signature)──► hub
   ├──► [Behavioral activation (S-5)] ──(draft until rated)──► hub
   ├──► [Trigger log (S-6)] ──► hub
   ├──► [Wellness toolbox + Safety plan (S-7)] ──► hub
   ├──► [Weekly reflection (S-8)] ──► hub
   ├──► [Insights (S-9)] (read-only)
   └──► [Report (S-10)] ──user-initiated share──► OS share sheet (PDF)

   [ANY free-text field] ──precheckCrisis match──► [Crisis surface] (priority; in-progress text never transmitted)
```

## Screens

### S-1: Clarity Journal hub
**Archetype:** tab-root (under Compass) → list. **Mirrors:** `SleepArchitectView` shell + section list.
**Purpose:** one calm entry point listing the 7 sections + Insights + Report, surfacing today's unfinished sections.
**Layout:** AVOID zone = title + short tagline; NATURAL = section rows (icon, label, "done today" check); EASY = primary "Today's check-in" CTA + Report at the bottom.
**Components:** `Card` rows, `Text`, `Badge` (done-today), `Button` (primary CTA), `CrisisPill` in header (SR-2 always-on).
**Touch targets:** rows 56h; CTA 56×full; all ≥44pt ✓.
**Haptic:** row tap `haptic.tap`; CTA `haptic.affirm`. **Motion:** row press `motion.duration.swift`/`easing.out`; page enter `base`. **Audio:** none.
**Empty/loading/error:** first-run shows a calm "start with today" state (placeholder clay figure); rows render instantly from MMKV (no skeleton needed); no network → no error path.
**A11y:** each row VoiceOver "‹section›, ‹done today | not yet›"; Dynamic Type scales; AA contrast via `color.text.primary`.
**Maps to ACs:** US-13/AC-13.1.

### Section-form archetype (S-2, S-5, S-6, S-8 share this)
**Archetype:** form (full-screen or sheet). **Mirrors:** `AddMomentSheet` / `SleepLogForm`.
**Pattern:** scrollable field stack; sticky bottom Save (`Button`, `haptic.confirm` on submit, `haptic.affirm` on field-add); inline validation in `color.semantic.error`; cancel keeps a draft where the section allows (EC-3). Every free-text field calls `precheckCrisis` on blur/submit (US-11). Save writes to the journal `record-store` (MMKV) keyed to `LocalCalendarDate`. **Motion:** field reveal `swift`; save→hub `base`. **Reduce-Motion:** static state changes. **Reduce-Haptics:** silent.
**Per-section deltas:**

| Screen | Fields | Notes / ACs |
|---|---|---|
| S-2 Daily check-in | mood 1–10, energy 1–10, slept (bool)+hours, one-sentence note, tags | one-per-day edit-in-place; distinct store from S4 check-in (AC-1.2/1.3) |
| S-5 Behavioral activation | activity, predicted-mood 0–10, type {mastery/pleasure/both}, actual-mood 0–10 (later) | unrated = valid draft (AC-4.2) |
| S-6 Trigger log | trigger, severity 1–5, category, subCategory, what-helps/worsens, effectiveness 1–5 | free-text scanned (AC-5.2) |
| S-8 Weekly reflection | went-well, was-difficult, patterns, do-next, gratitude (5 free-text) | all scanned; distinct from S9 terrain (AC-7.1) |

### S-3: Weekly screening
**Archetype:** form (stepped). **Mirrors:** Clarity Score flow question cards (no number reveal).
**Purpose:** PHQ-2/GAD-2/adapted PSS-4/adapted WHO-5; show a plain-language level + trend.
**Logic:** scores computed in `@psychage/shared/clarity-journal` with the web formulas/thresholds (AC-2.1/2.2). Cannot score until all items answered (EC-9). Result renders as educational level words, never instrument names or diagnosis (AC-2.3, SR-3). Sustained elevation → invitational support nudge (AC-2.4, copy→Dobson).
**Haptic:** option select `haptic.tap`; submit `haptic.confirm`. **Motion:** card advance `swift`. **A11y:** options are radio-role; level announced as words.
**Maps to ACs:** US-2/AC-2.1–2.5.

### S-4: Thought record (signature screen)
**Archetype:** form (stepped: situation → automatic thought → distortions → evidence for/against → balanced thought → re-rate).
**Purpose:** capture + reframe. **Signature moment:** the **balanced-thought reveal** — when the person writes the balanced thought and advances, the before→after emotion shift animates in with a calm transition (`motion.duration.calm`, `easing.standard`; Reanimated UI-thread; opacity+subtle translate). **Reduce-Motion fallback:** essential cross-fade only. One signature moment for this screen; none elsewhere.
**Haptic:** step advance `haptic.tap`; completion `haptic.confirm` (the reveal). **Audio:** none.
**Crisis:** situation / automatic-thought / evidence / balanced-thought all scanned (US-11).
**A11y:** distortions are multi-select chips with labels; emotion sliders expose value text; reveal respects Reduce Motion.
**Maps to ACs:** US-3/AC-3.1–3.3.

### S-7: Wellness toolbox + Safety plan
**Archetype:** list + form. **Mirrors:** `SettingsSection`/`SettingsRow` grouped list.
**Purpose:** 4 wellness categories (coping-strategy lists) + 6-section Stanley-Brown safety plan; crisis-contact section pre-seeds 988 + region helpline (AC-6.3) via `features/crisis/region.ts`.
**Crisis affordance:** call/text actions use `features/crisis/dialer.ts`. Crisis-contact rows are NOT a no-haptic concern (informational); the crisis *surface* (if triggered by free text) uses no haptic (alert zone).
**Gate:** all copy here = Dr. Dobson + App-Store 1.4.1/5.1.1 review before ship (AC-6.2). Ships as fixture copy meanwhile.
**Maps to ACs:** US-6/AC-6.1–6.3.

### S-9: Insights (read-only)
**Archetype:** detail/dashboard. **Mirrors:** `SleepDashboard` / mood `InsightsView` (bands + bars, react-native-svg trend per charts convention).
**Content:** mood trend, screener trajectories, top distortions, behavioral-activation success rate, coping effectiveness, recurring triggers, streak — all computed on-device (AC-9.1). No numeric verdict label of the person; movement/levels with educational framing (AC-9.2, SR-3). Empty state until enough entries (placeholder figure).
**Maps to ACs:** US-9.

### S-10: Report
**Archetype:** detail → OS share. **Reuses:** `features/therapist/pdf/build-html.ts` + `expo-printer.ts`.
**Flow:** "Create report" assembles `ReportData` on-device (ported web `reportEngine.ts` outputs) → HTML → PDF; sharing is an explicit OS share-sheet action only (AC-10.2/10.3, SR-4). No network upload.
**Maps to ACs:** US-10/AC-10.1–10.3.

## Data model

All entities **MMKV-only** (SR-4). New shared package `packages/shared/clarity-journal/` owns types + store + scoring; the mobile app owns screens.

| Entity | Storage | Schema (ported from web) | Notes |
|---|---|---|---|
| DailyJournalCheckIn | MMKV | `{ date, mood 1–10, energy 1–10, sleptLastNight, sleepHours?, note, tags[] }` | one per `LocalCalendarDate`; separate from S4 check-in store |
| WeeklyScreening | MMKV | `{ weekStart, phq2{q1,q2}, gad2{q1,q2}, pss4{q1,q2}, who5{q1..q5}, levels{} }` | scores computed, not double-stored from items |
| ThoughtRecord | MMKV | `{ id, createdAt, situation, automaticThought, distortions[], evidenceFor, evidenceAgainst, balancedThought, emotionBefore 0–10, emotionAfter 0–10 }` | |
| BehavioralActivation | MMKV | `{ id, createdAt, activity, predictedMood 0–10, type, actualMood? 0–10 }` | draft until `actualMood` |
| TriggerLog | MMKV | `{ id, createdAt, trigger, severity 1–5, category, subCategory?, whatHelps?, whatWorsens?, effectiveness? 1–5 }` | |
| WellnessToolbox | MMKV | `{ categories: {physical,social,mental,professional}: string[] }` | |
| SafetyPlan | MMKV | `{ sections: [6 Stanley-Brown], crisisContacts:[{label,phone}] }` | seeded 988 + region |
| WeeklyReflection | MMKV | `{ weekStart, wentWell, wasDifficult, patterns, doNext, gratitude }` | |
| SafetyFlag (internal) | MMKV | `{ date, source:'keyword' }` | on-device only; never transmitted |

Store: `ClarityJournalStore` (MMKV, injected `Storage`/`Clock`/`IdFactory` seams like `check-in`), versioned `SCHEMA_VERSION` migrator with quarantine-on-corrupt (AC-12.1, SR-13). `dates.ts` reuses the branded `LocalCalendarDate` pattern.

## API contracts

None. Zero network surface. No Supabase query, RPC, or edge function. (Forced by SR-4; intentional divergence from web's Supabase journal sync.)

## State management

- **Global:** none required (no Zustand/Query — no server state). Store is a prop-injected singleton (DI seam), mirroring sleep/check-in.
- **Local:** per-screen React state for form drafts; reducer for stepped flows (S-3, S-4).
- **Server:** none.

## Error handling

| Error | User message | Recovery |
|---|---|---|
| Corrupt persisted blob | (silent) quarantine + continue | journal shell always loads (EC-2) |
| Storage write fails | "Couldn't save that just now — try again." (warm, no haptic) | retry; form stays open |
| Incomplete screener | inline "answer all to see your result" | finish items (EC-9) |
| Crisis text detected | crisis surface (not an "error") | helpline/dialer; in-progress text not transmitted (EC-4) |

## Sensorial design (mobile)

### Haptic vocabulary
| Token | Purpose | Used at |
|---|---|---|
| `haptic.tap` | select / navigate | hub rows, screener options, step advance |
| `haptic.affirm` | add / primary CTA | field-add, "Today's check-in" CTA |
| `haptic.confirm` | submit / complete | section save, screener submit, thought-record reveal |
| `haptic.celebrate` | milestone (optional) | streak milestone in Insights |

No `haptic.alert`/`error` in normal flow; crisis surface = **no haptic** (alert no-haptic zone). All respect Reduce Haptics (silent).

### Audio vocabulary
None — V1 audio empty per DESIGN.mobile.md §3.

### Motion vocabulary
| Token | Library | Duration | Used at | Reduce-Motion fallback |
|---|---|---|---|---|
| `motion.duration.swift` + `easing.out` | Reanimated | 150ms | row/step transitions | static |
| `motion.duration.base` + `easing.standard` | Reanimated | 300ms | screen enter, save→hub | static fade |
| `motion.duration.calm` + `easing.standard` | Reanimated | 600ms | thought-record balanced-thought reveal | essential cross-fade |

### Signature moments inventory
One total for the feature: **S-4 balanced-thought reveal** (`motion.duration.calm`, Reanimated UI-thread, opacity+translate of the before→after emotion shift). Earns the ceiling because the reframe landing is the core therapeutic payoff. All other screens: no signature moment.

## Sacred Rules compliance map

| Rule | Compliance |
|---|---|
| SR-1 (Navigator cap) | N/A — no Navigator surface. |
| SR-2 (crisis bypass) | Every free-text field runs `precheckCrisis`; detection has no flag/branch/env to disable; crisis surface always reachable (hub `CrisisPill`). |
| SR-3 (diagnostic language) | Screener results = educational level words; no instrument-name verdicts; all section/insight/safety-plan copy reviewed against the 30-term filter + Dr. Dobson. Hook sr3 enforces seeds at write-time. |
| SR-4 (symptom data on device) | All entities MMKV-only; zero Supabase/analytics/Sentry writes; report PDF assembled on-device, shared only via explicit OS share. Telemetry MUST-NOT-FIRE list below. |

## Telemetry / analytics

| Event | Payload | Scrubbed |
|---|---|---|
| `journal_section_opened` | `{ section: '<name>' }` | section name only — no content |
| `journal_entry_saved` | `{ section: '<name>' }` | no field values |

**MUST NOT FIRE:** any event containing journal field content, mood/energy/screener values, thought-record text, trigger text, safety-plan content, report content, or a crisis match. Enforced by sr4 hook + Sentry `beforeSend`.

## Anti-slop check

| Pattern | Present? | Justification |
|---|---|---|
| Purple/cyan mesh gradient | No | n/a |
| Glassmorphism w/o purpose | No | n/a |
| Three-rounded-cards-in-a-row | No | section list is vertical rows |
| Inter as default | Yes | brand override (DESIGN.mobile.md) |
| Hardcoded shadow values | No | `shadow.*` tokens |
| Decorative spark-lines | No | trend lines are real data (react-native-svg) |
| Generic 4-tab nav | No | journal lives under custom Compass tab |
| Card-list-everywhere | No | mix of list (hub/toolbox), stepped forms (screener/thought record), dashboard (insights) |
| Sad-emoji empty states | No | clay-figure placeholder + calm copy |
| JS-thread animations | No | Reanimated UI-thread; svg for charts |
| Missing haptics on primary CTAs | No | every CTA mapped |
| Missing Reduce-* fallbacks | No | all sensorial events have fallbacks |

## Token discipline

All visual values reference tokens (`color.*`, `radius.*`, `motion.*`, `haptic.*`, 8pt spacing) — no raw hex/px/ms in implementation. Enforced at /spec-tasks via grep.

## Open design decisions

- **Exact balanced-thought reveal curve** (S-4) — opacity-only vs opacity+translate vs scale; pick at implement, within `motion.duration.calm`/`easing.standard`. Non-blocking.
- **Empty-state clay figures** — library undelivered (ETA 2026-07-08); ship placeholders, swap when delivered.
- **Report HTML schema** — extend `build-html.ts` sections; exact layout an implement-time detail.
- **Hub placement of S-2 vs the existing Today S4 check-in** — labeling to avoid confusion ("journal entry" vs "check-in"); confirm with a quick design pass, non-blocking.

## Next step

Run `/spec-tasks clarity-journal` to decompose into atomic, parallelizable tasks (expect the S1–S5 slice plan from requirements).
