# Clinical-review packet — Dr. Lena Dobson

**Purpose:** every user-facing surface that needs clinical sign-off before ship, in one list, prioritized by blocking status. Sacred Rule #2 (no diagnostic language) is load-bearing throughout — "people experiencing X often describe…", never "you have X".

**How to use:** review top-to-bottom. **Blockers** gate App Store submission / first ship. **Polish** can land in a fast-follow. Sign-off = a dated note (e.g. "ratified 2026-06-XX") per surface; do not invent the date.

**Status at compile:** copy is `CT4 FIXTURE` / `DRAFT → CT4` across the surfaces below — placeholder text pending this pass. The crisis helpline *data* (numbers, availability) is CT3-verified; only the *descriptions* are a copy gate.

---

## A. Blockers — gate first ship

| # | Surface | File(s) | What needs sign-off |
|---|---------|---------|---------------------|
| A1 | **Educational disclaimer** (store-compliance, App Store 1.4.1) | `apps/mobile/features/settings/copy.ts` → `about.disclaimerBody` | "Psychage is an educational resource. It does not diagnose, treat, or replace professional care…" — legal + clinical sign-off; the load-bearing health-claim statement. |
| A2 | **Crisis interstitial** (post-CRISIS Navigator halt) | `apps/mobile/features/crisis/*` | Grounding tone (not panic-inducing), Help-now clarity, zero diagnosis language, respects reduced-motion. SR-2 surface. |
| A3 | **Crisis helpline descriptions** | `apps/mobile/features/crisis/helplines.seed.ts` | 5-word factual lines ("National suicide and crisis line"); tone/accuracy/no-sensationalism. Numbers are CT3-verified; descriptions are the gate. |
| A4 | **Symptom Navigator KB** | `apps/mobile/features/navigator/kb.fixtures.ts` | Every symptom/condition name + description + severity tier + red-flag mapping. The one CRISIS-flagged symptom's wording + display gating. Currently placeholder — needs clinical authoring, not just review. (effort: large) |
| A5 | **Condition outlines** (Learn → Conditions hub) | `apps/mobile/features/conditions/data/condition-summaries.ts` | ~30–50 condition names/descriptions: person-first "pattern" framing (not diagnosis), educational-only, accurate prevalence, "when to seek care" guidance. (effort: large) |
| A6 | **Clarity Score copy** | `apps/mobile/features/clarity/*` (bands, interstitial, notes) | Band/tier labels (thriving/balanced/mixed/strained/reach-out); the ≥8 / q4≥2 crisis interstitial; "what stood out" notes (reframed from clinical flags); instrument names (PHQ-4/WHO-5/UCLA-3/PSS-4) must not claim diagnosis. |
| A7 | **Relationship Health copy** | `apps/mobile/features/relationship-health/copy.ts` (~50 strings) | Landing disclaimer ("not a diagnostic tool", "self-reflection"); the DV-hotline **safety interstitial** (tone + accuracy); results labels; legal/clinical disclaimer footer. |
| A8 | **Therapist-share PDF footer** (verbatim every page) | `apps/mobile/features/therapist/copy.ts` | "A personal check-in summary, shared from Psychage with your consent." + consent body ("No scores, no labels — just your own words"). No clinical vocabulary. |
| A9 | **Navigator clarifier prompts** | `apps/mobile/features/navigator/clarifiers.ts` (~15–20) | Severity/frequency/duration prompts: no leading language; CRISIS-flag prompts honest-not-sensational. |

## B. Feature gate (ship-blocking for that feature)

| # | Surface | File(s) | What needs sign-off |
|---|---------|---------|---------------------|
| B1 | **Mood Journal co-occurrence UI** | `apps/mobile/features/mood-journal/*` | Logic shipped + unit-tested; UI is gated pending review. Present the mood-trigger pattern mockup — verify no over-interpretation / diagnostic framing / missing grounding disclaimers. Unblock ship once approved. |

## C. Polish — fast-follow

| # | Surface | File(s) |
|---|---------|---------|
| C1 | Settings copy (11 screens) | `apps/mobile/features/settings/copy.ts` |
| C2 | Auth flow copy (~31 strings) | `apps/mobile/features/auth/copy.ts` — error lines must not leak account existence (generic "invalid credentials") |
| C3 | Learn / Find / Compass tab copy | `features/{learn,find,compass}/copy.ts` — educational, non-promotional framing |
| C4 | Supporter ("Keep Psychage Free") | `apps/mobile/features/supporter/copy.ts` — calm/honest, no guilt/"unlock" |
| C5 | WebView chrome + tool titles | `apps/mobile/features/webview/copy.ts` |
| C6 | Article reader chrome, offline/empty states | `features/content/copy.ts`, `features/offline/copy.ts` |
| C7 | Home hero + onboarding sequence | `apps/mobile/components/home/*` |
| C8 | Error/system messaging (SR-2/3) | scattered, ~20–30 — consolidate + audit for diagnostic/shame language |
| C9 | Article bodies (when authored) | `features/content/fixtures/ct1-articles.ts` (placeholder) — each real article reviewed before ship |

---

*Compiled from a read-only sweep of the mobile copy surfaces. File paths point at where each string lives. Counts are approximate where a surface bundles many strings.*
