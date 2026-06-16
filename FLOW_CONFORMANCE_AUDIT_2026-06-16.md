# PSYCHAGE V1 — FLOW CONFORMANCE AUDIT + MASCOT ASSET COUNT
Audited 16 June 2026 · Read-only · Evidence-cited

## SCOPE & TARGET (read first)

The audit's Part B/E invariants — `@keyframes` count, `fill="#1A9B8C"`, CSS selectors, DOM nodes, mascot render approach — are only meaningful against an HTML/CSS artifact. The sole such artifact in the workspace is:

- **`psychage-v6-r3.html`** (2206 lines, title *"Psychage — v6 · Design Library, slice 1"*). This is the audited target.

This file is a **prototype slice + design library**, NOT the full V1 build. It contains 11 `.screen` sections plus 2 overlay sheets. Many of the 50 spec screens are either absent or appear only as *spec notes* inside the design-library screen (`view-dslib`). The production implementation lives separately in the **Expo RN app `apps/mobile/`** (NativeWind + Reanimated; zero `@keyframes`, no `fill="#1A9B8C"`), which is out of scope for the HTML-grep invariants. Where a flow exists in RN but not in the HTML target, it is noted — but per the audit rules, **absence in the target is a finding**, graded as such.

Net consequence: against this slice-1 target, ~12 of 19 flows are *Not built* and ~30 of 50 screens are *Missing/spec-only*. That is expected of a design-library slice; it is reported honestly, not as defect inflation.

---

## PART A — FLOW CONFORMANCE (19 flows vs `psychage-v6-r3.html`)

| # | Flow | Status | Evidence |
|---|---|---|---|
| 1 | Onboarding → first check-in | **Not built** | No S1/S2 view; greeting hardcoded `Good evening, Amara` (L568). Check-in sheet exists (L1564) but no Welcome/trust screens precede it. |
| 2 | Daily check-in | **Partial (core conformant)** | Sheet L1564-1580: title "How are you right now?" (L1567), subline (L1568), 5 states via `#moods` JS, note placeholder verbatim "A word about it — optional" (L1576), `Save today's entry` disabled-until-select (L1578), "Stays on your phone" (L1579). Imprint keyframe L127. Bridge L599-606. Mascot home-only (L571) + `ack` tilt. Min path CTA(L596)→state→save = **3 taps ✓**. Offline/error/edit states are not exercised in a static mockup. |
| 3 | Post-save reminder ask | **Not built** | No reminder card / time-chip / pre-permission pattern anywhere. |
| 4 | Notification → re-entry | **Not built** | No notification entry simulation. |
| 5 | Lapse return (≥2 days) | **Partial (demo)** | JS `away` scenario: `weekAway`, `setScenario('away')` (L1770, L1780) renders away terrain + status; demo toggle only, no dedicated copy screen. |
| 6 | Crisis ("Help now") | **Partial** | `view-crisis` L788-805: lead copy verbatim (L797), emergency call CTA (L798-801). **Mascot NEVER ✓** (none). **Pill correctly absent on crisis ✓.** BUT `href="tel:"` empty (L798) + L803 "Mockup stub — production screen lists localized hotlines" → region picker (S12) + helpline list not built. |
| 7 | Anon → account upgrade | **Not built** | No auth views in target. (Exist in RN `app/(auth)/`.) |
| 8 | Sign in | **Not built** | As F7. |
| 9 | Migration (never-lose-an-entry) | **Not built** | No migration screen/queue in target. |
| 10 | Sign out | **Not built** | No sign-out confirm in target. |
| 11 | History | **Not built (stub)** | `History` link is `onclick="stub(...)"` (L586). No continuum screen; `view-dslib` documents it as a spec note (L1288). |
| 12 | Weekly Reflection | **Partial** | `reflRow` "This week's reflection is ready." (L589-591) + `openReflection()`; no dedicated reflection screen section among the 11 views. |
| 13 | Symptom Navigator | **Not built** | Tile is `stub(...)` (L642). Only the relevance-phrase component is showcased in `view-dslib` (L1400). **Mascot NEVER ✓** (no nav surface). |
| 14 | Toolkit exercise | **Partial** | `view-breath` live (L1525) with breathing form + cues; intro/end screens not built; Grounding/Body-scan are stubs (L629, L634). **Mascot absent ✓** (none on breath). |
| 15 | Article reading | **Partial + VIOLATION** | `view-library` reader live (L1128-1233; `libReadTitle`/`libReadTag`). **No Help-now pill on this screen** (see Part B5) → crisis not ≤1 tap. Mascot absent ✓. |
| 16 | Find Care | **Partial (conformant shell)** | `view-findcare/find/finddir/provider` all live (L808/920/942/1041), each carries pill; crisis affordances inline (L850, L1083). WebView nature N/A in mockup. Mascot absent ✓. |
| 17 | Therapist link / PDF | **Not built** | No therapist/consent/PDF screens in target. |
| 18 | Settings / privacy / delete | **Partial + VIOLATION** | `view-profile` settings (L1105-1128) minimal; "Make it yours" sheet present (L1584-1604). No Privacy/Export/Delete screens. **No Help-now pill on this screen** (Part B5). Mascot absent ✓. |
| 19 | Supporter surface | **Not built** | No "Keep Psychage free" surface (correctly absent from home/onboarding too — see Part B9). |

