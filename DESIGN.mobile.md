# DESIGN.mobile.md — Psychage Mobile Design Contract

**Status:** Phase 4.B complete
**Source of truth for:** `/spec-design` (mobile platform)
**Token file:** [tokens/mobile.tokens.json](tokens/mobile.tokens.json)
**Audit skill:** [.claude/skills/mobile-design-audit/](.claude/skills/mobile-design-audit/)
**Reference codebase:** `apps/mobile/` (Phase 6 — does not exist yet)

This contract is **constructive**, not descriptive. There is no existing psychage-v2 mobile codebase to extract from — mobile is Phase 6 work. The contract encodes the decisions locked at Phase 4.B kickoff so that Phase 6 implementation has a single source of truth to build against.

The companion web contract is [DESIGN.web.md](DESIGN.web.md). Where a token, primitive, or rule applies cross-platform (color, mood palette, sensorial restraint), this document references the web file rather than restating it.

---

## 0. Scope

### 0.1 In scope (`apps/mobile/` once it exists)

- All code under `apps/mobile/src/` after Phase 6 scaffold
- Token sources: `tokens/mobile.tokens.json` (this contract), `apps/mobile/tailwind.config.ts` (NativeWind 5 extension)
- The mobile primitive library at `apps/mobile/src/components/ui/` (mirrors the 26-primitive web canon, adapted to React Native — built in Phase 6)
- The 4 V1 native features (Daily Check-In, Symptom Navigator, My Therapist + share, Crisis surface) plus all Procedure-B surfaces (onboarding, settings, premium, auth, adaptive home)

### 0.2 Out of scope (deliberate exclusions)

- **The web app** — covered by [DESIGN.web.md](DESIGN.web.md). The only cross-platform identity carrier is the clay-figure library.
- **`clarity-score/`** — Next.js sub-app excluded per DESIGN.web.md §0. Not consumed by mobile.
- **The illustrator commission itself** — Tier 3 sensorial-complete scope is locked here (§4), but the commission, style-guide review, and figure delivery are a separate workstream tracked in `.claude/workspace.json` `clayFigures`.
- **The `apps/mobile/` codebase** — Phase 6 deliverable. This contract is built without code to extract from.

---

## 1. Tokens (overview; values in `tokens/mobile.tokens.json`)

The token file is canonical. This section names the families, the schema shape, and the cross-platform-sync conventions. Values do not appear here — read the JSON.

### 1.1 Color schema

Inherits from [DESIGN.web.md §1.1](DESIGN.web.md) two-system architecture:

- **Themed** (`color.background`, `color.surface.*`, `color.border.*`, `color.primary.*`, `color.text.*`, `color.semantic.*`): paired `{ light, dark }` per leaf — Option B schema locked at Phase 4.A.
- **Non-themed** (`color.charcoal.*` 11-step neutral scale, `color.teal.*` sparse brand scale, `color.crisis.red`, `color.relevance.*`): single hex per leaf.

**Cross-platform values copied verbatim from [tokens/web.tokens.json](tokens/web.tokens.json).** Any future brand-color change (e.g., teal hex amendment) is applied to both `tokens/web.tokens.json` and `tokens/mobile.tokens.json` in the same commit — see §6 carry-over watch-out.

`color.mood.{1..5}` is a feature-scoped exception (mood feature only, paired L/D with identical hex per side). Values identical to web for cross-surface coherence.

### 1.2 Typography schema

Only `type.family.{sans,display}` is a token. Locked families: `sans` = IBM Plex Sans (body/UI), `display` = Fraunces (display). The `mono` family token was dropped — see the lock note below.

> **Typography lock (DD-001, 2026-06-10):** `sans`/body/UI = **IBM Plex Sans** (SIL OFL); `display`/headlines = **Fraunces** (SIL OFL, static weight cuts). Both bundle via `@expo-google-fonts/ibm-plex-sans` (weights 400/500/700) + `@expo-google-fonts/fraunces` (weight 600) and load through `useFonts` in `apps/mobile/app/_layout.tsx`; token family strings are the packages' export names (`IBMPlexSans_400Regular`, `Fraunces_600SemiBold`). **Satoshi is forbidden in the mobile bundle** — its Indian Type Foundry / Fontshare EULA (the former `FFL.txt`) does not clearly cover embedding the font binary in a distributed app. The `mono` token was dropped (no production use; only the dev-navigator verification screen referenced it, now pointing at the platform default monospace). Satoshi remains legitimate on web (`tokens/web.tokens.json`).

