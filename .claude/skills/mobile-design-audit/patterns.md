# Anti-slop patterns — mobile

Catalog consumed by `/mobile-design-audit` Pass 2. Mobile audits **all 12 patterns**: the 10 web-applicable patterns (1, 2, 3, 4, 5, 6, 8, 9, 10, 12 — adapted to React Native / NativeWind 5 surfaces) plus the 2 mobile-only patterns (7 generic 4-tab bottom nav, 11 missing haptics on primary CTAs). The web catalog `.claude/skills/design-audit/patterns.md` reserves the numbers 7 and 11 — do not renumber.

Each pattern entry: name, one-sentence description, detection rule with confidence level, passing snippet, failing snippet, and exception (where applicable). All code snippets are React Native / NativeWind / Reanimated v4 idiom.

Confidence levels:

- **deterministic** — text-scan rule with negligible false positives
- **heuristic** — text-scan rule that may produce false positives; pattern-recognition supplements
- **context-dependent** — requires reading surrounding code or filename context
- **manual review recommended** — no acceptable text-scan rule; flagged for human inspection

---

## Pattern 1 — Purple/cyan mesh gradient

**What it looks like:** Hero backgrounds, splash cards, or auth surfaces using the AI-stock purple-to-cyan radial or linear gradient. Common on cold-start auth screens and onboarding heroes.

**Detection rule (deterministic):** ripgrep for any of:

```
rg -nE 'from-purple-[0-9]+|to-cyan-[0-9]+|via-purple|via-cyan' --type tsx
rg -nE '<LinearGradient[^>]*colors=\{?\[[^\]]*(purple|cyan|#[a-fA-F0-9]{0,2}[8-9a-fA-F][^\]]*)' --type tsx
rg -nE 'colors=\{?\[[^\]]*["#](8b5cf6|a855f7|d946ef|06b6d4|22d3ee|67e8f9)' --type tsx
```

Any hit = pattern present.

**Passing snippet** — `expo-linear-gradient` with brand-token teal:

```tsx
import { LinearGradient } from 'expo-linear-gradient';
import { color } from '@/design/tokens';

<LinearGradient
  colors={[color.teal[50], color.teal[100]]}
  className="rounded-xl p-6"
>
  <Hero />
</LinearGradient>
```

**Failing snippet:**

```tsx
<LinearGradient colors={['#8b5cf6', '#ec4899', '#22d3ee']}>
  <Hero />
</LinearGradient>
```

**Exception:** Named visual exception #2 (`DESIGN.mobile.md §3.5`) — the valence feeling shape in `apps/mobile/components/moments/FeelingVisualization.tsx` is the ONE sanctioned gradient + multi-hue ramp. It uses a Skia `<RadialGradient>` over token-sourced `color.valence.{1..5}` (navy → warm-neutral → brand teal; no purple/cyan, no `expo-linear-gradient`), scoped to that single Moments capture surface and carrying the `@design-purpose` annotation. Any gradient outside that file is still drift — Psychage brand is teal/charcoal.

---

## Pattern 2 — Glassmorphism without purpose

**What it looks like:** Translucent panels (`BlurView` + low-opacity surface) stacked over flat content. On mobile, `expo-blur` and `react-native-skia` blur primitives make this trivially reachable.

**Detection rule (heuristic):** ripgrep for blur primitives + translucent-surface utilities:

```
rg -nE 'from ["\\'']expo-blur["\\'']' --type tsx
rg -nE '<BlurView' --type tsx
rg -nE 'intensity=\{?\d' --type tsx
rg -nE 'bg-white/[0-9]+|bg-black/[0-9]+|bg-[a-z]+-[0-9]+/[0-9]+' --type tsx
```

A hit **passes** if the file contains a `@design-purpose:` line within 5 lines of the hit OR the component variant is named `glass` (e.g. `<Card variant="glass">`, `<Button variant="glass">`) — glass is a documented Card/Button variant inherited from `DESIGN.web.md §2.1`.

Otherwise the hit is reported.

