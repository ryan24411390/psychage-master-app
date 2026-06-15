# Requirements: Bookmarks (Saved Items)

**Spec ID:** bookmarks
**Status:** Requirements complete — ready for /spec-design
**Reads from:** brief.md
**Created:** 2026-06-15
**Brief read at:** 2026-06-15

## Context carried from brief

- Storage: **server-backed only**, table `public.bookmarks` (live, RLS per-`auth.uid()`, no migration needed).
- Schema: `id UUID PK`, `user_id UUID FK auth.users ON DELETE CASCADE`, `resource_type VARCHAR(50) CHECK IN ('article','video','provider','tool')`, `resource_id VARCHAR(255)`, `created_at TIMESTAMPTZ`, `UNIQUE(user_id, resource_type, resource_id)`.
- Ops available: SELECT / INSERT / DELETE for `authenticated` only. **No UPDATE** → toggle, never edit.
- Surface: "Saved" list behind the avatar header menu (no tab change).
- Metric: save→return within 7 days.
- Auth is a shipped dependency; bookmarks is a consumer, not auth-scope work.

## User stories

### Story US-1: Save an item

**As a** signed-in user (Aisha)
**I want** to save an article, provider, or tool from its detail surface
**So that** I can return to it later without re-searching.

**EARS:** When a signed-in user taps the save control on a supported detail surface, the system shall insert a bookmark row `(user_id, resource_type, resource_id)` and reflect a saved state.

**Acceptance criteria:**
- AC-1.1: Save control appears on `article/[slug]`, `find/provider/[id]`, and tool detail screens.
- AC-1.2: Tapping save inserts exactly one row with the current `auth.uid()` as `user_id` and the correct `resource_type`/`resource_id`.
- AC-1.3: Insert uses on-conflict-do-nothing (or pre-check) so a duplicate save is idempotent — never errors, never a second row (enforced by `UNIQUE`).
- AC-1.4: UI updates optimistically; on server failure it reverts to the prior (unsaved) state and surfaces a non-blocking error.
- AC-1.5: `video` resource_type is schema-supported but has **no save entry point in V1** (no video detail surface on mobile). No UI exposes it.

### Story US-2: Unsave an item

**As a** signed-in user
**I want** to remove a previously saved item
**So that** my Saved list stays relevant.

**EARS:** When a signed-in user taps the save control on an already-saved item, the system shall delete the matching bookmark row and reflect an unsaved state.

**Acceptance criteria:**
- AC-2.1: Toggle on a saved item issues a DELETE scoped to `(user_id, resource_type, resource_id)`.
- AC-2.2: Optimistic UI; reverts to saved state on server failure with a non-blocking error.
- AC-2.3: Deleting a non-existent row (race) is a no-op, not an error.

### Story US-3: View the Saved list

**As a** signed-in user
**I want** a Saved list reachable from the avatar header menu
**So that** I can browse everything I kept in one place.

**EARS:** When a signed-in user opens "Saved" from the avatar header menu, the system shall display their bookmarks newest-first, grouped or filterable by `resource_type`.

**Acceptance criteria:**
- AC-3.1: "Saved" entry exists in the avatar header menu (not a bottom tab).
- AC-3.2: List shows the user's bookmarks ordered by `created_at` descending.
- AC-3.3: Each row shows enough to identify the item (title/name + type) and routes to that item's detail surface on tap.
- AC-3.4: List uses FlashList (any list potentially >20 items per workspace rule).

### Story US-4: Open a saved item

**As a** signed-in user
**I want** to reopen a saved item from the list
**So that** I can resume reading/viewing it.

**EARS:** When a user taps a Saved list row, the system shall navigate to that resource's detail surface.

**Acceptance criteria:**
- AC-4.1: Tapping an article row → `article/[slug]`; provider → `find/provider/[id]`; tool → its tool screen.
- AC-4.2: Navigation resolves the saved `resource_id` to the live resource (re-fetch by id).

### Story US-5: Anonymous user attempts to save