`size/weight/leading/tracking` are **not** mobile tokens in this contract. The token file ships skeleton stubs with a `_note` indicating values are calibrated against the first mobile screen design. Hardcoding a type scale without a screen to validate against would be invented value — better honest stubs.

### 1.3 Spacing schema

8pt grid per iOS HIG. Token file ships skeleton stubs with the same `_note` as typography. Calibrated against the first mobile screen design in Phase 6.

### 1.4 Radius schema

3 canonical steps: `lg, xl, full`. `_canonical` maps element classes to radii (matches DESIGN.web.md §1.4 conventions):

| Element class | Radius |
|---|---|
| Cards / surfaces / panels | `xl` (1rem) |
| Inputs / smaller buttons | `lg` (0.5rem) |
| Pills / avatars / icon buttons | `full` (9999px) |

Mobile does not add the web `2xl/3xl` emphasis tier — emphasis on mobile leans on sensorial dimensions (motion, haptic) rather than visual flair.

### 1.5 Motion schema

See §3.1 for philosophy. Token shape:

- `motion.duration.{swift, base, calm, breath}` — 150 / 300 / 600 / 4000 ms
- `motion.easing.{out, in, standard, breath}` — cubic-bezier control-point strings
- `motion._reducedMotion` — two-tier handling object (essential vs non-essential), plus breath-specific override

The token file uses ms integers (Reanimated convention) rather than the web seconds-string convention — same value semantics, different unit literal.

### 1.6 Haptic schema (mobile-only, no web equivalent)

See §3.3 for philosophy. Token shape:

- 5 stock tokens (`haptic.{tap, affirm, confirm, celebrate, alert}`) — each `{ "_expo": "<event-name>", "_use": "<surfaces>" }`.
- 3 sequenced tokens (`haptic.{complete, breath_in, breath_out}`) — each `{ "_sequence": [{event, delayMs}, ...], "_use": "..." }`.
- `haptic._OSRespect` — system haptics toggle, low-power mode, in-app toggle requirements.
- `haptic._noHapticZones` — explicit zones where haptic must NOT fire.

The web contract has no parallel `haptic.*` family — web platform has no haptics.

### 1.7 Audio schema (mobile-only, no web equivalent)

See §3.2 for philosophy. V1 ships empty:

- `audio._v1` — declares "empty — content audio only, no UI sound effects".
- `audio._v2Candidates` — documents deferred tokens (`audio.complete`, `audio.ambient`) for future activation; not active in V1.

---

## 2. Information Architecture

### 2.1 Tab structure — 4 bottom tabs + avatar in header

| Tab | Icon meaning | What lives here |
|---|---|---|
| **Today** | Personalized landing — calendar / sun glyph | Today's content, mood prompt, recent activity, adaptive home |
| **Learn** | Articles + videos — book or play glyph | Library of educational articles + Dr. Dobson video index |
| **Compass** | Orienting / wayfinding — compass-rose glyph | Symptom Navigator, Clarity Score, mood tracking, breathing |
| **Find** | Locate care — map-pin or magnifier glyph | Provider directory, crisis resources, "speak to someone now" surfaces |

Account, settings, profile, and notifications live behind an **avatar icon in the header** on every tab — not a 5th tab. The avatar is the entrance to identity-scoped surfaces; the tab bar stays scoped to content destinations.

### 2.2 Tab content mapping (V1 features → tab)

- **Daily Check-In (Procedure A V1)** — Today tab (primary surface; also surfaces in onboarding flow before tabs are reachable).
- **Symptom Navigator (Procedure A V1)** — Compass tab.
- **My Therapist + share (Procedure A V1)** — Find tab (provider-directory adjacent) and Today tab (after-linkage status surface).
- **Crisis surface (Procedure A V1)** — Find tab (primary entrance) AND persistent in-app banner reachable from any tab.