**Passing snippet** — glass variant explicit:

```tsx
<Card variant="glass">
  <MoodSummary />
</Card>
```

**Passing snippet** — purpose annotated next to the utility:

```tsx
{/* @design-purpose: floating tab-bar over scrolling content */}
<BlurView intensity={40} tint="light" className="absolute bottom-0 inset-x-0">
  <TabBar />
</BlurView>
```

**Failing snippet:**

```tsx
<BlurView intensity={30} className="rounded-xl bg-white/40 p-6">
  <Text>Welcome</Text>
</BlurView>
```

**Exception:** documented Card/Button `glass` variant — already in the contract.

---

## Pattern 3 — Three-rounded-cards-in-a-row

**What it looks like:** Marketing or hero sections using three (or more) sibling `<Card>` / `rounded-*` containers in a single grid/flex row as the default "show me features" pattern. On mobile this collapses to a horizontally-scrolling carousel of three uniform cards — same anti-slop, mobile dialect.

**Detection rule (context-dependent):** AST-style heuristic via ripgrep + manual confirmation. Flag files that contain:

- `flexDirection: 'row'` (or `className="flex-row"`) AND 3+ sibling `<Card>` / `<View className="rounded-(lg|xl|2xl)">` containers on a top-level onboarding / marketing / landing surface
- OR a `<ScrollView horizontal>` / `<FlatList horizontal>` with `data.length === 3` hardcoded

```
rg -n 'flex-row' apps/mobile/src/screens/ -g '!**/test/**' -g '!**/__tests__/**'
rg -nC2 '<Card|rounded-(xl|lg|2xl)' <flagged-file>
rg -nE '<(ScrollView|FlatList) horizontal' --type tsx
```

Pass if the surface is a list/grid context that genuinely has N entities (provider directory, article list, tools hub). Fail if the surface is a top-level onboarding / landing splash with exactly three feature cards.

**Confidence note:** heuristic — full disambiguation requires reading the surrounding screen purpose. Auditor must flag-then-review for onboarding / marketing screens.

**Passing snippet** — provider directory list (genuine grid of N):

```tsx
<FlashList
  data={providers}
  renderItem={({ item }) => <ProviderCard provider={item} />}
  numColumns={1}
/>
```

**Failing snippet** — onboarding splash with hand-rolled three:

```tsx
<View className="flex-row gap-4">
  <Card><Text>Learn</Text><Text>Articles</Text></Card>
  <Card><Text>Find care</Text><Text>Providers</Text></Card>
  <Card><Text>Track</Text><Text>Tools</Text></Card>
</View>
```

**Exception:** any non-marketing context where the cards represent real, dynamic data of N items (N=3 is incidental, not designed).

---

## Pattern 4 — Inter as default

**What it looks like:** Raw `fontFamily: 'Inter'` or `style={{ fontFamily: 'Inter' }}` declarations used without the type-token indirection.

**Detection rule (heuristic):** ripgrep:

```
rg -nE 'fontFamily:\s*["\\'']Inter["\\'']' --type tsx --type ts
rg -nE 'style=\{\{[^}]*fontFamily:\s*["\\'']Inter' --type tsx
rg -n 'font-sans' --type tsx
```

A hit **passes** if any of:

- Used via `type.family.sans` token reference / tokens-shim import (`import { typography } from '@/design/tokens'; ... fontFamily: typography.family.sans`)
- A `@brand-font` comment within 5 lines of the hit explicitly notes Inter is the intentional brand sans
- File is the tokens-shim module itself (`apps/mobile/src/design/typography.ts` or `apps/mobile/tailwind.config.ts`) — the token-definition source

Otherwise reported.

**Passing snippet:**

```tsx
{/* @brand-font: Inter is the Psychage brand sans per DESIGN.mobile.md §1.2 */}
<Text className="font-sans text-charcoal-900">Educational content body.</Text>
```

**Passing snippet** — via tokens shim:

```tsx
import { typography } from '@/design/tokens';

<Text style={{ fontFamily: typography.family.sans }}>Body.</Text>
```

