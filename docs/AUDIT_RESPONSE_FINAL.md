# AUDIT_RESPONSE_FINAL — Convergent Plan

> **Status:** Final convergent position after audit memo + counter-memo + reply. Supersedes both prior memos as the single forward-looking record.
> **Decision:** Path B — ship the convergent plan with hooks, constitution.md, and Phase 4.A regulatory architecture pre-req for Phase 5.
> **Time impact:** Phase 4 grows from ~5 days to ~7 days. Subsequent phases gain ~2 days total of audit-driven additions, distributed across 4.A, 4.B, 6, 7, 11.

---

## 1. The conversation that produced this plan

Three documents preceded this one:

1. **Phase 4 deployment plan** — original, pre-audit. Shipped 7 files. Treated Sacred Rules as advisory.
2. **Audit memo** — external review by a strong reviewer. 23 items across three tiers. Caught the load-bearing gap (advisory enforcement of clinical-safety rules). Overreached on three items (subagent conversion, test runner lock, full regulatory codification timing). Anchored prioritization to fabricated percentages.
3. **Counter-memo** — pushed back specifically on the three overreaches and the percentages. Conceded everything else.
4. **Reply to counter** — the auditor conceded six items cleanly, refined two, and pushed back hard on one (regulatory architectural posture timing).

The single remaining disagreement (regulatory architectural posture at Phase 4.A vs. Phase 11) was resolved in favor of the auditor's position. Architectural posture decisions get baked into Phase 5 schema work; deferring them to Phase 11 creates expensive rework.

This document is what we ship.

---

## 2. The convergent plan — what's different from the original

### Phase 4 (revised)
- **Adds** `constitution.md` as the canonical source for Sacred Rule patterns
- **Adds** four hook scripts (`.claude/hooks/sr1..sr4`) reading patterns from constitution.md at runtime
- **Adds** `.claude/settings.json` wiring hooks into PreToolUse, Stop, SessionStart events
- **Adds** smoke-test corpus (`HOOKS_SMOKE_TEST_FIXTURES.md`) and validates hooks against it
- **Adds** `tooling.testRunner.candidate` field (recommended, not locked)
- **Adds** `phase5Prerequisites` section with two hard gates
- **Modifies** `/spec-design` SKILL.md to use composition pattern (skill that calls subagent for heavy reading), not full subagent conversion
- **Modifies** `/spec-implement` SKILL.md to add `/ultrareview` final pre-commit step + `[bypass]` commit-tag awareness
- **Modifies** `/spec-discovery` SKILL.md to recommend `--permission-mode plan`
- **Adds** three new `learnings.md` entries (bypass policy, Phase 5 regulatory pre-req, constitution amendment process)

Time impact: Phase 4 goes from ~5 days to ~7 days. The +2 days are honest cost for hooks + constitution + smoke testing.

### Phase 4.A (revised)
- **Adds** `rules/regulatory.md` with four architectural commitments resolved (HIPAA covered-entity status, 42 CFR Part 2 default, encryption-at-rest standard, BAA chain audit trail)
- **Becomes hard gate for Phase 5** — code touching PHI/symptom data cannot land until these four resolve

Time impact: ~+0.5 day for the regulatory architectural decisions (mostly emails to Supabase, Sentry, illustrator about BAAs).

### Phase 4.B (unchanged from previous plan)
- Mobile design language work
- Clay figure library scoping
- Adds SessionStart hook for clay-figure manifest gate (refuses Phase ≥11 sessions when manifest <30 entries)
- `/mobile-design-audit` ships static-only at 4.B

### Phase 5 (unchanged in scope, but now gated)
- Cannot start until `phase5Prerequisites` gates close
- Same shared package lift work as before