### 2.3 Avatar-in-header pattern

The avatar lives in the top-right of the header on every primary tab destination. Tapping opens a sheet/screen containing: account, premium upgrade, notification preferences, language, accessibility (incl. Reduce Motion / Reduce Haptic in-app toggles per §3), data export, sign-out.

Rationale: a 5th "Profile" or "Me" tab is the generic-nav anti-slop pattern that `/mobile-design-audit` Pattern 7 catches. Surfacing account behind an avatar keeps the tab bar focused on what the user came to **do**, not who they **are**.

### 2.4 Naming rationale

"Compass" is the genuinely distinctive label in the set. Today, Learn, and Find each have a clear behavioral verb; Compass is a metaphor — orienting yourself across Symptom Navigator, Clarity Score, mood tracking, and breathing exercises. The icon (a compass rose, or stylized N-arrow) must reinforce the orienting meaning on first encounter so the label doesn't read as decorative.

The tab labels {Today, Learn, Compass, Find} are by definition custom — they do not appear in the generic-nav anti-slop set {Home, Search, Library, Profile, Discover, Browse, Me, You, Account, Feed, Activity}. Pattern 7 is satisfied by construction.

---

## 3. Sensorial design

Mobile engages four sensorial dimensions: motion, audio, haptic, micro-interactions. **Restraint over abundance** is the governing principle (per `learnings.md` 2026-05-05 entry). Three signature sensorial moments per V1 are reserved: (a) Daily Check-In submit, (b) tool/series completion, (c) breathing-exercise breath cycle.

### 3.1 Motion philosophy — two-mode (utility vs content)

Motion serves either **utility** (transitions communicating hierarchy and feedback — tab change, page push, modal reveal) or **content** (deliberate sensorial moments — tool intros, micro-celebrations, guided breath cycles). The token table maps duration to mode:

| Token | Duration | Mode | Use |
|---|---|---|---|
| `motion.duration.swift` | 150ms | utility | tab change, toggle, list select, hover |
| `motion.duration.base` | 300ms | utility | modal open, page push, content reveal |
| `motion.duration.calm` | 600ms | content | tool intros, deliberate transitions, micro-celebrations |
| `motion.duration.breath` | 4000ms | content | breathing prompts, mindful-state transitions (natural breath cycle) |

Easing tokens map intent to curve:

| Token | Curve | Use |
|---|---|---|
| `motion.easing.out` | `cubic-bezier(0, 0, 0.2, 1)` | entering elements decelerate to rest |
| `motion.easing.in` | `cubic-bezier(0.4, 0, 1, 1)` | exiting elements accelerate away |
| `motion.easing.standard` | `cubic-bezier(0.2, 0, 0, 1)` | in-place transitions |
| `motion.easing.breath` | `cubic-bezier(0.45, 0, 0.55, 1)` | symmetric ease-in-out for breath cycles |

#### `prefers-reduced-motion` two-tier handling

- **Non-essential motion** (decorative loops, ambient pulsing, breath animations) → **fully disabled** when OS reduce-motion is on.
- **Essential motion** (transitions communicating hierarchy or feedback — modal opens, tab switches, validation reveals) → **replace transform/scale with cross-fade at 200ms**. Hierarchy still communicates; vestibular trigger is removed.
- **Breath animations specifically** → **static state by default** when OS reduce-motion is on; offer an **in-app toggle** for users who want breath motion despite the OS setting. The toggle lives in the avatar → accessibility sheet.