**Failing snippet:**

```tsx
<Text style={{ fontFamily: 'Inter', fontWeight: '600' }}>Headline</Text>
```

**Exception:** Psychage uses Inter as the brand sans (documented in `DESIGN.mobile.md §1.2`). Hits with the `@brand-font` annotation or tokens-shim reference are passing; raw declarations without indirection are still drift.

---

## Pattern 5 — Hardcoded shadow values

**What it looks like:** Inline `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius` props with raw rgba/px values; inline style objects with `boxShadow`-ish elevation literals; Android `elevation: <number>` hardcoded without a tokens-shim wrapper.

**Detection rule (deterministic):** ripgrep:

```
rg -nE 'shadowColor:\s*["\\'']#' --type tsx --type ts
rg -nE 'shadowOpacity:\s*[0-9]' --type tsx --type ts
rg -nE 'shadowRadius:\s*[0-9]' --type tsx --type ts
rg -nE 'elevation:\s*[0-9]' --type tsx --type ts
rg -nE 'boxShadow:\s*["\\'']' --type tsx --type ts
```

Any hit = drift, unless the file is the tokens-shim module (`apps/mobile/src/design/shadow.ts` or equivalent definition site).

**Passing snippet:**

```tsx
import { shadow } from '@/design/tokens';

<Card style={shadow.md}>
  <Content />
</Card>
```

**Failing snippet:**

```tsx
<View style={{ shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 4 }}>
  <Card />
</View>
```

**Exception:** None. All shadows reference a shadow tokens-shim consumed via `@/design/tokens`. (Note: `tokens/mobile.tokens.json` does not currently ship a `shadow.*` family — calibrated against the first mobile screen in Phase 6. Until then, this pattern fires on any hardcoded shadow with note "no shadow token yet — surface to Phase 6 calibration".)

---

## Pattern 6 — Decorative spark-lines

**What it looks like:** Inline `react-native-svg` `<Polyline>` / `<Path>` used as a decorative visual flourish in a non-chart context.

**Detection rule (heuristic):** ripgrep for inline SVG containing `<Polyline>` or short single `<Path>` in files that do NOT import a charting library:

```
rg -ln '<Polyline' --type tsx
rg -ln '<Path[^>]*d=' --type tsx
# For each hit file, check it does NOT import victory-native / skia chart primitives:
rg -L 'from ["\\''](victory-native|@shopify/react-native-skia|recharts-native)' <hit-files>
```

Reports files with inline polyline/path in non-charting components.

**Confidence note:** heuristic — false positives on icon components are likely; the rule recommends manual confirmation for any `<Svg>` outside `apps/mobile/src/components/Logo*`, `apps/mobile/src/components/icons/`, or a `lucide-react-native` import.

**Passing snippet** — chart in context:

```tsx
import { CartesianChart, Line } from 'victory-native';

<CartesianChart data={moodHistory} xKey="day" yKeys={['score']}>
  {({ points }) => <Line points={points.score} color={color.primary.default.light} />}
</CartesianChart>
```

**Passing snippet** — icon via library:

```tsx
import { Activity } from 'lucide-react-native';

<Activity className="text-text-secondary" />
```

**Failing snippet** — decorative inline spark-line in a hero:

```tsx
<Svg viewBox="0 0 100 30" className="opacity-50">
  <Polyline points="0,20 20,15 40,18 60,8 80,12 100,5" stroke="currentColor" fill="none" />
</Svg>
```

**Exception:** `apps/mobile/src/components/Logo*`, anything under `apps/mobile/src/components/icons/`, components that import a charting library (victory-native / skia chart primitives).

---

## Pattern 7 — Generic 4-tab bottom nav (mobile-only)

**What it looks like:** Bottom-tab navigation built around the generic-app tab set: Home, Search, Library, Profile (or close variants Discover, Browse, Me, You, Account, Feed, Activity). This is the universal "default app shell" — instantly recognizable as a template, completely unbranded.