### Deviations (one line each)
- `psychage-v6-r3.html:803` — Crisis screen helpline list + region picker stubbed; `tel:` target empty (L798) → Flow 6 offline/region states unbuilt.
- `psychage-v6-r3.html:1128-1233` — Article reader (`view-library`) renders no `.help-pill` → crisis unreachable on the screen (doctrine breach).
- `psychage-v6-r3.html:1105-1128` — Settings (`view-profile`) renders no `.help-pill` → same breach.
- `psychage-v6-r3.html:88` — `@keyframes veilIn` is a 5th motion outside the closed set of 4 (Part B1).
- `psychage-v6-r3.html:586,642` — History + Symptom Navigator are `stub()` placeholders, not flows.

---

## PART B — GLOBAL INVARIANTS

| # | Invariant | Result | Evidence |
|---|---|---|---|
| 1 | `@keyframes` === 4 (closed set) | **FAIL (5)** | `settle`(L73), `veilIn`(L88), `breathe`(L112), `ack`(L114), `imprint`(L127). Four map to the closed set (settle=page-load, breathe=mascot, ack=head-tilt, imprint=Imprint); **`veilIn` (sheet-scrim opacity fade) is the 5th** and is not in the §0 vocabulary. Literal violation per "any fifth animation is a violation." |
| 2 | `fill="#1A9B8C"` === 0 | **PASS (0)** | Zero `fill="#1a9b8c"`. The hex appears 2× only as the `--teal` token definition + dark fallback, never as a `fill=` attribute. |
| 3 | Naming: `Psychage` only, `Sykesh` 0 | **PASS** | `Sykesh` = 0; `Psychage` = 10. No other product name. |
| 4 | Forbidden words 0 (Clarity Score exempt) | **PASS** | `streak`/`trend`/`best`/`great`/`congrat` = 0. `score` = 2, both "Clarity Score" (L654, L657) → exempt. `normal` = 5, all JS identifiers/scenario strings (`weekNormal`, `setScenario('normal')` L1689/1770/1780-81) — never user copy, never a people-descriptor. |
| 5 | Crisis pill on every screen except crisis | **FAIL** | Present: home(L556), findcare(L814), find(L922), finddir(L948), provider(L1047), breath(L1527 chrome); `#persistentHelp` overlays open sheets (L355, L1557). Absent: crisis ✓ (correct). **Missing on `view-profile` Settings (L1105-1128) and `view-library` Article reader (L1128-1233)** — both live product surfaces. (`view-stub`/`view-dslib` are placeholder/meta pages, N/A.) |
| 6 | Mascot doctrine | **PASS** | Single instance, home only (L571). Absent from crisis, Navigator (unbuilt), bridge (same home surface), breath, find, settings. `ack` tilt is a state-independent container rotate — no mood-mirroring fork. No confetti/levels/reward/growth/costume anywhere. |
| 7 | Reduced-motion path for all motions | **PASS** | Global `.anim` gate on every keyframe; `@media (prefers-reduced-motion: reduce)` L531; JS `reduce` strips `.anim` (L1614-1616) and an in-mockup toggle (L1974-1978). Imprint→instant, settle→in-place, breathe/ack→still all covered. |
| 8 | Ask order (no cold account/notif before value) | **PASS** | No onboarding, account ask, or notification permission exists anywhere in target → no cold ask present. (Contextual reminder ask is simply unbuilt, F3.) |
| 9 | No paywall / locked features; Supporter only in Settings+About | **PASS** | No paywall, no subscription, no locked tile. Supporter surface absent (incl. from home/onboarding/post-check-in) — satisfies the "never offered" rule by omission. |
| 10 | Navigator honesty (75% cap + caveat; halt outranks) | **PASS on component / halt unverifiable** | `Strong match (75%)` hard-capped, text-only, three-phrase vocabulary, caveat-once rule documented (L1400-1403). Live Navigator flow + severity halt are **not built**, so halt-precedence cannot be exercised. |

