---
# ============================================================
# MACHINE-READABLE SECTION — read by .claude/hooks/sr*.sh scripts
# DO NOT modify pattern values without updating learnings.md and
# notifying every active session. This is the single source of truth
# for Sacred Rule enforcement.
# ============================================================

constitution_version: 1

sacred_rules:
  SR-1:
    name: navigator_confidence_cap
    summary: "Navigator confidence cannot exceed 0.75"
    enforced_by: .claude/hooks/sr1_navigator_confidence_cap.sh
    patterns:
      # Regex patterns the hook greps for in code diffs.
      # Match: numeric confidence assignments above 0.75
      forbidden_regex:
        - 'confidence\s*[:=]\s*(0\.[8-9]\d*|1\.0+|1\b)'
        - 'setConfidence\s*\(\s*(0\.[8-9]\d*|1\.0+|1\b)\s*\)'
        - 'CONFIDENCE_(MAX|CAP|CEILING)\s*[:=]\s*(0\.[8-9]\d*|1\.0+|1\b)'
      # Files where this rule applies (skip test fixtures, skip comments)
      file_globs:
        - "**/*.ts"
        - "**/*.tsx"
        - "**/*.js"
        - "**/*.jsx"
      file_globs_exclude:
        - "**/*.test.ts"
        - "**/*.test.tsx"
        - "**/__tests__/**"
        - "**/__fixtures__/**"
        - "**/*.spec.ts"

  SR-2:
    name: crisis_bypass_detector
    summary: "Crisis detection cannot be disabled via flag, branch, or environment"
    enforced_by: .claude/hooks/sr2_crisis_bypass_detector.sh
    patterns:
      forbidden_regex:
        - 'crisis[_.]?detection\s*[:=]\s*(false|0|null|undefined|"off")'
        - 'disable[_.]?crisis'
        - 'skip[_.]?crisis'
        - 'crisis[_.]?disabled\s*[:=]\s*true'
        - 'feature[_.]?flag.*crisis.*[:=]\s*false'
        - 'if\s*\(\s*!?\s*[A-Z_]*CRISIS[A-Z_]*\s*\)' # any conditional that gates crisis flow
      file_globs:
        - "**/*.ts"
        - "**/*.tsx"
        - "**/*.js"
        - "**/*.jsx"
      file_globs_exclude:
        - "**/*.test.ts"
        - "**/*.test.tsx"
        - "**/__tests__/**"
        - "**/__fixtures__/**"

  SR-3:
    name: diagnostic_language
    summary: "User-facing copy must not contain diagnostic phrasing"
    enforced_by: .claude/hooks/sr3_diagnostic_language.sh
    type: prompt
    model: claude-haiku-4-5
    # The hook sends user-facing string literals + the forbidden-phrase list
    # to Haiku for semantic judgment (paraphrases also caught).
    forbidden_phrase_seeds:
      - "you have"
      - "you are diagnosed with"
      - "diagnosis confirmed"
      - "this means you're"
      - "this means you have"
      - "you suffer from"
      - "you're suffering from"
      - "your diagnosis"
      - "you've been diagnosed"
      - "this confirms"
    file_globs:
      - "**/*.tsx"
      - "**/*.ts"
      - "**/i18n/**/*.json"
      - "**/translations/**/*.json"
      - "**/locales/**/*.json"
    file_globs_exclude:
      - "**/*.test.*"
      - "**/__tests__/**"
      - "**/__fixtures__/**"

  SR-4:
    name: no_symptom_telemetry
    summary: "Symptom data must never appear in Sentry, analytics, or third-party transmissions"
    enforced_by: .claude/hooks/sr4_no_symptom_telemetry.sh
    patterns:
      # Variable / type names that carry symptom data — these must never
      # appear in telemetry call sites
      symptom_identifier_seeds:
        - "symptom"
        - "symptoms"
        - "symptomData"
        - "symptomSelection"
        - "symptomSeverity"
        - "symptomDuration"
        - "symptomFrequency"
        - "userSymptoms"
        - "checkInData"
        - "moodSelection"
        - "symptomNavigatorState"
      # Telemetry call sites where the above must not appear
      telemetry_call_sites:
        - 'Sentry\.captureException'
        - 'Sentry\.captureMessage'
        - 'Sentry\.addBreadcrumb'
        - 'analytics\.track'
        - 'analytics\.identify'
        - 'analytics\.page'
        - 'posthog\.capture'
        - 'amplitude\.track'
        - 'amplitude\.logEvent'
        - 'mixpanel\.track'
      file_globs:
        - "**/*.ts"
        - "**/*.tsx"
        - "**/*.js"
        - "**/*.jsx"
      file_globs_exclude:
        - "**/*.test.ts"
        - "**/*.test.tsx"
        - "**/__tests__/**"
        - "**/__fixtures__/**"

