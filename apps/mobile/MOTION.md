# Motion System

One designed motion language for the whole app: spring-first, UI-thread-only,
token-driven, reduce-motion-aware. The goal is consistency — the same kind of
element animates the same way everywhere. If you're adding a screen, you almost
never write animation constants; you compose the primitives and factories below.

**Source of truth:** [`lib/motion.ts`](lib/motion.ts) (durations, easings, spring
presets, factories) backed by `tokens/mobile.tokens.json` → `motion.*`. There are
**no inline animation constants in components** — grep `withSpring(`/`withTiming(`/
`damping:` and every hit should resolve to a `@/lib/motion` import or `lib/motion.ts`
itself.

---

## 1. Tokens

### Durations — `DURATION` (ms)
| key | ms | use |
|---|---|---|
| `swift` | 150 | taps, toggles, selects |
| `base` | 300 | modals, reveals, page-level fades |
| `calm` | 600 | tool intros, celebrations |
| `breath` | 4000 | the guided-breath cycle |

`REDUCED_MOTION_FADE_MS = 200` — the cross-fade every animation collapses to under
reduced motion. Sourced from `tokens/mobile.tokens.json` → `motion._reducedMotion.essential.durationMs`.

### Easings — `EASING` (cubic-bezier token strings)
`out` · `in` · `standard` · `breath`. Consume via `easingFn('out')` which parses the
token string into a Reanimated `Easing.bezier(...)`. Timing/easing is for **opacity
and colour fades only** — anything spatial uses a spring.

### Spring presets — `SPRING_PRESETS` (the vocabulary; use these names)
| preset | feel | use |
|---|---|---|
| `magnetic` | sharp, low overshoot | the default press-scale (cards, buttons, tiles, chips) |
| `subtle` | fast, minimal overshoot | utilitarian rows (settings/nav/list rows) |
| `calm` | smooth | screen/content entrances, tab cross-fade, list layout |
| `gentle` | soft, light | the hero reveal |
| `deep` | heavy | bottom sheets |
| `swift` · `bouncy` · `playful` | — | accents, used sparingly |

> **Naming note.** An inbound spec proposed `snappy/smooth/gentle/bouncy`. We kept
> this existing 8-preset vocabulary (cross-platform token parity, convention #1, and
> many live call sites). The mapping is: spec `snappy`→`magnetic`/`subtle`,
> `smooth`→`calm`, `gentle`→`gentle`/`deep`, `bouncy`→`playful`/`bouncy`.

---

## 2. Factories — `lib/motion.ts`

All are **pure** and take `reduced` (from `useReducedMotion()`) explicitly, so they
honour BOTH reduce-motion sources — the OS setting AND the in-app S45 appearance
toggle (Reanimated's built-in `ReduceMotion.System` can't see the in-app one). Under
`reduced` every one collapses to the 200ms cross-fade (or `undefined` for layout).

| factory | returns | use |
|---|---|---|
| `enter(reduced, opts?)` | entering builder | fade + small upward translate (`calm`). For screen/content reveals. |
| `exit(reduced, opts?)` | exiting builder | matching fade + downward translate. |
| `staggeredEnter(index, reduced, opts?)` | entering builder | list/grid cascade. Delay = `min(index, 8) × 50ms`, so the last visible row lands by ~400ms. |
| `listLayout(reduced)` | `LinearTransition \| undefined` | pass to a list/row `layout` prop so inserts/reorders/deletes reflow smoothly. |
| `heroEnter(reduced)` | entering builder | the one signature reveal — scale-from-0.94 + fade (`gentle`). |

`STAGGER_MS = 50`, `STAGGER_CAP = 8`.

```tsx
const reduced = useReducedMotion();
<Animated.View entering={enter(reduced)}>…</Animated.View>
{items.map((it, i) => (
  <Animated.View key={it.id} entering={staggeredEnter(i, reduced)} layout={listLayout(reduced)}>
    …
  </Animated.View>
))}
```

---

## 3. Primitives — `components/ui/`

### `AnimatedPressable` — the one press primitive
**Every touchable in the app routes through this** (or `Button`, which wraps it).
Drop-in superset of `Pressable`: same props + a reduce-motion-aware spring scale on
press. Accepts the Reanimated layout props (`entering`/`exiting`/`layout`) too.

- **Cards / buttons / tiles / chips / icon-buttons** → defaults (`scaleTo={0.96}`, `magnetic`).
- **Utilitarian rows** (settings rows, full-width nav/list rows) → `scaleTo={0.98}` `springPreset="subtle"` (restraint — no bounce on serious surfaces).
- Never put a press-scale on a dismiss **backdrop**.
- Don't also use a NativeWind `active:scale-*` class — the Reanimated scale supersedes it.

