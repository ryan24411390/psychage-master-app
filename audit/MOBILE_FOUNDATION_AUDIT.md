# Mobile Foundation Audit — Psychage Master App

**Date:** 2026-06-10 · **Mode:** READ-ONLY · **Auditor:** Claude Code (Fable 5)
**Scope:** Foundation Phases 0–10 as merged to `main`, ahead of the ~40-feature / 44-screen build-out.

---

## 1. Executive Summary

**Overall health grade: B+ (solid foundation, three structural weaknesses to close before build-out).**

The foundation is genuinely healthy where it matters most: TypeScript is strict with **zero** `any`/`@ts-ignore`/suppression escapes across the tree, the build chain (Babel → Metro → NativeWind v4 → Reanimated 4) is wired correctly, the four Sacred Rules are enforced by fail-closed shell gates at both pre-commit and CI, `packages/shared` is provably platform-pure, and the claimed "201 passing / TS clean" is **confirmed by execution**, not just asserted.

The five things that matter most before 40 features land on this:

1. **The entire lint layer is ceremony.** `pnpm -r lint` exits 0 having run nothing ("None of the selected packages has a lint script"); `lint-staged` maps every file to the literal command `true`; Biome (the locked-stack linter) is not installed; CI runs no lint job. Forty features will be built with zero static-analysis enforcement beyond `tsc`.
2. **Sacred Rule CI gates do not cover direct pushes to `main`.** The `sacred-rules` job is `if: github.event_name == 'pull_request'`; there is no `.husky/pre-push` hook; server-side branch protection is absent (Free tier, tracked). A direct push to `main` bypasses all four SR gates. `learnings.md` claims husky "blocks force-push" — the tree does not contain that hook (doc/tree conflict).
3. **There is no UI test harness at all.** Both vitest configs run `environment: 'node'`; no React Native Testing Library, no jest-expo, no Maestro flows. Every component, route, font-load path, and the native MMKV adapter is untested. 44 screens are about to be built with no way to render-test any of them.
4. **Typography: the audit prompt's expectation is stale, not the tree.** Committed contract (`DESIGN.mobile.md:50`) locks Satoshi as sans/body **and** mono, Fraunces as display (assets not yet in tree, documented placeholder fallback to Satoshi). The bundle contains only Satoshi OTFs. "Satoshi must NOT be in the mobile bundle" contradicts the committed design contract — committed code is canonical; this is a prompt/doc discrepancy, not drift.
5. **Architecture quality is high and over-abstraction is minimal.** The DI adapter seam, storage wrapper, and token single-source wiring are clean and each earns its keep. The delete list is short and low-risk.

Finding counts: **Critical 0 · High 3 · Medium 9 · Low 7.**

---

## 2. Ground Truth

| Item | Claimed | Actual (verified by execution) | Verdict |
|---|---|---|---|
| Branch | main | `main`, ahead of `origin/main` by 1 commit (`4d60141`) | ⚠️ unpushed commit |
| HEAD SHA | — | `4d6014100bc8dfc33506ceef24a6f21a09a0cb6f` | recorded |
| Working tree | — | **Pre-dirty before audit:** modified `.specs/INDEX.md`, untracked `.specs/mascot/`, `.specs/supabase-data-layer/` | pre-existing, not audit-created |
| TypeScript clean | claimed | `pnpm -r typecheck` → both packages `tsc --noEmit` **Done**, exit 0 | ✅ CONFIRMED |
| 201 passing tests | claimed | `pnpm -r test` → shared: **191 passed (191)**, mobile: **10 passed (10)** = **201**, exit 0 | ✅ CONFIRMED |
| Lint | (implied by stack: Biome) | `pnpm -r lint` → "None of the selected packages has a lint script", exit 0 | ❌ VACUOUS (see F-1) |
| Node | 22 pinned | `.nvmrc` = 22; `engines: ">=22 <23"`; local node v22.22.3; CI uses `node-version-file: .nvmrc`; `eas.json` pins `22.16.0` | ✅ Node 25 blocked everywhere |
| Workspace scope | — | pnpm reports "Scope: 2 of 3 workspace projects" (root has no typecheck/test scripts of its own — expected) | ✅ |

