# Pre-build Verification — Psychage Mobile

**Date:** 2026-06-26
**Scope:** Mobile app only (`apps/mobile`) — Expo SDK 54, RN 0.81, NativeWind v4, expo-router v6, Supabase.
**Method:** Read-only sweep (router tree + reachability, Supabase data wiring + states, core flows + build health) plus direct verification of the one flagged conflict. No web-parity work, no redesign.

**Baseline CI (before any change):**

| Gate | Result |
|---|---|
| `typecheck` (tsc --noEmit) | ✅ exit 0 |
| `lint` (biome check) | ✅ exit 0 — 25 warnings + 1 info, all pre-existing |
| `vitest run` (logic) | ✅ 786/786 pass, 102 files |
| `jest` (components) | ⚠️ 336/341 pass — **5 pre-existing fails** in 2 suites (`learn-screen.test.tsx`, `SleepDashboard.test.tsx`), unrelated to navigation |

---

## BROKEN (must fix)

### B1 — `/why` route collision (auth ↔ therapist)

Two route files resolve to the same `/why` pathname:

- `app/(auth)/why.tsx` — S33 `WhyAccount`. The **live** target of `router.push('/why')` from `features/auth/prompts/use-account-prompt.ts:46` (the account-prompt → sign-up entry).
- `app/(therapist)/why.tsx` — S38 `ConsentIntro`. **Unreachable** — nothing in the app navigates to it. The therapist share flow deliberately enters at `/add-provider` (from `app/settings/index.tsx:132`, `features/directory/CompareView.tsx:119`, `features/directory/ProviderDetailView.tsx:378`, `features/find/FindCareScreen.tsx:828`).

Route groups `(auth)` and `(therapist)` do not segment the URL, so both files register `/why`. expo-router resolves this ambiguously — `router.push('/why')` from the account prompt can land on the therapist `ConsentIntro` instead of `WhyAccount`.

The codebase already knows about this: `app/settings/index.tsx:128-129` and `__tests__/settings-hub.test.tsx:41` both note the therapist flow uses `/add-provider` "NOT '/why', which collides with the auth S33 screen." Confirmed independently by the `experience-architecture-audit` memory ("/why route collision (auth vs therapist) unfixed").

**Why it's the only Broken item:** it is the single place where a live `router.push` target is non-deterministic / wrong-destination. Note it does not redbox the app — the bundle still builds — but it is a real ambiguous-route defect on a live navigation path.

**Fix (applied — see Changelog):** delete `app/(therapist)/why.tsx`. It is dead (zero inbound nav) and its only effect is breaking the live auth `/why`. After deletion `/why` is unambiguously `WhyAccount` (S33). The `ConsentIntro` component (`components/therapist/ConsentIntro.tsx`) and its unit test (`__tests__/therapist-screens.test.tsx`) are untouched — the test imports the component directly, not the route.

---

## RISKY (likely to break / your call — left as notes, not changed)

### R1 — Auth client throws if Supabase env is undefined
`getSupabaseAuthClient()` throws `Supabase env not configured` at `lib/supabase/client.ts:65` when `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` are missing. Consumers: MindMate persistence, moments sync, check-in sync, account-deletion RPC. The **anon** read client (`lib/supabase.ts`) degrades gracefully (returns null) — only the auth client hard-throws. Fine while `.env` is populated (it is, locally); **hardening note for EAS builds**: ensure both vars are set in the EAS build env, or add a graceful fallback before auth features ship.

### R2 — Condition `guide_path` 404s (~28/41 rows)
Condition rows carry web-shaped `guide_path` values (`/learn/conditions/<x>`) that have no matching mobile route → resolve to `+not-found`. Mobile condition routes are `/conditions/[slug]` (not `/learn/conditions/[slug]`). Matches the `navigator-results-wayfinding` memory (categories + articles route clean; condition guide rows are web-shaped). Degrades to the styled not-found, not a crash. Fix is a resolver/KB data change (make `guide_path` mobile-valid) — out of scope for this pass.

