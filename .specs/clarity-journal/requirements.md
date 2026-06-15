# Requirements: Clarity Journal (mobile)

**Spec ID:** clarity-journal
**Status:** Requirements complete — ready for /spec-design
**Reads from:** brief.md
**Created:** 2026-06-16
**Brief read at:** 2026-06-16

> Scope is full-parity with web (7 sections + insights + report engine + PDF), Compass-housed, on-device only. This is large; `/spec-tasks` MUST slice it into shippable increments (suggested cut lines in "Open questions for design phase"). Requirements below describe the whole contract.

## User stories

### US-1: Daily journal check-in
**As** Aisha **I want** a quick daily entry (mood 1–10, energy 1–10, slept-last-night + hours, one-sentence note, optional tags) **so that** I build a daily baseline.
**EARS:** When the person opens the daily check-in and submits, the system shall persist the entry keyed to the local calendar day.
- AC-1.1: Mood and energy are 1–10 integers; sentence is free text; tags drawn from the journal's daily-tag set.
- AC-1.2: One entry per local calendar day; re-opening the same day edits the existing entry (no duplicate).
- AC-1.3: This is distinct from the standalone S4 Daily Check-In store; the journal does NOT write to or double-count the S4 check-in store (no double mood storage). Reconciliation detail → design.

### US-2: Weekly screening (PHQ-2 / GAD-2 / adapted PSS-4 / adapted WHO-5)
**As** Aisha **I want** brief weekly screeners with a plain-language level and a trend **so that** I can see whether things are shifting.
**EARS:** When the person completes a weekly screening, the system shall compute each instrument score with the web's exact formulas and classify a level.
- AC-2.1: Scores match web byte-for-byte: PHQ-2 `clamp(q1+q2,0..6)`, GAD-2 `clamp(q1+q2,0..6)`, PSS-4 `clamp(q1+(4-q2),0..8)` (reverse-scored confidence item), WHO-5 `clamp(q1+q2,0..10)`.
- AC-2.2: Levels match web thresholds: PHQ-2/GAD-2 low ≤2 / moderate ≤4 / else elevated; PSS-4 low ≤3 / moderate ≤5 / else elevated; WHO-5 inverted good ≥7 / moderate ≥4 / else elevated.
- AC-2.3: Levels render as educational language ("lower concern / moderate / worth attention"), never instrument names as verdicts and never diagnostic phrasing (SR-3).
- AC-2.4: Sustained-elevation guidance suggests professional support using invitational framing (copy → Dr. Dobson).
- AC-2.5: Distinct from the Clarity Score tool (PHQ-4): the journal's weekly screening neither imports nor is imported by Clarity Score.

### US-3: Thought record (CBT)
**As** Aisha **I want** to capture situation → automatic thought → distortions → evidence for/against → balanced thought → re-rate emotion **so that** I can reframe.
**EARS:** When the person completes a thought record, the system shall persist all fields and the before/after emotion ratings.
- AC-3.1: Emotion intensity captured before (0–10) and after (0–10); distortions chosen from the web distortion list.
- AC-3.2: The balanced-thought step is the signature reveal moment (design picks the motion).
- AC-3.3: Free-text fields are crisis-scanned (see US-11).

### US-4: Behavioral activation
**As** Aisha **I want** to plan an activity and compare predicted vs actual mood/mastery/pleasure **so that** I build momentum.
- AC-4.1: predictedMood and actualMood 0–10; type ∈ {mastery, pleasure, both} (web `ACTIVATION_TYPES`).
- AC-4.2: An activity logged-but-not-yet-rated is a valid draft state until the actual rating is added.

### US-5: Trigger & pattern log
**As** Aisha **I want** to log triggers/warning-signs/what-helps/what-worsens with severity **so that** patterns surface.
- AC-5.1: severity 1–5; category + subCategory from web sets; effectiveness 1–5 where applicable.
- AC-5.2: Free-text fields crisis-scanned (US-11).

### US-6: Wellness toolbox + safety plan
**As** Aisha **I want** a personal coping toolbox and a 6-section safety plan **so that** I have a plan when things get hard.
**EARS:** While building the safety plan, the system shall pre-seed the crisis-contact section with the region helpline (988 default in US locale).
- AC-6.1: Wellness toolbox = 4 web categories; safety plan = 6 Stanley-Brown sections.
- AC-6.2: Safety-plan + crisis copy requires Dr. Dobson clinical review AND App-Store crisis-content review before ship (SR-3, App Store 1.4.1).
- AC-6.3: Crisis-contact actions (call/text) use the device dialer via the existing crisis surface helpers; default 988 + region resolution.