Note: a static count of `it(`/`test(` blocks finds 196; the runtime reports 201. Runtime is canonical (vitest counts generated/looped cases). No `it.each` multipliers found; the delta is benign.

---

## 3. Wiring / Blast-Radius Map

### 3.1 Workspace layout

```
psychage-master-app/            pnpm workspaces (apps/* + packages/*); NO turbo.json
├── apps/mobile/                @psychage/mobile — Expo SDK 54, RN 0.81.5, React 19.1.0
│   ├── app/                    expo-router v6 file-based routes
│   │   ├── _layout.tsx         root Stack; Satoshi font load; HapticProvider; SR-13 migrator side-effect import
│   │   ├── dev-navigator.tsx   __DEV__-gated verification screen (fonts/MMKV/navigator) — pre-ship delete marker
│   │   └── (tabs)/             4-tab IA: index(Today) / learn / compass / find — all stubs
│   ├── components/             HeaderAvatar + ui/{Button, Text, ScreenShell}
│   ├── lib/
│   │   ├── adapters/           DI seam: storage(.native), featureFlags, config(stub), analytics(no-op), index barrel
│   │   ├── persistence/        tier-flags.ts — versioned migrator (v0→v1)
│   │   ├── colors.ts           runtime hex re-export of tokens JSON
│   │   ├── haptics.ts / haptic-context.tsx / motion.ts
│   ├── features/               {check-in, data, mascot, safety}/index.ts — reserved empty barrels
│   ├── assets/fonts/           Satoshi-{Regular,Medium,Bold}.otf + FFL.txt (only fonts in bundle)
│   └── __tests__/              4 test files, 10 cases
├── packages/shared/            @psychage/shared — pure TS, zero RN/Expo imports (verified)
│   ├── navigator/              engine, scoring, safety, featureFlags, stepConfig, types, constants (CONFIDENCE_CAP=0.75) + 8 test files
│   ├── peaf/                   quality-gate, readability + 2 test files
│   ├── sensitivity/            filter + terms (30) + 1 test file
│   ├── sr-eval/                sr3-seed-scan.test.ts + fixtures (exercises the SR-3 hook itself)
│   └── {check-in, data, mascot, safety}/index.ts — reserved empty barrels
├── tokens/                     mobile.tokens.json (canonical for mobile) + web.tokens.json (colors byte-identical, verified)
├── .claude/hooks/              sr1..sr4 shell gates + _parse-constitution.sh
├── .husky/                     pre-commit ONLY (no pre-push)
└── .github/workflows/          pr-checks.yml + eas-build.yml
```

### 3.2 Blast-radius per core module

**Storage/MMKV** — `react-native-mmkv` imported in exactly one file: `apps/mobile/lib/adapters/storage.native.ts:28`. No bypass imports anywhere (verified by rg). Importers of the `Storage` seam: `adapters/featureFlags.ts:20`, `adapters/index.ts:10`, `persistence/tier-flags.ts:14`, and 2 test files. End consumers: `app/_layout.tsx:9` (side-effect import chain) and `app/dev-navigator.tsx:14`. **Blast radius of a storage change: 6 files.** The in-memory `storage.ts` twin serves node/vitest/web via Metro platform resolution.

**Supabase client** — **absent entirely.** Zero `@supabase/supabase-js` imports in the tree. Correctly deferred (auth scope blocked on `rules/auth.md` per root CLAUDE.md §5; `.specs/supabase-data-layer/` in flight). Blast radius of introducing it: currently zero — greenfield.

**State (Zustand / TanStack Query)** — **absent.** Local state is `useState` (haptic context, dev screen). Deferred per scope; nothing to break when introduced.

**Theme/tokens** — `tokens/mobile.tokens.json` consumed by exactly two files: `apps/mobile/tailwind.config.js:3` (theme extension: colors, radius, durations, fontFamily) and `apps/mobile/lib/colors.ts:16` (runtime hexes). `colors.ts` consumed by `(tabs)/_layout.tsx:8` and `components/HeaderAvatar.tsx:4` (lucide icon tints only). **Blast radius of a token change: 4 files + every NativeWind class string.** No second color source exists; zero hardcoded hexes outside the token layer (verified).

