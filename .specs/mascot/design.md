# Design: Mascot — Clay Companion

**Spec ID:** mascot
**Status:** Design complete — ready for /spec-tasks
**Reads from:** brief.md, requirements.md
**Created:** 2026-06-07

**Reference summary (assembled from DESIGN.mobile.md §3–4 + tokens/mobile.tokens.json, verbatim
token IDs):** No existing component applies — the mascot is a new surface. Reuse: motion via
`apps/mobile/lib/motion.ts` (`useReducedMotion()`, `DURATION`, `easingFn()`), `ScreenShell` for the
gallery screen, `Text` primitive for lines. Tokens that apply: matte clay body uses `color.charcoal.*`
(charcoal.800/900 for dot-eyes); mood tint uses `color.mood.1..5` (1=#8B7FA8 … 5=#15B8A6); the single
teal accent uses `color.teal.600` (#1A9B8C). Motion: `motion.duration.breath` 4000ms + `motion.easing.breath`
(symmetric ease) for idle breathing; `motion.duration.base` 300ms + `motion.easing.standard` for pose
transitions; `motion.duration.calm` 600ms for celebrate. Reduce-motion: two-tier — non-essential breath
**disabled**, essential pose change → 200ms cross-fade (`motion._reducedMotion`). Type: `type.family.sans`
(Satoshi) for line text. No haptic/audio tokens consumed by the mascot (the Daily Check-In submit owns
the one signature haptic). Gap: no new tokens needed — the mascot composes existing leaves. The
illustrator clay-figure library is NOT a dependency (mascot is code-rendered for V1).

## UI flow

The mascot is a **mounted component**, not a route. It is driven entirely by props from its consumer.

```
[Daily Check-In screen (#17, owned by check-in session)]
   │ mounts <Mascot mood={band|null} event={loopEvent} />
   ▼
[Mascot component]
   │ resolve(mood, event) → { pose, line? }       (pure, @psychage/shared/mascot)
   ├──► renderer registry: pose → primitive renderer  (swap-later seam)
   └──► optional line (i18n key → localized string)

Event timeline the consumer drives:
 app open, no check-in today   → event=idle,                 mood=null   → resting (silent)
 check-in opened               → event=check_in_opened,      mood=null   → attentive
 mood chosen                   → event=mood_selected,        mood=1..5   → gentle…bright (silent)
 saved                         → event=check_in_saved,       mood=1..5   → celebrate + line   ◀ signature (visual)
 streak milestone              → event=streak_milestone,     mood=1..5   → celebrate + milestone line
 returns after ≥2-day gap      → event=returned_after_absence,mood=null  → welcome_back + warm line   ◀ anti-nag
 crisis-adjacent signal        → event=crisis_adjacent,      mood=any    → steady + grounding line  (wins over mood)

[Dev gallery screen]  renders every pose × line-state for DoD verification.
```

## Screens

### S-1: `<Mascot>` component (the mounted surface)

**Archetype:** embedded component (not a route).

**Mirrors:** No direct analog — the clay companion is a new Psychage pattern. The *interaction
model* (non-punitive, presence-over-pressure) mirrors **Finch**; the clay aesthetic is Psychage-
original per DESIGN.mobile.md §4. Justification: a daily-ritual companion needs warmth without
gamified pressure; Finch's anti-nag model is the proven reference.

**Purpose:** Render the companion's current pose + optional line from `{ mood, event }`.

**Public interface (the contract check-in mounts):**
```ts
// @/features/mascot
type MascotProps = { mood: MoodBand | null; event: MascotLoopEvent };
export function Mascot(props: MascotProps): JSX.Element;
```
The component reads **no** global state; props are the only input (AC-5.4, SR-4 boundary).

**Pose/expression state set (finite, 9):**

| Pose id | Driven by | Dot-eyes (exception layer) | Body posture | Mood tint | Teal accent | Line |
|---|---|---|---|---|---|---|
| `resting` | `idle`, `mood=3`, `mood=null` | neutral, centered | upright-settled | `color.mood.3` / charcoal | no | optional |
| `gentle` | `mood=1` | soft, lowered (not sad-face) | grounded, slight settle | `color.mood.1` | no | optional |
| `tender` | `mood=2` | soft | gently settled | `color.mood.2` | no | optional |
| `warm` | `mood=4` | open | upright, light lean-in | `color.mood.4` | no | optional |
| `bright` | `mood=5` | open, raised | upright, open | `color.mood.5` | **yes** (1) | optional |
| `attentive` | `check_in_opened` | open, centered | lean-in toward user | charcoal neutral | no | optional |
| `celebrate` | `check_in_saved`, `streak_milestone` | open, raised | upright, buoyant | last mood band | **yes** (1) | **always** |
| `welcome_back` | `returned_after_absence` | open, soft | open, gentle lean-in | charcoal neutral | no | **always** |
| `steady` | `crisis_adjacent` | calm, level | grounded, still | charcoal neutral (no celebration color) | no | **always** |

**Pose parameter schema (face-agnostic-capable — EC-7):**
```ts
interface PoseSpec {
  id: MascotPose;
  eyes: { openness: number; offsetY: number };  // dot-eye render params; ignored if eyes disabled
  body: { lean: number; settle: number; scale: number };
  moodBand: MoodBand | null;   // matte tint source (color.mood.*) or null → charcoal
  tealAccent: boolean;          // exactly one teal element when true (one-teal-per-scene lock)
}
```
The state machine emits `PoseSpec`; the **renderer** consumes it. If the dot-eye exception is
rejected at sign-off, only the renderer drops `eyes`; the machine and lines are unchanged.

**Renderer registry (swap-later seam):**
```ts
type PoseRenderer = (spec: PoseSpec, reduced: boolean) => JSX.Element;
const POSE_RENDERERS: Record<MascotPose, PoseRenderer>;  // V1: hand-authored react-native-svg/Skia
```
Illustrator art swaps in later by replacing renderers; the `resolve` machine never changes.

**Touch targets:** None — the mascot is non-interactive in V1 (decorative-but-labeled). No tap
handler, no CTA. (If it ever becomes tappable, a 44pt target + haptic gets added in a later spec.)

**Haptic events:** None (US-7). The mascot fires zero haptics; the check-in submit owns the single
signature haptic (`haptic.complete`). The mascot supplies the coherent visual only.

**Audio events:** None (V1 ships no UI audio).

**Animation events:**
| Interaction | Token | Library | Duration | Reduce-Motion fallback |
|---|---|---|---|---|
| Idle "breathing" presence | `motion.duration.breath` + `motion.easing.breath` | Reanimated v4 (UI thread) | 4000ms loop | **disabled** — static pose (non-essential) |
| Pose transition (mood/event change) | `motion.duration.base` + `motion.easing.standard` | Reanimated v4 | 300ms | 200ms **cross-fade** (essential), no transform/scale |
| Celebrate entrance | `motion.duration.calm` + `motion.easing.out` | Reanimated v4 | 600ms | 200ms cross-fade to celebrate pose |

**Signature moment:** The **celebrate** pose entrance, landing in visual sync with the check-in's
`haptic.complete` on save/milestone. One per surface — it earns the ceiling because it is the
emotional payoff of the daily ritual. Idle breathing is *ambient*, not a signature moment.

**Accessibility table:**
| Element | VoiceOver label | Dynamic Type | Reduce-Motion |
|---|---|---|---|
| Mascot | localized "Companion, <pose-state>" (e.g. "Companion, resting") | n/a (figure) | idle motion off; pose still legible (AC-1.4, EC-4) |
| Line text | the line itself (read in order after the companion label) | scales 100–200% (Satoshi) | static |

Information is never motion-only — pose + line carry meaning when animation is disabled (constraint:
Accessibility).

**Empty/neutral state:** `mood=null` → `resting` pose, silent or a soft idle line. Never a sad-emoji
default; the clay figure *is* the empty state.

**Error state:** Missing line set for a language → EN fallback (EC-9); never renders empty. No
mood data in any fallback log (SR-4).

**Tokens used:**
| Element | Token ID | Defined in |
|---|---|---|
| Clay body (neutral) | `color.charcoal.300/400` | tokens/mobile.tokens.json |
| Dot-eyes | `color.charcoal.800` / `color.charcoal.900` | tokens/mobile.tokens.json |
| Mood tint | `color.mood.1..5` | tokens/mobile.tokens.json |
| Teal accent (1/scene) | `color.teal.600` | tokens/mobile.tokens.json |
| Line text | `type.family.sans` (Satoshi) | tokens/mobile.tokens.json |
| Idle motion | `motion.duration.breath`, `motion.easing.breath` | tokens/mobile.tokens.json |
| Pose transition | `motion.duration.base`, `motion.easing.standard` | tokens/mobile.tokens.json |
| Celebrate motion | `motion.duration.calm`, `motion.easing.out` | tokens/mobile.tokens.json |
| Reduce-motion fallback | `motion._reducedMotion` (essential→crossFade 200ms, breath→static) | tokens/mobile.tokens.json |

**New tokens introduced:** None.

**i18n keys:** `mascot.line.<state>.<n>` (e.g. `mascot.line.welcome_back.1..3`), `mascot.line.steady.1..3`,
`mascot.line.check_in_saved.1..3`, `mascot.line.streak_milestone.1..3`, `mascot.a11y.<pose>`.

**Maps to ACs:** US-1/AC-1.1–1.4, US-2/AC-2.1–2.6, US-4/AC-4.1–4.4, US-5/AC-5.1–5.4, US-7/AC-7.1.

---

### S-2: Mascot dev gallery (route: `/dev-mascot`, `__DEV__` only)

**Archetype:** full-screen scroll (dev-only, like the existing `/dev-navigator`).

**Mirrors:** the existing `__DEV__` dev-verify screen pattern (`apps/mobile/app/(tabs)/index.tsx`
links to `/dev-navigator`).

**Purpose:** Render the full pose/expression set + each line state for DoD verification (gallery DoD).

**Layout:**
```
┌─────────────────────┐
│  Mascot Gallery     │  header
├─────────────────────┤
│ resting  gentle     │  grid of every pose, each labelled,
│ tender   warm       │  rendered via the same component the
│ bright   attentive  │  check-in mounts (props faked per cell)
│ celebrate welcome…  │
│ steady              │
├─────────────────────┤
│ [Reduce-motion: ON] │  toggle echo of OS state (read-only display)
│ Lines: state → list │  shows each state's rotated line set
└─────────────────────┘
```

**Components used:** `ScreenShell`, `Text` (from `@/components/ui`), `Mascot` (from `@/features/mascot`).

**Accessibility:** each gallery cell labelled with its pose state; respects Reduce-Motion (the whole
point — verifies idle animation is off while poses stay legible).

**Tokens used:** inherits S-1 tokens; grid spacing via Tailwind scale (NativeWind).

**i18n keys:** dev-only, English labels acceptable (not shipped to users).

**Maps to ACs:** DoD gallery line, EC-4 (reduce-motion verification).

## Data model

| Entity | Storage | Schema | Notes |
|---|---|---|---|
| `PoseSpec` | in-memory (pure) | see schema above | Never persisted/transmitted |
| `MascotLoopEvent` | prop (transient) | closed union (AC-6.1) | Render input only — SR-4: never logged |
| `MoodBand` | prop (transient) | `1\|2\|3\|4\|5` | Owned/persisted by check-in (MMKV), not mascot |
| Lines | i18n JSON (static content) | `mascot.line.<state>.<n>` per language | Static copy, not user data |

No mascot-owned persistence. No Supabase table. No migration.

## API contracts

None. The mascot makes no network, Supabase, or RPC calls. It is a pure render of its props.

## State management

- **Global (Zustand):** none owned by the mascot.
- **Local (component state):** `reduced = useReducedMotion()`; transient animation shared-values
  (Reanimated). Rotation index is **caller-supplied** as part of `event` context (RNG-free), not
  internal state (AC-3.3).
- **Server (React Query):** none.

## Error handling

| Error | User message | Recovery |
|---|---|---|
| Unknown mood at runtime | (none shown) | clamp to `resting` (EC-2) |
| Missing language line set | (none shown) | EN fallback (EC-9), no-mood log |
| Rapid event change | (none shown) | render latest event's pose; interruptible transition (EC-3) |

## Sensorial design (mobile)

### Haptic vocabulary used
**None.** The mascot consumes zero haptic tokens in V1 (US-7). Rationale: "one signature moment per
surface" — the Daily Check-In submit already owns `haptic.complete`; the mascot would double-fire.

### Audio vocabulary
**None.** V1 ships no UI audio.

### Motion vocabulary
| Token | Library | Duration | Used at |
|---|---|---|---|
| `motion.duration.breath` + `motion.easing.breath` | Reanimated v4 | 4000ms loop | idle breathing (non-essential) |
| `motion.duration.base` + `motion.easing.standard` | Reanimated v4 | 300ms | pose transition (essential) |
| `motion.duration.calm` + `motion.easing.out` | Reanimated v4 | 600ms | celebrate entrance |

All motion branches on `useReducedMotion()` at the component level. Breath → static when reduce-motion
on; pose change → 200ms cross-fade (`motion._reducedMotion`).

### Signature moments inventory
Total for this feature: **1.** Screen S-1: **celebrate entrance** (Reanimated v4, 600ms `calm`), in
visual sync with the check-in's `haptic.complete`. It earns the ceiling as the daily ritual's payoff.

## Sacred Rules compliance map

| Rule | This feature's compliance |
|---|---|
| SR-1 | N/A — no Navigator surface, no confidence value computed or rendered. |
| SR-2 | N/A to own; **boundary asserted** — mascot has no flag/branch/env touching crisis detection and never suppresses/competes with the Crisis surface (AC-4.3). |
| SR-3 | All lines use educational, person-first framing; no diagnostic phrasing. Source registry + all i18n JSON scanned by `sr3_diagnostic_language.sh`; steady/crisis-adjacent + welcome-back sets reviewed by Dr. Dobson (DoD). |
| SR-4 | Mascot never logs/persists/transmits `mood`/`event`. Telemetry section lists MUST-NOT-FIRE. Props are render-only. |

## Telemetry / analytics

| Event | Payload | Scrubbed |
|---|---|---|
| (none) | — | — |

The mascot emits **no** telemetry. **MUST NOT FIRE:** any event carrying `mood`, `MoodBand`,
`MascotLoopEvent`, or pose state derived from mood. `sr4_no_symptom_telemetry.sh` enforces; a unit
test asserts no telemetry call sites exist in mascot code (AC-8.1).

## Anti-slop check

| Pattern | Present? | Justification or removal |
|---|---|---|
| Purple/cyan mesh gradient | No | matte clay only |
| Glassmorphism without purpose | No | n/a |
| Three-rounded-cards-in-a-row | No | mascot is a single figure |
| Inter as default (Psychage: Satoshi is the brand) | Satoshi | brand override per DESIGN.mobile.md §1.2 |
| Hardcoded shadow values | No | no shadows; matte clay |
| Decorative spark-lines | No | n/a |
| Generic 4-tab bottom nav | No | mascot is not nav |
| Card-list-everywhere | No | single figure + optional line |
| Sad-emoji empty states | No | clay figure is the empty/neutral state; `gentle` pose is steady, not pitying (AC-1.4) |
| JS-thread animations | No | Reanimated v4 UI-thread worklets only |
| Missing haptics on primary CTAs | No | mascot has no CTA; haptic deliberately owned by check-in |
| Missing Reduce-* fallbacks | No | every motion has an explicit fallback (table above) |

## Token discipline

| Element | Token reference | Raw value (FORBIDDEN) |
|---|---|---|
| Teal accent | `color.teal.600` | NEVER `#1A9B8C` |
| Dot-eyes | `color.charcoal.800` | NEVER `#292524` |
| Mood tint | `color.mood.<band>` | NEVER `#8B7FA8` etc. |
| Idle motion | `motion.duration.breath` | NEVER `4000` |

## Open design decisions

**None block /spec-tasks.** The design is fully specified. Two **ship-gates** are tracked (they
gate ship, not decomposition):
1. **Dot-eye exception sign-off** — Dr. Dobson + brand. The state machine is face-agnostic-capable
   (EC-7), so tasks proceed; only the renderer's eye layer is contingent.
2. **Clinical line review** — Dr. Dobson reviews steady/crisis-adjacent + welcome-back line sets
   before ship (SR-3 DoD).

## Next step

Run `/spec-tasks mascot` to decompose this design into atomic, parallelizable implementation tasks.