All Reanimated v4 components import `useReducedMotion()` and branch on it. The two-tier rule must be encoded at the component level, not deferred to a global disable — a global disable breaks essential feedback (e.g., a tap target that "should have responded" suddenly doesn't).

### 3.2 Audio philosophy — content-only

V1 audio tokens are empty. No UI sound effects, no tap sounds, no in-app notification chimes. Content brings its own audio (Dr. Dobson videos play with their own audio track; future guided-breathing recordings ditto).

**V2 candidates documented but deferred:**
- `audio.complete` — soft milestone chime, default-off in settings.
- `audio.ambient` — breathing-exercise background loops.

Audio activation is gated on: (a) signature-moment audit confirming content-only restraint failed, (b) Dr. Dobson clinical review of chime designs (anxious/migraine-overlap audience needs sensorial sign-off), (c) Reduce Audio system setting honored.

### 3.3 Haptic philosophy — 8 tokens, signature dimension

Haptic is the most distinctive sensorial dimension Psychage Mobile owns. Eight tokens — five stock single-event Expo Haptics calls and three sequenced Psychage-signature patterns implemented via chained `setTimeout`.

#### Stock (single Expo Haptics events)

| Token | Expo event | Use |
|---|---|---|
| `haptic.tap` | `Haptics.selectionAsync()` | tab change, toggle, list-item select |
| `haptic.affirm` | `Haptics.impactAsync(Light)` | primary CTAs, mood submit, tool start |
| `haptic.confirm` | `Haptics.impactAsync(Medium)` | form submit, save, step complete |
| `haptic.celebrate` | `Haptics.notificationAsync(Success)` | milestone, streak day, tool completion |
| `haptic.alert` | `Haptics.notificationAsync(Warning)` | confirmation prompts before destructive actions |

#### Sequenced (Psychage signature patterns)

| Token | Sequence | Use |
|---|---|---|
| `haptic.complete` | Light → 80ms → Medium → 80ms → Success | tool/series completion — **signature pattern** |
| `haptic.breath_in` | Light → 200ms → Light → 200ms → Medium (~800ms total) | breathing inhale; loops with `motion.duration.breath` at 4s/cycle |
| `haptic.breath_out` | Medium → 200ms → Light → 200ms → Light | breathing exhale; inverse curve of breath_in |

Sequenced patterns are implemented via chained `setTimeout(() => Haptics.impactAsync(...), delayMs)`. JS-thread timing is approximate (~10–20ms drift). For breath-cycle fidelity, Core Haptics AHAP patterns via a native module would be more reliable — tracked as a v2 watch-out in §6.

#### Firing rules — MUST fire

- Every primary button → `haptic.affirm` (satisfies the anti-slop floor for "missing haptics on primary CTAs", Pattern 11).
- Every navigation event (tab change, page push, modal open) → `haptic.tap`.
- Every form submission / save → `haptic.confirm`.
- Every tool completion / streak milestone / signature moment → `haptic.complete`.
- Every confirmation prompt before destructive actions → `haptic.alert`.
- Guided breathing → `haptic.breath_in` / `haptic.breath_out` synced with `motion.duration.breath`.

#### No-haptic zones (explicit exclusions)

- **Error states** → warm copy + visual only, never `haptic.error` (no such token exists; brand voice is non-clinical — an error haptic reads as punitive).
- **High-frequency micro-interactions** (typing keystrokes, slider drag deltas, scroll velocity) → no per-event firing. Aggregated end-of-gesture haptics are acceptable; per-keystroke is not.
- **Background notifications** → OS notification haptic owns this surface, not in-app code.

#### OS-level respect

- iOS System Haptics toggle → honor (expo-haptics no-ops automatically when this is off; verify in QA).
- Low Power Mode → honor (expo-haptics no-ops automatically; verify).
- In-app haptic toggle → **required** in app settings (avatar → accessibility sheet). Some users want haptics off without disabling system haptics globally — Phase 6 ships this.

### 3.4 Cross-modal coherence

`motion.duration.breath` + `haptic.breath_in` / `haptic.breath_out` + the breathing clay-figure illustration form a single sensorial moment. All three respect their respective OS preferences (Reduce Motion, System Haptics) and the in-app toggles. None of the three fires alone if the user has opted out of one — the moment is coherent or it's nothing.

Equivalent rule applies to `haptic.complete` + `motion.duration.calm` + the celebration clay-figure illustration on tool/series completion. Signature moments are cross-modal by definition; partial sensorial expressions (haptic only, no motion) are an anti-slop signal.

---

## 4. Clay figures — Tier 3 Sensorial-complete

**Tier:** 3 — Sensorial-complete (~25–35 illustrations).
**Style:** Headspace-adjacent, faceless, universal-humanity figures. No specific demographic representation. No photography of real people. Consistent body type, proportions, color palette across the full library.

Library status, commission-start date, and delivery ETA tracked in `.claude/workspace.json` `clayFigures`. This section locks the scope and practical requirements; the commission itself is a separate workstream.

### 4.1 Tier 3 placement breakdown

| Surface | Count | Examples |
|---|---|---|
| Onboarding | 5–8 | welcome, value props, permissions, sign-in |
| Empty states | 6–10 | one per surface: Today, Learn, Compass, Find, mood history, saved articles, etc. |
| Primary CTA visuals / tab-icon illustrations | 4–6 | hero illustrations on tab landing screens |
| Tool intros | 4 | Symptom Navigator, Clarity Score, Mood Tracking, Breathing |
| Milestone celebrations | 3–5 | streak day, tool complete, series finished |
| Breathing states | 2–3 | calm, focused, transition |

### 4.2 Style requirements

- Faceless — no eye/mouth/feature detail that reads as demographic.
- Universal-humanity body proportions — not exaggerated, not athletic, not slender. A single reference body type.
- Consistent palette across library — matte-leaning, not high-saturation. Cross-platform identity carrier — must read coherent against both web and mobile color systems.
- No props that culturally code (e.g., no kimono, no rosary, no graduation cap). Universal objects only (chair, book, doorway, plant, cup).

### 4.3 Five practical items (locked)

1. **Style guide first, library second.** Illustrator delivers a 1-page style guide + 3–5 sample figures; Ryan + Dr. Dobson approve before full library production starts. Avoids "we've paid for 30 figures we can't ship".
2. **Phased delivery.** V1 batch = onboarding (5–8) + empty states for Today/Learn/Compass/Find. V2 batch = tool intros + milestones. V3 batch = breathing + remaining empty states. Phase 6 first-feature ship needs only V1 figures present; the rest land in subsequent sprints.
3. **File format.** Vector source delivered (SVG + AI). Exported PNGs at 1x/2x/3x for legacy fallback. Inline SVG used in `<Image>` / SVG-component wrappers in React Native. Source files committed to `assets/clay-figures/source/`; flattened SVGs to `assets/clay-figures/svg/`.
4. **License.** Full commercial ownership transfer to Psychage. Exclusive-use clause — illustrator cannot resell, license to competitors, or include in portfolio publicly available to commercial use cases. Contract handled separately; this contract documents the requirement.
5. **Character system consistency.** A single reference sheet (proportions, palette, line weight, shading style) governs every figure. Reviewing samples without the reference sheet visible is not acceptable — drift across the library is the failure mode to prevent.

---

## 5. Anti-slop patterns

Enumerated and detected by [`.claude/skills/mobile-design-audit/`](.claude/skills/mobile-design-audit/). Mobile covers all **12 patterns** — the 10 web-applicable patterns (numbers `1, 2, 3, 4, 5, 6, 8, 9, 10, 12`) plus the 2 mobile-only patterns (`7` generic 4-tab bottom nav, `11` missing haptics on primary CTAs).

Detection rules, passing snippets, failing snippets, and per-pattern exceptions live in [.claude/skills/mobile-design-audit/patterns.md](.claude/skills/mobile-design-audit/patterns.md). The IA decisions in §2 and the haptic firing rules in §3.3 are designed so that Patterns 7 and 11 are **satisfied by construction** — custom tab labels (Today/Learn/Compass/Find) clear Pattern 7; the firing rules + the `haptic.affirm` mandate on primary CTAs clear Pattern 11.

---

## 6. Cross-platform coherence

Web and mobile maintain **fully independent** design systems per `.claude/workspace.json` `design.approach`. The only intentional cross-platform shared values are:

- **Color tokens** — every value in `color.background`, `color.surface.*`, `color.primary.*`, `color.text.*`, `color.border.*`, `color.semantic.*`, `color.crisis.red`, `color.relevance.*`, `color.teal.*`, `color.charcoal.*`, `color.mood.{1..5}`. Copied verbatim from `tokens/web.tokens.json` at this contract's authoring. Any future amendment is applied to both files in the same commit.
- **Mood palette** — `color.mood.{1..5}` values identical across platforms (mood-feature-scoped, but the hex set is shared identity).
- **Clay figures** — see §4. Single library, same set of figures consumed by both platforms.
- **Type families** — IBM Plex Sans (body/UI) + Fraunces (display), per the DD-001 lock (§1.2). All mobile-specific; none shared with web. Web's families (Inter / Plus Jakarta Sans / IBM Plex Mono) are independent. The mobile `mono` token was dropped (no production use) — mobile carries no monospace family. The divergence is intentional, not drift.

**Mobile-only tokens with no web equivalent:**
- `motion.duration.breath` (4000ms) — web has no comparable breath-cycle duration.
- All `haptic.*` tokens — web platform has no haptic primitives.
- All `audio.*` tokens — V1 empty by design; even when V2 activates, web audio is out of scope.
- `motion._reducedMotion.breath` two-tier override — web's `prefers-reduced-motion` is binary at the CSS layer; mobile gets the in-app toggle on top.

**Carry-over watch-out from DESIGN.web.md §7 Q7:** the two-color-system architecture (`color.text.*` themed L/D vs `color.charcoal.*` non-themed neutrals) applies on mobile too. NativeWind 5 consumes both. Slice-4-style "consolidate to one neutral scale" is not on the mobile roadmap — the two serve different jobs on mobile for the same reasons they coexist on web.

---

## 7. Mobile screen template

Any new mobile feature spec generated by `/spec-design` must include the following sections. This template is the contract for spec-design output completeness.

- **Archetype.** Which IA pattern (which tab the surface lives on, what depth level — root, push 1, modal, sheet, etc.).
- **Mirrors.** Which existing screen pattern it inherits from (a Mobbin reference, or a previously shipped Psychage screen once they exist).
- **Touch targets.** All interactive targets meet the 44pt iOS HIG / 48dp Android Material minimum. Audit notes any exceptions.
- **Haptic events.** Which `haptic.*` token fires at which user action. Audit verifies §3.3 firing-rule compliance.
- **Audio events.** Typically none in V1 (per §3.2). If a content-bearing audio asset is involved (Dr. Dobson video), note it.
- **Animation events.** Which `motion.duration.*` and `motion.easing.*` tokens are used. Note any animation that crosses the 200ms vestibular threshold and confirms a Reduce Motion path exists.
- **Signature moment.** Any sensorial-anchored moment (mood submit, tool complete, breath cycle). Cross-modal coherence (§3.4) must be honored — partial expressions are anti-slop.
- **Accessibility.** Reduce Motion handling per §3.1 two-tier rule. VoiceOver labels for all non-decorative elements. Contrast floor WCAG AA (matches web).
- **Platform deltas.** Any iOS-only or Android-only behavior. The default is platform-consistent — deltas need a documented reason.

---

## 8. What's NOT in this contract

- The `apps/mobile/` codebase. Phase 6.
- React Native + Expo wiring (Expo Router setup, NativeWind 5 config, Reanimated v4 setup, react-native-reusables install). Phase 6.
- The component library itself — primitives, variants, story files. Downstream of this contract.
- The illustrator commission. Tier 3 scope is locked here; commission timing, contract, and figure delivery are tracked in `.claude/workspace.json` `clayFigures`.
- `/ultrareview` activation. Pass 3 hook preserved in `mobile-design-audit/SKILL.md` for future activation; default behavior is `SKIPPED (disabled)`, matching the web `/design-audit` precedent.
- Core Haptics AHAP patterns via a native module. V1 ships JS-driven sequenced haptics (see §3.3 watch-out). AHAP fidelity is a V1.1 candidate.
- Sized typography scale + concrete spacing scale. Stubs only — calibrated against the first mobile screen design in Phase 6 (see §1.2 and §1.3).