### US-7: Weekly reflection
**As** Aisha **I want** a 5-field weekly reflection (went well / was difficult / patterns / do next / gratitude) **so that** I close the loop.
- AC-7.1: All five fields free text; crisis-scanned (US-11); distinct from the existing read-only S9 reflection terrain view.

### US-8: Guided prompts
**As** Aisha **I want** rotating guided prompts **so that** I'm not staring at a blank page.
- AC-8.1: Prompt library ported from web (CBT/ACT/positive-psych/self-compassion categories); prompts rotate deterministically.

### US-9: Journal insights
**As** Aisha **I want** trends and patterns across my entries **so that** I understand myself over time.
- AC-9.1: Computes (on-device) mood trend, screener trajectories, top cognitive distortions, behavioral-activation success rate, coping effectiveness, recurring triggers, and an entry streak.
- AC-9.2: No numeric verdict label of the person; trends shown as movement/levels with educational framing (SR-3).

### US-10: Therapist report + PDF export
**As** Aisha **I want** to generate a report to bring to a provider **so that** the session starts with context.
**EARS:** When the person taps "create report," the system shall assemble the report on-device and produce a shareable PDF only via an explicit user-initiated share.
- AC-10.1: Report engine ports web `reportEngine.ts` outputs: mood/screener trajectories, thought-record distortion analysis, behavioral/sleep/stressor/coping summaries, safety-flag rollup, session-prep prompts.
- AC-10.2: PDF generated on-device (reuse `features/therapist/pdf` expo-print path where feasible — design decides); never auto-transmitted (SR-4).
- AC-10.3: Sharing is an OS share-sheet action the person explicitly invokes; the app performs no network upload of report content.

### US-11: Free-text crisis detection (cross-cutting)
**As** a person in distress **I want** the journal to notice crisis language and offer help **so that** I'm routed to support immediately.
**EARS:** When free text in ANY journal field matches a crisis pattern, the system shall surface the crisis affordance (helpline/dialer) and shall not suppress or gate that behind any flag.
- AC-11.1: Every free-text field runs `precheckCrisis` from `@psychage/shared/safety` (the lifted, drift-guarded CRISIS list).
- AC-11.2: A match opens the crisis surface (region helpline + 988 fallback) and records a journal safety flag (on-device only).
- AC-11.3: Detection cannot be disabled by any flag, branch, env, or setting (SR-2).

### US-12: On-device persistence
**As** Aisha **I want** my journal to stay private on my device **so that** I trust it with hard things.
- AC-12.1: All journal data persists via MMKV only; versioned schema with a migrator (SR-13) and quarantine-on-corruption.
- AC-12.2: No journal/screener/safety-plan data is written to Supabase, analytics, or Sentry (SR-4).

### US-13: Compass entry + navigation
**As** Aisha **I want** the journal reachable from Compass **so that** I find it with the other tools.
- AC-13.1: Entry point under Compass; section hub lists the 7 sections + insights + report; today's incomplete sections are indicated.

## Sacred Rules → Acceptance criteria

| Sacred Rule | Acceptance criterion | How to verify |
|---|---|---|
| SR-1 (Navigator confidence cap) | N/A — Clarity Journal has no Navigator confidence path. | n/a |
| SR-2 (Crisis detection cannot be bypassed) | AC-N.2: No code path disables crisis detection via flag, branch, or environment. | Hook (sr2_crisis_bypass_detector.sh) + unit test on every free-text field (US-11) |
| SR-3 (No diagnostic language) | AC-N.3: All user-facing strings use educational framing. Sensitivity filter applies. | Hook (sr3_diagnostic_language.sh) + manual review by Dr. Lena Dobson for all clinical surfaces (screener levels, safety plan, insights) |
| SR-4 (Symptom data on device) | AC-N.4: No Sentry breadcrumb, analytics event, Supabase write, or third-party transmission contains raw journal/screener/symptom data. | Hook (sr4_no_symptom_telemetry.sh) + integration test; report PDF is user-initiated share only |

## Edge cases

