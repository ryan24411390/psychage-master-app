# packages/shared — CLAUDE.md

Pure-TypeScript domain logic shared across Psychage apps. Lifted from psychage-v2 in Phase 5 Slice 2 (PR #11); public API formalized in Phase 6 Slice 6.

Workspace-level rules (Sacred Rules, stack lock, voice, etc.) live in the root `CLAUDE.md` — don't restate them here. This file is for package-local conventions only.

## Scope

Three barrels, three subpaths:

| Subpath | Source | Purpose |
|---|---|---|
| `@psychage/shared/navigator` | `navigator/index.ts` | Symptom Navigator engine + scoring + safety + types + step config |
| `@psychage/shared/peaf` | `peaf/index.ts` | Article quality gate, readability, source tiers, content taxonomy |
| `@psychage/shared/sensitivity` | `sensitivity/index.ts` | 30-term person-first language scanner |

The `package.json` `exports` map declares only these subpaths (plus `./package.json`). **Deep imports do not resolve** — if a consumer needs a symbol not on a barrel, add it to the barrel rather than reaching past `exports`.

## Source-consumed, not built

No `main` / `module` field. No build script. Mobile (Metro) and the workspace's vitest both resolve TS source directly via the symlinked workspace package. `tsconfig.json` retains `outDir: ./dist` for type-checking ergonomics; `dist/` is never populated.

Do not add a build step (tsc/tsup/rollup) without surfacing the trade-off first — it would change every consumer's import resolution and force a coordinated cutover.

## Dependency-injection seam (rules/conventions.md #3)

Lifted code that depended on app-side adapters (feature flags, storage, analytics, env access) **must inject adapter behavior as a parameter** rather than import from the app. Default values should be the safe no-op (`() => true`, `noop`, etc.) so the shared tests run without any consumer wiring.

Current seam: `runSymptomNavigator(..., isTierEnabled: IsTierEnabledFn = () => true)`. Mobile injects an `expo-constants`-backed predicate; web (when migrated) injects an `import.meta.env`-backed predicate. The shared package never reads env directly.

## Sacred Rule #1 — CONFIDENCE_CAP

`CONFIDENCE_CAP = 0.75` is the absolute ceiling. Declared once in `navigator/constants.ts`. Enforced at three call sites (`navigator/engine.ts`, `navigator/scoring.ts`, `navigator/utils.ts`). **Never** raise the constant. **Never** bypass `Math.min(config.confidence_cap, CONFIDENCE_CAP)`. Confidence cap floor tests live in `navigator/__tests__/cap-floor.test.ts`.

### Cap-safe barrel surface

`runSymptomNavigator` is the cap-safe entry point — `NavigatorResultItem.relevance_score` equals `capped_score` (enforced twice in `calculateConditionScore`). The lower-level scoring primitives (`calculateConditionScore`, `rankAndDiversify`, `scoreAllConditions`) and the `ConditionScore` / `MatchedSymptomDetail` / `ScoringConfig` types are **intentionally not exported from the barrel** — `ConditionScore` carries pre-cap diagnostic fields (`raw_score`, `normalized_score`) that can exceed 0.75 and would be a Sacred Rule #1 foot-gun for a naive consumer. If a future caller proves a need, re-adding them is a non-breaking subset addition; the trade-off (and a wrapper that strips pre-cap fields) must be surfaced first.

## No runtime dependencies

`devDependencies` only (TypeScript, vitest, `@types/node`). Adding a runtime dep means every consumer pays the bundle cost — surface the trade-off first.

## Semver discipline

- Patch: bug fix, no API change.
- Minor: additive surface (new export, new optional parameter with safe default).
- Major: removed export, required parameter added, behavior change in an existing symbol.

Bump on every PR that touches the public surface. The barrel files (`*/index.ts`) and `package.json.exports` are the surface — changes inside a non-exported helper don't count.

## Test conventions

- Vitest, `vitest run`.
- Tests live in `<module>/__tests__/*.test.ts`.
- Internal aliases (`@/lib/navigator/*`, `@/lib/article-framework/*`, `@/data/mock_knowledge_base`) come from `vitest.config.ts` and `tsconfig.json` paths — they're for **test ergonomics only**, not part of the public surface. Consumers import from `@psychage/shared/<subpath>`.

## Critical Findings tracked in README

See `README.md` for the running list of cross-repo Critical Findings fixed during lifts (CONFIDENCE_CAP single source, confidence-cap floor, etc.).