`Button` (`components/ui/Button.tsx`) is the primary-action wrapper: `AnimatedPressable`
+ `haptic.affirm` + a `LinearTransition` content swap. Prefer it for real buttons.

### `AnimatedSheet` — the one bottom-sheet
Backdrop fade (`DURATION.base`) + weighted slide-up + velocity-aware **drag-to-dismiss**
(`gesture-handler`, `deep` spring). For **non-destructive** sheets only — `ConfirmSheet`
(sign-out) composes it. **Destructive confirms stay native modals** so a stray flick
can't trigger an irreversible action. Requires `GestureHandlerRootView` (wired in
`app/_layout.tsx`).

### `TabScreen` — tab content transition
Wraps a tab screen's content; cross-fades + settles up 10px each time the tab gains
focus (`calm`). Re-triggers off the navigation focus listener (tab screens stay
mounted), and renders statically outside a navigator. Wired into all four tabs.

### `HeroReveal` — the signature moment
Wraps the element a detail screen shares with the card it opened from. Used in exactly
two places: the article art (`ArticleReader` → `ArtPanel`) and the provider photo
(`ProviderDetailView` → `Avatar`). Rare on purpose. See §6 on why this isn't a true
shared-element morph.

Other existing animated primitives compose the same tokens: `Card`, `AnimatedInput`
(shake-on-error), `AnimatedScrollView` (parallax), `Skeleton`, `AnimatedTextReveal`,
`AnimatedEmptyState`.

---

## 4. Route transitions (expo-router native stack)

Native stack, tuned by `animation`/`presentation` per group — never replaced with a
JS transition lib.

| surface | animation | where |
|---|---|---|
| push / detail (article, provider, condition, …) | `slide_from_right` | root default (`app/_layout.tsx`), reduced → `fade` |
| auth / therapist / settings stacks | `default` (platform slide) | their `_layout.tsx`, reduced → `fade` |
| full-screen takeover flows (navigator, toolkit, clarity, history, reflection, mood-journal, onboarding) | `fade` | per-screen `Stack.Screen` (fade is non-spatial → reduce-motion-safe) |
| settings modals (make-it-yours, delete-confirm) | `modal` / `transparentModal` | `settings/_layout.tsx` |
| **crisis + crisis-region** | **`none`** | per-screen — instant by design |

---

## 5. Reduce motion

`useReducedMotion()` = OS Reduce-Motion **OR** the in-app S45 appearance toggle. Every
animation honours it. Spatial motion collapses to instant or the 200ms cross-fade;
press-scale, drag physics, stagger, and the hero reveal all no-op. When you add motion,
gate it through the factories (already reduce-motion aware) or branch on the hook.

---

## 6. Deliberate exclusions & deferrals

Not everything is animated — by design. Logged here so "uncovered" reads as a decision,
not a gap.

- **Crisis surfaces — no decorative motion (Sacred Rule #3, instant reachability).**
  `crisis.tsx` + `crisis-region.tsx` keep `animation: 'none'`. The following keep raw
  `Pressable` (no press-scale): `CrisisView`, `RegionPickerView`, `CrisisPill`,
  `EmergencyButton`, `CrisisCallRow`, mindmate `CrisisCard`, navigator `HaltView`,
  relationship `SafetyAlert`, and every Help-now pill / helpline action (in
  `ClarityChrome`, `ExerciseChrome`, `RelationshipChrome`).
- **Dismiss backdrops / scrims / stop-propagation sheet wrappers** stay raw `Pressable`
  — scaling a backdrop is a bug.
- **`components/home/*`** (Today screen) was deferred during the press sweep: it was
  in-flight in a separate effort and failing at the branch point. Migrate its touchables
  onto `AnimatedPressable` when that work lands.
- **True cross-screen shared-element morphs** are not used: Reanimated's
  `sharedTransitionTag` is unsupported on the New Architecture and no shared-element lib
  is in the locked stack. `HeroReveal` (a coordinated entrance) is the robust stand-in.

---

## 7. Adding a new screen — checklist

1. Touchables → `AnimatedPressable` (or `Button`). Rows get `scaleTo={0.98}`/`subtle`;
   cards/buttons get the defaults. Never a backdrop.
2. Lists → `staggeredEnter(i, reduced)` on items; `listLayout(reduced)` if they mutate.
3. Content reveals → `enter(reduced)`.
4. A bottom sheet → `AnimatedSheet` (non-destructive only).
5. A crisis/helpline control → leave it raw and instant.
6. No magic numbers — everything comes from `lib/motion.ts`. Respect reduced motion.
7. Run `/mobile-design-audit` before commit.