**Navigation** — expo-router primitives only; no custom nav helper layer. Route changes touch only `app/`.

**@psychage/shared** — mobile imports only the `navigator` subpath: `lib/adapters/featureFlags.ts:16` (type), `app/dev-navigator.tsx:24` (engine + types), 2 test files. `peaf`/`sensitivity` not yet consumed by mobile (used by hooks/CI tooling). Reserved barrels (`check-in`, `data`, `mascot`, `safety`) export `{}` and have zero importers. **Blast radius of a navigator API change: 4 mobile files + shared's own tests.**

**Cold-start chain (load-bearing):** `_layout.tsx` → side-effect import of `@/lib/adapters/featureFlags` → module-init `loadTierFlags(storage)` → migrator (`persistence/tier-flags.ts`) → MMKV. A regression test (`cold-start-migrator-wiring.test.ts`) pins the import target — by grepping source text (see F-12).

---

## 4. Findings

### Critical

None. Nothing in the foundation is broken, unsafe, or misreporting its state.

### High

**F-1 — The lint layer is entirely vacuous.**
Evidence: root `package.json` — `"lint": "pnpm -r lint"` but neither `apps/mobile/package.json` nor `packages/shared/package.json` defines a `lint` script; executed `pnpm -r lint` → `None of the selected packages has a "lint" script`, exit 0. Root `package.json` lint-staged block: `"*.{ts,tsx,js,jsx,json,md}": "true"` — the literal shell builtin `true`, a no-op run on every commit by `.husky/pre-commit` (last line: `pnpm exec lint-staged`). No `biome.json` exists; Biome is the locked-stack linter per root `CLAUDE.md` §3. No lint job in `.github/workflows/pr-checks.yml`.
Why it matters: 40 features built by parallel sessions with zero style/static-analysis gate means convention drift compounds silently; the pre-commit "lint pass" advertised in the hook header comment is false confidence.
Recommendation: install + configure Biome, add real `lint` scripts, point lint-staged at `biome check`, add a CI lint step — or explicitly de-scope lint and delete the dead config so it stops lying.

**F-2 — Sacred Rule gates skip direct pushes to `main`; force-push protection claimed but absent.**
Evidence: `.github/workflows/pr-checks.yml:44` — `if: github.event_name == 'pull_request'` on the `sacred-rules` job (the `checks` job runs on push, SR job does not). `.husky/` contains `pre-commit` only — no `pre-push` (verified by `ls`). Server-side branch protection absent (GitHub Free tier; tracked-deferred in `learnings.md` "2026-05-03 — Branch protection deferred"). However `learnings.md` also states "Local protection lives in Phase 7 Husky hooks (blocks force-push, blocks `--no-verify` bypasses)" — **no such hook exists in the tree**; pre-commit cannot block force-push, and `--no-verify` skips pre-commit entirely. Doc/tree conflict; tree is canonical.
Why it matters: one `git push origin main` from a session that committed with `--no-verify` (or any human) lands SR-violating code on `main` with only typecheck+test as the net. With ~40 features incoming across parallel sessions, the bypass window widens.
Recommendation: add `.husky/pre-push` running the four SR hooks with `--base-ref=origin/main`, and drop the `if: pull_request` condition so `sacred-rules` also runs on push to main (diff vs previous SHA). Correct the stale `learnings.md` entry.

**F-3 — No component/render test capability exists; mobile-side foundation is functionally untested.**
Evidence: `apps/mobile/vitest.config.ts:13` and `packages/shared/vitest.config.ts:14` — `environment: 'node'`. Zero `@testing-library/react-native` / `jest-expo` / `react-test-renderer` in any package.json. No Maestro flows in the tree. Mobile suite = 10 cases in 4 files; untested: `components/ui/Button.tsx`, `Text.tsx`, `ScreenShell.tsx`, `HeaderAvatar.tsx`, all `app/` routes, font loading in `_layout.tsx`, `lib/colors.ts`, `lib/motion.ts`, `lib/haptics.ts`, and `lib/adapters/storage.native.ts` (the real MMKV path — only the in-memory twin is ever exercised). Phase 10 close commit `c2325dc` records "mobile render smoke deferred to Phase 11" — tracked, but Phase 11 is now in progress and 44 screens follow.
Why it matters: every screen of the build-out will ship with no render regression net; the first component-harness setup cost will be paid mid-feature instead of in the foundation.
Recommendation: stand up an RN render-test harness (RNTL + appropriate vitest/jest environment) plus a root-layout smoke render before feature screens multiply; add a device-path Maestro smoke for MMKV + fonts.

