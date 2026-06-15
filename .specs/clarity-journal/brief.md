# Brief: Clarity Journal (mobile)

**Spec ID:** clarity-journal
**Created:** 2026-06-16
**Status:** Discovery complete — ready for /spec-requirements

## Problem

A person doing CBT-style self-work on Compass mobile has nowhere to capture a thought record, run a behavioral-activation experiment, log triggers, track brief screeners over time, build a wellness toolbox / safety plan, or generate a session-prep report for a provider. The web app ships a full **Clarity Journal** (7 structured sections + insights + a therapist report engine + PDF). Mobile has only fragmented, unstructured pieces — a 5-state Daily Check-In, a tags-only Mood Journal, the Clarity Score assessment, and a read-only weekly reflection — none of which give the evidence-based, longitudinal journaling the web tool does. The parity audit ([docs/parity-audit/](../../docs/parity-audit/)) flagged Clarity Journal as the single biggest missing tool on mobile (whole tool absent).

## Users

**Aisha** (24, living with anxiety; daily-tracking-first) — primary. Wants to notice thought patterns, try small behavioral experiments, watch her screeners trend, and walk into a therapy session with something concrete. Secondary: **Sofia** (38), who arrives via the Navigator and later wants structure for the patterns she's noticing.

## Why now

Parity-driven: the audit named this the #1 coverage gap, and the product owner chose **full parity** (all 7 sections + the full report engine). It deepens Compass from "orient + assess" into "work on it over time," and gives the first real provider-handoff artifact on mobile. **Caveat:** this is a large, multi-slice feature (web is 7 sections + a 592-line report engine + PDF + versioned storage). It will not land in one task or one sprint; `/spec-tasks` must slice it, and it likely sequences across several spec cycles. The brief scopes the whole; delivery is staged.

## Scope

**In:**
- All 7 web sections, mobile-native: (1) daily check-in (journal variant), (2) weekly screening — PHQ-2, GAD-2, adapted PSS-4 (reverse-scored confidence item), adapted WHO-5, with the exact web scoring (`clamp` formulas) and thresholds, (3) thought record (CBT: situation → automatic thought → distortions → evidence for/against → balanced thought → re-rate), (4) behavioral activation (predicted vs actual mood, mastery/pleasure), (5) trigger & pattern log, (6) wellness toolbox + 6-section Stanley-Brown safety plan (default 988 contact), (7) weekly reflection (5-field form).
- Guided journal prompt library; journal insights (mood/screener trends, top distortions, coping effectiveness, streaks).
- **Full report engine** (port web `reportEngine.ts` logic: mood/screener trajectories, distortion analysis, behavioral/sleep/stressor/coping summaries, safety-flag rollup, session-prep prompts) + **on-device PDF export** (reuse `features/therapist/pdf` expo-print path where possible).
- **Mandatory free-text crisis detection** on every free-text field — reuse `@psychage/shared/safety` `precheckCrisis` + the web ClarityJournal scanner's coverage; surface a crisis overlay (tel:988 / region helpline). Non-bypassable (SR-2).
- On-device MMKV persistence with versioned migrators (SR-13); Compass entry point.

**Out:**
- **Any cloud sync / telemetry of journal or screener data** — explicit non-goal (SR-4). Forced divergence from web, which syncs to Supabase; mobile will not.
- Re-administering instruments already owned elsewhere without reconciliation — the journal's daily check-in must not double-store mood vs the existing S4 Daily Check-In, and weekly screening (PHQ-2/GAD-2) must not be conflated with the separate Clarity Score (PHQ-4). Reconcile at design.
- New clay figures beyond the existing/forthcoming library (library undelivered, ETA 2026-07-08) — use placeholders.
- Non-English journal UI copy (no `packages/i18n` yet) — but crisis-keyword coverage should consider ES/FR (audit gap).

## Success metric

**≥40% of users who open the Clarity Journal complete at least one full thought record within 7 days.** Measures whether the core CBT value (capture → reframe) actually lands, not just that the tool was viewed. Secondary watch: ≥2 distinct section types used in the first week (breadth of adoption).

## Sacred Rules in play

- **SR-2** — Free-text crisis detection on every journal text field; non-bypassable, no flag/branch disables it. Crisis match routes to the crisis surface.
- **SR-3** — No diagnostic language. Screener results shown as educational levels ("low / moderate / elevated concern"), never "you have." All section copy, screener result copy, and the elevated-score guidance require Dr. Dobson clinical review before ship.
- **SR-4** — All journal clinical data (screener scores, thought records, trigger logs, safety plan, reflections) is MMKV-only on device. No Supabase write, no Sentry breadcrumb, no analytics event. The report PDF is generated on-device; sharing is a user-initiated export only — never auto-transmitted. (The narrow check-in carve-out does NOT extend to screeners/thought-records.)
- **SR-1** — Not in play (no Navigator confidence path here).

Brand/compliance: person-first, sage voice, no clinical voice; the safety plan + crisis copy additionally need **App-Store crisis-content review** (Apple 1.4.1 / 5.1.1) alongside Dr. Dobson.

## Mobile IA assumption

IA is decided (`workspace.json`: bottom-tabs-4 Today/Learn/Compass/Find). Clarity Journal lives under **Compass** (the orient/assess/work-on-it hub alongside Navigator, Clarity Score, mood, breathing). No assumption needed.

## Sensorial commitment (mobile)

- **Haptic:** `affirm` on saving a section entry; `confirm` on completing a thought record / submitting a weekly screener. No haptic on the crisis overlay (alert states are a no-haptic zone per `tokens/mobile.tokens.json`).
- **Audio:** none in V1 (UI audio is empty per tokens).
- **Motion:** calm section transitions (base/calm durations); honor Reduce Motion (essential-only cross-fade).
- **Signature moment:** the **balanced-thought reveal** at the end of a thought record — the reframe lands with one calm, breathing transition. One signature moment, max.

## Open questions

- **Dr. Dobson clinical review** (required before ship): screener result/level copy, elevated-score guidance, safety-plan template wording, all section copy. — *requirements + design*
- **App-Store crisis-content review** (Apple 1.4.1/5.1.1) for the safety plan + crisis detection surface. — *design / pre-submit*
- **Reconciliation with existing tools:** does the journal's daily check-in reuse the S4 Daily Check-In store, and how does weekly PHQ-2/GAD-2 relate to the Clarity Score's PHQ-4 (avoid double-administration / double mood storage)? — *design*
- **Crisis-keyword language coverage:** English-only today; port the web ClarityJournal scanner's ES/FR terms for free-text? (audit flagged no ES/FR on mobile). — *requirements*
- **Report PDF infra:** reuse `features/therapist/pdf` (expo-print, build-html) vs a new builder. — *design*
- **Slicing:** this is too large for one spec cycle — confirm whether `/spec-tasks` slices it into multiple shippable increments (e.g., capture-first, then insights, then report). — *tasks*
- **Clay figures** for empty/onboarding states — library undelivered (ETA 2026-07-08); ship with placeholders? — *design*

## Next step

Run `/spec-requirements clarity-journal` to expand into user stories and acceptance criteria. (Given the size, expect requirements to recommend a sliced delivery plan.)
