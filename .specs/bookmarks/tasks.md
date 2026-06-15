# Tasks: Bookmarks (Saved Items)

**Spec ID:** bookmarks
**Status:** Tasks complete — ready for /spec-review
**Reads from:** brief.md, requirements.md, design.md
**Created:** 2026-06-15

## Notes carried from design

- Table `public.bookmarks` is **live** (RLS per `auth.uid()`); **no migration task**.
- Mobile has **no i18n library** — strings live in per-feature `copy.ts` (EN only; full EN/PT/ES/SV/FR lands when `packages/i18n` is created — CLAUDE.md §2). No translation-file tasks.
- Mobile has **no Sentry wiring** — telemetry exclusion (AC-N.4b) enforced at the analytics adapter (T-011), not a Sentry `beforeSend` task. Feature DoD notes this.
- `lucide-react-native` already a dependency → **no `package.json` change → zero sequential-only tasks**.
- Tool-save surface is the weakest-defined (no uniform tool detail); T-009 scopes it explicitly and is flagged in Open items.

## Task table

| ID | Title | Files | Depends on | Parallelizable | Est. | DoD summary |
|---|---|---|---|---|---|---|
| T-001 | Bookmark types + Supabase service | `apps/mobile/features/bookmarks/types.ts (create), apps/mobile/features/bookmarks/service.ts (create)` | — | ✓ | 35m | Q-1/Q-2/M-1/M-2 via auth client; RLS-trusted |
| T-002 | React Query hooks (optimistic toggle) | `apps/mobile/features/bookmarks/hooks.ts (create)` | T-001, T-011 | ✓ | 30m | useQuery + useMutation, onMutate/onError, invalidate |
| T-003 | Copy strings (EN) | `apps/mobile/features/bookmarks/copy.ts (create)` | — | ✓ | 15m | SR-3 educational, person-first |
| T-004 | SaveButton component (S-1) | `apps/mobile/features/bookmarks/SaveButton.tsx (create)` | T-002, T-003 | ✓ | 35m | spring-pop + haptic.confirm, a11y states, reduce-* |
| T-005 | Sign-in bottom sheet (S-2) | `apps/mobile/features/bookmarks/SignInSheet.tsx (create)` | T-003 | ✓ | 30m | reuses (auth); resumes save post-sign-in |
| T-006 | Saved list screen + rows (S-3) | `apps/mobile/app/saved.tsx (create), apps/mobile/features/bookmarks/SavedList.tsx (create), apps/mobile/features/bookmarks/SavedRow.tsx (create)` | T-002, T-003 | ✓ | 45m | FlashList, filter chips, empty/stale/loading |
| T-007 | Wire save into article detail | `apps/mobile/app/article/[slug].tsx (modify)` | T-004, T-005 | ✓ | 25m | SaveButton + anon→sheet on article |
| T-008 | Wire save into provider detail | `apps/mobile/app/find/provider/[id].tsx (modify)` | T-004, T-005 | ✓ | 25m | SaveButton + anon→sheet on provider |
| T-009 | Wire save into tool screens | `apps/mobile/app/tools/clarity.tsx (modify), apps/mobile/app/tools/sleep.tsx (modify), apps/mobile/app/tools/mood-journal.tsx (modify), apps/mobile/app/tools/mindmate.tsx (modify), apps/mobile/app/tools/relationship-health.tsx (modify)` | T-004, T-005 | ✓ | 35m | SaveButton on tool headers; resource_id = tool id |
| T-010 | Settings "Saved" entry | `apps/mobile/app/settings/index.tsx (modify)` | T-006 | ✓ | 15m | row routes to /saved from avatar→Settings |
| T-011 | Telemetry (count-only events) | `apps/mobile/features/bookmarks/analytics.ts (create)` | — | ✓ | 20m | SR-4/AC-N.4b: no resource id/type in payload |
| T-012 | Account-deletion cascade test | `apps/mobile/features/bookmarks/__tests__/cascade.test.ts (create)` | T-001 | ✓ | 25m | US-7: CASCADE clears bookmarks |
| T-013 | Maestro E2E (save→list→open→unsave) | `apps/mobile/.maestro/bookmarks.yaml (create)` | T-006, T-007, T-008 | ✓ | 30m | happy path on iOS+Android |

13 tasks · all parallelizable (dependency-ordered) · 0 sequential-only · ~365m serial / ~2.5h on the critical path.

## Per-task detail