### Medium

**F-4 — Native MMKV adapter has zero test coverage and its in-memory twin masks it.**
Evidence: `apps/mobile/lib/adapters/storage.native.ts` — no test imports it (rg verified); all storage-touching tests construct in-memory `Map` stand-ins (`tier-flags-persistence.test.ts`, `tier-flags-composition.test.ts`). Metro resolves `.native.ts` on device, so vitest never sees the real implementation.
Why: the persistence layer every feature will trust (SR-13 migrators included) has its production path verified only by manual dev-screen checks.
Recommendation: extract a Storage contract test suite that runs against both implementations (in-memory under vitest now; native under Maestro/device test later).

**F-5 — Tab stub screens hardcode `bg-white` / `text-black`, bypassing the token layer and breaking dark-mode parity.**
Evidence: `apps/mobile/app/(tabs)/learn.tsx:11,13`; `compass.tsx:11,13`; `find.tsx:11,13` (read directly; confirmed). Root CLAUDE.md §7: dark mode is "full parity… no 'dark mode is V2'"; ScreenShell exists precisely to supply themed background.
Why: these stubs are the template the next 44 screens will be copied from.
Recommendation: switch stubs to `ScreenShell` + token classes before first feature screen lands.

**F-6 — SR-3 enforcement is fixed-string only; paraphrase layer OFF and now coming due.**
Evidence: `.claude/hooks/sr3_diagnostic_language.sh` scans 10 seed phrases from `constitution.md` (lines 69–79); `docs/SR-3-paraphrase-coverage-DEFERRED.md` documents the gap with close-by Phase 11 — which is in progress. A sentence like "the data shows you fit the criteria for depression" passes the gate today.
Why: the first user-facing copy ships in Phase 11; the deferral's due date has arrived.
Recommendation: schedule the paraphrase layer (or a Dr. Dobson copy-review checklist gate) inside Phase 11, not after.

**F-7 — Stack-doc drift: Turborepo and Biome claimed, absent.**
Evidence: root `CLAUDE.md` §3 locks "Turborepo + pnpm workspaces" and "Biome"; no `turbo.json`, no `turbo` dependency, no `biome.json` anywhere (fd/rg verified). Plain `pnpm -r` orchestration works fine at 2 packages.
Why: stale stack table misleads sessions that follow it (and CLAUDE.md says committed code wins — so the doc must move).
Recommendation: either adopt them or amend CLAUDE.md §3; don't leave the table aspirational.

**F-8 — TypeScript version skew between packages.**
Evidence: `apps/mobile/package.json` → `"typescript": "~5.9.2"`; `packages/shared/package.json` → `"typescript": "^5.5.3"`. Both satisfy "5.7+" only via lockfile luck on shared (`^5.5.3` can float, but pinning intent differs); two tsc versions can disagree on emitted errors.
Why: a strict-mode error appearing in one package's typecheck but not the other's is a debugging tax during build-out.
Recommendation: hoist a single typescript version to the root (or align both ranges).

**F-9 — `@types/node` v25 against a hard Node 22 pin.**
Evidence: `"@types/node": "^25.9.1"` in both packages; engines `">=22 <23"`, `.nvmrc` 22, EAS `22.16.0`. Types advertise Node 25 APIs the runtime forbids (the prompt notes Node 25 hangs tsc/Metro — runtime is correctly blocked everywhere; this is types-only skew).
Recommendation: pin `@types/node` to `^22`.