---

## PART C — SCREEN COVERAGE (S1–S50)

Built = live interactive section. Partial = present but stubbed/incomplete. Spec-only = documented in `view-dslib` notes, not a build. Missing = absent.

| Screen | Name | Status | Evidence |
|---|---|---|---|
| S1–S2 | Onboarding Welcome / record+trust | Missing | No view; greeting hardcoded L568 |
| S3 | Home | **Built** | `view-home` L552 |
| S4 | Check-in / edit sheet | **Built** | `#sheet` L1564 |
| S5 | Compass tab | Spec-only | dslib tab note L1260 |
| S6 | Learn tab | Partial | `view-library` L1128 (library/reader merged) |
| S7 | History continuum | Spec-only | dslib L1288; home link stubs L586 |
| S8 | Entry detail sheet | Missing | — |
| S9 | Weekly Reflection | Partial | `reflRow`+`openReflection()` L589 |
| S10 | Earlier reflections | Missing | — |
| S11 | Crisis screen | Partial | `view-crisis` L788 (helplines stubbed L803) |
| S12 | Region picker | Missing | — |
| S13–S18 | Navigator (Area/Symptoms/Clarifier/Severity/Halt/Results) | Missing / Spec-only | Tile stub L642; relevance phrase only, dslib L1400 |
| S19–S21 | Exercise intro / exercise / end | Partial | `view-breath` L1525 (exercise only; no intro/end) |
| S22 | Article reader | Partial | `view-library` reader L1128 (no pill) |
| S23–S25 | Library browse / search / offline | Partial / Missing | Library list within L1128; search/offline missing |
| S26–S28 | Directory / provider detail / find offline | **Built** / Partial | `view-finddir` L942, `view-provider` L1041; offline fallback missing |
| S29–S32 | Sleep / Relationship / Med Tracker / Clarity (WV) | Spec-only | dslib WV-state note L1486; tiles stub |
| S33–S37 | Auth (why/email/code/migration/sign-out) | Missing | — |
| S38–S41 | Therapist (consent/add/range/PDF) | Missing | — |
| S42 | Settings hub | Partial | `view-profile` L1105 (no pill) |
| S43 | Reminders | Spec-only | dslib note |
| S44 | Make it yours (sheet) | **Built** | `#pVeil` L1584 |
| S45 | Accessibility & appearance | Spec-only | dslib rows note L1446 |
| S46 | Privacy & your data | Missing | — |
| S47–S48 | Delete (what/confirm) | Missing | — |
| S49 | About & legal | Missing | — |
| S50 | Keep Psychage free (Supporter) | Missing | — |

**Built/Partial: ~13 of 49. Missing/Spec-only: ~36.** Consistent with a slice-1 design library.

### Killed/absent items — confirm NOT present (each would be a violation)
| Item | Result |
|---|---|
| Insights & trends | **Absent ✓** |
| Paywall / subscription-management | **Absent ✓** |
| Streak + sparkline confirmation | **Absent ✓** (no `streak`) |
| Premium-gated therapist tiers | **Absent ✓** |
| Cold first-launch notification prompt | **Absent ✓** |
| "Sykesh" naming | **Absent ✓** (0 hits) |

