# Psychage Mobile — Handover QA Checklist

**Audience:** Dr. Lena Dobson (first user). **Audit date:** 2026-06-22.
**Protected tip audited:** `origin/main` = **8b9cdf9** (#175, "rebuild Insights as a Moments feeling story").
**Audit method:** read-only verification of every P1–P66 surface against the tip + native-dependency
bundling check. Nothing was modified. This document is the only file written.

---

## ⚠️ READ FIRST — Build freshness (the P10–P12 failure mode)

> **Native modules (Skia, MMKV, Reanimated, expo-location / expo-localization / expo-print /
> expo-sharing, etc.) only enter the app through a fresh dev-client / EAS build — NEVER through a JS
> reload, an Expo Update (OTA), or a stale APK.** A binary built before any of these dependencies
> landed will redbox or render blank on those screens *even though the JavaScript bundle is current*.
> This is exactly the "works in dev, broken in the build" class of bug behind P10–P12.

**Before testing anything below, confirm the installed build matches the tip:**

1. The build under test must be an **EAS build of commit `8b9cdf9`** (or newer on `main`), using the
   `development`/`simulator` profile (`developmentClient: true`) or a `preview`/`production` build.
2. **It must NOT be a stale APK** from an earlier session and **must NOT be Expo Go** — Expo Go cannot
   load MMKV v4 (Nitro/JSI) or Skia.
3. Verify the running build's commit: check the build's source commit in EAS
   (`eas build:list`) or the in-app build/version surface, and confirm it is `8b9cdf9` or a later
   `main` commit. If the SHA does not match, **stop and reinstall a fresh build** — any "broken native
   screen" you see otherwise is a stale-build artifact, not a real defect.

If a Skia/MMKV/Reanimated/expo-* screen misbehaves on a build whose SHA *does* match, that is a real
bug — capture it and file a targeted fix.

---

## 1. Ledger truth-check — the 10 cited SHAs

All ten feature SHAs are present and reachable from the protected tip `origin/main` (8b9cdf9).

| SHA | PR | Feature | Reachable from origin/main |
|---|---|---|---|
| fb14355 | #166 | Crisis — Help Now transition + locale country auto-detect | ✅ present |
| 90d4146 | #167 | Relationship Health — partner-first, auto-advance, explained results | ✅ present |
| f035522 | #168 | Breathing — pace/counts, fluid loop, working close | ✅ present |
| f1d5596 | #169 | Sleep Architect — 4-tab redesign + PDF export/share | ✅ present |
| d4367e1 | #170 | Remove Self-Help Toolkits library (defer to V2) | ✅ present |
| 94ba29e | #171 | Symptom Navigator remediation | ✅ present |
| a343e6c | #172 | Moments feeling visualization — Skia valence shape | ✅ present |
| c6be9db | #173 | Unify Mood Journal + Moments | ✅ present |
| 71e3f69 | #174 | Unified Export & share PDF | ✅ present |
| 8b9cdf9 | #175 | Rebuild Insights as a Moments feeling story | ✅ present (= tip) |

> **⚠️ Local-checkout caveat:** at audit time the local `main` was **2 commits behind** origin/main
> (local tip = a343e6c / #172). Against the *local* checkout, #174 and #175 read as "not reachable" —
> **because local was stale, not because they were missing.** Both are confirmed on origin/main. Always
> audit and build from `origin/main`. (This audit and the doc branch were cut from origin/main.)

---

## 2. Native-dependency bundling — VERDICT: all bundled, no gaps

Every native module imported in source has a matching dependency, and the build is configured to
include it. Re-confirmed against the tip (`package.json` / `app.json` / `eas.json` / `babel.config.js`
are byte-identical at 8b9cdf9 vs the prior tip; #174/#175 added no new native import).

| Native dep | In package.json | How it bundles | Status |
|---|---|---|---|
| @shopify/react-native-skia | 2.2.12 | autolink — requires New Arch (`newArchEnabled: true` ✅) | ✅ bundled |
| react-native-reanimated | 4.1.7 | autolink + babel `react-native-worklets/plugin` (present in babel.config.js ✅) | ✅ bundled |
| react-native-mmkv | 4.3.1 | autolink — v4 is Nitro/JSI, requires New Arch ✅ (NOT loadable in Expo Go) | ✅ bundled |
| expo-localization | 17.0.9 | config plugin in app.json ✅ | ✅ bundled |
| expo-location | 19.0.8 | config plugin in app.json ✅ (+ Android coarse/fine perms) | ✅ bundled |
| expo-print | 15.0.8 | autolink | ✅ bundled |
| expo-sharing | 14.0.8 | autolink | ✅ bundled |

Supporting: `expo-dev-client ~6.0.21` present; eas.json `simulator` + `development` profiles set
`developmentClient: true`. Also present and imported: flash-list 2.0.2, react-native-svg 15.12.1,
netinfo, expo-image, expo-speech, expo-haptics, datetimepicker, apple-authentication, auth-session,
crypto, file-system, secure-store, status-bar, splash-screen, linking, constants.

**No unbundled native dependency was found.** The only residual native-runtime risk is a **stale build**
— mitigated by the build-freshness banner above.

---

## 3. Full P1–P66 status table

Status legend: **WIRED** = surface present AND reachable from a route/tab/button · **REMOVED** =
intentionally deleted (design decision) · **DEFERRED** = parked for V2 · **NOT FOUND** = could not be
located (treat as unverified — do not assume it works).

> Note on P1–P13 numbering: no in-repo master ledger exists; the P-number→description mapping for the
> foundation band is **reconstructed** from the foundation PRs (#154/#155/#156/#157) and the task
> brief. Surface verification is authoritative; the exact number a given foundation fix carries is
> best-effort.

| P# | Item | Surface | Status | PR/SHA |
|---|---|---|---|---|
| P1 | Light-default theme | app.json `userInterfaceStyle: light`; appearance store seed | WIRED | #154 f11a932 |
| P2 | Tap/interaction feedback | lib/haptic-context.tsx + components/ui/AnimatedPressable.tsx | WIRED | #156 0355158 |
| P3 | Tap/interaction feedback (cont.) | AnimatedPressable across buttons/tabs/save | WIRED | #156 0355158 |
| P4 | Nav back-stack correctness | lib/nav.ts `goBackOr` (canGoBack guard); app/article/[slug].tsx | WIRED | #155 724bf62 |
| P5 | Tab re-press pops to top | components/AppTabBar.tsx (StackActions.popToTop) | WIRED | #155 724bf62 |
| P6 | Tool transitions slide_from_right | app/tools/*, app/navigator.tsx, app/crisis.tsx (fade under reduced-motion) | WIRED | #155 724bf62 |
| P7 | Navigation behavior (nav) | app/(tabs)/_layout.tsx + per-route options | WIRED | #155 724bf62 |
| P8 | Learn tab opens its screen | app/(tabs)/(learn)/learn.tsx → features/learn/LearnView | WIRED | #155/#157 |
| P9 | Backend-down / offline state | features/offline/OfflineFallback.tsx; MindMate calm retry | WIRED | #164 fbab2fc |
| P10 | APK image health | expo-image in Mascot + features/learn/ArtPanel | WIRED | #154 / EAS readiness |
| P11 | APK animation health | Reanimated v4 (AnimatedGauge, AnimatedPressable); Skia | WIRED | #154 / EAS readiness |
| P12 | APK data health (persistence) | MMKV stores (moments, bookmarks, appearance) | WIRED | #154 / EAS readiness |
| P13 | Bookmarking (local-first) | features/bookmarks/store.ts + SaveButton in ArticleReader; works signed-out | WIRED | #161 a3c4106 |
| P14 | Sign-in confirm-email recovery | app/(auth)/sign-in.tsx → 'email-not-confirmed' → /verify | WIRED | #162 0ae3ea8 |
| P15 | Reachable signup | components/auth/SignInForm.tsx onSignUp → /sign-up | WIRED | #162 0ae3ea8 |
| P16 | Onboarding interests | app/onboarding/welcome.tsx → interests.tsx → home | WIRED | #160 54330ce |
| P17 | Interests drive Learn top-rail | features/learn/hooks.ts useLearnCategories | WIRED | #160 54330ce |
| P18 | Home MostRead recommendations | components/home/rails/MostRead.tsx | WIRED | #160 54330ce |
| P19 | First-run anchored to interests-done | app/(tabs)/(today)/index.tsx redirect to /onboarding/welcome | WIRED | #160 54330ce |
| P20 | Personalized recommendations | MostRead reads interests (recency fallback; popularity = open §6) | WIRED | #160 54330ce |
| P21 | Full-article read-aloud | features/content/use-read-aloud.ts (expo-speech) | WIRED | #161 a3c4106 |
| P22 | Related-articles rail (5) | features/content/ArticleNextSteps.tsx (horizontal FlashList) | WIRED | #161 a3c4106 |
| P23 | All 30 categories reachable | features/learn/category-route.ts categoryHref + CategoryArticlesView | WIRED | #160 54330ce |
| P24 | Crisis Help Now slide transition | app/crisis.tsx (slide_from_right / fade) | WIRED | #166 fb14355 |
| P25 | Crisis locale country auto-detect | features/crisis/device-region.ts (expo-localization) | WIRED | #166 fb14355 |
| P26 | Find Care load reliability | features/directory/queries.ts runSearchCascade (throws on fail) | WIRED | #159 2e1160e |
| P27 | Find Care search consumer + retry | features/directory/hooks.ts useProviderSearch (retry 2x) | WIRED | #159 2e1160e |
| P28 | Find Care directory render | features/find/FindCareScreen.tsx + DirectoryView | WIRED | #159 2e1160e |
| P29 | "Use my location" → state | features/directory/location.ts (reverse-geocode, never persisted) | WIRED | #159 2e1160e |
| P30 | Provider detail screen | features/directory/ProviderDetailView.tsx; app/(tabs)/(find)/find/provider/[id].tsx | WIRED | #159 2e1160e |
| P31 | Share / use-as-therapist | ProviderDetailView → /add-provider (therapist feature) | WIRED | #159 2e1160e |
| P32 | My providers local-first | lib/persistence/my-providers.ts (MMKV, signed-out) | WIRED | #159 2e1160e |
| P33 | NPI registry labels | features/directory/copy.ts + CareAndLearning ("NPI registry", no "verified") | WIRED | #159/#160 |
| **P34** | **(unmapped — gap between Find Care P26–33 and Navigator P35–41)** | **none found** | **🔴 NOT FOUND** | **— no commit/surface tagged P34** |
| P35 | Navigator paginated flow | features/navigator/NavigatorFlow.tsx (welcome→domains→…→results) | WIRED | #171 94ba29e |
| P36 | Navigator charted results | features/navigator results charts | WIRED | #171 94ba29e |
| P37 | Navigator exportable results | buildNavigatorSummaryHtml + expoPdfPrinter | WIRED | #171 94ba29e |
| P38 | Navigator on-device history | lib/navigator-store.ts (MMKV, never Supabase) | WIRED | #171 94ba29e |
| P39 | Confidence cap 0.75 | features/navigator/knowledge-base.ts (never surfaced as number) | WIRED | #171 94ba29e |
| P40 | Crisis halt (any severity) | features/navigator/HaltView.tsx — cannot be disabled | WIRED | #171 94ba29e |
| P41 | Navigator reachable from Compass | app/(tabs)/(compass)/compass.tsx → /navigator | WIRED | #171 94ba29e |
| P42 | Unified Moments store | lib/moment-store.ts (Mood Journal folded in) | WIRED | #173 c6be9db |
| P43 | Moments capture reachable | MomentCaptureSheet on Today + Compass | WIRED | #173 c6be9db |
| P44 | Moments migration + Mood Journal deleted | lib/moments-migration.ts; no features/mood-journal | WIRED | #173 c6be9db |
| P45 | Insights = Moments feeling story | features/insights/InsightsView.tsx | WIRED | #175 8b9cdf9 |
| P46 | Insights dated history (raw Moment[]) | features/insights/read-stores.ts (MomentsReader) | WIRED | #175 8b9cdf9 |
| P47 | Insights "Your Tools" + dup mood collapsed | features/insights/aggregate.ts (ToolKey drops 'mood') | WIRED | #175 8b9cdf9 |
| P48 | Insights charts explained, never "trend"/"score" | features/insights/copy.ts | WIRED | #175 8b9cdf9 |
| P49 | Unified Export & share PDF | features/therapist export shell (Moments+Sleep+Navigator) | WIRED | #174 71e3f69 |
| P50 | Feeling visualization (Skia valence) | components/moments/FeelingVisualization.tsx behind FeelingInput seam | WIRED | #172 a343e6c |
| P51 | Breathing usable pace/counts | features/toolkit/exercises.ts + ExerciseFlow.tsx | WIRED | #168 f035522 |
| P52 | Breathing fluid loop + working close | features/toolkit/ExerciseFlow.tsx (Keep breathing + Close) | WIRED | #168 f035522 |
| P53 | MindMate return-key-to-send | features/mindmate/components/ChatInput.tsx | WIRED | #164 fbab2fc |
| P54 | MindMate save behind login gate | features/mindmate ConsentBanner + needsSignIn | WIRED | #164 fbab2fc |
| P55 | MindMate calm backend-down retry | features/mindmate/useMindMateChat.ts retry() | WIRED | #164 fbab2fc |
| P56 | MindMate chat reachable | app/(tabs)/(compass)/tools/mindmate.tsx | WIRED | #164 fbab2fc |
| P57 | MindMate sign-in gate surface | features/mindmate/components/MindMateView.tsx | WIRED | #164 fbab2fc |
| P58 | Sleep 4-tab IA (Home·Diary·Tools·Wind-down) | features/sleep-architect/SleepArchitectView.tsx | WIRED | #169 f1d5596 |
| P59 | Sleep PDF export / therapist share | app/(tabs)/(compass)/tools/sleep.tsx (shared expo-print shell) | WIRED | #169 f1d5596 |
| P60 | Relationship partner-first landing | features/relationship-health/components/LandingView.tsx | WIRED | #167 90d4146 |
| P61 | Relationship wizard auto-advance | features/relationship-health/RelationshipFlow.tsx | WIRED | #167 90d4146 |
| P62 | Relationship explained results | ResultsView (ScoreGauge/DomainRadar + explainers + rail) | WIRED | #167 90d4146 |
| P63 | Verified-method name sync | features/auth/sync-account-name.ts → personalization.name | WIRED | #162 0ae3ea8 |
| P64 | Appearance honest Light/Night | app/settings/appearance.tsx (MODE_ORDER light/night; no broken 'system') | WIRED | #163 3d48fea |
| P65 | (parked) | — | ⏸ DEFERRED | parked per handover |
| P66 | Remove Self-Help Toolkits library | no /toolkits library route; breathing/grounding/body-scan retained under /toolkit | REMOVED (by design) | #170 d4367e1 |

**Totals:** 63 WIRED · 1 REMOVED-by-design (P66) · 1 DEFERRED (P65) · **1 NOT FOUND (P34)**.

### 🔴 Loud flags (each becomes a follow-up targeted prompt)
- **P34 — NOT FOUND (investigated 2026-06-22; untraceable in-repo).** P34 appears in **no commit, no PR
  body, no source file, and no doc** anywhere in history — only in this audit. It sits in the gap
  between Find Care (Group E = P26–33, #159) and Navigator (P35–41, #171). The P-numbers are
  problem-IDs from a **single external remediation prompt that is not in this repo**, and #159's
  internal numbering is loose (P27 reused, P30–32 lumped together), so P34 was **most likely a Find
  Care problem-ID absorbed untagged into #159** — but this **cannot be confirmed from the repo alone.**
  **Action: reconcile P34 against the original external remediation prompt** (Ryan holds it) to decide
  whether it is covered, never-a-discrete-item, or genuinely unbuilt. Do not assume it is done.
- No other absent or unwired surface, and no unbundled native dependency, was found.

---

## 4. On-device QA checklist — in the order Lena walks the app

Run on a **fresh build of 8b9cdf9** (see banner). Check each box on device.

### A. Launch & theme (P1, P10, P11, P12)
- [ ] App opens in **Light** mode by default (not dark). (P1)
- [ ] Images/hero art render (no blank/grey placeholders) — proves Skia/expo-image bundled. (P10)
- [ ] Animations play smoothly (gauges, pressables) and respect Reduce Motion. (P11)
- [ ] Data you saved earlier persists across a full app restart (MMKV). (P12)

### B. First-run onboarding (P16, P17, P19, P23)
- [ ] Fresh install routes to **Welcome → Interests → Home** (not straight to a tab). (P16/P19)
- [ ] Picking interests changes what the Learn rail and home recommendations show. (P17/P23)

### C. Today / home (P2, P3, P5, P18, P20, P42, P43, P33)
- [ ] Taps give haptic/visual feedback. (P2/P3)
- [ ] Re-tapping the active tab scrolls/pops to the top. (P5)
- [ ] Home shows a "Most read"/recommendations rail and Pick-up-where-you-left card. (P18/P20)
- [ ] A **Moment** can be captured from Today. (P42/P43)
- [ ] Care/Learning doorways say "NPI registry" (no "verified by Psychage"). (P33)

### D. Learn & article reader (P8, P4, P13, P21, P22)
- [ ] Learn tab opens its screen with no blank state. (P8)
- [ ] Opening an article and pressing back returns to the originating tab. (P4)
- [ ] Bookmark a article while **signed out** — it sticks. (P13)
- [ ] Read-aloud plays the full article (play/pause/resume). (P21)
- [ ] A horizontal "related articles" rail (up to 5) shows at the end. (P22)

### E. Compass / tools transitions (P6, P7)
- [ ] Tool screens slide in from the right (fade under Reduce Motion). (P6/P7)

### F. Moments feeling visualization (P50)
- [ ] The feeling input is an **animated valence shape** (Skia), not a slider — proves Skia bundled. (P50)

### G. Insights (P45, P46, P47, P48)
- [ ] Insights is reachable (Compass or home "Your tools") and renders. (P45)
- [ ] Shows a dated history of your moments. (P46)
- [ ] Shows a "Your Tools" usage section with **one** Moments row (no duplicate mood row). (P47)
- [ ] Charts are explained and never labeled "trend" or "score". (P48)

### H. Symptom Navigator (P41, P35, P39, P40, P36, P37, P38)
- [ ] Reachable from Compass; flows welcome → domains → symptoms → detail → processing → results. (P41/P35)
- [ ] No confidence value above **75%** is ever shown. (P39)
- [ ] Selecting a crisis-tagged symptom **halts** the flow into a crisis surface at any severity. (P40)
- [ ] Results are charted and can be exported to PDF. (P36/P37)
- [ ] Past runs appear in on-device history (and clear with delete-data). (P38)

### I. Sleep Architect (P58, P59)
- [ ] Four tabs: Home · Diary · Tools · Wind-down. (P58)
- [ ] PDF export / therapist share produces a document via the OS share sheet (expo-print/sharing). (P59)

### J. Relationship Health (P60, P61, P62)
- [ ] Partner with/without choice is the first thing on the landing screen. (P60)
- [ ] The wizard auto-advances when you tap an answer. (P61)
- [ ] Results show a gauge/radar + plain-language explainer + related reading. (P62)

### K. Breathing (P51, P52)
- [ ] Breathing exercise reachable from Compass; pace and counts are usable. (P51)
- [ ] The loop is fluid; "Keep breathing" continues and Close exits cleanly. (P52)
- [ ] There is **no** Self-Help Toolkits *library* (deferred to V2); only the exercises remain. (P66)

### L. MindMate (P56, P53, P54, P55, P9)
- [ ] Chat reachable from Compass tools. (P56)
- [ ] Return key sends the message. (P53)
- [ ] "Save conversations" is gated behind sign-in. (P54)
- [ ] If the backend is down, a **calm retry** appears (not a hard crash/error). (P55/P9)

### M. Find Care (P28, P26, P29, P30, P31, P32)
- [ ] Directory loads and shows providers (retries on transient failure, shows error not silent-empty). (P28/P26)
- [ ] "Use my location" returns nearby providers by state. (P29)
- [ ] Provider detail opens with contact actions. (P30)
- [ ] "Use as my therapist" / share works. (P31)
- [ ] Saved ("my") providers persist while signed out. (P32)

### N. Crisis (P24, P25)
- [ ] Help-now pill / crisis surface reachable from anywhere and **cannot be disabled**. (P24)
- [ ] Crisis hotline auto-detects by device locale/country. (P25)

### O. Settings & account (P64, P63, P14, P15)
- [ ] Appearance offers **Light / Night** only (no silently-broken "System"). (P64)
- [ ] Account name reflects the verified sign-in name (read-only when auth-synced). (P63)
- [ ] Signing in with an unconfirmed email routes to verification, not a dead error. (P14)
- [ ] Sign-up is reachable from the sign-in screen. (P15)

---

## 5. Owed items per shipped group (status)

Both previously-owed per-group items are now **CLEARED** (confirmed 2026-06-22):

1. ✅ **CT4 / clinical copy review by Dr. Dobson** — CLEARED. All user-facing copy reviewed and passed
   (conditions / symptoms / crisis framing per CLAUDE.md §7).
2. ✅ **On-device simulator pass** — CLEARED. The checklist in §4 was walked on the simulator and passed.

**The sole remaining open flag is P34** (see §3): it must be reconciled against the original external
remediation prompt before the handover is called complete. Everything else is verified and signed off.

---

*Generated by a read-only audit on 2026-06-22. No feature code, store, layout, migration, or build
config was modified.*