**F-10 — expo-updates installed and active-by-default with unconfigured identity.**
Evidence: `apps/mobile/package.json` → `expo-updates ~29.0.18`; `app.json` → `"owner": "OWNER_PLACEHOLDER"`, `runtimeVersion.policy: "appVersion"`, no `updates.url`; `eas.json` profiles exist. expo-updates phones home to Expo by design; channel/URL strategy undocumented in `rules/offline.md`.
Why: it is the only network-egress-capable dependency in the bundle today; SR-4's "on-device only" story should name it explicitly.
Recommendation: document the OTA channel/URL plan (Phase 9 EAS runbook) and replace the owner placeholder before any non-dev build.

**F-11 — tier-flags migrator (SR-13 archetype) tested on happy paths only.**
Evidence: `apps/mobile/__tests__/tier-flags-persistence.test.ts:35-78` — exactly 3 cases (no data → seed; v1 pass-through; v0 → v1). No corrupted-JSON, partial-shape, or future-version (v2) cases.
Why: this file is the pattern every persisted feature shape will copy; its edge-case blind spots will be copied too.
Recommendation: add corrupt/unknown-version cases and make this the reference migrator test.

**F-12 — Cold-start wiring test asserts source text, not behavior.**
Evidence: `apps/mobile/__tests__/cold-start-migrator-wiring.test.ts:26-32` — greps `_layout.tsx` source for the import string `@/lib/adapters/featureFlags`.
Why: a rename refactor breaks the test without a real regression; a behavioral break that keeps the string passes it.
Recommendation: replace with a module-load behavioral assertion once a render harness exists (pairs with F-3).

### Low

**F-13 — `learnings.md` force-push claim stale** (see F-2). Correct the entry.
**F-14 — sr3-seed-scan fixture guards are loose.** `packages/shared/sr-eval/__tests__/sr3-seed-scan.test.ts:67-69` uses `>= 4` / `>= 3` counts; new fixtures aren't content-validated.
**F-15 — `dev-navigator.tsx` carries inline styles + raw font literals.** `apps/mobile/app/dev-navigator.tsx:114-123`. `__DEV__`-gated and marked for pre-ship removal — keep tracked, don't forget.
**F-16 — `app.json` `owner: "OWNER_PLACEHOLDER"`.** Blocks EAS builds when reached; trivial.
**F-17 — Haptic sequences hand-mirrored from token comments.** `apps/mobile/lib/haptics.ts:19-35` vs `tokens/mobile.tokens.json` `haptic.*._sequence` — documented debt; will drift silently.
**F-18 — Pre-dirty working tree on `main` + 1 unpushed commit** (`4d60141`, `.specs/INDEX.md` modified, two untracked spec dirs). With parallel sessions sharing one tree (per project memory), uncommitted spec state on `main` is a collision hazard.
**F-19 — `lint-staged` + `husky` "lint pass" header comment in `.husky/pre-commit` overstates what runs** (it runs `true`). Cosmetic once F-1 is fixed.

---

## 5. Delete Candidates

| Item | Evidence | Blast radius | Verdict |
|---|---|---|---|
| `lint-staged` no-op config (and the dep, if lint is de-scoped) | root `package.json` lint-staged block → `"true"` | 1 file + `.husky/pre-commit` last line; nothing imports it | Delete **or** wire to Biome (F-1). Do not leave as-is. |
| `dev-navigator.tsx` | `apps/mobile/app/dev-navigator.tsx` (marked pre-ship removal) | Linked only from `(tabs)/index.tsx` dev link + own route | Keep until Phase 11 device checks done; delete before any store build. |
| Stale stack-table rows (Turborepo, Biome) in root `CLAUDE.md` §3 | no `turbo.json`/`biome.json` in tree | docs only | Amend doc (or adopt tools); F-7. |
| Stale `learnings.md` force-push line | `.husky/` contents | docs only | Correct (F-13). |

**Assessed and deliberately kept (not dead weight):** the 8 reserved empty barrels (`packages/shared/{check-in,data,mascot,safety}/index.ts`, `apps/mobile/features/*/index.ts`) — they are session-reservation surfaces per commit `4d60141`, each `export {}` with intent comments; the DI adapter stubs (`config.ts`, `analytics.ts`) — the analytics stub's `TrackProps` flat-primitive type is itself an SR-4 guard; the in-memory/native storage twin — it is the test seam, not duplication. No orphan files found (every source file has ≥1 importer or is a route/test entry — rg-verified).