**Detection rule (deterministic):** parse the tab-bar configuration. Inspect the labels passed to `<Tabs.Screen options={{ title: ... }}>` (Expo Router) or the `name` / `label` fields in `createBottomTabNavigator` config. Build the label set; flag if the set has 3+ overlap with the generic set:

```
{Home, Search, Library, Profile, Discover, Browse, Me, You, Account, Feed, Activity}
```

```
rg -nE 'title:\s*["\\''](Home|Search|Library|Profile|Discover|Browse|Me|You|Account|Feed|Activity)["\\'']' apps/mobile/src/app/ apps/mobile/src/navigation/
rg -nE '<Tabs\.Screen[^>]+name=["\\''](home|search|library|profile|discover|browse|me|you|account|feed|activity)' --type tsx
```

Any file with 3+ matches to that set in its tab definition = pattern present.

**Exception:** the contract tab set `{Today, Learn, Compass, Find}` per `DESIGN.mobile.md §2.1`. These are custom labels by definition and do not overlap with the generic set — they satisfy Pattern 7 by construction. Other custom labels also pass (e.g., `Mood`, `Streak`, `Provider`); the rule only flags labels in the generic set.

**Confidence:** deterministic.

**Passing snippet** — Psychage contract tabs:

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="today"   options={{ title: 'Today' }}   />
      <Tabs.Screen name="learn"   options={{ title: 'Learn' }}   />
      <Tabs.Screen name="compass" options={{ title: 'Compass' }} />
      <Tabs.Screen name="find"    options={{ title: 'Find' }}    />
    </Tabs>
  );
}
```

**Failing snippet** — generic default-app shell:

```tsx
<Tabs>
  <Tabs.Screen name="home"    options={{ title: 'Home' }}    />
  <Tabs.Screen name="search"  options={{ title: 'Search' }}  />
  <Tabs.Screen name="library" options={{ title: 'Library' }} />
  <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
</Tabs>
```

---

## Pattern 8 — Card-list-everywhere

**What it looks like:** Screens where the dominant layout pattern is a vertical stack of `<Card>` components, regardless of the underlying content type.

**Detection rule (heuristic):** count `<Card`, `<InteractiveCard` instances per file via ripgrep:

```
rg -c '<Card[^A-Za-z]|<InteractiveCard' <file>
```

Flag the file if:

- count is ≥ 3
- AND the file has no other primary content layout (no chart primitive, no `<ComparisonTable>` equivalent, no `<ProgressSteps>`, no grid of non-Card primitives, no `<FlashList>` of homogeneous items)

**Confidence note:** heuristic — false positives on legitimate card lists (Today-screen widgets, provider directory). Auditor reads the screen's purpose: if the cards are wrapping heterogeneous content types rather than a list of like entities, it's drift.

**Passing snippet** — Today-screen widgets, each card has a distinct content type:

```tsx
<ScrollView className="space-y-6">
  <Card><ClarityScoreSummary /></Card>
  <ProgressSteps current={2} steps={onboarding} />
  <ArticleChart data={moodHistory} />
</ScrollView>
```

**Failing snippet** — every section wrapped in a Card "just because":

```tsx
<ScrollView className="space-y-4">
  <Card><Text>Headline</Text></Card>
  <Card><Text>Intro paragraph...</Text></Card>
  <Card><Image source={...} /></Card>
  <Card><Button>Continue</Button></Card>
</ScrollView>
```

**Exception:** dashboards or directories where each card represents a distinct entity of the same type (provider cards, article cards, widget cards).

---

## Pattern 9 — Sad-emoji empty states

**What it looks like:** Empty-state UI using sad/blank/disappointed emoji or "Nothing here yet" copy as the empty signal.

**Detection rule (deterministic):** ripgrep for the emoji set and the canonical copy pattern:

```
rg -nE '😢|😞|😔|😭|🥺|💔|🙁|☹️' --type tsx --type ts
rg -niE 'nothing here yet|no [a-z]+ found yet|oops[!.]|sad to see' --type tsx
```

Any hit = drift.

**Passing snippet** — uses `EmptyState` primitive with calm copy and recoverable action, anchored by a clay-figure illustration:

```tsx
<EmptyState
  illustration="clay-figure-rest"
  title="No entries this week"
  body="Your first entry will appear here."
  action={<Button onPress={openNew}>Add an entry</Button>}