Common DoD (every task): code TS-clean (`pnpm --filter @psychage/mobile typecheck`); tests RED→GREEN (Vitest, run targeted — full suite OOMs); Biome lint passes; `@/` alias, NativeWind-only; PR references US/AC.

### T-001 — Bookmark types + Supabase service
**Files:** `apps/mobile/features/bookmarks/types.ts` (create), `apps/mobile/features/bookmarks/service.ts` (create)
**Depends on:** none · **Parallelizable:** yes · **Est:** 35m
**Description:** Define `Bookmark` + `ResourceType` types. Implement service against auth client `lib/supabase/client.ts`: `listUserBookmarks` (Q-1), `bookmarkedIdsForType` (Q-2), `addBookmark` (M-1 upsert ignoreDuplicates onConflict `user_id,resource_type,resource_id`), `removeBookmark` (M-2 delete match). RLS-trusted — no manual ownership checks.
**DoD:** + service functions covered by unit tests (mock client); duplicate add is idempotent; delete-missing is no-op. Sacred Rule: N/A. Token/anti-slop: N/A.

### T-002 — React Query hooks
**Files:** `apps/mobile/features/bookmarks/hooks.ts` (create)
**Depends on:** T-001, T-011 · **Parallelizable:** yes · **Est:** 30m
**Description:** `useBookmarks(userId)` (key `['bookmarks',userId]`), `useBookmarkedIds(userId,type)`, `useToggleBookmark()` mutation with optimistic `onMutate`, `onError` revert, `onSuccess` invalidate. Fire analytics (T-011) count-only events.
**DoD:** + optimistic add/remove + revert covered by tests. Sacred Rule: SR-4 — mutation telemetry carries no resource id/type (sr4 hook passes). Token/anti-slop: N/A.

### T-003 — Copy strings (EN)
**Files:** `apps/mobile/features/bookmarks/copy.ts` (create)
**Depends on:** none · **Parallelizable:** yes · **Est:** 15m
**Description:** All bookmark strings as a typed `copy.ts` (save aria, error toasts, sign-in sheet, list title, filter labels, empty state, unavailable row). Mirrors `features/directory/copy.ts` convention.
**DoD:** Sacred Rule: SR-3 — educational, person-first, content-neutral; sr3 hook passes. Token/anti-slop: N/A.

### T-004 — SaveButton component (S-1)
**Files:** `apps/mobile/features/bookmarks/SaveButton.tsx` (create)
**Depends on:** T-002, T-003 · **Parallelizable:** yes · **Est:** 35m
**Description:** 44pt circular toggle. lucide `Bookmark`(filled `color.primary.default`) / `BookmarkPlus`(outline `color.text.secondary`). Save = spring-pop scale (`withSequence`, `motion.duration.swift`→`base`, `easing.out`) + `haptic.confirm`; unsave = `haptic.affirm`. Anon tap → emits `onRequestSignIn` (parent shows S-2). VoiceOver "Save…/Saved. Tap to remove."; reduce-motion → instant, reduce-haptics → silent.
**DoD:** + interaction tests. Sacred Rule: N/A. Token discipline: all values are token IDs, no raw hex/px. Anti-slop: `/mobile-design-audit` static pass.

### T-005 — Sign-in bottom sheet (S-2)
**Files:** `apps/mobile/features/bookmarks/SignInSheet.tsx` (create)
**Depends on:** T-003 · **Parallelizable:** yes · **Est:** 30m
**Description:** Bottom sheet: bookmark glyph, title/body (copy from T-003), "Sign in" CTA → existing `(auth)` flow, "Not now" dismiss. On successful sign-in, resolves a callback so the parent auto-completes the original save (AC-5.3). Slide-up `motion.duration.base`; focus trap; scrim dismiss.
**DoD:** + present/dismiss + post-sign-in resume tests. Sacred Rule: SR-3 (copy via T-003). Token discipline: tokens only. Anti-slop: `/mobile-design-audit` static pass.