---

## 6. Restructure Candidates

1. **Module-init side-effect freeze of tier flags** — `apps/mobile/lib/adapters/featureFlags.ts` runs `loadTierFlags(storage)` at import time and the result is fixed for process lifetime. Fine for today's static tiers; the planned premium-tier toggle and persisted-tier UI will need runtime re-read or a subscribe mechanism. Restructure to a lazily-initialized accessor *when* the first runtime-toggle feature lands — not before (no speculative work), but record the constraint now.
2. **Storage contract formalization** (pairs with F-4): one shared contract-test suite over the `Storage` interface, run against both implementations. Small change, large confidence gain before every feature persists state through this seam.
3. **Stub screens → ScreenShell pattern** (F-5): make the four tab stubs the canonical screen template (themed bg, reduced-motion entrance, token classes) so 44 screens copy something correct.

No layering violations, no circular imports, no UI-reaching-into-MMKV paths found. The architecture does not need structural surgery.

---

## 7. Add Candidates (gaps the foundation needs before 40 features)

| # | Add | Driven by | Size |
|---|---|---|---|
| A-1 | Real lint: Biome config + per-package `lint` scripts + lint-staged wiring + CI step | F-1 | S |
| A-2 | `.husky/pre-push` running SR hooks vs `origin/main`; remove `if: pull_request` from CI `sacred-rules` job | F-2 | S |
| A-3 | RN render-test harness (RNTL) + root-layout smoke render + first component tests (Button/ScreenShell) | F-3, F-12 | M |
| A-4 | Storage contract test suite (both impls) + migrator edge cases (corrupt JSON, future version) | F-4, F-11 | S |
| A-5 | Maestro device smoke: cold start, font load, MMKV round-trip, tab navigation | F-3, F-4 | M |
| A-6 | SR-3 paraphrase layer or formal copy-review gate, inside Phase 11 | F-6 | M |
| A-7 | Version hygiene: single hoisted typescript, `@types/node@^22` | F-8, F-9 | XS |
| A-8 | OTA/expo-updates channel + URL decision documented in `rules/offline.md` / EAS runbook; owner placeholder resolved | F-10, F-16 | S |
| A-9 | Doc reconciliation commit: CLAUDE.md stack table, learnings.md force-push entry | F-7, F-13 | XS |