# Brand non-negotiables — referenced by /spec-design and /mobile-design-audit
# Not directly hook-enforced (these are creative judgments) but must be
# checked at every spec-design and design-audit step.
brand_non_negotiables:
  - clay_figures_only_for_universal_humanity
  - faceless_genderless_raceless_figures
  - person_first_language
  - sage_archetype_in_voice
  - no_clinical_voice_in_consumer_copy
  - "deep_breath_aesthetic_calm_warm_spacious"

bypass_policy:
  # Lightweight escape hatch from SDD ceremony for trivial changes.
  # Tracked via [bypass] tag in commit subject line.
  enabled: true
  threshold:
    max_lines_changed: 20
    behavior_change_allowed: false
    sacred_rule_surface_allowed: false
  ceiling:
    max_bypass_commits_pct: 30
    max_bypass_commits_pct_comment: "If exceeded, the workflow itself is too heavy. Quantitative signal."
---

# Psychage Constitution

> **Status:** Immutable foundation. Changes require a signed-off ADR and updates to every dependent file in the same commit.
>
> **Version:** 1 (May 2026)
>
> **Purpose:** This is the contract that does not evolve. `CLAUDE.md` evolves with project understanding; skills evolve with the spec workflow; `learnings.md` accumulates lessons. This file holds the things that *cannot* change without compromising clinical safety, regulatory standing, or the brand identity that makes Psychage worth shipping.
>
> **Single source of truth** for the four Sacred Rules. The four hook scripts in `.claude/hooks/` parse this file's YAML front-matter at runtime. There is no other source. If a hook script and this file disagree, the file wins; the script is broken.

---

## Mission

Make mental health clarity as accessible as checking the weather. Mental health *information infrastructure* — operating before users know what kind of help they need. Non-diagnostic. Education-only. Globally culturally adapted.

## The four Sacred Rules

These four rules cannot be violated, bypassed, feature-flagged off, or relaxed for any reason. Violation of any one of them allows Psychage to ship a clinically dangerous experience. They are deterministically enforced via `.claude/hooks/` — meaning they execute outside the LLM reasoning chain, on every file write, every commit attempt, every session stop. Hooks block; prompts suggest; the difference matters.

### SR-1 — Navigator confidence cap

The Symptom Navigator's confidence output is capped at **0.75 absolute maximum**. No code path returns a confidence value above this. The cap is enforced three times: at the geometric mean ceiling, at the post-modifier ceiling, and at the output ceiling. Confidence above 0.75 reads as diagnosis to users; the gap between 0.75 and 1.0 exists specifically to communicate "this is a guide, not a verdict."

Enforcement: pattern-grep PreToolUse hook, plus Stop hook re-validation. See `.claude/hooks/sr1_navigator_confidence_cap.sh`.

### SR-2 — Crisis detection cannot be bypassed

Crisis-symptom detection halts the Symptom Navigator at any severity. There is no flag, branch, environment variable, configuration, or feature gate that disables this. Adding one is a Sacred Rule violation regardless of the stated rationale.

Enforcement: pattern-grep PreToolUse hook, plus Stop hook re-validation. See `.claude/hooks/sr2_crisis_bypass_detector.sh`.

### SR-3 — No diagnostic language in user-facing copy

User-facing strings must use educational framing. Forbidden patterns include "you have," "diagnosis confirmed," "this means you're," "you suffer from," and any paraphrase of these that asserts a clinical status. The replacement pattern is invitational: "you might want to read about," "people experiencing similar things often find," "this is sometimes associated with."

