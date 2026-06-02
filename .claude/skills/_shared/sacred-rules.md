# Sacred Rules — canonical reference

This file is the shared single-source-of-truth for the Sacred Rules block referenced by every `spec-*` skill. Skills include their own phase-specific framing alongside a pointer here. **Authoritative source: `constitution.md` at workspace root** (machine-readable YAML front-matter that the `.claude/hooks/sr*.sh` scripts parse at runtime). This file is the human-readable companion.

Edit policy: this file mirrors `constitution.md`. Do not amend Sacred Rule semantics here without amending `constitution.md` in the same commit. The hooks read patterns from `constitution.md`; if this file and `constitution.md` ever disagree, **`constitution.md` wins** and this file is broken.

## The four rules

1. **SR-1 — Navigator confidence cap.** No code path returns Navigator confidence > 0.75. Enforced 3× (geometric mean ceiling, post-modifier ceiling, output ceiling). Hook: `.claude/hooks/sr1_navigator_confidence_cap.sh`.
2. **SR-2 — Crisis detection cannot be bypassed.** No flag, branch, environment variable, or feature gate disables crisis-symptom detection. Crisis symptoms halt the Symptom Navigator at any severity. Hook: `.claude/hooks/sr2_crisis_bypass_detector.sh`.
3. **SR-3 — No diagnostic language.** Clinical-assertion phrasing in user-facing copy is forbidden. The canonical seed list lives in `constitution.md` under `sacred_rules.SR-3.forbidden_phrase_seeds` — the hook parses it at runtime. Educational framing only (e.g., "people experiencing X often describe…", "what's commonly called…"). Hook: `.claude/hooks/sr3_diagnostic_language.sh`.
4. **SR-4 — Symptom data on device.** No Sentry breadcrumb, analytics event, Supabase write, or third-party transmission contains raw symptom selections. MMKV-only on mobile; localStorage-only on web. Hook: `.claude/hooks/sr4_no_symptom_telemetry.sh`.

## Enforcement layers

Two layers deterministically enforce these rules; advisory text in skills is belt-and-suspenders:

- **PreToolUse** — `.claude/hooks/sr*.sh` fire on every Write / Edit / MultiEdit. Block at write-time (exit 2). See `.claude/settings.json` PreToolUse block.
- **Pre-commit** — `.husky/pre-commit` re-runs SR-1..SR-4 in `--mode=stop` against `git diff --cached`. Blocks the commit on violation.

For all other rules (PEAF blocks, person-first 30-term sensitivity filter, `@/` alias, NativeWind / Tailwind discipline, `ArticleRecord` shape, Sanity-dormant), see `CLAUDE.md`.

## How skills reference this file

Each `spec-*` skill keeps its own phase-specific Sacred Rules section. That section:

1. Names the four rules with a 1-line per-rule recap framed for the skill's phase (e.g., spec-design frames each in terms of design.md compliance; spec-tasks frames each as DoD entries).
2. Points here for the canonical definitions.
3. Points to `constitution.md` for the authoritative machine-readable source.

Skills do not duplicate full definitions inline. If a skill needs more detail than its phase-specific recap provides, the reader follows the pointer to this file.