/>
```

**Failing snippet:**

```tsx
<View className="items-center py-12">
  <Text className="text-4xl">😢</Text>
  <Text>Nothing here yet</Text>
</View>
```

**Exception:** None.

---

## Pattern 10 — JS-thread animations (adapted for React Native)

**What it looks like:** Heavy animation libraries (or Animated API on JS thread) used for animations that a Reanimated v4 worklet or a simple Tailwind/inline transition could handle.

**Detection rule (heuristic):** ripgrep for animation-library imports + JS-thread Animated API in files where the surrounding animation is trivial (simple opacity or transform):

```
rg -n 'from ["\\'']react-native["\\''].*Animated' --type tsx
rg -n 'Animated\.timing\(' --type tsx
rg -n 'from ["\\'']lottie-react-native["\\'']' --type tsx
rg -n 'from ["\\'']@lottiefiles' --type tsx
```

For each hit, the auditor reads the surrounding code. Flag if:

- Uses `Animated` (RN core) without `useNativeDriver: true` for an opacity/transform-only animation — should be Reanimated v4 worklet.
- Uses Lottie for a 200ms opacity fade — overkill.
- Uses Reanimated for a single-property scale at default spring duration — could be a layout animation.

**Confidence note:** heuristic, **low priority** — Reanimated v4 is the documented motion engine. Most hits are legitimate. The pattern catches the rare case where RN's Animated is reached for instead.

**Passing snippet** — Reanimated v4 worklet for a layout-shifting transition:

```tsx
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { motion } from '@/design/tokens';

const height = useSharedValue(0);
const style = useAnimatedStyle(() => ({
  height: withTiming(height.value, { duration: motion.duration.base, easing: motion.easing.standard }),
}));

<Animated.View style={style}>
  <Content />
</Animated.View>
```

**Failing snippet** — RN Animated on JS thread for a fade:

```tsx
import { Animated } from 'react-native';

const opacity = new Animated.Value(0);
Animated.timing(opacity, { toValue: 1, duration: 200 }).start();

<Animated.View style={{ opacity }}>
  <Text>Hello.</Text>
</Animated.View>
```

**Exception:** any animation that crosses layout (height/width auto, FLIP, drag, gesture) legitimately needs Reanimated v4 or RN Gesture Handler.

---

## Pattern 11 — Missing haptics on primary CTAs (mobile-only)

**What it looks like:** A primary call-to-action button (variant="primary" or component name matching `Button` / `CTA` / `PrimaryAction`) fires an `onPress` handler that calls into business logic without triggering a haptic — silent commitment to a meaningful action. Sensorial floor: every primary CTA fires at least `haptic.affirm` (Light) per `DESIGN.mobile.md §3.3`.

**Detection rule (heuristic):** for each Pressable / Button / TouchableOpacity with `variant="primary"` OR component name matching `/(^|[A-Z])(Button|CTA|PrimaryAction)/`, inspect the `onPress` handler. Pass if the handler:

- Calls `triggerHaptic('affirm')` or any other `triggerHaptic(<token>)` from a tokens-shim
- OR calls `Haptics.impactAsync(ImpactFeedbackStyle.Light | Medium | Heavy)` directly
- OR calls `Haptics.notificationAsync(NotificationFeedbackType.Success | Warning)` directly
- OR calls `Haptics.selectionAsync()` directly
- OR delegates to a wrapper component documented to fire haptics internally (e.g., `<PrimaryButton>` wrapping a haptic-firing `Pressable`)

Fail if the handler executes business logic (navigation, state mutation, API call, async action) with no haptic call anywhere in the function body or the immediate wrapper hierarchy.

```
rg -nE 'variant=["\\'']primary["\\'']' --type tsx
rg -nB1 'onPress=\{' --type tsx
rg -nE 'triggerHaptic\(|Haptics\.(impactAsync|selectionAsync|notificationAsync)' --type tsx
```

The auditor cross-references hits: every `variant="primary"` button's `onPress` must show a haptic call within 5 lines or via an immediate wrapper.

**Exception:** components inside a documented `_noHapticZones` zone (per `tokens/mobile.tokens.json` `haptic._noHapticZones` and `DESIGN.mobile.md §3.3`):

- error-state surfaces (warm copy + visual only)
- high-frequency micro-interaction targets (typing keystroke buttons, slider drag, scroll-velocity-driven primitives)
- background-notification surfaces (OS owns the haptic)

If a component is documented as a no-haptic-zone via a `@no-haptic` annotation within 5 lines OR is named with the suffix `Silent` (e.g., `PrimaryButtonSilent`), the rule does not fire.

**Confidence:** heuristic — false negatives possible if haptic firing is hidden behind an indirection chain >1 wrapper. Auditor surfaces the rule's confidence in the report note.

**Passing snippet** — direct haptic via tokens-shim:

```tsx
import { Button } from '@/components/ui/Button';
import { triggerHaptic } from '@/design/haptic';