- EC-1: **Offline** — fully functional; all reads/writes are on-device. No network dependency anywhere (report PDF included).
- EC-2: **Storage full / corrupt blob** — migrator quarantines unreadable records and continues; the person never loses access to the journal shell.
- EC-3: **Abandoned mid-entry** — partial entries persist as drafts where the section supports it (US-4 unrated activity; thought record in progress); never a half-written record masquerading as complete.
- EC-4: **Crisis detected mid-entry** — crisis surface takes priority over save flow; the in-progress text is not transmitted anywhere (SR-4).
- EC-5: **Reduce Motion on** — the balanced-thought signature reveal degrades to an essential cross-fade; non-essential motion off.
- EC-6: **Reduce Haptics on** — entry-save/affirm haptics suppressed; behavior otherwise unchanged.
- EC-7: **Schema upgrade** — a person returning after an old version's data is migrated N→N+1 with no silent loss (SR-13).
- EC-8: **Empty states** — each section and insights show a calm empty state (placeholder clay figure until library lands).
- EC-9: **Incomplete screener** — cannot compute/classify until all items answered; partial screeners are not scored.

## Sensorial requirements (mobile)

| Interaction | Haptic | Audio | Motion | Reduce-Motion fallback | Reduce-Haptics fallback | Reduce-Audio fallback |
|---|---|---|---|---|---|---|
| Save a section entry | affirm | no | yes (base) | static state change | none | n/a |
| Submit weekly screener | confirm | no | yes (base) | static | none | n/a |
| Thought-record balanced-thought reveal (signature) | confirm | no | yes (signature/calm) | essential cross-fade | none | n/a |
| Crisis surface appears | none (alert zone) | no | yes (swift) | instant show | n/a | n/a |
| Tab/section navigation | tap | no | yes (swift) | static | none | n/a |

## Out of scope (carry-forward)

- Any cloud sync / telemetry of journal, screener, or safety-plan data (SR-4) — explicit non-goal; intentional divergence from web's Supabase sync.
- Non-English journal UI copy (no `packages/i18n` yet). Crisis-keyword coverage is English V1 (matches current mobile chat/sleep lists); ES/FR crisis terms tracked as a follow-up tied to i18n.
- New clay figures beyond the existing/forthcoming library (undelivered, ETA 2026-07-08) — placeholders in V1.
- Merging/replacing the existing S4 Daily Check-In, S9 Reflection, Mood Journal, or Clarity Score tools — the journal is additive and self-contained.

## Constraints

- **Performance:** section hub and any section open <300ms warm; report assembly <1s for a year of entries.
- **Accessibility:** ≥44pt touch targets; screen-reader labels per HIG; WCAG AA contrast; honors Reduce Motion / Reduce Haptics.
- **Localization:** EN only in V1 (per Out of scope).
- **App Store:** Guideline 1.4.1 (medical/health — no diagnostic claims) and 5.1.1 (data collection consent) apply to the safety plan + screeners + crisis surface; PR must reference both.
- **Privacy:** Data classification = sensitive (mental health) + crisis. On-device only.
- **Regulatory:** On-device, no PHI transmission → within `rules/regulatory.md` posture (Phase 4.A resolved per workspace.json). No new transmission surface introduced.

## Definition of Done (feature-level)

- [ ] All user stories have passing tests
- [ ] All Sacred Rule ACs have passing tests AND hook validation passes
- [ ] All edge cases handled or explicitly deferred (with linked issue)
- [ ] Localized strings in all in-scope languages (EN only this feature)
- [ ] Sentry beforeSend filter excludes all journal/screener/safety-plan data
- [ ] PR description references App Store 1.4.1 + 5.1.1
- [ ] Reviewed by Dr. Lena Dobson (clinical: screener levels, safety plan, insights, all section copy)
- [ ] /mobile-design-audit passes
- [ ] /ultrareview pass on each implementation PR

## Open questions for design phase

- Pure scoring/types/insights/report logic → port into `packages/shared/clarity-journal` (mirrors sleep/mood-journal/check-in) vs `apps/mobile/features/clarity-journal`? (Recommend shared for the pure layer.)
- Report PDF: reuse `features/therapist/pdf` (build-html + expo-print) vs new builder.
- Exact reconciliation between the journal daily check-in and the S4 check-in store (separate store; optional read-only cross-reference?).
- **Slicing for /spec-tasks** — suggested cut lines: (S1) shared scoring/types/store + crisis-scan wiring + Compass hub; (S2) capture sections — thought record, behavioral activation, trigger log, daily check-in; (S3) weekly screening + reflection + toolbox/safety plan; (S4) insights; (S5) report engine + PDF. Each slice independently shippable.
- Clay-figure placeholders for empty/onboarding states until the library lands.

## Next step

Run `/spec-design clarity-journal` to translate these requirements into a concrete UI/data design with token-bound specs and a Sacred-Rules compliance map.
