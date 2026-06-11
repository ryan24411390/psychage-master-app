# Brief: Mascot — Clay Companion

**Spec ID:** mascot
**Created:** 2026-06-07
**Status:** Discovery complete — ready for /spec-requirements

## Problem

The Daily Check-In is the daily spine of the app, but a bare mood slider + streak counter is
transactional — it asks something of the user and gives a number back. People building a daily
ritual stay because something *meets* them there. Aisha opens the app on a frayed morning and
needs to feel a calm, non-judging presence acknowledge her, not a scoreboard. Today there is
nothing on the check-in surface that holds warmth or continuity between sessions; the screen is a
form. The mascot is the felt presence that turns a form into a ritual — an expressive clay
companion that reacts to how the day is going and to the rhythm of showing up, without ever
nagging, scoring, or pretending to be a therapist.

This spec is the **mascot system**: a finite set of mood-reactive poses/expressions plus a
scripted-line registry. It is explicitly **not** the V2 conversational AI (MindMate).

## Users

- **Aisha** (26, anxious early-career professional, mobile-native) — primary. Wants the daily
  ritual to feel warm and safe, never evaluative. Sensitive to anything that reads as judgment or
  pressure on a bad day.
- **Sofia** (21, international student, Portuguese-speaker) — secondary. Companion warmth must
  survive translation across all 5 languages; lines are culturally-sensitive, not just translated.

## Why now

The Daily Check-In spec (`.specs/daily-check-in/`) is in discovery and reserved a mount slot on the
Today tab. Session 1 stubbed a feature-module surface (`apps/mobile/features/mascot/index.ts`,
`packages/shared/mascot/index.ts`) for parallel work. Speccing the mascot now lets the check-in
session mount a defined interface rather than inventing one later, and lets the companion's
emotional contract be reviewed (clinical + brand) before any pixels ship.

## Scope

**In:**
- A finite **pose/expression state set** (~8–10 states): mood-band expressions (dot-eyes + body
  posture, mapped to the 5-step mood palette) plus event poses (attentive, celebrate, welcome-back,
  steady/crisis-adjacent).
- A pure-TS **state machine**: `resolve(mood, event) → { pose, line? }`. Deterministic, finite,
  no generation.
- A **scripted-line registry** (anti-nag, Finch model): warm welcome-back on a missed day, never
  streak-shaming or guilt; person-first; educational framing; rotation to avoid repetition;
  localizable across 5 languages.
- **Milestone moments**: first check-in, streak milestones, return-after-absence — pose + line,
  visually coherent with the check-in's signature haptic moment (which the check-in screen owns).
