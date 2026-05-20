# Phase 5 Shared Lift Recon — psychage-v2

**Branch:** `recon/phase5-shared-lift`
**Source:** `/Users/raiyanabdullah/Desktop/psychage-v2/`
**Source commit:** `528a8d5988146ecf7c323ba7916414922ffcb7dd` (`528a8d5`)
**Audited at:** 2026-05-20T04:19:01Z (Slice 1)
**Source working tree:** clean modulo known pre-existing drift on `supabase/.temp/cli-latest` (Supabase CLI runtime file; see PROJECT_CONTEXT.md history)

---

## 1. Navigator scoring

### 1.1 Location

Single directory: [`src/lib/navigator/`](../../../Desktop/psychage-v2/src/lib/navigator/) (13 `.ts` files plus `__tests__/`). Core algorithm files:

- `src/lib/navigator/scoring.ts` (234 LOC) — `calculateConditionScore`, `rankAndDiversify`, `scoreAllConditions`. The 8-step matching algorithm.
- `src/lib/navigator/engine.ts` (229 LOC) — `runSymptomNavigator` orchestrator + safe-output generation.
- `src/lib/navigator/utils.ts` (244 LOC) — modifiers (severity/frequency/duration), normalization, relevance tiers, `DEFAULT_MATCHING_CONFIG`, `NAVIGATOR_DISCLAIMER`, `PROHIBITED_PHRASES`.
- `src/lib/navigator/safety.ts` (178 LOC) — `screenRedFlags`, CRISIS/URGENT/WATCH classification, region-aware crisis-resource resolution.
- `src/lib/navigator/types.ts` (383 LOC) — full type system (Symptom, Condition, MatchingConfig, KnowledgeBase, etc.), `DURATION_TO_DAYS` map.

Adjacent files in same dir:

- `providerQuestions.ts` (135 LOC) — pure question-generation logic
- `defaults.ts` (16 LOC) — symptom default thresholds
- `stepConfig.ts` (98 LOC) — step ordering metadata
- `featureFlags.ts` (91 LOC) — phased-rollout tier gating (Vite-env-coupled)
- `analytics.ts` (102 LOC) — Supabase + Vite-env-coupled
- `config.ts` (33 LOC) — Vite-env-coupled (age gate)
- `storage.ts` (114 LOC) — `localStorage`-coupled

### 1.2 Exports (key surfaces consumed by mobile)

From `engine.ts:43` — `runSymptomNavigator(userInputs, knowledgeBase, userRegion?) → NavigatorResults`.
From `scoring.ts:45/159/226` — `calculateConditionScore`, `rankAndDiversify`, `scoreAllConditions`.
From `utils.ts:25/92/121/133/144/161/172/183/191/200/213` — `DEFAULT_MATCHING_CONFIG`, `normalizeSymptoms`, modifier helpers, `getRelevanceLevel/Label/Color`, `NAVIGATOR_DISCLAIMER`, `PROHIBITED_PHRASES`.
From `safety.ts:33` — `screenRedFlags`.
From `types.ts` — all interfaces / type aliases (50+ exports).

### 1.3 Imports

External: none across the five core files (zero npm deps).
Internal (within the navigator/ dir only): `./types`, `./utils`, `./featureFlags`, `./safety`, `./scoring`.

Pure-TS lift candidates (no runtime/platform coupling): `scoring.ts`, `engine.ts`, `utils.ts`, `safety.ts`, `types.ts`, `providerQuestions.ts`, `defaults.ts`, `stepConfig.ts`.

Platform-coupled (cannot lift as-is — refactor or stay app-side):

