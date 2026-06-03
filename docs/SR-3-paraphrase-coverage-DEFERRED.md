# SR-3 paraphrase coverage — DEFERRED

**Status:** open, tracked gap (not silence)
**Filed:** 2026-06-03 (Phase 9, slice 2)
**Owner:** workspace (no individual)
**Close-by:** before Phase 11's first user-facing feature ships

---

## TL;DR

SR-3 (`diagnostic_language`) today is a **deterministic fixed-string scan only**.
It catches user-facing copy that contains one of the 10 forbidden seed phrases
listed in `constitution.md`'s `forbidden_phrase_seeds`. It does **not** catch
clinically-asserting copy that avoids the exact seeds via paraphrase or
synonym substitution. That semantic / paraphrase layer is OFF, has never
run, and is deferred pending an upstream decision.

This ticket exists so the gap is visible in the project history rather than
buried in a hook header comment.

---

## What IS covered today

- The fixed-string seed scan, enforced by
  `.claude/hooks/sr3_diagnostic_language.sh`, in two modes:
  - `pretool` (per-edit, Claude Code hook)
  - `--mode=stop` (pre-commit, husky)
- Coverage proven by the deterministic eval at
  `packages/shared/sr-eval/__tests__/sr3-seed-scan.test.ts`:
  - 4 violating fixtures (4 distinct seed categories) — all asserted blocked
  - 3 clean invitational-framing fixtures — all asserted allowed
- File globs scanned: `**/*.tsx`, `**/*.ts`, `**/i18n/**/*.json`,
  `**/translations/**/*.json`, `**/locales/**/*.json`.
- Exclusions: `**/*.test.*`, `**/*.spec.*`, `**/__tests__/**`,
  `**/__fixtures__/**`.

---

## What is NOT covered

The **paraphrase / semantic layer**. The hook header documents this directly:

> Known gap: paraphrase coverage (the original Haiku layer) is OFF. Re-enable
> by adding an inline ANTHROPIC API call from this script once a vendor /
> secret-distribution decision exists.

In practice this means: any user-facing string that **asserts a clinical
conclusion to the reader using wording outside the 10-seed list** passes the
gate silently. Concrete illustrative shape (described, not embedded):

- A sentence that names a specific condition and attaches it to the reader
  using a synonym for the seed verbs ("it's clear that …", "the data shows
  …", "this is a clear case of …").
- A sentence that converts the reader's responses into a labeled state
  ("your profile matches X", "you fit the criteria for X").
- A sentence that delivers a clinical-sounding verdict without using any
  word from the 10 seeds.

The fixed-string scan cannot reason about meaning, only about literal
substrings. SR-3 was originally designed with a Claude Haiku judgment layer
that would have caught these. That layer was never wired up.

---

## Why deferred

The paraphrase layer requires an LLM judgment call from inside a pre-commit /
pre-tool hook. That requires:

1. A vendor decision (Anthropic via direct API vs Bedrock vs other).
2. A secret-distribution policy for the API key — both for local dev
   (per-engineer `ANTHROPIC_API_KEY`) and for CI (a shared, scoped key with
   spend caps).
3. A fail-mode policy — does the hook fail-closed (block on API timeout, key
   missing, quota exhausted) or fail-open with a logged warning? Fail-closed
   is the Sacred-Rule-consistent choice but blocks every commit when the API
   is degraded.
4. A latency budget — the current hook runs sub-second. An LLM round-trip
   blows that budget and makes pre-commit unpleasant. Probably acceptable
   for `--mode=stop` (pre-commit), not for per-edit `pretool`.

None of these decisions exist yet. They were explicitly deferred out of
Phase 8 close-out.

---

## When this must close

**Before Phase 11's first user-facing feature ships.** Phase 11 is the first
phase where copy starts going in front of real users in the mobile app.
Untested paraphrase coverage at that point carries real safety risk — a
clinically-asserting string can ship under the current scan.

Spec this alongside **SR-5 (`therapeutic_claims`)** which has the same
shape (constitution lists exact forbidden phrasings; the semantic
generalization is open) and will need the same vendor / secret decision.

Until then, every PR adding user-facing copy must be read by Dr. Dobson
before merge (existing convention; not a substitute for tooling, but the
current backstop).

---

## Closing this ticket

Acceptable resolution:

1. Vendor + secret + fail-mode + latency-budget decisions are documented
   (likely a new `rules/sr-3-paraphrase.md` or an addition to
   `rules/auth.md`-class file).
2. The hook gains an inline LLM call gated behind those decisions.
3. The eval at `packages/shared/sr-eval/__tests__/sr3-seed-scan.test.ts`
   is extended with paraphrase fixtures — clinically-asserting strings
   that contain none of the 10 seeds. The eval mocks / records the LLM
   response (deterministic tests; no live API call in CI).
4. This ticket is moved to `docs/closed/` with a one-line resolution note.

---

## References

- `constitution.md` — `SR-3.forbidden_phrase_seeds` (10 entries)
- `.claude/hooks/sr3_diagnostic_language.sh` — current implementation
  (fixed-string scan)
- `.claude/hooks/_parse-constitution.sh` — seed-list extractor
- `packages/shared/sr-eval/__tests__/sr3-seed-scan.test.ts` — eval proving
  the fixed-string scan works
- `packages/shared/sr-eval/__fixtures__/` — eval fixtures (excluded from
  SR-3 scan by glob)
- Phase 8 close-out (commit `ff2d2f8`) — original deferral
- Phase 9 slice 2 (this ticket) — gap documented