### Phase 6 (revised)
- **Adds** Storybook RN setup
- **Adds** i18n per-feature namespace pattern as hard rule
- **Adds** test runner lock (confirms or overrides Phase 4's candidate)
- **Adds** Mood Quick-Check tracer bullet — must ship to TestFlight/internal Android, used on real device for ≥48 hours, friction points captured in `learnings.md` before Phase 7 begins

Time impact: +1 day across additions.

### Phase 7 (revised)
- **Adds** Tier 2 hooks via Biome + custom rules (PEAF, sensitivity, @/, Tailwind, ArticleRecord shape, etc.)
- **Adds** `_shared` skill block for boilerplate deduplication
- **Adds** DoD field per task in tasks.md, validated by hook
- **Adds** `_metrics.jsonl` SessionEnd hook for workflow metrics
- **Decision point:** add `/spec-verify` per-PR hook based on measured drift rate from ~10 specs

Time impact: ~+0.5 day across additions.

### Phase 11 (revised)
- **Adds** SR-5 hook (no therapeutic claims) — string-level, calibrated against shipped strings
- **Adds** full regulatory string-level codification (SaMD trigger phrases, state AI-therapy disclosure copy, FTC marketing claims)

---

## 3. What was rejected and why

**Rejected from the audit:**

1. **Subagent conversion of two skills.** Anthropic docs explicitly recommend skills as the default; subagents as escalation when context blows up. Composition pattern (skill calls subagent for specific heavy work) replaces wholesale conversion. Zero extra Phase 4 work.

2. **Test runner locked in Phase 4.** Premature; Phase 6 has the right information. Candidate field captures the recommendation without committing.

3. **Regulatory string-level rules at Phase 4.A.** Cannot calibrate against imaginary code; deferred to Phase 11. (But architectural posture goes at 4.A — that's the auditor's correct push-back.)

4. **Per-PR `/spec-verify` hook in Phase 4.** Friction cost (~$0.20 + 1min latency per feature) creates ceremony fatigue. Deferred to Phase 7 decision after measured drift rate from ~10 real specs.

5. **60/85/92/95% reliability scorecard.** Fabricated precision. Replaced with qualitative failure-mode reasoning.

6. **All eight Tier 2 hooks in Phase 4.** Most are mechanical Biome rules. Wait until Phase 7 when Biome lands.

---

## 4. The qualitative reliability ladder (replacing percentages)

**Today (without convergent plan):**
- Sacred Rules can be violated under context pressure, on long sessions, after compaction.
- Specs can drift from implementation undetected.
- Test runner choice affects TDD smoke test against an unspecified runner.
- Architectural regulatory posture is implicit; assumed-safe defaults will get baked in.
- Clay-figure library deadline is a soft promise.

**With convergent plan landed:**
- Sacred Rules cannot be violated by Claude. Hook blocks land in shell, outside the LLM reasoning chain.
- Specs cannot drift past a phase close (per-PR detection deferred but acceptable).
- Test runner candidate exercises the smoke test against a real concept.
- Regulatory architecture is committed before code touches PHI.
- Clay-figure manifest is a hard gate, not a soft promise.
- Sensory accessibility is committed in the design system before features ship.

**What's still possible to fail:**
- Spec ambiguity that requires human judgment.
- Mid-feature drift between phase boundaries.
- A new failure mode we haven't predicted.

The first two are irreducible without dropping back to manual review on every PR. The third is what `learnings.md` exists for — every new failure becomes a new rule, per the compound-engineering pattern.

---

## 5. Files in this delivery

12 files total. 6 net-new (per Path B convergent plan). 6 revisions of files delivered earlier:

| File | Status | Where it lives |
|---|---|---|
| `constitution.md` | NEW | workspace root |
| `.claude/settings.json` | NEW | `.claude/` |
| `.claude/hooks/sr1_navigator_confidence_cap.sh` | NEW | `.claude/hooks/` |
| `.claude/hooks/sr2_crisis_bypass_detector.sh` | NEW | `.claude/hooks/` |
| `.claude/hooks/sr3_diagnostic_language.sh` | NEW | `.claude/hooks/` |
| `.claude/hooks/sr4_no_symptom_telemetry.sh` | NEW | `.claude/hooks/` |
| `HOOKS_SMOKE_TEST_FIXTURES.md` | NEW | workspace root or docs/ |
| `AUDIT_RESPONSE_FINAL.md` | NEW (this file) | docs/ |
| `workspace.json` | revised | `.claude/` |
| `phase4_turn1_setup.sh` | revised | runs from workspace root |
| `PHASE_4_DEPLOYMENT_PLAN.md` | revised | reference doc |
| `learnings_md_contingency_entries.md` | revised | paste-into-learnings text |

Strategy memos (`DESIGN_AND_CODE_QUALITY_STRATEGY.md`, `MOBILE_DESIGN_QUALITY_STRATEGY.md`) are unchanged — their substance was orthogonal to the audit.

---

## 6. What happens next

1. **Save the file bundle** to `~/Downloads/`. The setup script expects them there.
2. **Run `phase4_turn1_setup.sh`** from `psychage-master-app/`. It places files, makes hooks executable, validates JSON, runs the smoke-test corpus, and aborts if anything fails.
3. **Manually test SR-3 prompt hook** against the 10-case rubric in `HOOKS_SMOKE_TEST_FIXTURES.md` §SR-3. Pass criterion: ≥9/10 correct decisions from Haiku. This requires invoking the API.
4. **Reply "Phase 4 — turn 2"** when both setup script and SR-3 manual test pass cleanly.

Phase 4 is now an 11-turn deployment instead of 8:
- Turn 1: foundation files + hooks + smoke test (this delivery)
- Turns 2–7: six SKILL.md files, one per turn, each smoke-tested
- Turn 8: smoke-test cleanup + atomic Phase 4 close commit
- (No additional turns; the original 8 turns absorbs the audit additions)

Wait — recounting: original was 8 turns; audit additions land in turn 1 (this one). Same 8-turn total, denser turn 1.

---

## 7. The tradeoff captured in this plan

**What you get:** clinical-safety enforcement that Claude cannot violate even on session 47 after compaction. Drift detection at phase boundaries. Regulatory architecture committed before PHI code ships. Quantitative signal for "workflow becoming too heavy" via [bypass] tag tracking.

**What you pay:** +2 days in Phase 4 itself, +2 days distributed across subsequent phases, a 13-file Phase 4 close commit instead of 7, and a constitution.md that creates intentional friction around Sacred Rule changes.

The cost is real. The alternative (Path A: lighter Phase 4, accept residual risk) was defensible. Path B was chosen because Sacred Rules in advisory storage on a clinical-safety project is the kind of decision that produces a 6-month later "we should have seen this coming" moment.

This decision is on record. If the trade turns out wrong — if the workflow becomes too heavy and bypass commits exceed 30% — `learnings.md` captures the canary. If the hooks turn out to be over-engineered for the actual failure rate, we revisit at Phase 11 close. Both directions are recoverable; the worst version of this is "Sacred Rules violated in production because hooks weren't shipped." That version is now off the table.