Because diagnostic phrasing can be paraphrased into novel forms a regex can't catch, this rule is enforced via a `prompt`-type hook that uses Claude Haiku to make a semantic judgment on every diff containing user-facing strings. See `.claude/hooks/sr3_diagnostic_language.sh`.

### SR-4 — Symptom data stays on device

Raw symptom selections, severity ratings, durations, frequencies, and mood selections never leave the user's device. No Sentry breadcrumb, analytics event, Supabase write, or third-party transmission contains this data. MMKV-only persistence on mobile; localStorage-only persistence on web for the corresponding flow. Aggregated, anonymized population data may be transmitted only after explicit, separate consent — and is out of scope for V1.

Enforcement: pattern-grep PreToolUse hook checks every telemetry call site for symptom-data identifier names. See `.claude/hooks/sr4_no_symptom_telemetry.sh`.

## Brand non-negotiables

These are creative judgments, not pattern-matchable rules. They are checked at every `/spec-design` and `/mobile-design-audit` step but not hook-enforced.

1. **Clay figures only for universal humanity.** Faceless, genderless, raceless matte-white figures. The figure library is finite and illustrator-produced (never generated at code time). When a feature needs a figure that doesn't exist in the library, the spec defers until the library is expanded. No ad-hoc generation.

2. **Person-first language throughout.** "A person experiencing depression," not "a depressed person." Twenty-six-term sensitivity filter applies to every user-facing string. The filter list is in `rules/sensitivity.md` (lifted from psychage-v2).

3. **Sage archetype in voice.** Calm, knowing, warm. Never clinical, never bureaucratic, never performatively friendly. The voice of someone who has thought about this a long time and chooses words carefully.

4. **No clinical voice in consumer copy.** "Symptoms" is acceptable when accurate. "Patient" is not. "Diagnosis" is not. "Condition" is acceptable; "disorder" is acceptable when the user's language uses it; the app's own framing avoids it.

5. **"Deep breath" aesthetic.** Calm, open, warm, spacious. Generous whitespace. Quiet typography. Movement that breathes rather than snaps. Sound design that calms rather than punctuates. Haptics that confirm rather than insist.

## Regulatory commitments

Resolved at Phase 4.A close. The four architectural commitments below are not yet finalized; they will be filled in during Phase 4.A's regulatory work and amended into this document via ADR.

1. **HIPAA covered-entity status:** _to be resolved at Phase 4.A_
2. **42 CFR Part 2 default posture:** _to be resolved at Phase 4.A_
3. **Encryption-at-rest standard:** _to be resolved at Phase 4.A_
4. **BAA chain audit trail:** _to be resolved at Phase 4.A_

Until these four are resolved, **no Phase 5 code touching PHI, symptom data, auth, or persistence may be merged.** This is a hard gate, enforced as a Phase 5 prerequisite in `workspace.json`.

The string-level regulatory rules (SaMD trigger phrases, state AI-therapy disclosure, FTC marketing claims, the eventual SR-5) are deferred to Phase 11 when real user-facing strings exist to calibrate against.

## Bypass policy

Trivial changes (single-file copy fixes, dependency bumps, comment fixes, doc-only updates) bypass the spec workflow entirely and commit directly. Threshold:

- Maximum 20 lines changed
- No behavior change
- No Sacred Rule surface (any file matching SR-1..SR-4's `file_globs` triggers full workflow regardless of size)

Bypass commits **must** include `[bypass]` in the subject line and a one-sentence justification in the body. This creates an audit trail. If `[bypass]` commits exceed 30% of total commits in any 30-day window, the workflow itself is too heavy and `learnings.md` gets a forced review entry.

## Amendment process

This file is mutated only via signed-off ADR (Architectural Decision Record). The ADR lives in `docs/adr/NNN-<title>.md` and references the constitution section it amends. The ADR commit and the constitution commit must be the same commit. Hooks run against the new constitution from the next session forward.

The four Sacred Rules **cannot be amended** without a separate process: the amendment requires (a) Dr. Lena Dobson's clinical sign-off for SR-1/SR-2/SR-3, (b) a security review for SR-4, and (c) a 7-day cooling-off period before the change lands. This is intentional friction. Sacred Rules should be hard to change.