<Button
  variant="primary"
  onPress={() => {
    triggerHaptic('affirm');
    onSubmitMood(value);
  }}
>
  Submit
</Button>
```

**Passing snippet** — wrapper documented to fire haptics:

```tsx
{/* PrimaryButton wraps Pressable + fires haptic.affirm on press */}
<PrimaryButton onPress={onSubmitMood}>Submit</PrimaryButton>
```

**Passing snippet** — explicit no-haptic-zone annotation:

```tsx
{/* @no-haptic: typing keystroke target — per-event haptic suppressed (DESIGN.mobile.md §3.3) */}
<Pressable onPress={() => insertChar('a')}>
  <Text>a</Text>
</Pressable>
```

**Failing snippet** — primary CTA, no haptic:

```tsx
<Button
  variant="primary"
  onPress={() => onSubmitMood(value)}
>
  Submit
</Button>
```

---

## Pattern 12 — Missing `prefers-reduced-motion`

**What it looks like:** Vestibular-risk motion (longer transitions, opacity fades, multi-property motion definitions, breath/pulse loops) in a file without any reduced-motion accommodation. On mobile this maps to the OS-level Reduce Motion setting, read via `useReducedMotion()` from `react-native-reanimated`.

**Detection rule (context-dependent):** flag motion when any of the four triggers below is present AND the file has no reduced-motion path. Gesture-bound micro-interactions (single-property scale/translate at default spring or duration < 200ms) are **exempt** — essential interaction feedback that doesn't trigger vestibular concerns.

Four triggers (any one fires the pattern):

**(a) Explicit duration > 200ms.** ripgrep:

```
rg -nE 'duration:\s*(2[0-9][0-9]|[3-9][0-9]{2,}|[0-9]{4,})' --type tsx
rg -nE 'withTiming\([^,]+,\s*\{[^}]*duration:\s*(2[0-9][0-9]|[3-9][0-9]{2,}|[0-9]{4,})' --type tsx
```

Decode: any duration ≥ 250ms = over vestibular threshold and fires (a). Anything ≤ 200ms is under threshold.

**(b) Any opacity transition (regardless of duration).** ripgrep:

```
rg -nE 'opacity:\s*withTiming|opacity:\s*withSpring|opacity:\s*interpolate' --type tsx
rg -nE 'animate=\{\{[^}]*opacity|exit=\{\{[^}]*opacity' --type tsx
```

Opacity transitions on full-surface elements (modal backdrops, screen transitions) are common vestibular triggers regardless of duration. Always fires (b).

**(c) Multi-property motion definition.** Detect Reanimated worklets or Moti `animate=` objects defining two or more animated properties simultaneously:

```
rg -nA3 'useAnimatedStyle' --type tsx
rg -nE 'animate=\{\{[^}]*,[^}]*\}\}' --type tsx
```

For each hit, read the rule body / JS object. If two or more of `{ opacity, transform, scale, translate(X|Y), rotate, height, width }` are animated together, trigger (c) fires.

**(d) Breath / pulse loops.** Any motion using `motion.duration.breath` (4000ms) OR an infinite-repeat decorative loop. ripgrep:

```
rg -nE 'duration:\s*motion\.duration\.breath|duration:\s*4000' --type tsx
rg -nE 'withRepeat\([^,]+,\s*-1' --type tsx
rg -nE 'withRepeat\([^,]+,\s*Infinity' --type tsx
```

Always fires (d). Breath / decorative-loop animations require the two-tier reduced-motion handling per `DESIGN.mobile.md §3.1` (non-essential = disabled; breath gets the in-app opt-back-in).

For each fired file, confirm a reduced-motion path exists. At least one of:

- `useReducedMotion` import from `react-native-reanimated` or `@/hooks/useReducedMotion`, with the value branched into the animation
- A wrapping component documented to honor reduced-motion (e.g., `<MotionGuard>` from a tokens-shim)
- For breath/pulse specifically: an additional check that the in-app `breathMotionEnabled` toggle from settings is read (e.g., via `useUserPreference('breathMotion')`)

If no reduced-motion path is found, report the hit with the trigger letter.

**Confidence note:** context-dependent. Trigger (d) on breath animations requires the additional in-app-toggle check; surfacing it as a `manual review recommended` line in the report is acceptable when the breath toggle indirection chain is long.

**Passing snippet — gesture-bound micro-interaction (exempt):**

```tsx
// gesture-bound · scale-only · default spring — Pattern 12 exempt
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