### T-006 — Saved list screen + rows (S-3)
**Files:** `apps/mobile/app/saved.tsx` (create), `apps/mobile/features/bookmarks/SavedList.tsx` (create), `apps/mobile/features/bookmarks/SavedRow.tsx` (create)
**Depends on:** T-002, T-003 · **Parallelizable:** yes · **Est:** 45m
**Description:** Route `/saved`. FlashList of bookmarks (`created_at` desc) via T-002. Horizontal filter chips (All/Articles/Providers/Tools, client-side). Row: icon + title/name + type, trailing unsave; tap → resolve `resource_id` and navigate (refetch-by-id; article→`article/[slug]`, provider→`find/provider/[id]`, tool→tool screen). Empty state (lucide glyph + calm copy + CTA→Learn). Stale row (EC-4) → "No longer available" + Remove. Skeleton loading.
**DoD:** + filter, empty, stale, unsave tests. Sacred Rule: SR-3 (copy). Token discipline: tokens only. Anti-slop: `/mobile-design-audit` static pass.

### T-007 — Wire save into article detail
**Files:** `apps/mobile/app/article/[slug].tsx` (modify)
**Depends on:** T-004, T-005 · **Parallelizable:** yes · **Est:** 25m
**Description:** Mount `SaveButton` in article header (resource_type `article`, resource_id = slug/id). Wire `onRequestSignIn` → `SignInSheet`; resume save on sign-in. Hydrate saved state via `useBookmarkedIds`.
**DoD:** + toggle + anon-prompt tests. Sacred Rule: N/A. Token/anti-slop: inherits component audit.

### T-008 — Wire save into provider detail
**Files:** `apps/mobile/app/find/provider/[id].tsx` (modify)
**Depends on:** T-004, T-005 · **Parallelizable:** yes · **Est:** 25m
**Description:** Same as T-007 for provider (resource_type `provider`, resource_id = provider id).
**DoD:** + tests. Sacred Rule: N/A.

