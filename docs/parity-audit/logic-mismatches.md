# Logic / Scoring Mismatch Report

All findings adversarially verified against `file:line` in both repos. Web = `~/dev/psychage-v2`, mobile = `~/dev/psychage-fresh`.

Legend: severity (critical/high/medium/low) · **blocked** = closing toward web breaks a Sacred Rule or needs Dr. Dobson (§7).

---

## Clarity Score — VERDICT: MATCH (logic byte-identical)

Inputs (20 items, PHQ-4/WHO-5/UCLA-3/PSS-4/FUNC), all domain formulas, reverse-scoring (q14/q15), composite tiers (80/60/40/20), crisis predicate (PHQ-4 ≥8 OR q4 ≥2), clinical-flag thresholds (PHQ-2 ≥3, GAD-2 ≥3, WHO5% ≤28, UCLA ≥6), `STRENGTH_FLOOR=12`, recommendation threshold (≤10/20) — **all identical**.
- web `src/lib/clarity/scoring.ts` + `questions.ts` ↔ mobile `features/clarity/scoring.ts` + `questions.ts` + `bands.ts`

Divergences are presentation/output only (see [ux-ui-mismatches.md](ux-ui-mismatches.md)):
| id | sev | blocked | summary |
|---|---|---|---|
| `clinical-flags-reframed-as-notes` | low | ✅ §7 | Same thresholds; web surfaces "PHQ-2: 4/6 / elevated", mobile surfaces person-first notes with no instrument names. `scoring.ts:96-113` ↔ `scoring.ts:97-111` |
| `detailed-strength-insights-absent` | low | free | Web `getStrengthsAndGrowthDetailed` prose insights (`scoring.ts:286-337`) not ported; mobile groups domains via same `isSteady≥12` but emits band words only (`bands.ts:45-73`). |

---

## Symptom Navigator — VERDICT: MATCH (logic byte-identical)

Verified identical: symptom weights (1/2/3); severity `{1:0.6, 2-3:0.8, 4-5:1.0, 6-7:1.2, 8-10:1.4}`; frequency `{rarely:0.7, sometimes:1.0, often:1.2, always:1.4}`; duration `{below_half:0.7, half_to_full:1.0, meets_or_exceeds:1.3}`; geometric-mean combine; coverage factor (`COVERAGE_REFERENCE=20`, log2); **count cap `min(1.0, matched/3)`**; below-minimum penalty 0.6; ranking/diversity (`min_relevance_threshold=0.08`, `max_per_family=2`, `max_results=5`); red-flag screening (CRISIS>URGENT>WATCH, `should_halt=has_crisis`); 30 prohibited phrases; version `1.2.0`.
- web `src/lib/navigator/{scoring,engine,safety,config}.ts` ↔ mobile `packages/shared/navigator/{scoring,engine,safety,stepConfig}.ts`

| id | sev | blocked | summary |
|---|---|---|---|
| ~~`count-cap-divisor`~~ | ~~high~~ | — | **OVERTURNED.** Both use `/3` (web `scoring.ts:130`, mobile `scoring.ts:123`). First-pass misread; stale `/5` docstring in *both* repos. No runtime divergence. |
| `engine-entry-cap-floor` | low | free | Mobile **stricter**: floors `confidence_cap` at `min(rawConfig, 0.75)` at engine entry (`engine.ts:57-60`) — web only caps in `scoring.ts`. Strengthening, not a defect. |
| `tier-feature-flag-gating` | low | free | Mobile re-introduced `filterByFeatureFlags`/`isTierEnabled` (`engine.ts:78-88`) that web removed; mobile adapter seeds all 6 tiers ON → output-neutral by default. Path divergence only. |

> ⚠ SR-1 confidence cap (0.75) is **honored on both sides**; mobile enforces it at two layers. No parity action needed; do not "fix" toward exposing higher values.

---

## Relationship Health — VERDICT: MATCH (1:1 port)

Verified identical: 4 domains, 34 questions (10/8/8/8), 17 sub-dimensions, Likert 1-5; `computeDomainScore = ((total-min)/(max-min))*100` with reverse `6-raw`; composite = round(mean active domains); tiers (≥80 thriving / ≥60 healthy / ≥40 mixed / ≥20 strained / else isolated); **Four Horsemen** (criticism/contempt/defensiveness/stonewalling, thresholds 4/3); **DV + isolation alerts** (all thresholds identical); 10 pattern rules; 18 interventions; narrative templates. The Four Horsemen + DV/isolation detection is **present on web** (`narrative.ts`, `alerts.ts`, `patterns.ts`) and ported verbatim — mobile did not add it.
- web `src/components/tools/RelationshipHealthCheck/*` ↔ mobile `features/relationship-health/*`