<Pressable onPressIn={() => (scale.value = withSpring(0.97))}>
  <Animated.View style={style}><Text>Continue</Text></Animated.View>
</Pressable>
```

**Passing snippet — non-trivial motion with `useReducedMotion` guard:**

```tsx
import Animated, { useReducedMotion, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { motion } from '@/design/tokens';

function Hero() {
  const reduce = useReducedMotion();
  const style = useAnimatedStyle(() => ({
    opacity: reduce ? 1 : withTiming(1, { duration: motion.duration.base }),
    transform: reduce ? [] : [{ translateY: withTiming(0, { duration: motion.duration.base }) }],
  }));
  return <Animated.Text style={style}>Welcome</Animated.Text>;
}
```

**Passing snippet — breath loop with two-tier guard + in-app toggle:**

```tsx
import { useReducedMotion, withRepeat, withTiming } from 'react-native-reanimated';
import { useUserPreference } from '@/hooks/useUserPreference';
import { motion } from '@/design/tokens';

const reduce = useReducedMotion();
const breathEnabled = useUserPreference('breathMotion');

const scale = useSharedValue(1);
if (!reduce || breathEnabled) {
  scale.value = withRepeat(
    withTiming(1.1, { duration: motion.duration.breath, easing: motion.easing.breath }),
    -1,
    true,
  );
}
```

**Failing snippet — trigger (a) duration > 200ms, no reduce-motion path:**

```tsx
const opacity = useSharedValue(0);
opacity.value = withTiming(1, { duration: 500 });

<Animated.View style={{ opacity }}><Hero /></Animated.View>
```

**Failing snippet — trigger (b) opacity transition, no reduce-motion path:**

```tsx
import { MotiView } from 'moti';

<MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
  <ModalBackdrop />
</MotiView>
```

**Failing snippet — trigger (d) breath loop, no reduce-motion path AND no in-app-toggle check:**

```tsx
scale.value = withRepeat(withTiming(1.1, { duration: 4000 }), -1, true);
```

**Exception:**

- Gesture-bound micro-interactions (single-property scale/translate at default spring OR duration < 200ms) — exempt.
- Files using only Tailwind / NativeWind transition utilities with durations under threshold — exempt.
- Files importing only static easing/duration constants from `@/design/tokens` without firing them — exempt.