### T-009 — Wire save into tool screens
**Files:** `apps/mobile/app/tools/clarity.tsx` (modify), `apps/mobile/app/tools/sleep.tsx` (modify), `apps/mobile/app/tools/mood-journal.tsx` (modify), `apps/mobile/app/tools/mindmate.tsx` (modify), `apps/mobile/app/tools/relationship-health.tsx` (modify)
**Depends on:** T-004, T-005 · **Parallelizable:** yes · **Est:** 35m
**Description:** Mount `SaveButton` on each tool screen header (resource_type `tool`, resource_id = tool's DB id from the `tools` table). **Surface flagged** — see Open items; if a tool↔id mapping is unavailable, this task narrows to the tools with a clean id and the rest move to follow-up.
**DoD:** + toggle test on ≥1 tool screen. Sacred Rule: N/A.

### T-010 — Settings "Saved" entry
**Files:** `apps/mobile/app/settings/index.tsx` (modify)
**Depends on:** T-006 · **Parallelizable:** yes · **Est:** 15m
**Description:** Add a "Saved" row to the settings list (avatar→Settings→Saved) routing to `/saved`.
**DoD:** + nav test. Sacred Rule: SR-3 (label). Token/anti-slop: inherits.

### T-011 — Telemetry (count-only events)
**Files:** `apps/mobile/features/bookmarks/analytics.ts` (create)
**Depends on:** none · **Parallelizable:** yes · **Est:** 20m
**Description:** Thin helpers over the existing analytics adapter (`lib/adapters`): `trackBookmarkAdded()`, `trackBookmarkRemoved()`, `trackSavedListOpened()`, `trackSavedItemOpened()` — **empty payloads** (no resource id/type/slug).
**DoD:** + test asserting payloads contain no identifiers. Sacred Rule: SR-4/AC-N.4b — sr4 hook passes; no symptom/content identifiers. Token/anti-slop: N/A.

### T-012 — Account-deletion cascade test
**Files:** `apps/mobile/features/bookmarks/__tests__/cascade.test.ts` (create)
**Depends on:** T-001 · **Parallelizable:** yes · **Est:** 25m
**Description:** Integration test verifying bookmark rows are removed via `ON DELETE CASCADE` when the account-deletion path runs (US-7/AC-7.1–7.2). Mock/seeded user.
**DoD:** test passes. Sacred Rule: N/A.

### T-013 — Maestro E2E
**Files:** `apps/mobile/.maestro/bookmarks.yaml` (create)
**Depends on:** T-006, T-007, T-008 · **Parallelizable:** yes · **Est:** 30m
**Description:** E2E: open article → save (icon fills) → open Settings→Saved → see item → open it → return → unsave → list empty state. Runs iOS sim + Android emulator.
**DoD:** green on both platforms. Sacred Rule: N/A.

## Parallelization plan

### Wave 1 (no deps)
T-001, T-003, T-011 — spin 3 worktrees.

### Wave 2 (after Wave 1 merges)
T-002 (needs T-001, T-011) · T-012 (needs T-001).

### Wave 3
T-004 (T-002,T-003) · T-005 (T-003) · T-006 (T-002,T-003).

### Wave 4
T-007 · T-008 · T-009 (all need T-004,T-005) · T-010 (needs T-006).

### Wave 5
T-013 (needs T-006,T-007,T-008).

```bash
# worktrees root per workspace.json: ~/Documents/psychage-worktrees
git worktree add ~/Documents/psychage-worktrees/bm-T-001 main
git worktree add ~/Documents/psychage-worktrees/bm-T-003 main
git worktree add ~/Documents/psychage-worktrees/bm-T-011 main
# in each:  cd <worktree> && claude /spec-implement bookmarks T-001   (etc.)
```

### Practical recommendation
Run **3** parallel worktrees in Wave 1 (T-001 service is the critical-path root). Then 3 in Wave 3 (T-004/T-005/T-006 are the bulk). Single feature-merge after each wave. Critical path ≈ T-001→T-002→T-006→T-010 (~2.5h).

## File-creation summary

```
apps/mobile/
  app/
    saved.tsx                                   (T-006)
    article/[slug].tsx                          (T-007, modify)
    find/provider/[id].tsx                      (T-008, modify)
    tools/{clarity,sleep,mood-journal,mindmate,relationship-health}.tsx (T-009, modify)
    settings/index.tsx                          (T-010, modify)
  features/bookmarks/
    types.ts                                    (T-001)
    service.ts                                  (T-001)
    hooks.ts                                    (T-002)
    copy.ts                                     (T-003)
    SaveButton.tsx                              (T-004)
    SignInSheet.tsx                             (T-005)
    SavedList.tsx                               (T-006)
    SavedRow.tsx                                (T-006)
    analytics.ts                                (T-011)
    __tests__/cascade.test.ts                   (T-012)
  .maestro/bookmarks.yaml                       (T-013)
```

No `supabase/migrations/` (table live). No `packages/i18n/` (not created; strings in copy.ts).

## Definition of Done — feature

- [ ] T-001…T-013 merged on `main`
- [ ] `pnpm --filter @psychage/mobile typecheck` + Biome clean
- [ ] Vitest targeted suites pass (full suite OOMs — run per-file)
- [ ] T-013 Maestro E2E green on iOS + Android
- [ ] SR-3 + SR-4 hooks pass on every commit
- [ ] `/mobile-design-audit` passes (S-1, S-2, S-3)
- [ ] `/ultrareview` pass on implementation PR
- [ ] PR references App Store 5.1.1; no medical-advice copy (1.4.1)
- [ ] No analytics/storage write contains resource_id/resource_type or any symptom/mood data (test + sr4 hook). **Sentry beforeSend filter: N/A — Sentry not yet wired in mobile; add bookmark-id scrub when Sentry lands.**
- [ ] Clinical review (Dr. Dobson) on any condition-referencing string (empty state + sign-in copy kept neutral to minimize surface)
- [ ] Manual QA: dark mode parity, Reduce-Motion, Reduce-Haptics, large list, signed-out path

## Open items (surface in /spec-review)

1. **Tool-save surface (T-009) — mapping RESOLVED; save buttons DEFERRED (2026-06-15).** `resource_id` for tools = the **stable Expo Router route slug** (`clarity`, `sleep`, `mood-journal`, `mindmate`, `relationship-health`) with `resource_type='tool'` (no `tools` DB table in mobile). The saved list + `SavedRow` fully support tool bookmarks (slug → name map + `/tools/<slug>` route), so tool saves render and open correctly. **Deferred:** the per-tool SAVE button. Unlike article/provider, the five tool screens render bespoke full-screen flows with **no uniform header trailing slot** (design.md S-1's mount point doesn't exist there); adding it requires per-flow chrome surgery across five features and is out of scope for this pass. Follow-up: add `BookmarkSaveSlot` to each tool flow's chrome when those flows gain a standard header affordance.
2. **i18n** — EN-only via copy.ts at ship; PT/ES/SV/FR deferred until `packages/i18n` exists.
3. **Sentry scrub** — deferred until Sentry is wired in mobile.

## Next step

1. Run `/spec-review bookmarks` to audit before implementation.
2. On review-pass, spin up worktrees per the parallelization plan and run `/spec-implement bookmarks <task-id>` in each.