**As an** anonymous (signed-out) user
**I want** clear guidance when I try to save
**So that** I understand saving needs an account.

**EARS:** If an anonymous user taps the save control, then the system shall prompt sign-in rather than writing a bookmark.

**Acceptance criteria:**
- AC-5.1: Anonymous tap on save does NOT write to `bookmarks` (RLS would reject anyway) and does NOT silently fail — it surfaces a sign-in path.
- AC-5.2: Prompt copy is educational and content-neutral (see SR-3). Exact UX (modal/inline/route) is a design decision.
- AC-5.3: After sign-in initiated from the sign-in sheet completes successfully, the system completes the original save and the detail surface reflects the saved state within one render cycle. If the post-sign-in save call fails, the standard save-error toast (EC-1) is shown and the control reverts to unsaved. (Resolved per design decision #1 — auto-complete; no abandoned-intent branch. Replaces the earlier OR-phrasing flagged in `_review.md` B-2.)

### Story US-6: Persistence across sessions and devices

**As a** signed-in user
**I want** my saved items to persist
**So that** they survive app restarts and appear on any device.

**EARS:** While a user is signed in, the system shall source saved state from the server so it is consistent across sessions and devices.

**Acceptance criteria:**
- AC-6.1: Saved state on a detail surface reflects the server row, not local-only state.
- AC-6.2: Signing in on a second device shows the same Saved list.
- AC-6.3: Server reads cached via TanStack Query; cache invalidates on save/unsave.

### Story US-7: Account deletion clears bookmarks

**As a** user deleting my account
**I want** my saved items removed with it
**So that** no residual data remains.

**EARS:** When a user's account is deleted, the system shall remove all their bookmark rows.

**Acceptance criteria:**
- AC-7.1: Bookmark rows are deleted via the existing `ON DELETE CASCADE` on `user_id` — no separate cleanup code required.
- AC-7.2: Verified by integration test against the account-deletion path.

## Sacred Rules → Acceptance criteria

| Sacred Rule | Acceptance criterion | How to verify |
|---|---|---|
| SR-1 (Navigator confidence cap) | N/A — feature returns no confidence value. | — |
| SR-2 (Crisis detection cannot be bypassed) | N/A — feature does not touch the Navigator/crisis path. | — |
| SR-3 (No diagnostic language) | AC-N.3: All bookmark UI strings (empty state, sign-in prompt, toasts, list labels) use educational, person-first framing; no "you have"/clinical assertions; 30-term sensitivity filter applies. | Hook `sr3_diagnostic_language.sh` + Dr. Dobson review of any condition-referencing string |
| SR-4 (Symptom data on device) | AC-N.4: No bookmark row, Sentry breadcrumb, or analytics event contains raw symptom selections. Bookmarks store only `resource_type` + `resource_id`. | Hook `sr4_no_symptom_telemetry.sh` + integration test |

**SR-4 spirit (privacy extension):** a saved `resource_id` can imply mental-health interest (e.g., a depression article). Therefore: AC-N.4b — bookmark `resource_id`/`resource_type` values must NOT be emitted to Sentry or analytics payloads. Telemetry may count *that* a save happened (for the success metric) but not *what* was saved.

## Edge cases

- EC-1: **Offline on toggle** — save/unsave fails; optimistic UI reverts; non-blocking "couldn't save, check connection" message. No local queue (offline sync is out of scope).
- EC-2: **Session expired mid-toggle** — write rejected by RLS/auth; surface re-auth path; UI reverts.
- EC-3: **Duplicate save race** — `UNIQUE` constraint makes it idempotent; treat conflict as success.
- EC-4: **Saved resource later unpublished/deleted** (e.g., article unpublished, provider removed from directory) — Saved list must render the row gracefully (placeholder + "no longer available") and allow removal; opening it must not crash.
- EC-5: **Reduce-Motion on** — save-icon fill/scale transition replaced by instant state swap.
- EC-6: **Reduce-Haptics on** — save/unsave haptic suppressed.
- EC-7: **Empty Saved list** — educational empty state (content-neutral, SR-3), routes user toward Learn/Find.
- EC-8: **Large list** — FlashList virtualization; paginate server reads if needed for performance.
- EC-9: **Language switch** — Saved list labels re-render in active language; saved rows (content) unaffected.

## Sensorial requirements (mobile)

| Interaction | Haptic | Audio | Motion | Reduce-Motion fallback | Reduce-Haptics fallback | Reduce-Audio fallback |
|---|---|---|---|---|---|---|
| Save tap (signature moment) | yes | no | yes (icon fill/scale) | instant state swap | none | n/a |
| Unsave tap | yes (distinct from save) | no | yes (icon empty) | instant state swap | none | n/a |
| Saved list row open | no | no | standard nav transition | system default | n/a | n/a |
| Empty-state appearance | no | no | subtle fade | static | n/a | n/a |

Specific haptic types and animation durations are /spec-design deliverables.

## Out of scope (carry-forward)

- Anonymous/local (MMKV) bookmarking — server-backed only.
- Offline create/sync queue — `rules/offline.md` scope.
- Folders, tags, collections, reordering, notes on saved items.
- Bookmark sharing or export.
- Editing a bookmark (no UPDATE policy exists).
- Video save entry point (schema-supported, no V1 surface).
- A 5th bottom tab for Saved.

## Constraints

- **Performance:** Saved list first meaningful paint <500ms on a warm cache; toggle reflects optimistically <100ms. Provider rows resolve by id (snapshot-vs-refetch tradeoff is a design call).
- **Accessibility:** Save control ≥44pt touch target; exposes selected/not-selected state to screen readers (e.g., "Saved"/"Not saved" + action label); WCAG AA contrast.
- **Localization:** Strings localizable for EN/PT/ES/SV/FR. EN required at ship; other locales land when the shared i18n package exists (`packages/i18n` not yet created — CLAUDE.md §2). No hardcoded user-facing strings.
- **App Store:** Guideline 5.1.1 (data collection/consent) — saving content to an account is account-scoped user data; covered by existing account consent. Guideline 1.4.1 — keep copy non-medical (SR-3). No new crisis-flow surface.
- **Privacy:** Data classification — **identifying / sensitive-adjacent** (saved content can imply mental-health interest). Server-stored under per-user RLS; excluded from telemetry payloads (AC-N.4b).
- **Regulatory:** No PHI/symptom-data persistence (content references only). `rules/regulatory.md` (Phase 4.A, complete) reviewed; no additional regulatory ACs triggered.

## Definition of Done (feature-level)

- [ ] US-1…US-7 have passing tests
- [ ] SR-3 + SR-4 (incl. AC-N.4b) ACs pass tests AND hook validation passes
- [ ] All edge cases EC-1…EC-9 handled or explicitly deferred with linked issue
- [ ] Strings externalized; EN shipped; PT/ES/SV/FR wired when i18n package lands
- [ ] Sentry `beforeSend` excludes bookmark `resource_id`/`resource_type`
- [ ] PR references App Store 5.1.1 + confirms no medical-advice copy
- [ ] Clinical review (Dr. Dobson) on any condition-referencing string
- [ ] `/mobile-design-audit` passes
- [ ] `/ultrareview` pass on the implementation PR

## Open questions for design phase

- Sign-in prompt UX for anonymous save (modal vs inline vs route to `(auth)`); and whether the original save intent is auto-completed post-sign-in (AC-5.3).
- Provider bookmark display: store only id + refetch, or denormalize a display snapshot (staleness vs perf; affects EC-4 rendering).
- Saved list IA: single combined list with type filter vs sectioned by `resource_type`.
- Exact save-icon animation + haptic type for the signature moment.
- Empty-state copy + illustration (clay-figure tier per DESIGN.mobile.md §4).

## Next step

Run `/spec-design bookmarks` to translate these requirements into a token-bound UI/data design.
