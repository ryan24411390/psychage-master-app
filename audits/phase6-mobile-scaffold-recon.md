# Phase 6 Slice 1 — Mobile Scaffold Recon

**Date:** 2026-05-21
**Branch:** `recon/phase-6-mobile-scaffold`
**Base SHA:** `15d3383` (Phase 5 close, `chore(phase-5): transition to phase 6`)
**Author:** Claude (recon-only artifact)
**Scope:** Read-only audit. No production code changes. Input for Slice 2+ planning.

Style mirrors `audits/phase5-shared-lift-recon.md`: path:line citations, terse, surprises and questions surfaced.

---

## 1. `packages/shared` public interfaces

`packages/shared` was lifted in Phase 5 (Slice 2, PR #11 squash `4a94878`). Mobile must consume Navigator + PEAF + sensitivity through these surfaces. Per-module enumeration follows. Where adapter behavior must be supplied, the DI-seam convention (`rules/conventions.md:31`) applies.

### 1.1 `packages/shared/sensitivity/` — barrel export

[`packages/shared/sensitivity/index.ts`](packages/shared/sensitivity/index.ts) re-exports:

| Export | Source | Type |
|---|---|---|
| `SENSITIVITY_TERMS` | [`terms.ts:24`](packages/shared/sensitivity/terms.ts#L24) | `SensitivityTerm[]` (30 entries — verified via `grep -c "^\s*{ term:"`) |
| `SensitivityTerm` | [`terms.ts:19`](packages/shared/sensitivity/terms.ts#L19) | type |
| `scanForSensitivity` | [`filter.ts:22`](packages/shared/sensitivity/filter.ts#L22) | `(content: string) => SensitivityFlag[]` |
| `SensitivityFlag` | [`filter.ts:15`](packages/shared/sensitivity/filter.ts#L15) | type |

30-term count reconciles with [`packages/shared/README.md`](packages/shared/README.md) and CLAUDE.md §4 SR-5. Recon §2.2 of [`audits/phase5-shared-lift-recon.md`](audits/phase5-shared-lift-recon.md) listed 31 (stale historical artifact per `learnings.md:215` watch-out).

**Mobile consumer note:** `scanForSensitivity` is pure, side-effect-free, no DI seam needed. Wire it into any LLM-output guardrail surface, generated-copy lint, and (V1.1+) any user-generated-content surface.

### 1.2 `packages/shared/peaf/` — barrel export

[`packages/shared/peaf/index.ts`](packages/shared/peaf/index.ts) re-exports the full PEAF surface:

- **Functions:** `runQualityGate`, `analyzeReadability`.
- **Types:** `SourceTier`, `ArticleType`, `ArticleTemplate`, `EnhancedCitation`, `QualityGateResult`, `QualityCheck`, `QualityGateInput`, `ReadabilityResult`, `SensitivityFlag`.
- **Constants:** `SOURCE_TIERS`, `SOURCE_TYPE_TO_TIER`, `LEGACY_SOURCE_TYPE_MAP`, `EXPANDED_SOURCE_TYPES`, `ARTICLE_TEMPLATES`, `ARTICLE_TYPE_OPTIONS`, `QUALITY_GATE`, `SENSITIVITY_TERMS`, `BLOCKED_SOURCE_DOMAINS`.
- **Content architecture:** `CONTENT_CATEGORIES`, `TOTAL_ARTICLE_TARGET`, `getCategoryByNumber`, `getCategoryBySlug`, `getCategoriesForInstrument`, `getCategoriesForCondition`, `GAP_CLOSER_CATEGORIES`, `FOUNDATION_CATEGORIES`, `ContentCategory`, `ClarityInstrument`.

**Mobile consumer note:** PEAF is content-side. Mobile V1 surfaces articles via WebView (see `psychage-v2` integration), not native rendering. `runQualityGate` will not be called from `apps/mobile` in V1. Type re-exports (`SourceTier`, `ArticleTemplate`) are useful if mobile builds a content-catalog browser. No DI seams.

### 1.3 `packages/shared/navigator/` — NO barrel; per-file enumeration

[`packages/shared/navigator/`](packages/shared/navigator/) ships no `index.ts`. Mobile must import per file. The 10 source files and their exports:

| File | Line | Export | Notes |
|---|---|---|---|
| [`engine.ts`](packages/shared/navigator/engine.ts#L44) | `44` | `runSymptomNavigator(userInputs, knowledgeBase, userRegion?)` | Main entry. **Floors confidence_cap at line 54** via `Math.min(rawConfig.confidence_cap, CONFIDENCE_CAP)` — SR-1 belt-and-braces. |
| [`scoring.ts`](packages/shared/navigator/scoring.ts) | `46` / `164` / `231` | `calculateConditionScore`, `rankAndDiversify`, `scoreAllConditions` | Pure scoring. Second SR-1 floor at `scoring.ts:127` (`effectiveCap = Math.min(config.confidence_cap, CONFIDENCE_CAP)`) and an absolute final cap at `scoring.ts:139`. |
| [`safety.ts`](packages/shared/navigator/safety.ts#L33) | `33` | `screenRedFlags(symptoms, allSymptoms, crisisResources, userRegion?)` | SAFETY FIRST. CRISIS → `should_halt: true` ([`safety.ts:102`](packages/shared/navigator/safety.ts#L102)). Enforces SR-2 / SR-3 invariant. |
| [`utils.ts`](packages/shared/navigator/utils.ts) | `26` / `93` / `122` / `134` / `145` / `162` / `173` / `184` / `192` / `201` / `214` | `DEFAULT_MATCHING_CONFIG`, `normalizeSymptoms`, `getSeverityModifier`, `getFrequencyModifier`, `getDurationModifier`, `combinedModifier`, `getRelevanceLevel`, `getRelevanceLabel`, `getRelevanceColor`, `NAVIGATOR_DISCLAIMER`, `PROHIBITED_PHRASES` | `DEFAULT_MATCHING_CONFIG.confidence_cap` references `CONFIDENCE_CAP` directly. `PROHIBITED_PHRASES` is the build-time SR-3 lint list (29 entries). |
| [`constants.ts`](packages/shared/navigator/constants.ts#L19) | `19` | `CONFIDENCE_CAP` | `0.75 as const`. Sacred Rule #1 source of truth. |
| [`featureFlags.ts`](packages/shared/navigator/featureFlags.ts) | `61` / `71` / `84` | `IsTierEnabledFn`, `filterByFeatureFlags`, `getEnabledTiers` | **Only DI seam in the package.** Predicate signature: `(tier: 1\|2\|3\|4\|5\|6) => boolean`. |
| [`defaults.ts`](packages/shared/navigator/defaults.ts) | `7` / `16` | `SYMPTOM_DEFAULTS`, `SYMPTOM_DETAIL_UX_THRESHOLD` | Severity=5, duration=`2_to_4_weeks`, frequency=`sometimes`. UX threshold 8. |
| [`providerQuestions.ts`](packages/shared/navigator/providerQuestions.ts#L18) | `18` | `generateProviderQuestions({results, selectedSymptoms, knowledgeBase?})` | Returns 4–6 personalized questions; falls back to generic set. |
| [`stepConfig.ts`](packages/shared/navigator/stepConfig.ts) | `6` / `8` / `15` / `57` / `64` / `71` / `78` / `86` | `NavigatorStep`, `StepConfig`, `STEP_CONFIGS`, `getStepConfig`, `getStepNumber`, `getTotalSteps`, `isStepBefore`, `wouldJumpInvalidateData` | 6-step flow: welcome / domains / symptoms / details / processing / results. |
| [`types.ts`](packages/shared/navigator/types.ts) | `13`–`383` | Full type system | `Symptom`, `Condition`, `ConditionWithMappings`, `MatchingConfig`, `ScoringConfig`, `KnowledgeBase`, `NavigatorResults`, `SafetyResult`, `RedFlag`, `CrisisResource`, etc. `DURATION_TO_DAYS` lookup at `types.ts:367`. |

### 1.4 DI-seam consumers — mobile adapter contract

Per `rules/conventions.md:31` (Convention #3, surfaced PR #11). The Navigator package declares one DI seam — `filterByFeatureFlags`'s `isTierEnabled?` predicate. Mobile must supply an `expo-constants`-backed implementation reading `Constants.expoConfig.extra.navigatorTiers` (or equivalent EAS Update channel).

**Adapter signature mobile authors:**

```typescript
import type { IsTierEnabledFn } from '@psychage/shared/navigator/featureFlags';
// (or via packages/shared/navigator path resolution after workspace wiring)

export const mobileTierEnabled: IsTierEnabledFn = (tier) => {
  // read from expo-constants / EAS Update remote config
  return /* tier-specific check */;
};
```

**Sharp edge:** [`engine.ts:74`](packages/shared/navigator/engine.ts#L74) calls `filterByFeatureFlags(knowledgeBase.conditions)` with **no predicate argument** — meaning the top-level `runSymptomNavigator` entry point cannot inject the predicate today. Web (`psychage-v2`) suffers the same; the package default `() => true` falls open (all tiers enabled). Mobile has three options:

1. Accept the default (all tiers always enabled in V1). Lowest effort; matches current web behavior.
2. Bypass `runSymptomNavigator` and call `screenRedFlags` → `filterByFeatureFlags(conditions, mobileTierEnabled)` → `scoreAllConditions` → `rankAndDiversify` directly. Reproduces engine logic in app code; fragile.
3. Patch `packages/shared/navigator/engine.ts` to accept and thread an optional `isTierEnabled` argument. Cleanest; one-line signature change + one-line `filterByFeatureFlags(_, isTierEnabled)` change. Out of scope for Phase 6 (this is `packages/shared` work) but the right place to land it.

Recommend option 1 for V1 (matches web), file option 3 as a Phase 5.B/Phase 7 follow-up if mobile demands tier control. Surfaced to Slice 3.

### 1.5 Adapter gaps mobile must author *outside* shared

Per [`packages/shared/README.md`](packages/shared/README.md) "Not lifted" + recon `audits/phase5-shared-lift-recon.md` §1.3:

| Concern | Source state | Mobile lands at |
|---|---|---|
| `analytics.ts` | Supabase + env coupled (left in `psychage-v2`) | `apps/mobile/src/lib/analytics.ts` after Procedure-B analytics decision (open §6 in `PROJECT_CONTEXT.md`) |
| `config.ts` (env access) | `import.meta.env.VITE_NAVIGATOR_*` web-only | `apps/mobile/src/lib/navigatorConfig.ts` wrapping `expo-constants` |
| `storage.ts` | `localStorage` web-only | `apps/mobile/src/lib/navigatorStorage.ts` wrapping MMKV with SR-13 versioned migrator |
| PII telemetry sanitizer | [`rules/security.md:170`](rules/security.md#L170) cites `packages/shared/sensitivity/` but the module does **not** exist | Deferred per `learnings.md:202` (Phase 5.B or Phase 9 prereq). Mobile must NOT write its own; wait for the shared lift. |

---

## 2. `DESIGN.mobile.md` adapter contracts

What `apps/mobile/` must honor at scaffold (Slice 3+). Tokens are wired through NativeWind v5 (per `workspace.json.tooling.componentLibrary`) → consume from [`tokens/mobile.tokens.json`](tokens/mobile.tokens.json) via the theme extension.

### 2.1 Haptic event → token mapping

Per [`DESIGN.mobile.md`](DESIGN.mobile.md) §3.3 firing rules + [`tokens/mobile.tokens.json:160`](tokens/mobile.tokens.json#L160):

| Trigger | Token | Expo Haptics primitive |
|---|---|---|
| Primary CTA, mood submit, tool start | `haptic.affirm` | `Haptics.impactAsync(ImpactFeedbackStyle.Light)` |
| Tab change, toggle, list-item select | `haptic.tap` | `Haptics.selectionAsync()` |
| Form submit, save, step complete | `haptic.confirm` | `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` |
| Tool/series completion (signature) | `haptic.complete` | Sequenced: Light→Medium→Success (0/80/80ms via chained `setTimeout`) |
| Confirmation prompts before destructive actions | `haptic.alert` | `Haptics.notificationAsync(NotificationFeedbackType.Warning)` |
| Milestone, streak day, tool completion | `haptic.celebrate` | `Haptics.notificationAsync(NotificationFeedbackType.Success)` |
| Breathing inhale (~800ms) | `haptic.breath_in` | Sequenced: Light→Light→Medium (0/200/200ms) |
| Breathing exhale (~800ms) | `haptic.breath_out` | Sequenced: Medium→Light→Light (0/200/200ms) |

### 2.2 No-haptic zones (hard rule)

Per [`tokens/mobile.tokens.json:211`](tokens/mobile.tokens.json#L211):

- Error states → warm copy + visual only (no `haptic.error` exists by design — would read as punitive).
- High-frequency micro-interactions: typing, slider drag deltas, scroll velocity. End-of-gesture aggregate is acceptable; per-event is not.
- Background notifications — OS notification haptic owns this surface.

### 2.3 OS respect requirements

Per [`tokens/mobile.tokens.json:205`](tokens/mobile.tokens.json#L205):

- iOS System Haptics toggle → honor (expo-haptics no-ops automatically; verify in QA).
- Low Power Mode → honor (auto no-op; verify).
- **In-app toggle: REQUIRED** in avatar → accessibility sheet. Phase 6 must ship this affordance.

### 2.4 Motion-token wiring (Reanimated v4)

Per [`tokens/mobile.tokens.json:130`](tokens/mobile.tokens.json#L130) and `DESIGN.mobile.md` §3.1:

- `motion.duration.{swift|base|calm|breath}` → ms integers (no string→number parse needed).
- `motion.easing.{out|in|standard|breath}` → cubic-bezier strings (Reanimated v4 accepts strings; coerce to control-point arrays at adapter site if its API requires it — see §7 Reanimated 4 notes).
- `motion._reducedMotion`: two-tier handling. Non-essential disabled. Essential cross-fade 200ms. Breath static-by-default with in-app override toggle in avatar accessibility sheet. Encode per-component via Reanimated 4's `useReducedMotion()` hook (never global disable).
- Cross-modal coherence (`DESIGN.mobile.md` §3.4): `motion.duration.breath` + `haptic.breath_in/out` + breathing clay-figure must fire together or not at all.

### 2.5 Type-scale + spacing calibration gaps

Per [`tokens/mobile.tokens.json:106`](tokens/mobile.tokens.json#L106) `type._omitted` + [`tokens/mobile.tokens.json:111`](tokens/mobile.tokens.json#L111) `spacing._omitted`:

- Type sizes / weights / leadings / trackings = **skeleton stubs only**. Calibrated against first mobile screen design in Phase 6.
- Spacing scale = **skeleton stubs only**. 8pt baseline locked. Steps (4/8/12/16/24/32) authored against first mobile screen design in Phase 6.
- **Implication for Slice 3:** must NOT invent a type or spacing scale. The first mobile screen design (Mood Quick-Check tracer per roadmap line) is the calibration surface. `learnings.md:165` watch-out: when the stubs are filled, `.claude/skills/mobile-design-audit/SKILL.md` must remove its stub-aware exemption.

### 2.6 Audio

[`tokens/mobile.tokens.json:219`](tokens/mobile.tokens.json#L219): `audio._v1` empty by design. V2 candidates (`audio.complete` chime, `audio.ambient` breathing loops) gated on: signature-moment audit + Dr. Dobson clinical sign-off + Reduce Audio honored at firing site. **Slice 3 ships no UI audio.**

---

## 3. `tokens/mobile.tokens.json` calibration status

Per family. Cross-platform sync risk per `rules/conventions.md:9` (Convention #1) — color edits on one platform must land on the other in the same PR.

| Family | Status | Cross-platform sync (Convention #1) |
|---|---|---|
| `color.background` / `color.surface.*` | ready (verbatim from web) | **YES** — must sync edits |
| `color.primary.*` / `color.text.*` / `color.border.*` / `color.semantic.*` | ready (verbatim from web) | **YES** |
| `color.crisis.red` | ready (`#DC2626`, non-themed) | **YES** |
| `color.relevance.{high,moderate,explore}` | ready (verbatim from web) | **YES** |
| `color.teal.{50,100,400,500,600,700,900}` | ready (sparse 7-step subset from web's full ramp) | **YES** |
| `color.charcoal.{50..950}` | ready (11-step non-themed, verbatim from web) | **YES** |
| `color.mood.{1..5}` | ready (verbatim from web, mood-feature-scoped) | **YES** |
| `type.family.{sans,display,mono}` | ready (Inter / Plus Jakarta Sans / IBM Plex Mono) | shared identity, value-equivalent (RN font asset names vs CSS font-family strings) |
| `type.size/weight/leading/tracking` | **needs-device-calibration** (`_omitted` stubs only) | platform-specific |
| `spacing.*` | **needs-device-calibration** (`_omitted` stubs only, 8pt baseline locked) | platform-specific |
| `radius.{lg,xl,full}` | ready (3-step subset of web's 5-step) | divergent by design — mobile drops sm/md + 2xl/3xl emphasis tier |
| `motion.duration.{swift,base,calm,breath}` | ready (ms integers) | divergent unit literal (web uses seconds-string) |
| `motion.easing.{out,in,standard,breath}` | ready (cubic-bezier strings) | `motion.easing.standard` divergent from web by design (mobile sharper); documented at [`tokens/mobile.tokens.json:138`](tokens/mobile.tokens.json#L138) |
| `motion._reducedMotion` | ready (two-tier + breath override) | mobile-only structure |
| `haptic.{tap,affirm,confirm,celebrate,alert,complete,breath_in,breath_out}` + `_OSRespect` + `_noHapticZones` | ready (8 tokens + 2 meta) | platform-only (no web equivalent) |
| `audio._v1` | platform-only, **V1 empty** | platform-only |

**Drift risk:** Convention #1 enforcement is PR-review-only today (no CI rule). Any `color.*` value edit on one platform that doesn't land on the other in the same PR is a brand-identity bug.

---

## 4. `audit_events` schema starting point (input for Slice 7 surface-plan checkpoint)

**Not a commitment.** Slice 7 owns the schema PR. This is input only.

Derived from [`rules/regulatory.md`](rules/regulatory.md) §3 + [`rules/security.md:73`](rules/security.md) §2.5 + CLAUDE.md "Procedure B" item 5 + [`workspace.json.openSecurityQuestions.audit-events-schema`](.claude/workspace.json) (`targetPhase: 6`).

### 4.1 Required fields per row

`user_id` (FK to `auth.users`), `event_type` (enum), `ip_address`, `device_id`, `timestamp`, `success` (boolean).

### 4.2 Optional fields

`failure_reason` (enum, when `success=false`), `metadata` (jsonb — sanitized via `packages/shared/sensitivity/` PII regex **once it exists**, per `learnings.md:202` deferral).

### 4.3 Event taxonomy — starting set

Auth + premium per Procedure B item 5. Therapist linking is MFA-gated per `workspace.json.auth.mfaMandatoryFor`.

- **Auth:** `signup`, `signin`, `signin_mfa_challenge`, `signin_mfa_success`, `signin_mfa_failure`, `signout`, `password_change`, `password_reset_request`, `password_reset_complete`, `account_deletion_request`, `account_deletion_complete`, `mfa_enroll`, `mfa_disable`, `oauth_link_apple`, `oauth_link_google`, `passkey_enroll`, `breach_password_rejected`.
- **Therapist (MFA-gated):** `therapist_link_create`, `therapist_link_edit`, `therapist_link_delete`, `therapist_share_create`.
- **Account / data:** `data_export_request`, `data_export_complete`.
- **Premium:** `subscription_purchase`, `subscription_renew`, `subscription_cancel`, `subscription_refund`.

### 4.4 PII discipline boundaries

Per `rules/security.md` §2.5 + Sacred Rule #11 (CLAUDE.md §4):

- **Never store:** passwords, MFA secrets, OAuth refresh tokens, journal content, symptom selections, raw Navigator choices, therapist contact details (email/phone/notes).
- **Store:** `user_id` (opaque), IP address (raw — see open question), `device_id`, `event_type`, `timestamp`.
- **Open question for Slice 7:** is IP address a PII bucket that needs hashing? Storing raw aids incident-response correlation; hashing aids privacy. State-law-breach-window decision (WA MHMDA, CA CCPA/CMIA) shapes this. Surface to surface-plan checkpoint.

### 4.5 Regulatory boundaries

Per [`rules/regulatory.md`](rules/regulatory.md) §2.1, §2.2:

- **HIPAA covered-entity:** NO. `audit_events` does not need HIPAA's 6-year retention.
- **42 CFR Part 2 (SUD):** out of V1 scope (no SUD-specific events in this taxonomy).
- **Retention:** follows GDPR + state consumer-health law. Typically 1–3 years post-account-deletion for fraud-defense audit trail. Counsel specifies the exact window.

**This is INPUT for Slice 7 surface-plan checkpoint, NOT a schema commitment.**

---

## 5. `.phase` semantics — proposed convention

### 5.1 State at plan-time

Per [`.claude/workspace.json`](.claude/workspace.json):

- `.phase = 4`
- `.phaseLabel = "spec-driven-workflow-deploy"`
- `phaseRoadmap["4"].status = "complete"`
- `phaseRoadmap["4.A"].status = "complete"`
- `phaseRoadmap["4.B"].status = "complete"`
- `phaseRoadmap["5"].status = "complete"`
- `phaseRoadmap["6"].status = "pending"`

Phases 4.A / 4.B / 5 all closed without bumping `.phase` or `phaseLabel`. The fields are stale relative to the roadmap.

### 5.2 Three options

**(a) `.phase` tracks current-active phase — flips at kickoff.**
Slice 2 retroactively bumps `.phase` to `6` + sets `phaseLabel` to phase 6's roadmap label. Future phases: kickoff commit bumps; close commit does not.

**(b) `.phase` tracks last-completed phase — flips at close.**
Slice 2 retroactively bumps `.phase` to `5`. Phase 6 close (later commit) bumps to `6`. Drawback: introduces an off-by-one between human language ("I'm working on phase 6") and the `.phase` value.

**(c) Deprecate `.phase` and `phaseLabel` entirely.**
`phaseRoadmap` becomes single source of truth. Tools / hooks that consume `.phase` (none today — verified by absence in grep over `.claude/skills/` + hooks) read the highest `phaseRoadmap[N].status == "in-progress"` (or default to highest `complete` + 1).

### 5.3 Recommendation

**Option (a).** Justification:

- Matches human-language intuition ("we're in phase 6").
- One update per kickoff (low overhead).
- Future-proof against tools that may someday consume `.phase` (status-line scripts, SessionStart hooks).
- Option (c) is the most coherent but burns a field that already exists and may be referenced in unwritten future tooling.
- Option (b) is least intuitive — the off-by-one will trip up future Claude sessions reading the field.

**Ryan decides at PR review.** Slice 2 applies the resolution as part of the kickoff commit.

---

## 6. Monorepo wiring decisions (proposed shapes — for review, not commitment)

### 6.1 `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

Per SDK 54 guidance (see §7.1), SDK 54 introduced an alternative: set `nodeLinker: hoisted` directly in `pnpm-workspace.yaml` rather than `.npmrc`. Slice 3 picks one shape.

### 6.2 Root `package.json` (private, scripts only)

```json
{
  "name": "psychage-master-app",
  "private": true,
  "version": "0.0.0",
  "packageManager": "pnpm@9.x",
  "engines": { "node": ">=20" },
  "scripts": {
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint"
  },
  "pnpm": {
    "overrides": {
      "react": "19.1.0",
      "react-dom": "19.1.0"
    }
  }
}
```

**Singleton-pinning critical.** Per Step 3 research (Tamagui Discussion #3860, verified SDK 54 + pnpm config): React/RN must resolve to single instances or "Invalid hook call" errors surface. `pnpm.overrides` only applies from workspace root, never workspace member.

### 6.3 Discrepancy to surface — PM conflict

`workspace.json.tooling.packageManager = "bun"` (locked Day 1 per `learnings.md:83`) but `packages/shared/` (Phase 5 Slice 2) shipped with **npm** `package-lock.json` (per `learnings.md:198` Slice 2 decisions). Phase 4.B's intent statement and the inner package's actual lock file disagree.

Three resolutions:

- (i) Stay with workspace.json declaration (Bun). Re-lock `packages/shared` as `bun.lockb`. Bun workspaces handle the monorepo. **Risk:** Bun's RN/Metro compat is improving but Metro tooling assumes node_modules layout pnpm/npm produce. Step 3 surfaced no Bun-with-Expo-SDK-54 monorepo reference setup.
- (ii) Flip workspace.json declaration to pnpm. pnpm has Expo first-class support per SDK 54 (see §7.1). `packages/shared/package-lock.json` deleted; root `pnpm-lock.yaml` becomes single lock. **Recommended by Step 3 research.**
- (iii) npm workspaces. Lowest tooling friction; loses Bun perf and pnpm's content-addressable store benefits.

**Slice 1 surfaces, Slice 3 must resolve. See §9 Q1.**

### 6.4 `apps/mobile/package.json` (workspace consumer)

```json
{
  "name": "@psychage/mobile",
  "private": true,
  "version": "0.0.0",
  "main": "expo-router/entry",
  "dependencies": {
    "@psychage/shared": "workspace:*"
  }
}
```

### 6.5 `.npmrc` (only if pnpm chosen and `pnpm-workspace.yaml.nodeLinker` not used)

```
node-linker=hoisted
public-hoist-pattern[]=*expo*
public-hoist-pattern[]=*react-native*
public-hoist-pattern[]=@react-native/*
public-hoist-pattern[]=metro*
```

Per Step 3 research. RN + Expo require hoisting due to native module resolution; isolated installs (SDK 54 default) break in practice on RN libraries. Slice 3 picks `.npmrc`-style vs `pnpm-workspace.yaml.nodeLinker` style.

### 6.6 `.gitignore` additions for Expo

```
.expo/
.expo-shared/
dist/
web-build/
ios/build/
ios/Pods/
android/build/
android/app/build/
android/.gradle/
*.jks
*.keystore
*.p8
*.p12
*.mobileprovision
.env.local
.env.*.local
```

Note: `.claude/workspace.json.parallelization.sequentialOnlyFiles` already includes `apps/mobile/app.json` and `package.json` — Slice 2 honors that (no parallel agents touch those two files).

---

## 7. External dependency landscape (Step 3 findings, ~30min time-box, May 2026)

| Dep | Workspace.json locked | May-2026 state | Known issue | Slice 3 workaround |
|---|---|---|---|---|
| Expo SDK | 54 | Stable. Supports isolated pnpm/Bun installs (default), but most RN libraries still need hoisting fallback | `autolinking.exclude` insufficient in pnpm monorepos — Metro `resolveRequest` block also required if multiple apps hoist conflicting deps | Use `pnpm-workspace.yaml.nodeLinker: hoisted` per SDK 54 guidance, OR `.npmrc node-linker=hoisted` |
| React Native | 0.81 | Locked V1; SDK 54 ships RN 0.81+. **New Architecture required by Reanimated 4** | Reanimated 4 dropped Paper/legacy renderer. SDK 54 default is New Arch enabled | None — accept New Arch |
| React | 19.1.0 | Per pnpm.overrides singleton-pinning recommendation | Required for RN 0.81 + Reanimated 4 + Expo SDK 54 | Pin in root `pnpm.overrides` |
| NativeWind | v5 | **Preview / pre-release. NOT stable yet** (per docs updated 2026-03-30 — official recommendation is v4 + Tailwind 3.4.17 for production) | `withNativewind(config)` API changed (no 2nd arg). Babel plugin auto-applied (remove `nativewind/babel` from babel.config.js). CSS-first config (no `tailwind.config.js`). Depends transitively on Reanimated 4+ and the renamed `react-native-css` peer dep | Accept preview channel risk OR downgrade workspace.json to NativeWind v4. Surface to Slice 3 as decision point. |
| tailwindcss | v4 (transitively via NativeWind v5) | v4.1+. CSS-first config; `@import "tailwindcss/theme.css"` etc. | Tied to NativeWind v5's pre-release status | See NativeWind row |
| Reanimated | v4 | **Stable.** Supports RN 0.80/0.81/0.82/0.83 (compat matrix). Worklets extracted to separate `react-native-worklets` package — Babel plugin name changes from `react-native-reanimated/plugin` to `react-native-worklets/plugin` | Old Architecture/Paper dropped. `useScrollViewOffset` → `useScrollOffset`. `runOnJS`/`runOnUI` → `scheduleOnRN`/`scheduleOnUI` from `react-native-worklets` | Slice 3 babel config must reference `react-native-worklets/plugin`. New Arch required |
| Expo Router | v5 (per workspace.json) | Built on React Navigation v7. **Industry leans file-based by default in SDK 50+** | React Navigation v8 alpha (Dec 2025) requires RN 0.83 / SDK 55 — INCOMPATIBLE with SDK 54 locked V1. Stay on v7 underpinning | None — Expo Router v5 + RN-v7 path is correct for SDK 54 |
| React Navigation | (transitive via Expo Router v5) | v7 stable; v8 alpha requires SDK 55+ | v8 alpha includes native bottom tabs by default — feature mobile WILL want post-V1.1 | Defer v8 upgrade to V1.1 / SDK 55+ migration |
| `lucide-react-native` | unpinned | **Compass icon exists** (`import { Compass } from 'lucide-react-native'`). v1.16.0 latest. Requires `react-native-svg` 12–15 peer | None blocking | See §8 — recommend lucide Compass for Slice 4 placeholder |
| Package manager | "bun" per workspace.json; `packages/shared` ships npm `package-lock.json` | **Conflict surfaced — see §6.3** | Slice 3 must-resolve | Surfaced to Q1 in §9 |
| `react-native-worklets` | not in workspace.json | New required Reanimated 4 peer dep | Must be installed alongside Reanimated 4 with matching version | Slice 3 adds |
| `react-native-css` | not in workspace.json | New required NativeWind v5 peer dep (renamed from `react-native-css-interop`) | Must be installed if NativeWind v5 path chosen | Slice 3 adds (or skipped if NativeWind v4 chosen) |

**Material Slice-3 impacts from research:**

1. **pnpm chosen + Bun rolled back?** Resolve PM conflict (§6.3) before Slice 3 begins scaffolding. Touches lockfile commit, `.npmrc`, every script invocation.
2. **NativeWind v5 preview risk.** If Ryan wants production-stable today, downgrade to NativeWind v4. If V1 launch can absorb a pre-release dep (with cache-clear/migration risk on upgrade), keep v5. The workspace.json declaration alone is not enough to justify shipping a preview.
3. **Babel plugin name change.** Slice 3's `babel.config.js` references `react-native-worklets/plugin`, not the old `react-native-reanimated/plugin`.
4. **`pnpm.overrides` for react/react-native singleton pinning.** Add to root `package.json` in Slice 2/3.
5. **Metro `resolveRequest` may be required** post-Slice-2 if `apps/api` or other future apps land alongside `apps/mobile` and create hoisted-dep conflicts. Not a Slice 3 blocker; surface in Phase 6 Slice "+1" for additional apps.

---

## 8. Compass icon placeholder approach (Slice 4)

Per [`DESIGN.mobile.md`](DESIGN.mobile.md) §2.1 the Compass tab needs a compass-rose glyph. Tier 3 illustrator scope (`workspace.json.design.platforms.mobile.clayFigureTier`) covers ~25–35 illustrations including tab-icon visuals — the final commissioned compass is a deferred Tier 3 deliverable (`workspace.json.design.clayFigures.deliveryETA = "2026-07-08"`).

Recon `learnings.md:178` (Phase 6 prep) stated: "No fitting icon found in `lucide-react-native`." **Step 3 research contradicts this**: the `Compass` icon **does exist** in `lucide-react-native` v1.16.0 (`import { Compass } from 'lucide-react-native'`, tagged direction/north/east/south/west/safari/browser). The recon assertion was wrong — verifiable at `https://lucide.dev/icons/compass`.

### Three options for Slice 4

**(a) Lucide `Compass` icon from `lucide-react-native`.** Verified available. Pros: zero asset work, matches the icon library mobile is already using for other tabs (per the implicit choice of `lucide-react-native` in workspace.json IA decision). Cons: generic visual — does not yet reinforce the orienting-metaphor brief that the illustrator commission will satisfy. Stylistic risk: lucide Compass is a stroked line glyph; if other tabs are clay-filled, visual inconsistency surfaces.

**(b) Inline SVG stub.** Author a placeholder compass-rose SVG at `apps/mobile/src/assets/icons/compass-placeholder.svg`. Pros: visual ownership now; can match clay-figure stroke weight. Cons: ~30min of design work for a throwaway placeholder.

**(c) Text label only.** Render "Compass" as text in the tab. Pros: zero ambiguity that it's a placeholder. Cons: visually inconsistent with the other 3 tabs (Today/Learn/Find) which carry icons.

### Recommendation

**(a) — lucide `Compass`.** Step 3 research confirms availability. Falls back to (b) if Slice 4 visual review finds the stylistic mismatch unacceptable.

**Slice 4 must set a grep-discoverable TODO marker** so the illustrator swap is trivial when the Tier 3 deliverables land:

```typescript
// TODO(tier-3-illustrator): replace with commissioned compass-rose figure
import { Compass } from 'lucide-react-native';
```

Also: amend `learnings.md:178` to correct the "no fitting icon" claim, OR add a learnings entry noting "lucide-react-native does include Compass; prior recon claim was wrong, verified Phase 6 Slice 1." Slice 2 chore commit is the right place.

---

## 9. Surface-plan questions for Slice 3

Grouped by urgency. **Slice 1 surfaces; Slice 3 cannot start scaffold until Q1–Q4 resolved.**

### 9.1 Must-resolve-before-Slice-3

1. **Package manager — pnpm or Bun?** [`.claude/workspace.json.tooling.packageManager`](.claude/workspace.json) says `"bun"`. `packages/shared/package-lock.json` (npm) ships per `learnings.md:198`. Pick one. Affects `.npmrc`, lockfile commit, every script. Step 3 research lean is pnpm (SDK 54 first-class support, verified monorepo reference setups). See §6.3.

2. **`.phase` semantics resolution.** Pick (a), (b), or (c) per §5.2. Slice 2 applies as kickoff commit.

3. **Workspace-aware `tsconfig.json` at root?** Or per-app `tsconfig.json` extending nothing? Affects path-alias propagation. `packages/shared/tsconfig.json:21` already aliases `@/lib/navigator/*` → `./navigator/*`. Mobile aliases (`@/components`, `@/lib`, etc. per CLAUDE.md §3 "Use the `@/` path alias") need a separate decision: live in `apps/mobile/tsconfig.json` only, or extend a root `tsconfig.base.json`.

4. **`packages/api` + `packages/i18n` scaffolds in Phase 6?** Per CLAUDE.md §2 planned layout. Do they ship in Slice 2 alongside `apps/mobile`, or later slices in Phase 6? Resolution shapes Slice 2's directory scaffold scope.

### 9.2 Can-resolve-during-Slice-3

5. **Expo Router v5 file structure.** `app/_layout.tsx` + 4 tab routes. Tab labels lock to Today/Learn/Compass/Find per `DESIGN.mobile.md` §2.1.

6. **NativeWind v5 (preview) vs v4 (stable).** Per §7 table. Workspace.json declares v5 but v5 is pre-release. Slice 3 picks. Recommend v5 if Ryan accepts cache-clear/migration risk; v4 if production stability is paramount today.

7. **Storybook RN.** Separate slice in Phase 6 per roadmap line; Slice 3 does not need to wire.

8. **First mobile screen for type/spacing calibration.** Mood Quick-Check tracer per Phase 6 roadmap line. Confirm this is the calibration surface for `type._omitted` and `spacing._omitted`.

### 9.3 Can-defer (Phase 7+ territory)

9. **Biome + husky + lint-staged.** Phase 7 per roadmap.
10. **`audit_events` schema commit.** Slice 7 surface-plan checkpoint. §4 here is input only.
11. **Compass illustrator-commissioned icon.** Tier 3 deferred (ETA 2026-07-08) per §8.
12. **Sentry RN + PostHog wiring.** Phase 9 per roadmap.
13. **EAS Build + EAS Update.** Phase 8 per roadmap.
14. **Engine `runSymptomNavigator` signature change** to thread `isTierEnabled` from caller (per §1.4 option 3). Phase 5.B or Phase 7. Not blocking V1.

---

## Surprises surfaced

1. **`packages/shared/navigator/` has no `index.ts` barrel.** Per-file imports required. Web (`psychage-v2`) was lifted from a per-file-import structure so this is intentional, but it inflates the `apps/mobile/` import surface.

2. **`runSymptomNavigator` cannot inject `isTierEnabled` today.** [`engine.ts:74`](packages/shared/navigator/engine.ts#L74) calls `filterByFeatureFlags(knowledgeBase.conditions)` with no predicate. The DI seam exists at the function level but is unreachable through the public entry point. Web suffers the same; mobile inherits.

3. **Sensitivity term count: confirmed 30** (not 31 from recon §2.2, not the 26/31 docs claim noted in CLAUDE.md). Verified via `grep -c "^\s*{ term:" packages/shared/sensitivity/terms.ts`. `learnings.md:215` watch-out tracks the historical recon overcount.

4. **PM conflict.** Workspace.json declares Bun; `packages/shared` ships npm `package-lock.json`. Phase 5 Slice 2 explicitly deferred reconciliation to Phase 6 (per `learnings.md:198`). Slice 3 must resolve.

5. **NativeWind v5 is pre-release.** Workspace.json locks it as if stable. Step 3 research finds the official docs explicitly recommend v4 + Tailwind 3.4 for production through at least March 2026. Surface to Ryan as a stability vs. feature-set decision, not a default.

6. **React Navigation v8 alpha requires SDK 55+.** Cannot land on V1's SDK 54 lock. Stay on v7 (transitive via Expo Router v5). When V1.1 migrates to SDK 55 or 56 (post-launch decision per `learnings.md:83`), revisit.

7. **`learnings.md:178` Compass-icon claim is wrong.** lucide-react-native does include a Compass glyph. Slice 2 chore commit corrects.

8. **Reanimated 4 babel-plugin rename.** `react-native-reanimated/plugin` → `react-native-worklets/plugin`. Easy to miss; would break the first build silently.

9. **`workspace.json.monorepo.packages.shared.exists = false`** remained stale post-Phase-5-Slice-2 per `learnings.md:217` watch-out. Slice 2 of Phase 6 should flip it as part of the monorepo wiring commit.

---

## Stop conditions evaluated

- Pre-flight gates: PASS. HEAD `15d3383c1d7e83c8693f1e919a0a2e7fa9027ee6` matches; `phaseRoadmap["5"].status = "complete"`; `phaseRoadmap["6"].status = "pending"`; `packages/shared/` exists; working tree clean.
- `packages/shared/navigator/` export enumeration: complete (no barrel; per-file enumeration in §1.3).
- `DESIGN.mobile.md` token-category references: all map to `tokens/mobile.tokens.json` entries (verified during cross-reference for §2 + §3).
- Step 3 SDK 54 / pnpm blockers: NONE blocking. SDK 54 has first-class pnpm support; hoisting fallback well-documented.
- Step 3 NativeWind v5 surprise: surfaced as Slice 3 decision (not a recon blocker).

---

## Constraints honored

- Write-allowed: `audits/phase6-mobile-scaffold-recon.md` only. No other file mutated.
- Read-only: `.claude/workspace.json`, `learnings.md`, `CLAUDE.md`, `DESIGN.mobile.md`, `tokens/**`, `rules/**`, `packages/**`, `psychage-v2/**`.
- No `pnpm init`, no `npx create-expo-app`, no `git submodule add`, no state-mutating commands beyond Step 1 + Step 5 git ops.
- Every claim cites `path:line` or external URL.
- `audit_events` schema NOT committed in §4.