| id | sev | blocked | summary |
|---|---|---|---|
| `compute-result-purity-seam` | low | free | Mobile `computeResult` is pure (returns `Omit<...,'id'|'createdAt'>`); store stamps id/createdAt via DI (`scoring.ts:191,237-252`). Web mints inline (`scoring.ts:230-247`). RN-correct, no result change. |
| `healthy-opener-sr3-reword` | low | ✅ §7 | "healthy" tier 2nd opener reworded "You have…"→"There are…" to dodge SR-3 seed phrase (`narrative.ts:45` ↔ web `:34`). Index + scoring identical. |
| `results-copy-ct4-fixture` | low | ✅ §7 | Mobile result/landing copy is a CT4 FIXTURE pending Dr. Dobson (`copy.ts:6-101`); web copy is shipped. |

---

## Sleep Architect — VERDICT: PARTIAL (calc identical, window + digest differ)

Pure scoring is a verbatim, numerically-identical port: duration `max(0, tib - latency - WASO)` with midnight wrap; efficiency `(sleep/tib)*100`; composite weights **dur .25 / eff .25 / qual .2 / consistency .15 / latency .15**; sub-scores (efficiency target 85%, consistency stddev 0min=100/60min=0, latency ideal 10-20 band); debt (last-14, recovery `ceil(debt/30)`); chronotype thresholds 22/18/12/8 + dolphin special-case; Pearson correlation core + 0.6/0.4/0.2 bands + 14-pair gate. (Note: neither side has a ">30min latency" or "awakenings>2" penalty — earlier hypothesis false.)
- web `src/lib/sleep/{calculations,constants,chronotype,templates}.ts` ↔ mobile `packages/shared/sleep/{calculations,constants,chronotype,score-band,correlations}.ts`

| id | sev | blocked | summary |
|---|---|---|---|
| **`score-window-7d-vs-14entry`** | **high** | free | **CONFIRMED real numeric divergence.** Web scores entries within a user-selectable calendar-day window, default **7 days** (`useSleepScore.ts:11`, `SleepDashboard.tsx:24-29` toggle 7/30/90). Mobile always scores the newest **14 entries** (`SleepDashboard.tsx:58 entries.slice(0,14)`) — no range control. Same logged data → different composite → can cross a band. Different *semantics* too (cal-day cutoff vs fixed entry count). |
| `weekly-digest-divergent-reimpl` | medium | free | Web `generateWeeklyDigest` (rich conditional prose; same-threshold 10 min; eff 85%; stddev bands; screen+caffeine sentences, `templates.ts:16-149`) was **not ported**. Mobile wrote its own `WeeklyDigest` (count + one week-over-week line, 15-min threshold, `WeeklyDigest.tsx:25,81-86`). |
| `weekly-digest-not-in-shared` | low | free | `templates.ts`/`generateWeeklyDigest` never lifted into `packages/shared/sleep` (no shared home). |
| `correlation-mood-source` | low | free | Web cross-correlates 4 sleep metrics × 4 mood-journal axes (`calculations.ts:435-495`); mobile correlates each metric vs the entry's own `morning_mood` (single axis) since mobile has no separate mood-journal valence feed. Pearson + bands identical. |

---

## Mood Journal — VERDICT: DIVERGENT (taxonomy identical, data model + insights differ)

Emotion taxonomy (12, same order) and trigger/impact taxonomy (9, same order) are **byte-identical** (mobile "lifted verbatim"). Everything around storage and insights diverges materially.
- web `src/components/tools/MoodJournal.tsx`, `MoodWizard/*`, `moodService.ts`, `LightweightInsights.tsx` ↔ mobile `features/mood-journal/*`, `packages/shared/mood-journal/*`

| id | sev | blocked | summary |
|---|---|---|---|
| **`valence-required-vs-optional`** | **high** | free | **CONFIRMED.** Web valence always captured (default 5, mandatory slider, every entry has a number — `MoodWizard.tsx:27`). Mobile valence optional/skippable (default `null`, omitted when unset — `AddMomentSheet.tsx:46,72`; type `packages/shared/mood-journal/types.ts:45,80`). Changes what data exists. |
| `db-valence-1to5-validation-bug` | high | free | **CONFIRMED — this is a WEB bug.** Web `moodService` rejects `value>5` (`moodService.ts:78-81,122-124`) but the wizard slider is 1-10, so authed entries with mood 6-10 silently fail to persist to Supabase. Mobile validates full 1-10 and is local-only, so unaffected. *Fix belongs to the web team.* |
| `valence-float-vs-integer` | medium | free | Web valence float (step 0.01, `StepValence.tsx:62`); mobile integer 1-10 (`types.ts:66-73`). |
| `tag-requirement-and-distinction` | medium | free | Web requires ≥1 emotion AND ≥1 impact area, then **merges into one flat `tags[]` losing the distinction** (`MoodJournal.tsx:67`). Mobile requires ≥1 tag total and **keeps emotions/triggers separate** (`AddMomentSheet.tsx:54`) — arguably *better*. |
| `streak-gap-tolerance` | medium | free | Web streak walks entries, day-diff ≤1 (`LightweightInsights.tsx:21-32`); mobile walks strictly-consecutive calendar days (`patterns.ts:210-222`). Different streak values. |
| `trend-algorithm` | medium | free | Web sparkline = raw last-7-entries; mobile = per-day average + split-half direction (ε 0.5) (`patterns.ts:154-173`). |
| `top-emotions-vs-frequency-bars` | medium | free | Web = first 5 unique emotions, no counts; mobile = ranked emotion+trigger frequency bars with counts (`patterns.ts:33-56`). |
| `note-length-cap` | low | free | Web no cap; mobile 280 UTF-16 (`types.ts:51`). |
| `sync-vs-local-only` | low | ✅ SR-4 | Web syncs authed entries to Supabase; mobile is local-only by construction. **Closing toward web violates SR-4** — do not. |
| `cooccurrence-mobile-only-gated` | low | ✅ §7 | Mobile has trigger↔check-in co-occurrence (`patterns.ts:98-131`), implemented but unrendered pending Dr. Dobson. Mobile excess, not a gap. |

