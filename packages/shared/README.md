# @psychage/shared

Pure-TypeScript domain logic shared across Psychage apps.

## Scope

- `navigator/` — Symptom Navigator scoring + safety screening + types. Pure
  algorithm core; no Vite / React / platform coupling.
- `peaf/` — Psychage Educational Article Framework validators (quality gate,
  readability, source tiers, content taxonomy).
- `sensitivity/` — Person-first language scanner (30 terms + scanner).

## Source

Slice 2 lifted from psychage-v2 at SHA `528a8d5`. See
[`../../audits/phase5-shared-lift-recon.md`](../../audits/phase5-shared-lift-recon.md)
for the canonical per-module mapping.

The original psychage-v2 source files remain in place; cross-repo migration
of psychage-v2 to consume this package is a separate future slice.

## Critical Finding fixes applied during lift

- **#1 — Confidence cap floor.** `navigator/scoring.ts` and `navigator/engine.ts`
  now wrap the API-supplied `confidence_cap` in `Math.min(value, CONFIDENCE_CAP)`
  so a malformed knowledge-base response cannot raise the 0.75 ceiling.
- **#2 — `CONFIDENCE_CAP` single source.** Declared once in
  `navigator/constants.ts`. `utils.ts`, `scoring.ts`, and `engine.ts` import
  from there. The duplicate at `psychage-v2/src/lib/admin/constants.ts:67`
  is out of scope until psychage-v2 migrates.

## Not lifted

- `analytics.ts`, `config.ts`, `storage.ts`, and the platform-coupled portions
  of `featureFlags.ts` — each app owns its own adapters per Sacred Rule #4
  (mobile MMKV vs web localStorage). `featureFlags.ts` itself ships because
  `engine.ts` imports `filterByFeatureFlags`; in environments without
  `import.meta.env` it filters all tiered conditions out, which is safe.
- PII telemetry sanitizer — referenced by `rules/security.md:170` but does
  not exist in psychage-v2. Deferred to Phase 5.B or Phase 9 prereq per
  recon Critical Finding #3.

## Local commands

```bash
cd packages/shared
npm install
npm run test
npm run typecheck
```

## Counts

- Navigator core: 9 `.ts` files, ~1,540 LOC + ~3,200 LOC of tests + helpers.
- PEAF: 8 `.ts` files, ~1,860 LOC + ~430 LOC of tests.
- Sensitivity: 2 `.ts` files (terms + scanner), ~80 LOC + tests.