Already tracked-deferred (note, don't re-add): Sentry RN + `beforeSend` PII filter (Phase 9), analytics vendor decision (Phase 9), Supabase client/`packages/api` (blocked on `rules/auth.md`; `.specs/supabase-data-layer/` in flight), certificate pinning (Phase 8 target), pen-test/threat model (pre-launch).

---

## 8. Risk Register

| Risk | Status | Evidence |
|---|---|---|
| **SR-1** confidence cap 0.75 | ✅ ENFORCED, triple-layered | `packages/shared/navigator/constants.ts:19` (`CONFIDENCE_CAP = 0.75 as const`); `scoring.ts:125-139` double `Math.min` clamp; `cap-floor.test.ts` + ~100 implicit cap assertions across the suite; hook `sr1_*.sh` at pre-commit + CI; `ConditionScore` (pre-cap fields) deliberately not exported from the barrel |
| **SR-2** crisis always-on | ✅ ENFORCED | `navigator/safety.ts:81-106` (`should_halt: has_crisis`, unconditional); zero gating flags in tree; `sr2_*.sh` blocks introduction patterns. Note: no crisis UI surface exists yet — enforcement is engine-level pending the Crisis feature |
| **SR-3** no diagnostic language | ⚠️ PARTIAL (by design, due now) | seed-scan hook enforced; paraphrase layer OFF per `docs/SR-3-paraphrase-coverage-DEFERRED.md`, close-by = Phase 11 (in progress) |
| **SR-4** symptom data on-device | ✅ ENFORCED today, amendment pending | zero network call sites in mobile/shared source (rg-verified: no fetch/supabase/Sentry/analytics calls); only egress-capable dep is expo-updates (F-10); `sr4_*.sh` cross-product gate active; ADR `docs/adr/001-sr4-checkin-persistence.md` **Proposed** — requires Dobson sign-off + cooling-off before any check-in sync code |
| SR gate bypass via direct push | ⚠️ OPEN | F-2 |
| **Design tokens / DD-001** | ✅ NO CODE DRIFT; one doc-vs-prompt conflict | colors byte-identical across `tokens/*.json`, zero hardcoded hexes outside token layer; motion durations 150/300/600/4000ms wired into tailwind; `useReducedMotion` polled in every animated screen (`lib/motion.ts:44-60`); typography: Satoshi(sans+mono)/Fraunces(display, asset pending) per `DESIGN.mobile.md:50` — the audit prompt's "IBM Plex Sans body / no Satoshi" expectation is stale vs the committed contract. Exception: stub-screen hardcoded classes (F-5). Type/spacing scales `_omitted` pending calibration (tracked) |
| Animation on UI thread | ✅ | Reanimated 4 `FadeIn` entering animations only; worklets plugin last in `babel.config.js`; no JS-thread timer-driven visuals found |
| Secrets/env | ✅ CLEAN | no `.env*` committed, gitignored; no keys in history (git log sweep); no `EXPO_PUBLIC_` misuse; EAS Secrets mandated by `rules/security.md` §2.4 |
| Email-confirmation workaround | ✅ NON-ISSUE | `rules/auth.md` §3 requires verification; **no auth code exists in mobile at all** (rg: zero `supabase.auth`/`signIn`/`expo-secure-store` hits) — nothing to work around yet |
| Observability (Sentry/analytics) | ⏸ TRACKED-DEFERRED Phase 9 | no Sentry dep; analytics adapter is a typed no-op whose flat-primitive `TrackProps` shape is itself an SR-4 guard |
| Tap targets / type scale / spacing | ⏸ DEFERRED to first-screen calibration | `tokens/mobile.tokens.json` `_omitted` stubs; no shipped screens to audit yet |

---

## 9. Suggested Sequencing

Ordered for later sessions; dependencies noted. Items 1–3 should land **before** feature screens multiply.

1. **A-2 SR push gates** (no deps; smallest change closing the biggest invariant hole) → then fix learnings.md in the same commit (A-9 partial).
2. **A-1 Biome lint layer** (no deps; do before parallel feature sessions start generating unlinted code). Includes deleting/wiring the lint-staged no-op.
3. **A-3 render-test harness + F-5 stub-screen tokenization together** — the corrected stubs become the first render-test subjects and the copy-template for all 44 screens. F-12's source-grep test gets replaced here.
4. **A-4 storage contract + migrator edge cases** (independent; before the first feature persists state — i.e., before Phase 11 check-in persistence merges).
5. **A-7 version hygiene + A-9 doc reconciliation** (anytime; trivial, batch into one chore commit).
6. **A-6 SR-3 paraphrase decision** — inside Phase 11 scope, before its first user-facing copy merges. Depends on nothing technical; depends on Dr. Dobson review-process decision.
7. **A-8 OTA/updates identity + A-5 Maestro device smoke** — with Phase 9 EAS runbook work; needs an Expo owner/account decision (A-8 blocks real builds; A-5 wants a build to run against).
8. **Restructure #1 (feature-flag runtime re-read)** — deferred until the first runtime-toggle feature; record only.

---

## Appendix: Could not verify without mutation

- **Native MMKV round-trip, font rendering, OTA behavior on device** — requires building/running the app (`expo run:ios`). Recommend Maestro smoke (A-5).
- **`pnpm install --frozen-lockfile` reproducibility on a clean checkout** — install mutates `node_modules`.
- **SR hook behavior on a synthetic violating diff** — proving the gates fire requires staging a violating change (mutation). The sr-eval fixture tests exercise SR-3's script against fixtures read-only; SR-1/2/4 scripts were inspected, not red-tested, in this session (prior red-test branches `sr-smoke-redtest`, `ci/verify-sr-redtest` exist in branch list as historical evidence).
- **Dependency vulnerability scan** (`pnpm audit`) — network call; skipped.