---

## Crisis detection lists — VERDICT: MATCH (live surfaces identical)

| id | sev | blocked | summary |
|---|---|---|---|
| `chat-crisis-tier-parity` | low | free | MindMate CRISIS regex tier: **11/11 byte-identical** (web `ai/safety.ts:50-60` ↔ mobile `crisis-keywords.ts:19-29`). |
| `sleep-crisis-list-parity` | low | free | Sleep free-text scan: **18/18 identical** (web `sleep/constants.ts:313-332` ↔ shared `sleep/constants.ts:30-49`). |
| `chat-urgent-harmful-tiers-not-mirrored` | low | free | Web URGENT (7) + HARMFUL (6) tiers not mirrored client-side — by design; server classifier authoritative. |
| `clarityjournal-freeform-scanner-absent` | medium | free | Web ClarityJournal 16-term scanner (incl. ES/FR) absent on mobile — but its consuming surface (free-text journal) doesn't exist on mobile yet. Becomes real only if a journal is ported. |
| `no-spanish-french-terms-on-mobile` | medium | free | No non-English terms in any mobile offline crisis pre-check. Chat is mitigated (multilingual server LLM); offline pre-check would miss ES/FR. App targets EN/PT/ES/SV/FR. |

---

## Clarity Journal — VERDICT: MISSING (entire tool absent on mobile)

Web `src/components/tools/ClarityJournal/` = 7 sections + 592-line report engine + PDF + versioned storage. Mobile has **none** of it. (`features/clarity/` is the unrelated Clarity *Score* assessment; standalone Daily Check-In is a 5-state selector + 24-char note, not the journal.)

| id | sev | blocked | summary |
|---|---|---|---|
| **`journal-crisis-keyword-detection-absent`** | **critical** | ✅ SR-3 | Web scans free-text journal entries → SafetyFlag + CrisisOverlay (tel:988) (`FreeFormSection.tsx:25-34`, `DailyEntryV2.tsx:65-66`). Mobile check-in note has **no scan** (`CheckInSheet.tsx:56-68`). Not live today (no journal), but **any journal port MUST include free-text crisis detection** or it violates SR-3. |
| `weekly-screening-…-absent` | high | ✅ §7 | PHQ-2/GAD-2/adapted-PSS-4/adapted-WHO-5 weekly screening (`scoring.ts:8-61`) absent. |
| `wellness-toolbox-safety-plan-absent` | high | ✅ SR-12/§7 | 4-cat Wellness Toolbox + 6-section Stanley-Brown Safety Plan w/ default 988 (`constants.ts:109-125`) absent. Crisis-adjacent → clinical + App-Store review. |
| `journal-insights-therapist-report-absent` | high | free | 592-line report engine + PDF (`reportEngine.ts`) absent. (Mobile has a *different* therapist PDF for check-ins only — `features/therapist/pdf/build-html.ts` — not the journal report.) |
| `thought-record-cbt-absent` / `behavioral-activation-absent` / `trigger-pattern-log-absent` / `weekly-reflection-form-absent` / `guided-prompts-absent` | medium-low | free | Each CBT section absent (mobile `features/reflection` is a read-only check-in terrain, not the structured form). |

---

## Medication Tracker — VERDICT: MISSING native (WebView fallback exists)

Mobile `app/tools/med-tracker.tsx` is a 6-line `<WebViewSurface surface="med-tracker" />` (S31) loading remote `/m/med-tracker`. No native form, store, adherence math, chart, history, or export. Because the WebView runs the actual web app, behavior is "identical" only by being the web app — zero offline/native parity, data lives in WebView localStorage not MMKV/secure-store.

Web-only logic not ported (all `src/components/tools/MedicationTracker/`):
- Adherence `total===0 ? 0 : round(taken/total*100)`, default 7-day window (`storage.ts:213-260`)
- Streak: consecutive days all-taken, overall `min` of per-med (`storage.ts:234-250,277`)
- Schedule math: weekly/biweekly(`%14`)/monthly/as-needed gating (`storage.ts:158-203`)
- Input vocabularies: `DOSAGE_UNITS` (11), `FREQUENCY_LABELS` (8), `MEDICATION_COLORS` (8), `COMMON_SIDE_EFFECTS` (20) (`constants.ts:11-106`)
- Export: JSON download + clipboard text (not CSV/PDF as sometimes assumed) (`storage.ts:291-352`)