All killed items correctly absent. **PASS.**

---

## PART D — RUBRIC RE-SCORE (regressions only)

Assessable only for built flows.

- **Flow 15 (Article reading)** — Axis 7 (Moment fit / crisis ≤1 tap from anywhere): Flow Book 2 → **build 0**. No `.help-pill` on `view-library` (L1128-1233) makes crisis unreachable from the reader. A zero on an axis → **flow under bar.** Regression + blocker.
- **Flow 18 (Settings)** — Axis 7: Flow Book 2 → **build 0** for the same reason (`view-profile` L1105 has no pill). Settings is graded on global crisis reach; missing pill = zero.
- **Flow 6 (Crisis)** — Axis 9 (Recovery design): Flow Book 2 → **build 1**. Region/helpline list + working `tel:` stubbed (L798, L803); the offline/gap states the flow's 20/20 depends on are unbuilt.

Other built flows (2, 16) hold ≥16 with no axis zero; no regression reported.

---

## PART E — MASCOT ASSET MANIFEST + COUNT

**Step 1 — Required set (doctrine §1.1–1.4):** one base form (bone matte-clay humanoid, faceless, 2 charcoal dot-eyes, 1 teal chest dot, holds nothing); 3 eye treatments (Default / Morning / Night) that are parameter changes, not new renders; Idle + Head-tilt poses that are *motion*, not frames.

**Step 2 — Rendering approach in code:** **SVG vector with dots as elements.** Evidence `psychage-v6-r3.html:572-579` — `<svg>` with `<circle>` eyes (L576-577), `<circle>` teal chest dot (L578), `<rect>` body (L574), `<circle>` head (L575). RN counterpart `apps/mobile/components/home/Mascot.tsx` is also SVG-via-`react-native-svg`, flagged in-code as a placeholder awaiting the founder asset.

**Step 3 — Count under approach found:** SVG vector → **1 master asset** (eye treatments via parameter, tilt + breathe via `@keyframes`/transform).

**Step 4 — Head-tilt fork:** the `ack` keyframe (L114) rotates the **whole `.mascot` container** (`transform:rotate`). This is **(a) full-image rotate** — acceptable as implemented, though note it tilts the entire body, not the head relative to the body. Does **not** multiply the raster count (none used).

**Step 5 — Net it out:**
- **Required:** 1 (SVG-vector master).
- **Present in codebase:** 1 — inline SVG `psychage-v6-r3.html:572-579`; plus the RN placeholder `apps/mobile/components/home/Mascot.tsx`. No external asset file (`apps/mobile/assets/mascot/` does not exist).
- **MISSING:** 0 net-new image files are required by the architecture (the single SVG is parameterized for all eye states + both motions). The present SVG is a **geometric-primitive placeholder**, not the doctrinal *matte-clay* form — so **1** founder-delivered matte-clay SVG master must be authored to *replace* the placeholder (a quality swap, not an added file).

**HEADLINE: Mascot images still needed to finish: 1** — under the SVG-vector approach, a single founder-delivered matte-clay master to replace the geometric placeholder; eye treatments, head-tilt, and breathing all parameterize from that one asset, so no additional frames or files are required.

---

## BLOCKERS (launch-grade failures)

1. **`@keyframes` = 5, not 4** (`veilIn`, L88) — explicit Part B1 blocker condition.
2. **Crisis pill missing on Article reader (`view-library`, L1128) and Settings (`view-profile`, L1105)** — crisis not ≤1 tap from those live surfaces; doctrine breach + Flow 15/18 axis-7 zero.

Not blockers (verified clear): no lost-entry path (migration unbuilt, not broken — but untestable here); **no mascot in crisis/Navigator/bridge**; **no paywall or locked feature**; **no cold notification ask**; `fill="#1A9B8C"` = 0; `Sykesh` = 0; forbidden words clean.

**Caveat:** the dominant gap — 12/19 flows and ~36/50 screens unbuilt — is a **coverage characteristic of the slice-1 design-library target**, not a defect. The full V1 surface lives in `apps/mobile/` and was not assessable under the HTML-grep invariants this audit specifies.

*End of audit.*
