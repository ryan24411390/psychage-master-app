# File-Level Action Plan

Each item: file(s), change, effort, and gate tag — **free** (ship within Sacred Rules), **§7** (Dr. Dobson clinical-copy review), **SR-x** (blocked / must preserve rule), **web** (fix belongs to web repo), **product** (needs a product decision).

Ordered by priority. See [roadmap.md](roadmap.md) for sequencing.

---

## A. Critical / safety

### A1. Guard the mobile crisis-keyword copy against drift — **DONE (2026-06-16)**
- **Done:** Lifted the CRISIS list into `packages/shared/safety/crisis-keywords.ts` (exported via the already-reserved `./safety` barrel); deleted the duplicate `apps/mobile/features/mindmate/safety/crisis-keywords.ts`; re-pointed `useMindMateChat.ts` + the mobile behavior test at `@psychage/shared/safety`. Added `packages/shared/safety/__tests__/crisis-keywords.snapshot.test.ts` pinning the 11 regex sources+flags to a committed verbatim copy of web `src/lib/ai/safety.ts:49-61` (last verified 2026-06-16) — any edit now fails CI and forces a re-verify against web. Shared 0.7.0 → 0.8.0.
- **Note:** True cross-repo single-source still impossible until web joins the monorepo; the snapshot reference is the contract bridging the two repos.

### A2. Forward-looking guard: free-text crisis detection requirement — **SR-3 / doc**
- **Files:** add `docs/parity-audit/PORTING-GUARDRAILS.md` (or a `rules/` note).
- **Change:** Document that ANY future free-text surface on mobile (Clarity Journal, journal notes, expanded check-in note) MUST run crisis-keyword detection (web does via `FreeFormSection.tsx`). Not a code change now — a binding constraint on B-tier work.
- **Effort:** XS.

---

## B. Logic parity (changes user-visible results)

### B1. Sleep score window — match web — **free** *(recommended first code fix)*
- **Files:** `apps/mobile/features/sleep-architect/dashboard/SleepDashboard.tsx` (`:58,67`); possibly a small `useSleepScore`-equivalent helper in `packages/shared/sleep/`.
- **Change:** Replace `entries.slice(0,14)` with a **calendar-day window, default 7 days**, and add a 7/30/90 range toggle mirroring web `useSleepScore.ts:11` + `SleepDashboard.tsx:24-29`. Score the date-filtered set, not a fixed entry count.
- **Why:** Verified HIGH numeric divergence — same data yields a different band on each platform. Web is source of truth.
- **Gate:** computation only (free); the resulting band copy is already §7 fixture, no new copy.
- **Effort:** M. **Tests:** add Vitest for the windowing helper (identical inputs → web-matching score).

### B2. Mood Journal — valence required + integer/float — **DECIDED: keep mobile optional**
- **Decision (2026-06-16):** Keep mobile's **optional** valence. Mobile's optional/integer model is the better UX and web's required path has a persistence bug (B-web1). This is an **intentional, justified divergence** — do *not* regress mobile to match the flawed web flow.
- **No code change.** (Had it been pursued: make valence required default 5 in `AddMomentSheet.tsx` + `packages/shared/mood-journal/types.ts` with a schema-version bump + migrator, SR-13.)

### B-web1. Web Mood valence 1-5 vs 1-10 persistence bug — **web**
- **Files (web repo):** `src/services/moodService.ts:78-81,122-124`.
- **Change:** Web rejects `value>5` though the wizard slider is 1-10 → authed entries with mood 6-10 silently fail to persist. Fix the validation range (or the slider). **Belongs to the web team** — out of scope for this mobile repo; reported here for the source-of-truth owner.

### B3. Sleep weekly digest — port `generateWeeklyDigest` — **free**
- **Files:** create `packages/shared/sleep/templates.ts` (port web `src/lib/sleep/templates.ts`), export from `packages/shared/sleep/index.ts`; rewire `apps/mobile/features/sleep-architect/dashboard/WeeklyDigest.tsx` to consume it.
- **Change:** Replace mobile's bespoke digest with the shared template engine (10-min threshold, eff 85%, stddev bands, screen/caffeine sentences) so digest text matches web.
- **Gate:** prose is clinical-adjacent → §7 review of final strings.
- **Effort:** M.

### B4. Navigator stale docstring `/5` — **free, trivial**
- **Files:** `packages/shared/navigator/scoring.ts` (header docstring ~line 42). (Web has the same stale comment but is a separate repo.)
- **Change:** Fix docstring to say `/3` to match code + inline comment. No behavior change.
- **Effort:** XS.

---

## C. Feature parity (missing tools — large, own specs)

### C1. Clarity Journal native port — **§7 + SR-3 + SR-12, spec required**
- **Scope:** 7 sections (daily check-in, weekly PHQ-2/GAD-2/PSS-4/WHO-5 screening, thought record, behavioral activation, trigger log, wellness toolbox + Stanley-Brown safety plan, weekly reflection) + report engine + insights.
- **Hard requirements:** free-text crisis detection (SR-3); safety plan + screening copy → Dr. Dobson + App-Store crisis-content review (SR-12, §7); local-first persistence + migrators (SR-4, SR-13).
- **Recommendation:** Procedure A (`/spec-discovery clarity-journal`). This is a multi-slice feature, **not** a parity patch.
- **Reuse:** mobile already has check-in store, reflection view, crisis surface, and the Clarity *Score* scoring module to build on.

### C2. Medication Tracker — native port vs keep WebView — **product**
- **Current:** WebView S31 (`app/tools/med-tracker.tsx`). Functional but no offline, data in WebView localStorage not native stores.
- **If native:** port adherence math, streak, schedule math, input vocabularies, export to `packages/shared/medication/` + RN UI. Procedure B (no crisis copy). Decide whether native parity is worth it vs the WebView fallback.

### C3. i18n — **infra, blocked by open decision**
- **Scope:** create `packages/i18n` (EN/PT/ES/SV/FR from web), wire mobile copy through it; add ES/FR crisis-keyword coverage to mobile offline pre-checks once journal/free-text surfaces exist.
- **Note:** CLAUDE.md flags i18n as not-yet-created; large cross-cutting effort.

---

## D. UX / UI parity (presentation)

### D1. Numeric reveal on Clarity / Sleep / Mood — **free compute, §7 copy**
- **Files:** `ClarityResultsView.tsx`, sleep `ScoreBand.tsx`/dashboard, mood `InsightsView.tsx`.
- **Change:** Optionally surface the raw composite/avg numbers web already shows (computation exists; just render). Keep band words alongside.
- **Gate:** any verdict-style *label* change (tier vocabulary, Great/Good/Okay/Low, "Distressed/Crisis") is §7 — do not ship verbatim web labels without Dr. Dobson.

### D2. UX-state sweep — **free**
- Dedicated follow-up diff of empty/loading/error states across the 7 shared tools (not covered in the scoring-focused pass).

---

## Do-not-touch (preserve; closing toward web violates a rule)
- Mood/Clarity/Navigator local-only persistence — **SR-4**
- Navigator 0.75 cap (already parity; mobile floors it twice) — **SR-1**
- Softened non-diagnostic tier/band wording — **§7** until Dr. Dobson approves
- Separate emotion/trigger arrays in Mood Journal (do not regress to web's merge) — quality