- `analytics.ts:91` — `import.meta.env.DEV`
- `analytics.ts:96` — dynamic import of `../../lib/supabaseClient`
- `featureFlags.ts:69` — `import.meta.env[key]`
- `config.ts:20-24` — `import.meta.env.VITE_NAVIGATOR_*`
- `storage.ts:9,57,70,98,109` — `localStorage` (mobile uses MMKV per CLAUDE.md §4 Sacred Rule #4)

### 1.4 Consumers (in psychage-v2)

Production code:

- [`src/context/NavigatorContext.tsx:7-10`](../../../Desktop/psychage-v2/src/context/NavigatorContext.tsx) — types, analytics, storage
- [`src/components/screens/ProcessingScreen.tsx:4-5`](../../../Desktop/psychage-v2/src/components/screens/ProcessingScreen.tsx) — `runSymptomNavigator`, types
- [`src/components/screens/DomainSelectionScreen.tsx:6`](../../../Desktop/psychage-v2/src/components/screens/DomainSelectionScreen.tsx) — types
- [`src/components/screens/SymptomSelectionScreen.tsx:12`](../../../Desktop/psychage-v2/src/components/screens/SymptomSelectionScreen.tsx) — types
- [`src/components/screens/CrisisResourcesScreen.tsx:4`](../../../Desktop/psychage-v2/src/components/screens/CrisisResourcesScreen.tsx) — types
- [`src/components/screens/DurationSeverityScreen.tsx:14`](../../../Desktop/psychage-v2/src/components/screens/DurationSeverityScreen.tsx) — defaults
- [`src/components/screens/NavigatorFlow.tsx:16-17`](../../../Desktop/psychage-v2/src/components/screens/NavigatorFlow.tsx) — step config
- [`src/components/screens/ResultsScreen.tsx:20`](../../../Desktop/psychage-v2/src/components/screens/ResultsScreen.tsx) — provider questions
- [`src/components/screens/AgeGateScreen.tsx:5`](../../../Desktop/psychage-v2/src/components/screens/AgeGateScreen.tsx) — config
- [`src/components/navigator/ResultCard.tsx:4`](../../../Desktop/psychage-v2/src/components/navigator/ResultCard.tsx) — types (also hardcodes `/ 0.75 * 100` for relevance % display at lines 65, 70 — see §1.5)
- [`src/components/navigator/DurationPicker.tsx:2`](../../../Desktop/psychage-v2/src/components/navigator/DurationPicker.tsx) — types
- [`src/components/navigator/SymptomToggle.tsx:5`](../../../Desktop/psychage-v2/src/components/navigator/SymptomToggle.tsx) — types
- [`src/components/navigator/EnhancedProgressBar.tsx:7-8`](../../../Desktop/psychage-v2/src/components/navigator/EnhancedProgressBar.tsx) — step config

Total prod consumers: **13 files**. All UI; none of the algorithm core is consumed cross-domain.

### 1.5 75% relevance cap — exact location + enforcement

The "sacred 0.75 cap" surfaces in **five** code locations and **one** mock-data location:

| # | File:line | Form | Status |
|---|---|---|---|
| A | `src/lib/navigator/utils.ts:26` | `confidence_cap: 0.75` inside `DEFAULT_MATCHING_CONFIG` | Default — used only as fallback when knowledge-base API returns no config (`engine.ts:48`) |
| B | `src/lib/navigator/scoring.ts:125` | `let capped = Math.min(adjustedNormalized * countCap, config.confidence_cap);` | First enforcement point |
| C | `src/lib/navigator/scoring.ts:134` | `capped = Math.min(capped, config.confidence_cap);` // `SAFETY: Absolute cap enforcement — this must NEVER be removed` | Second enforcement point (after below-minimum penalty) |
| D | `src/lib/navigator/types.ts:187` | `confidence_cap: number;` in `MatchingConfig` interface | Type — no value enforcement |
| E | `src/lib/admin/constants.ts:67` | `export const CONFIDENCE_CAP = 0.75;` | Used by admin UI ([`src/pages/admin/v2/symptom-navigator/MappingMatrix.tsx:6`](../../../Desktop/psychage-v2/src/pages/admin/v2/symptom-navigator/MappingMatrix.tsx)) — **second source of truth, drift risk** |
| F | `src/data/mock_knowledge_base.ts:749` | `confidence_cap: 0.75` in mock data | Mock — falls back when API unavailable |

**Critical finding — the cap is config-driven, not code-hardcoded.** [`engine.ts:48`](../../../Desktop/psychage-v2/src/lib/navigator/engine.ts#L48) reads `config = knowledgeBase.matchingConfig ?? DEFAULT_MATCHING_CONFIG`. The cap value flows in from the API. If a Supabase response ever returns `matchingConfig.confidence_cap > 0.75`, the "absolute cap" rises silently — the `Math.min(...)` enforcement at scoring.ts:125 and 134 uses the *config* cap, not a literal `0.75`. The comment on line 133 reads "this must NEVER be removed" but the *value* is still mutable per request.

Sacred Rule #1 ("absolute maximum … enforced in 3+ places") is **partially** code-enforced today: the *mechanism* (Math.min) is in 2 places, but the *value* is API-supplied and admin-editable via an entirely separate `CONFIDENCE_CAP` constant in `src/lib/admin/constants.ts:67`. Slice 2 should consider whether to (a) hard-code `0.75` as a const in shared and assert against config at lift, (b) keep config-driven but add a runtime guard (`Math.min(value, 0.75)` floor on ingest), or (c) accept the drift risk and treat it as a `rules/security.md`-style policy.

UI display: [`src/components/navigator/ResultCard.tsx:65,70`](../../../Desktop/psychage-v2/src/components/navigator/ResultCard.tsx) divides `relevance_score / 0.75` to compute a 0–100% bar — also a hardcoded magic number. Lifting won't touch ResultCard (UI stays in apps), but the cap value coupling between scorer and UI is real.

### 1.6 Test coverage

Two test groupings exist:

Colocated (`src/lib/navigator/__tests__/`): `analytics.test.ts` (178 LOC), `storage.test.ts` (195 LOC) — both test the **platform-coupled** files, not the algorithm.

Centralised (`src/tests/navigator/`): `scoring.test.ts` (592 LOC), `safety.test.ts` (290 LOC), `expansion.test.ts` (374 LOC), `expansion-phase4.test.ts` (812 LOC), `robustness.test.ts` (217 LOC), `api.test.ts` (369 LOC), `test-helpers.ts` (2,291 LOC of fixture builders).

Algorithm-core tests total ~2,654 LOC + 2,291 LOC helpers = **~4,945 LOC of portable test surface**. All use `@/lib/navigator/*` path-alias imports. Test runner: Vitest.

### 1.7 Extraction complexity

**Algorithm core**: low complexity. `scoring.ts` + `engine.ts` + `utils.ts` + `safety.ts` + `types.ts` + `providerQuestions.ts` + `defaults.ts` + `stepConfig.ts` are zero-npm-dep pure TS (~1,540 LOC). Direct copy.

**Adapter layer needed**: `featureFlags.ts`, `config.ts`, `analytics.ts`, `storage.ts` are platform-coupled. Two options:

1. Lift only the pure core; leave adapters in each app (web keeps Vite-env featureFlags; mobile authors equivalents using `expo-constants` + MMKV).
2. Refactor each adapter to accept a platform-provider interface (e.g., `featureFlags.ts` takes a `getEnv(key) => string | undefined` parameter; mobile injects Expo Constants, web injects `import.meta.env`).

Option 1 is faster (Phase 5 90-min estimate per PROJECT_CONTEXT.md §6 holds). Option 2 prevents drift but is ~2× effort.

`storage.ts` is **client-side persistence** per Sacred Rule #4 ("Navigator state lives in MMKV"). Mobile MUST replace `localStorage` with MMKV; web stays as-is. Storage cannot share a single implementation — interface yes, implementation no.

---

## 2. Sensitivity filter

### 2.1 Reality vs. doc claim — significant divergence

**PROJECT_CONTEXT.md §6** claims: "Sensitivity filter | `src/lib/safety/` (specific files TBC during lift) | 26-term person-first language filter."
**CLAUDE.md §4 Sacred Rule #5** claims: "26-term sensitivity filter … lives in `packages/shared/sensitivity/` after Phase 5 lift."
**rules/security.md:86,152,170** claims: "Event properties sanitized via `packages/shared/sensitivity/` before emit" + "PII regex set. Defer to `packages/shared/sensitivity/`."

The doc claims describe **two distinct concerns** conflated under one name:

1. **Person-first language filter** (content sensitivity terms) — sub-feature of PEAF
2. **PII regex / telemetry sanitization** — referenced but not yet implemented

### 2.2 Reality: person-first filter EXISTS but inside PEAF, not `lib/safety/`

[`src/lib/article-framework/constants.ts:217-262`](../../../Desktop/psychage-v2/src/lib/article-framework/constants.ts#L217) — `SENSITIVITY_TERMS: { term: string; suggestion: string }[]` with **31 terms** (CLAUDE.md's "26-term" claim is stale; actual count is 31).

Categories observed: suicide-language (7), person-first replacements (10), suffering-victim language (6), dismissive ("just a phase") (3), identity-vs-condition ("is bipolar" → "has bipolar disorder") (5).

[`src/lib/article-framework/quality-gate.ts:268-298`](../../../Desktop/psychage-v2/src/lib/article-framework/quality-gate.ts#L268) — `checkSensitivity(content) → QualityCheck`. Lowercase contains-scan with positional context capture (20 chars each side). Returns `'warning'` status (non-blocking) with `SensitivityFlag[]` payload.

Type: [`src/lib/article-framework/types.ts:160-165`](../../../Desktop/psychage-v2/src/lib/article-framework/types.ts#L160) — `SensitivityFlag { term, suggestion, position, context }`.

Examples database: [`src/lib/article-framework/content-standards-data.ts:106`](../../../Desktop/psychage-v2/src/lib/article-framework/content-standards-data.ts#L106) — `sensitivityExamples: SensitivityExample[]` for admin UI surface.

### 2.3 Reality: `src/lib/safety/` is NOT a sensitivity filter

[`src/lib/safety/cognitiveDistortions.ts`](../../../Desktop/psychage-v2/src/lib/safety/cognitiveDistortions.ts) (99 LOC) — CBT reference data (`COGNITIVE_DISTORTIONS`), consumed by ClarityJournal report engine.
[`src/lib/safety/crisisKeywords.ts`](../../../Desktop/psychage-v2/src/lib/safety/crisisKeywords.ts) (23 LOC) — `CRISIS_KEYWORDS` array + `scanForCrisisKeywords()`, consumed by ClarityJournal `FreeFormSection.tsx`.

These are crisis-content + CBT data — useful but **not** the sensitivity filter described in the docs. They lift to a different shared destination (e.g., `packages/shared/safety/` for crisis text scan or `packages/shared/content/cbt/` for CBT reference). They are not what `packages/shared/sensitivity/` is meant to contain.

### 2.4 Reality: PII regex / telemetry sanitizer DOES NOT EXIST

Grep across `src/` for `pii\|sanitize\|redact\|scrub\|maskPii` returns nothing in `src/lib/`. `rules/security.md:170`'s "PII regex set. Defer to packages/shared/sensitivity/" describes a module that has not been authored — neither in psychage-v2 nor anywhere in master-app.

The closest existing surface is [`src/lib/sentry.ts`](../../../Desktop/psychage-v2/src/lib/sentry.ts) (if present — not in target scope of this audit), which the docs say has a `beforeSend` PII filter. Worth verifying in Slice 2 whether the Sentry filter is reusable or app-specific.

### 2.5 Exports + consumers (for what does exist)

`SENSITIVITY_TERMS` re-exported via `src/lib/article-framework/index.ts:28`.
Consumed only by `quality-gate.ts:checkSensitivity`. No direct consumers outside PEAF.

The PEAF quality gate is consumed by:
- [`src/components/admin/articles/QualityGateDashboard.tsx:14`](../../../Desktop/psychage-v2/src/components/admin/articles/QualityGateDashboard.tsx) — admin UI
- [`src/services/articleAdminService.ts:646`](../../../Desktop/psychage-v2/src/services/articleAdminService.ts) — server-side validation
- Tests in [`src/tests/article-framework/quality-gate.test.ts:225-238`](../../../Desktop/psychage-v2/src/tests/article-framework/quality-gate.test.ts#L225) — sensitivity-specific test cases exist

### 2.6 Extraction complexity

- **Person-first term filter:** trivial to extract — pure data (31-row array) + 30-line scanner function. Zero deps.
- **PII regex / telemetry sanitizer:** must be **authored from scratch**. Spec input lives in `rules/security.md` + `ARCHITECTURE.md §8`. Not a lift — a write. Slice 2 must decide: do this now, or defer to Phase 6 when first mobile telemetry call site lands.

---

## 3. PEAF validators

### 3.1 Location

[`src/lib/article-framework/`](../../../Desktop/psychage-v2/src/lib/article-framework/) — 8 `.ts` files + 1 `.md`:

- `quality-gate.ts` (418 LOC) — `runQualityGate` orchestrator + 11 individual check functions
- `readability.ts` (137 LOC) — Flesch-Kincaid implementation (`analyzeReadability`)
- `constants.ts` (280 LOC) — `SOURCE_TIERS`, `QUALITY_GATE` thresholds, `SENSITIVITY_TERMS`, `BLOCKED_SOURCE_DOMAINS`, `ARTICLE_TEMPLATES`, `EXPANDED_SOURCE_TYPES`, `LEGACY_SOURCE_TYPE_MAP`
- `types.ts` (165 LOC) — `SourceTier`, `ArticleType`, `ArticleTemplate`, `EnhancedCitation`, `QualityGateResult`, `QualityCheck`, `QualityGateInput`, `ReadabilityResult`, `SensitivityFlag`
- `content-architecture.ts` (626 LOC) — 15-category × 1,000-article taxonomy data + helper lookups (`getCategoryByNumber`, etc.)
- `content-standards-data.ts` (142 LOC) — admin UI reference data (examples for sensitivity, citation tiers)
- `citation-mapper.ts` (47 LOC) — legacy → expanded source-type mapper
- `index.ts` (49 LOC) — barrel export
- `CONTENT_GUIDELINES.md` (13 KB) — editorial doc, not code

Total: **~1,864 LOC** of TS.

### 3.2 Exports

`runQualityGate(input: QualityGateInput) → QualityGateResult` (the entry point).
`analyzeReadability(content: string) → ReadabilityResult`.
Plus all constants, all types, content-architecture lookups. See [`src/lib/article-framework/index.ts:1-49`](../../../Desktop/psychage-v2/src/lib/article-framework/index.ts) for full surface.

### 3.3 Imports

External npm deps: **zero** in all 8 files. No Zod, no Yup, no validator libraries. Pure TS, hand-rolled.
Internal: only intra-`article-framework/` cross-imports.

### 3.4 Consumers (in psychage-v2)

Production code:

- [`src/components/admin/articles/ArticleTypeSelector.tsx:3-4`](../../../Desktop/psychage-v2/src/components/admin/articles/ArticleTypeSelector.tsx) — types, constants
- [`src/components/admin/articles/CitationManager.tsx:12-18`](../../../Desktop/psychage-v2/src/components/admin/articles/CitationManager.tsx) — types, source-tier constants
- [`src/components/admin/articles/QualityGateDashboard.tsx:12-16`](../../../Desktop/psychage-v2/src/components/admin/articles/QualityGateDashboard.tsx) — `runQualityGate`, types, constants
- [`src/components/article/Citation.tsx:4-5`](../../../Desktop/psychage-v2/src/components/article/Citation.tsx) — source-tier display
- [`src/components/article/ReferenceList.tsx:4-5`](../../../Desktop/psychage-v2/src/components/article/ReferenceList.tsx) — source-tier display
- [`src/lib/admin/constants.ts:111`](../../../Desktop/psychage-v2/src/lib/admin/constants.ts#L111) — re-exports `ARTICLE_TYPE_OPTIONS`, `QUALITY_GATE`, `SOURCE_TIERS`
- [`src/pages/admin/v2/articles/ArticleCreator.tsx:14`](../../../Desktop/psychage-v2/src/pages/admin/v2/articles/ArticleCreator.tsx) — types
- [`src/pages/admin/v2/articles/ArticleDetail.tsx:64`](../../../Desktop/psychage-v2/src/pages/admin/v2/articles/ArticleDetail.tsx) — types
- [`src/pages/core/ContentStandardsPage.tsx:21`](../../../Desktop/psychage-v2/src/pages/core/ContentStandardsPage.tsx) — standards data
- [`src/services/articleAdminService.ts:645-646`](../../../Desktop/psychage-v2/src/services/articleAdminService.ts) — `EnhancedCitation`, `QualityGateResult`
- [`src/services/searchService.ts:27`](../../../Desktop/psychage-v2/src/services/searchService.ts) — `CONTENT_CATEGORIES`, `ContentCategory`

Total prod consumers: **11 files**. All web admin / web article rendering. **No mobile-side consumer expected** — mobile V1 does not include article admin (article reading is read-only on mobile, no quality-gate UX). Mobile may consume content-architecture taxonomy for category navigation, but not the validators.

### 3.5 Test coverage

[`src/tests/article-framework/quality-gate.test.ts`](../../../Desktop/psychage-v2/src/tests/article-framework/quality-gate.test.ts) (345 LOC), [`src/tests/article-framework/readability.test.ts`](../../../Desktop/psychage-v2/src/tests/article-framework/readability.test.ts) (86 LOC). Total **~431 LOC**. Path-aliased via `@/lib/article-framework/*`. Vitest.

### 3.6 Extraction complexity

**Low.** Zero external deps. Pure functions. Hand-rolled validators (no Zod migration consideration). Direct copy. The full ~1,864 LOC + ~431 LOC tests lift cleanly.

One subtlety: `CONTENT_GUIDELINES.md` (13 KB editorial doc) lives next to code. Decision: keep next to code (lifts with the package) or move to repo docs. Recommend keep.

---

## 4. Monorepo state

### 4.1 master-app workspace tooling (current)

**None.** Audit of `/Users/raiyanabdullah/Documents/psychage-master-app/`:

- No root `package.json`
- No `pnpm-workspace.yaml`, `turbo.json`, `nx.json`, `lerna.json`
- No `bun.lock` / `bun.lockb`
- No `.gitmodules`
- No `packages/` directory
- No `apps/` directory
- Empty placeholder: `psychage-mobile/` (referenced in CLAUDE.md §2 as "empty — Expo app to be scaffolded here" — confirmed empty by audit; not opened)

Master-app today is **doc-only** (CLAUDE.md, PROJECT_CONTEXT.md, ARCHITECTURE.md, learnings.md, constitution.md, rules/, audits/, tokens/, etc.). It hosts no compiled code. The Expo scaffold + monorepo migration is **Phase 6** work per CLAUDE.md §2 "current vs planned state".

### 4.2 psychage-v2 workspace tooling (current)

Single package, **not** a monorepo.

- [`package.json`](../../../Desktop/psychage-v2/package.json) `"name": "psychage-web"`, `"packageManager": "pnpm@10.25.0"`
- No `"workspaces"` field
- No `pnpm-workspace.yaml`
- No `.gitmodules`
- Path alias only: `tsconfig.json` `"paths": { "@/*": ["./src/*"] }` (bundler resolution via Vite)

### 4.3 Package manager

- psychage-v2: **pnpm 10.25.0** (locked via `packageManager` field)
- master-app: **none yet**; CLAUDE.md §3 declares **Bun 1.3+** + **Turborepo 2** as the intended stack

Mixed-manager risk: if Slice 2 introduces Bun workspaces in master-app while psychage-v2 stays on pnpm, the shared package becomes the only cross-manager consumer surface. Git-submodule strategy (per PROJECT_CONTEXT.md §6) sidesteps this — submodule is package-manager-agnostic, each consumer's own manager installs it as a local dep.

### 4.4 Implication for `packages/shared`

Three patterns are viable; **the project has already declared a preference**:

**Per PROJECT_CONTEXT.md §6 "Lift method":** "git submodule for V1, monorepo workspace package after monorepo migration. Reasons: no registry account needed, both consumers explicitly bump version (no surprise breakage), plays fine with later monorepo (submodule becomes workspace package)."

This implies the Phase 5 deliverable is:

1. A **new repo** `psychage-shared` (private GitHub).
2. Submoduled into `psychage-v2/` (replacing the inline copies in `src/lib/{navigator,article-framework}/`).
3. Submoduled into `psychage-master-app/` (consumed when `apps/mobile/` materializes in Phase 6).
4. Versioned by SHA pin per submodule update.

**Open implementation choice (not resolved by docs):** whether Phase 5 *also* introduces Bun workspaces in master-app, or leaves master-app doc-only and only adds workspaces in Phase 6 when `apps/mobile/` is scaffolded. The simpler path is to defer workspace tooling: Phase 5 creates the shared repo + submodules it into psychage-v2 first (mobile consumer doesn't exist yet, so master-app submodule is optional but recommended for future-proofing).

---

## 5. Proposed extraction strategy

### 5.1 Per-module

#### 5.1.1 Navigator scoring → `packages/shared/navigator/`

**Lift**: `scoring.ts`, `engine.ts`, `utils.ts`, `safety.ts`, `types.ts`, `providerQuestions.ts`, `defaults.ts`, `stepConfig.ts`. ~1,540 LOC.
**Stay app-side** (web): `analytics.ts` (Supabase-coupled), `config.ts` (Vite-env), `featureFlags.ts` (Vite-env), `storage.ts` (localStorage).
**Mobile equivalents to author later (Phase 6)**: feature flags via `expo-constants`, storage via MMKV with a versioned migrator (CLAUDE.md §4 Sacred Rule #13), analytics via the chosen PostHog/Amplitude client (gated on `rules/analytics` decision, currently `null` in workspace.json).
**Consumer import changes**: psychage-v2's 13 prod consumers update `@/lib/navigator/*` → `@psychage/shared/navigator/*` (or similar via path-alias). Codemod-eligible with `sd`/`rg`.
**Tests**: lift ~4,945 LOC alongside core. Vitest stays.
**Sacred-Rule risk to flag in Slice 2 (NOT to fix without Ryan's call):** the 0.75 cap is config-driven (§1.5). Slice 2 should at minimum surface this in `_review.md`; ideally add a runtime invariant guard inside `engine.ts` that asserts `config.confidence_cap <= 0.75` on every call.

#### 5.1.2 Sensitivity → `packages/shared/sensitivity/`

**Two sub-modules required:**

1. **`packages/shared/sensitivity/person-first/`** — lift `SENSITIVITY_TERMS` data + `checkSensitivity` logic out of `article-framework/constants.ts:217` + `quality-gate.ts:268`. Re-export the symbols from the PEAF module so PEAF still works. ~50 LOC.
2. **`packages/shared/sensitivity/pii/`** — **author from scratch**. Spec input: `rules/security.md` (PII column list, sanitization expectations) + `ARCHITECTURE.md §8` (event sanitization at write-time). Output: regex set + `sanitize(event: object) → object` function used by PostHog/Sentry adapters.

Sub-module #1 is mechanical. Sub-module #2 is **net-new work** — not a lift. Should be flagged in `_review.md` as a scope-change candidate (see §6 question 3).

#### 5.1.3 PEAF validators → `packages/shared/article-framework/`

**Lift**: all 8 TS files. ~1,864 LOC + ~431 LOC tests. Zero adapters needed.
**Stay app-side** (web): the 11 prod consumers are all admin / article-rendering UI — none move.
**Mobile equivalents**: none expected in V1 — mobile reads articles read-only; no quality-gate UI on mobile.
**Decision-point:** does mobile actually need to consume PEAF? If the answer is "only the `content-architecture.ts` taxonomy for category navigation," consider splitting: `packages/shared/article-content/` (taxonomy only) vs `packages/shared/article-framework/` (validators + readability). Avoid forcing mobile to depend on validator code it never invokes.

### 5.2 Order of operations (proposal, not commitment)

1. Create empty `psychage-shared` repo (private GitHub).
2. Lift PEAF validators (cleanest, zero-deps) — verify psychage-v2 still builds + tests pass.
3. Lift Navigator core (pure files only) — verify psychage-v2 still builds + tests pass.
4. **Decision point** (gate on Ryan): author `packages/shared/sensitivity/pii/` now, or defer.
5. Move `SENSITIVITY_TERMS` out of PEAF into `packages/shared/sensitivity/person-first/` with backward-compat re-export. Verify.
6. Add submodule into master-app (no consumer yet — future-proofing only).
7. Slice 2 close: psychage-v2 builds, tests pass, master-app has submodule wired but no mobile consumer.

Estimated time: **3–5 hours** (PROJECT_CONTEXT.md §6 says 90 min; that estimate assumed only pure functions — does not include the docs-vs-reality drift discovered in §2, the PII sanitizer authoring decision, or the 0.75-cap-config-drift discussion).

### 5.3 Risks

| Risk | Severity | Mitigation |
|---|---|---|
| 0.75 cap is config-driven, not code-floored (§1.5) | High — Sacred Rule #1 surface | Slice 2 add an `assert(config.confidence_cap <= 0.75)` guard in engine.ts; document in `_review.md`; flag for Ryan |
| Sensitivity doc claims (§2.1) vs reality drift | Medium — confuses Slice 2 + future readers | Slice 2's first commit should fix PROJECT_CONTEXT.md §6, CLAUDE.md §4, rules/security.md to match actual locations; or accept the move and update docs to point to new locations |
| `CONFIDENCE_CAP` second source of truth in `src/lib/admin/constants.ts:67` | Medium — drift between admin UI and engine | Slice 2 should make admin UI import from shared package, eliminating duplication |
| `ResultCard.tsx:65,70` hardcodes `/ 0.75` for relevance bar % | Low — UI quirk, not algorithm | Out of scope for Slice 2 (UI stays in app); flag for separate cleanup |
| PEAF `CONTENT_GUIDELINES.md` editorial doc location | Low | Decide: keep adjacent to code in shared repo (recommend), or move to master-app docs |
| Mobile MMKV migrator (Sacred Rule #13) not yet designed | Medium — blocks `storage.ts` mobile work in Phase 6 | Out of scope for Slice 2; surface to `rules/offline.md` (currently exists, may need amendment) |
| `content-architecture.ts` is 626 LOC of data — mobile may not need it all | Low | Decide split now (taxonomy vs validators) or later (single package, tree-shake at consumer) |
| Cross-manager consumer surface (pnpm in v2, Bun planned in master-app) | Low (with submodule) | Submodule strategy bypasses this; only matters if Phase 5 introduces workspaces too |

---

## 6. Questions for Ryan

The following decisions block Slice 2 from clean execution. Surfacing each as a discrete question:

1. **Sensitivity filter sub-modules — author the PII regex now, or defer?**
   The "person-first language filter" exists and is mechanically liftable. The "PII regex / telemetry sanitizer" referenced in `rules/security.md:170` does **not exist anywhere** and must be authored from scratch (not lifted). Slice 2 can: (a) author the PII module from `rules/security.md` + `ARCHITECTURE.md §8` as spec input, expanding Slice 2 scope by ~3–4 hours; or (b) lift only person-first now, defer PII to Phase 6 when the first mobile telemetry call site forces the issue. Note: deferring leaves a known gap that blocks PostHog/Amplitude integration whenever that lands.

2. **Documentation drift — fix in Slice 2 commit or separate?**
   PROJECT_CONTEXT.md §6 says "Sensitivity filter | `src/lib/safety/`" but the actual person-first filter lives in `src/lib/article-framework/constants.ts`. CLAUDE.md §4 says "26-term sensitivity filter"; actual count is 31. Three options: (a) Slice 2 includes a doc-fix commit alongside the lift; (b) separate `chore(docs)` PR after Slice 2 closes; (c) accept the drift and let the new locations document themselves in the shared repo's README.

3. **0.75 cap enforcement — add runtime guard during lift?**
   The "absolute" cap is config-driven (engine.ts:48 reads `knowledgeBase.matchingConfig.confidence_cap`, defaulting to 0.75 only when missing). A malformed API response or admin-edit-gone-wrong could silently raise it. Three options: (a) hard-code a const `MAX_CONFIDENCE_CAP = 0.75` in shared and floor every config value via `Math.min(config.confidence_cap, MAX_CONFIDENCE_CAP)`; (b) add a runtime assertion (`if (config.confidence_cap > 0.75) throw`); (c) keep config-driven, document risk in `rules/security.md`, rely on admin UI + DB constraint. Option (a) is the most defensive and matches the spirit of Sacred Rule #1; (b) is more debuggable; (c) is the status quo.

4. **Lift mechanism — confirm submodule, or revisit?**
   PROJECT_CONTEXT.md §6 declares "git submodule for V1, monorepo workspace package after monorepo migration." Slice 2 can execute on that, or revisit. Alternatives: (a) Bun workspace from day one in master-app (forces Phase 6 monorepo work into Phase 5); (b) npm-published private package (requires registry account, neither repo currently uses); (c) confirmed submodule. Recommend (c) unless something changed.

5. **`content-architecture.ts` — split now or keep together?**
   PEAF's `content-architecture.ts` (626 LOC) is the 15-category × 1,000-article taxonomy. Mobile may want this (for category navigation in `Learn` tab) without wanting the validator code. Options: (a) ship as one `packages/shared/article-framework/` and rely on tree-shaking; (b) split now into `packages/shared/article-taxonomy/` + `packages/shared/article-framework/`. Recommend (a) unless mobile bundle size becomes a concern.

6. **`src/lib/safety/` (cognitiveDistortions + crisisKeywords) — lift now or wait?**
   These two files exist, are used by ClarityJournal (web tool), and look like they'll be re-consumed by mobile's crisis surface + journaling. They are **not** the sensitivity filter the docs point at, but they ARE pure utilities that mobile will eventually want. Options: (a) include in Slice 2 scope as `packages/shared/safety/` (adds ~30 min); (b) defer to Phase 6 when mobile crisis surface is built; (c) leave permanently in psychage-v2 since neither will share the exact same content (mobile crisis keywords list may localize differently).

7. **CONFIDENCE_CAP at `src/lib/admin/constants.ts:67` — eliminate duplication?**
   A separate `CONFIDENCE_CAP = 0.75` constant lives in `src/lib/admin/constants.ts` and feeds the admin UI (`MappingMatrix.tsx`). After lift, this should import from the shared package to eliminate drift risk. Slice 2 scope: (a) include the admin-side import refactor; (b) leave for follow-up. Recommend (a) since it's a 2-line change once the shared package exists.

8. **Master-app submodule wiring during Slice 2 — yes or no?**
   `apps/mobile/` does not exist yet (Phase 6 scaffold). Slice 2 can either (a) add `psychage-shared` as a submodule into master-app now even though there's no consumer, for documentation/future-proofing; or (b) defer the master-app side of submoduling to Phase 6 when mobile scaffolds and there's an actual consumer. Recommend (a) for symmetry and to verify the submodule mechanics work for the second consumer before mobile lands.

9. **Storage abstraction — design now or defer?**
   `navigator/storage.ts` uses `localStorage` (web-only). Mobile needs MMKV (Sacred Rule #4). Three approaches: (a) lift no storage; each app owns its persistence layer fully; (b) lift an interface `StorageAdapter` in shared and let each app implement; (c) lift a storage abstraction that auto-detects the runtime. Recommend (a) for V1 — storage shape is small enough that duplication is cheap; abstraction is premature.

10. **Slice 2 verification gate — what counts as "done"?**
    Suggested: (i) `psychage-shared` repo exists, contains lifted code + tests passing; (ii) psychage-v2 consumes via submodule, `pnpm build` + `pnpm test` pass, no functional regression; (iii) master-app contains submodule entry (if §6 question 8 resolves yes); (iv) docs in master-app updated to reflect new locations; (v) `_review.md` from `/spec-review` returns pass. Confirm or amend.

---

## 7. Recon meta

### 7.1 Files read

In psychage-v2 (read-only):
- `src/lib/navigator/scoring.ts`, `engine.ts`, `config.ts`, `utils.ts`, `safety.ts`, `types.ts`, `storage.ts`, `featureFlags.ts`, `analytics.ts`
- `src/lib/article-framework/index.ts`, `quality-gate.ts`, `types.ts`
- `src/lib/safety/cognitiveDistortions.ts`, `crisisKeywords.ts`
- `src/lib/admin/constants.ts` (partial)
- `package.json`, `tsconfig.json`

In master-app:
- `learnings.md`, `CLAUDE.md`, `PROJECT_CONTEXT.md`, `ARCHITECTURE.md` (partial), `rules/security.md` (grep-only)

Plus targeted greps across `src/` for `0.75`, `confidence_cap`, `sensitiv`, `PEAF`, `validatePEAF`, `from 'lib/navigator'`, `from 'article-framework'`, `import.meta.env`, `localStorage`, `process.env`.

### 7.2 Time taken

~50 minutes wall-clock from branch creation to audit committed.

### 7.3 Surprises

1. **Sensitivity filter is not where the docs say it is.** `src/lib/safety/` contains different content; the actual person-first filter is embedded inside PEAF. Doc claims need updating regardless of Slice 2 execution path.
2. **The "26-term" filter has 31 terms.** Drift between CLAUDE.md and code. Trivial but real.
3. **The 0.75 cap is config-driven, not code-floored.** Sacred Rule #1's "enforced in 3+ places" is partially true at the mechanism level but false at the value level. Worth elevating to Ryan before Slice 2 hardens this into a shared package.
4. **PII regex / telemetry sanitizer does not exist.** `rules/security.md:170` describes a module that has not been written. Slice 2 either authors it (scope expansion) or leaves a known gap.
5. **Two sources of truth for `CONFIDENCE_CAP`** (engine config + admin/constants.ts). Drift risk between Navigator scoring and Admin UI.
6. **Navigator core is genuinely pure**, with ~1,540 LOC of zero-dep TS. Lift is mechanically clean. Adapters (storage, env, analytics) are the only friction — and they stay app-side per the proposed strategy.
7. **PEAF is even cleaner** — zero external deps, no platform coupling, hand-rolled validators (no Zod refactor needed). Pure 1,864 LOC + 431 LOC tests, drop-in lift.
8. **Master-app is purely documentation today.** No monorepo tooling, no code. Slice 2 introduces the first non-doc artifact (the submodule itself).

### 7.4 Slice 2 scope-change suggestions

Most consequential for Ryan to decide on, ranked by impact:

1. **Decide on PII sanitizer (Q1)** — could add 3–4 hours, but defers a known regulatory gap.
2. **Decide on 0.75 cap runtime floor (Q3)** — 10-line code change, high Sacred-Rule defense value.
3. **Decide on doc-drift fixes (Q2)** — should bundle with Slice 2 commit for atomicity; 15 min of edits.
4. **Decide on `src/lib/safety/` inclusion (Q6)** — small scope add (30 min), avoids a Phase 6 mini-lift.
5. **Decide on admin/constants.ts dedupe (Q7)** — 2 lines, high coherence value.

If all five are accepted, Slice 2 grows from ~3–5h to ~6–8h. If only Q2 + Q3 + Q7 are accepted, it stays at ~4h. If only the literal lift happens (no questions accepted), Slice 2 is ~3h but leaves five known gaps for later.

The extraction path itself is **clean**. The friction is around the seven adjacent decisions (regulatory gap, doc drift, Sacred-Rule defense, admin dedupe, storage abstraction, taxonomy split, submodule mechanics on master-app). None are show-stoppers; all benefit from Ryan's call before code changes.