- The **public interface** the check-in screen (#17) mounts: one component, props =
  `{ mood, event }`. Coordinates to Session 1's reserved slot.
- **Sensorial fallbacks**: reduce-motion (idle animation disabled, pose still legible), no haptics
  fired by the mascot in V1, no audio in V1.
- A **dev gallery** rendering the full pose/expression set (DoD surface).
- **V1 rendering** as hand-authored vector/Skia primitives behind a `pose → renderer` registry
  (swap-later seam for illustrator art).

**Out:**
- Conversational / behavioral reactivity, memory of prior conversations, free-text response — all
  **V1.5+** (and AI chat is V2 MindMate, a separate product). The baked-in scope (scripted lines +
  simple mood-reactive poses) is confirmed by this discovery; it aligns with the restraint and
  finite-set design locks.
- The illustrator clay-figure library (faceless humanity figures, ETA 2026-07-08) — the mascot is a
  **distinct asset class** and does not depend on, or write to, `assets/clay-figures/manifest.json`.
- Owning the check-in mood input, the streak/grace computation, or the signature haptic — those
  belong to the Daily Check-In spec. The mascot *consumes* mood + loop events; it does not compute
  them.
- Editing the check-in screen itself. This spec **defines** the interface; the check-in session
  mounts it.
- Push notifications, sound design, mascot customization/unlockables.

## Success metric

**Day-14 check-in retention lift attributable to companion presence** — measured as the difference
in % of users completing check-ins on ≥7 of their first 14 days between companion-on and a held-out
companion-minimal cohort (target: +5 percentage points). Proxy/leading metric until that test runs:
**return-after-absence re-engagement rate** — % of users who, after a ≥2-day gap, complete a
check-in within 48h of next opening the app (the moment the anti-nag welcome-back line is doing its
job).

## Sacred Rules in play

- **SR-3 — No diagnostic language.** Every mascot line is user-facing copy. No "you have," "you
  are [condition]," "you're depressed/anxious," "diagnosis." Educational, person-first framing only.
  Lines live in i18n JSON across 5 languages; the SR-3 hook scans `**/i18n/**`, `**/locales/**`,
  `**/translations/**`. Crisis-adjacent state copy is grounding/calm, never clinical.
- **Person-first language** (CLAUDE.md SR-5 / 30-term sensitivity filter). "A person having a hard
  day," not "a depressed person." Applies to every line in every language.
- **SR-4 — Symptom/mood data on device.** The mascot reads the mood band as a prop at render time;
  it must **not** log, persist, or transmit mood. No Sentry breadcrumb, no analytics event, no
  Supabase write carrying the mood value from the mascot. Pure render input, MMKV-owned upstream.
- **Not** in play: SR-1 (no Navigator confidence), SR-2 (mascot does not gate crisis detection —
  but see the crisis-adjacency open question; the mascot must never *suppress* or trivialize a
  crisis surface owned elsewhere).

## Mobile IA assumption

Not applicable — mobile IA is decided (`workspace.json` →
`design.platforms.mobile.informationArchitecture: bottom-tabs-4-custom-plus-avatar-header`). The
mascot mounts inside the Daily Check-In surface on the **Today** tab; it is not itself a tab or a
nav destination.

## Sensorial commitment (mobile)

- **Motion** — Idle "breathing" presence loop is **non-essential** → fully disabled under OS
  reduce-motion (pose remains static and legible). Pose transitions are **essential** → 200ms
  cross-fade (not transform/scale) under reduce-motion, per DESIGN.mobile.md §3.1 two-tier rule.
  `useReducedMotion()` branched at component level. Durations from `motion.duration` tokens
  (`calm` 600ms for celebrate, `breath` 4000ms for idle breathing).
- **Haptic** — The mascot fires **no haptics** in V1. The Daily Check-In submit is one of the three
  reserved V1 signature haptic moments and is **owned by the check-in screen**; the mascot supplies
  the coherent *visual* celebration only. This respects "one signature moment per surface" and
  avoids double-firing. (Cross-modal all-or-nothing rule, DESIGN.mobile.md §3.4.)
- **Audio** — None. V1 ships no UI audio; the mascot is silent.
- **Signature moment** — The mascot's signature is **visual**: the celebrate pose + single teal
  accent landing in sync with the check-in's haptic.complete on a saved check-in / streak
  milestone. One teal element per scene (design lock), reserved for these moments.

### Design exception flagged at discovery (carry into requirements + design)

**Dot-eyes vs faceless.** The task's sensorial lock specifies "two charcoal dot-eyes only," but
DESIGN.mobile.md §4.2 and constitution.md `brand_non_negotiables` mandate **faceless** clay
figures. Resolution carried into this spec: the generic clay-figure *library* (faceless
humanity-carriers in empty states) stays faceless; the **mascot character** is granted two charcoal
dots only — no mouth, brows, or demographic features, still genderless/raceless/matte-clay — as a
**deliberate, scoped exception**. This exception is **gated on Dr. Lena Dobson + brand sign-off** as
a required reviewer before ship. Recorded here so requirements/design cannot silently assume it is
settled.

### Process note

`learnings.md` (2026-05-09) locks Procedure A to the four V1 native features (Daily Check-In,
Symptom Navigator, My Therapist, Crisis). The mascot is **not** one of the four — it is functionally
a **sub-system of Daily Check-In**. This spec is run through full Procedure A by explicit user
direction; flagged here so the scope decision is auditable rather than silent.

## Open questions

1. **Crisis-adjacency behavior** — When the lowest mood band is selected (or a crisis-adjacent
   signal arrives), what exactly does the `steady` pose + line do? It must be calm/grounding, never
   cheerful, and must never suppress or compete with the crisis surface owned by the Crisis spec.
   *Needs Dr. Dobson clinical review.* (Requirements phase.)
2. **Dot-eye exception sign-off** — The faceless exception above needs Dr. Dobson + brand approval.
   Until then, design proceeds face-agnostic-capable but specs the dot-eye treatment as the intended
   default. *Resolver: Dr. Dobson + brand.* (Design phase gate.)
3. **Mood scale mapping** — Daily Check-In's brief says mood 1–10; the mood color tokens are a
   5-step band (`color.mood.1..5`). The mascot consumes the **5-band** value. Confirm the check-in
   session owns the 1–10 → 5-band mapping (mascot does not). (Requirements phase — coordinate with
   `.specs/daily-check-in/`.)
4. **Line rotation + repetition policy** — How many lines per state to feel non-robotic without a
   content explosion across 5 languages? Needs a content-budget decision. (Requirements/design.)
5. **Loop-event source of truth** — The exact `MascotLoopEvent` set must match what the check-in
   screen can actually emit. Coordinate the enum with the check-in session so the interface is real,
   not aspirational. (Requirements phase.)

## Next step

Run `/spec-requirements mascot` to expand this brief into user stories and acceptance criteria.