### R3 — `search_providers_v3` unscoped-call timeout
`features/directory/queries.ts:128` calls the RPC against a ~423k-row table that times out if called with no scope. The only guard is UI-side (the directory requires a state/filter before searching). No code-level guard prevents an unscoped call if a future code path reaches it. Consider a query-level assertion that refuses an all-empty scope.

### R4 — Tables possibly undeployed on shared Supabase
`conditions_reference` (`lib/conditions/repo.ts`) and `ai_conversations` / `ai_messages` (`features/mindmate/persistence/chat-store.ts`) are defined by web migrations and may not be live yet. Reads silently return empty; MindMate persistence is best-effort push (swallowed by design). No crash, but those features no-op until the tables exist. Verify deployment before relying on them.

### R5 — 5 pre-existing failing jest tests
`__tests__/learn-screen.test.tsx` and `__tests__/SleepDashboard.test.tsx` (5 tests total) fail on component-render text/`testID` assertions. Pre-existing, unrelated to routing — present at baseline before this pass. Flag for a separate cleanup; not addressed here.

---

## FINE (verified healthy)

- **Routing reachability** — every navigation target resolves to a real route file; ~95+ `router.push`/`Link` targets cross-checked against the `app/` tree. No orphan landing screens, no dead ends (every screen has a back path or link out).
- **Back stack / tabs** — 4-tab IA (Today / Learn / Compass / Find) via `app/(tabs)/_layout.tsx`; each tab keeps an independent stack; detail screens (`article/[slug]`, `conditions/[slug]`, `find/provider/[id]`) push and back correctly; `+not-found.tsx` present and styled.
- **Data screens** — providers, provider detail, articles, browse, conditions, crisis all have loading + empty + error states; TanStack Query retry + `isError` gates in place; no infinite-spin patterns; no screens stuck on mock/placeholder data.
- **Error swallows** — all `catch → return []/null` are intentional offline-first posture, documented in-code (articles/conditions/crisis repos), never block the UI or crisis.
- **Persistence** — every persisted store (my-providers, personalization, sync-consent, bookmarks, milestones, moments) carries a `version` field + migrator (Sacred Rule #13).
- **Core flows** — onboarding (welcome → interests → home, `markOnboardingSeen` anchored), Find Care search (location → state → city → type → results → profile → compare), Crisis reachable from 5+ surfaces and delegated to the full `/crisis` route, MindMate wired to `POST /api/ai/chat` with streaming, theme toggle (light/night).
- **`FindCareScreen.tsx`** (working-tree `M` file) — clean: balanced JSX, imports resolve, crisis modal correctly replaced by `router.push('/crisis')`; the deleted `CrisisSheet` has no dangling references.
- **Build health** — imports resolve (no references to deleted files: ValenceSlider, Sparkline, ExerciseChrome/ClarityChrome/RelationshipChrome, SignInSheet); `@/` alias maps to `./` (flat root, no `src/`), consistent.

---

## Changelog

| # | Was broken | Change | Verify |
|---|---|---|---|
| B1 | `/why` resolved to two files (`app/(auth)/why.tsx` + `app/(therapist)/why.tsx`) → ambiguous route; live account-prompt push could land on the dead therapist ConsentIntro | Deleted the dead, unreachable `app/(therapist)/why.tsx` so `/why` resolves only to the auth `WhyAccount` (S33) | `find app -name why.tsx` → 1 file. typecheck 0, lint 0, vitest 786/786, jest 336/341 (same 5 pre-existing fails, no new). No stray refs to the removed path. Therapist flow still enters at `/add-provider`. |

### Post-fix CI (after deleting `app/(therapist)/why.tsx`)

| Gate | Before | After |
|---|---|---|
| typecheck | ✅ 0 | ✅ 0 |
| lint | ✅ 0 | ✅ 0 |
| vitest | ✅ 786/786 | ✅ 786/786 |
| jest | ⚠️ 336/341 (5 pre-existing fails) | ⚠️ 336/341 (**same** 5 fails — none new) |

The deletion changed nothing in CI except removing the duplicate-route ambiguity. The 5 jest failures (R5) are pre-existing and out of scope.

---

## Risky-items fix pass (2026-06-26)

Follow-up pass that resolved R1–R5 + the orphaned `ConsentIntro`. Investigation reclassified two items before any code was written:

- **R2 was already fixed.** `lib/discovery/signal-map.ts` `conditionHref()` routes every Navigator/discovery condition through its owning content-category route (`categoryHref`), never the web-shaped `guide_path`. `guide_path` is dead data (KB defs + empty fixtures + comments only; `__tests__/signal-map.test.ts` asserts the category routing). The earlier "28/41 condition rows 404" reading was stale. **No code change — memory note corrected.**
- **R4 deploy concern resolved.** A read-only REST existence probe against the live shared Supabase returned HTTP 200 for `conditions_reference`, `ai_conversations`, and `ai_messages` — all three tables are deployed. No web-repo migration needed. A `__DEV__`-only visibility warning was still added so future drift (a dropped table / tightened RLS) surfaces in development instead of hiding behind the offline-first empty state.

### Changelog

| # | Item | Change | Files |
|---|---|---|---|
| R1 | Auth client `getSupabaseAuthClient()` throws on missing env. Every caller already guards on `isSupabaseConfigured()`, but the service is built at **module import**, so a construction failure would white-screen the app. | Wrapped the default-service construction in `selectDefaultService()` — a throw now degrades to the in-memory stub (signed-out) instead of crashing at import. Tier-1 anonymous features keep working. | `features/auth/use-auth.tsx` |
| R3 | `search_providers_v3` RPC times out on a wholly-unscoped scan (423k rows); only a UI gate prevented it. | Added `hasSearchScope()` guard in `searchProviders()` — an all-empty scope returns `EMPTY()` without hitting the RPC. Broad predicate, only blocks the truly-empty case. + unit test. | `features/directory/queries.ts`, `__tests__/directory-queries.test.ts` |
| R5a | `learn-screen.test.tsx` asserted removed testIDs from the pre-rebuild Learn design (4 failing tests). | Rewrote against the current Browse screen (`browse-find-path`, `browse-search-input`, segmented Topics/Conditions, inline search). | `__tests__/learn-screen.test.tsx` |
| R5b | `SleepDashboard.test.tsx` used fixed past dates that fell outside the 7-day window as real time advanced (time-bomb, 1 failing test). | Fixture dates now generated relative to "today" so they always sit inside the window. | `__tests__/SleepDashboard.test.tsx` |
| Consent | The therapist-share consent **body** (what the provider sees) appeared nowhere in the live add-provider flow — only in the orphaned `ConsentIntro` (pre-existing disclosure gap, App Store 5.1.1). | Surfaced `THERAPIST_COPY.consentBody` under the title in `ProviderForm` (existing CT4 copy, no new strings); deleted the orphaned `ConsentIntro.tsx` + its test, added a disclosure assertion to the ProviderForm test. | `components/therapist/ProviderForm.tsx`, `components/therapist/ConsentIntro.tsx` (deleted), `__tests__/therapist-screens.test.tsx` |
| R4 | `conditions_reference` / `ai_conversations` / `ai_messages` silently no-op if absent. | Verified all three live (HTTP 200). Added `__DEV__`-only, PII-free `devWarnSilentFailure` at the 5 silent-swallow error branches so drift is visible in dev; production unchanged. | `lib/dev-warn.ts` (new), `lib/conditions/repo.ts`, `features/mindmate/persistence/chat-store.ts` |

### Final CI (after the fix pass)

| Gate | Result |
|---|---|
| typecheck | ✅ 0 |
| lint | ✅ 0 (baseline warnings only) |
| vitest | ✅ 787/787 (102 files, +1 directory-guard test) |
| jest | ✅ **340/340, 85 suites — fully green** (the 5 R5 fails fixed; net −1 test from the retired ConsentIntro test) |

**Left for you:** nothing blocking. Dr. Dobson sign-off on the therapist-share `ProviderForm` (now shows the consent body — copy is unchanged CT4, but it's a clinical-review surface per §7). R2's dead `guide_path` data in `features/navigator/knowledge-base.ts` is harmless and left in place.
