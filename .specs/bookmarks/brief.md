# Brief: Bookmarks (Saved Items)

**Spec ID:** bookmarks
**Created:** 2026-06-15
**Status:** Discovery complete — ready for /spec-requirements

## Problem

A user reading an article, viewing a provider, or trying a tool has no way to save it for later on mobile. The web app has had server-backed bookmarks (`bookmarkService`, table `bookmarks`) since v2 — saving articles, videos, providers, and tools per account. On mobile this is the highest-value patient-facing gap from the web→mobile parity audit (2026-06-15). Users currently re-find content by re-searching or re-navigating, or they lose it.

## Users

Primary: **Aisha** (24, anxiety, content-led) — reads multiple articles per session and wants to return to the ones that resonated. Secondary: any signed-in user browsing the provider directory (423k providers) who wants to keep a shortlist while deciding on care.

## Why now

The parity audit confirmed web and mobile share one Supabase backend; bookmarks are the top unblocked patient feature missing from mobile (provider portal + admin are web-only by design; booking + messaging are blocked by `rules/auth.md` / `rules/offline.md`). Auth is already shipped on mobile (`(auth)/*`, `AuthProvider`, `record_auth_event`), so a server-backed bookmark feature is a *consumer* of existing auth, not new auth-scope work. Closing this brings the reader and directory surfaces to functional parity with web.

## Scope

**In:**
- Server-backed bookmarks, per authenticated user, written to the shared Supabase bookmarks table (matches web exactly — cross-device).
- Bookmarkable entities: **article, video, provider, tool** (`resource_type` parity with web; video dormant at 0 rows but schema-supported).
- Save / unsave toggle on the relevant detail surfaces: `article/[slug]`, `find/provider/[id]`, tool screens.
- A **"Saved" list** reachable from the **avatar header menu** (account/settings entry point per DESIGN.mobile.md §2 — avatar is NOT a tab).
- Optimistic UI on toggle, React Query cache invalidation, empty state.

**Out:**
- Anonymous/local bookmarking (chosen storage model is server-backed only — anonymous users are prompted to sign in to save).
- Offline create/sync queue (that is `rules/offline.md` scope — bookmarks require connectivity in V1).
- Folders, tags, collections, reordering, notes on saved items.
- Bookmark sharing or export.
- Bumping bookmarks into the bottom-tab IA (no 5th tab).

## Success metric

**Save → return rate:** % of users who bookmark ≥1 item and later reopen it from the Saved list within 7 days. Measures whether bookmarks actually drive re-engagement rather than being a dead-end save.

## Sacred Rules in play

- **SR-3 — No diagnostic language.** All bookmark UI copy (empty states, sign-in prompt, toasts) uses educational, person-first framing. No "your conditions," no clinical assertion. Person-first 30-term sensitivity filter applies to any generated/templated string.
- **SR-4 — Symptom data on device.** Not directly triggered: bookmarks store content references (`resource_type` + resource id), NOT symptom selections. **Constraint to preserve:** a bookmark row must never embed Navigator/symptom state — only the saved content's id. Flag for /spec-review that no symptom payload rides along.
- **SR-1, SR-2:** None.

## Mobile IA assumption

Not an assumption — mobile IA is **decided** in `workspace.json`: `bottom-tabs-4-custom-plus-avatar-header`. Saved items live behind the **avatar header menu** (account/settings region), consistent with DESIGN.mobile.md §2. No tab change. No re-review needed.

## Sensorial commitment (mobile)

- **Haptic events:** selection-style haptic on save and on unsave (distinct enough to confirm state change). Fallback: silent when Reduce-Haptics is on.
- **Audio events:** none.
- **Motion events:** subtle bookmark-icon fill/scale transition on toggle (Reanimated). Fallback: instant state swap when Reduce-Motion is on.
- **Signature moment:** the save tap — icon fills + light haptic — the one moment that defines the feature's feel. Max one.

## Open questions

1. **Table identity — RESOLVED (2026-06-15).** Canonical table is **`public.bookmarks`** (web migration `20250109000001_create_remaining_tables.sql`). Anon REST 404 is expected: grants + RLS are `TO authenticated` only, so the anon role cannot see it. The `user_bookmarks` table (anon-200/0) is unrelated — not the bookmark store. Schema: `id UUID PK`, `user_id UUID FK auth.users ON DELETE CASCADE`, `resource_type VARCHAR(50) CHECK IN ('article','video','provider','tool')`, `resource_id VARCHAR(255)`, `created_at TIMESTAMPTZ`, `UNIQUE(user_id, resource_type, resource_id)`.
2. **RLS — RESOLVED (2026-06-15).** Live and correct: RLS enabled; per-`auth.uid()` policies for SELECT / INSERT (WITH CHECK) / DELETE; `GRANT SELECT,INSERT,DELETE TO authenticated`. **No UPDATE policy** → bookmarks are insert/delete only (toggle, no edit). UNIQUE constraint → idempotent insert-on-conflict. CASCADE → account deletion auto-clears. **No mobile migration required.**
3. **Sign-in prompt UX** for anonymous users hitting the save toggle — modal vs inline vs route to `(auth)`. Needs design call in /spec-design.
4. **Provider bookmarks scale** — saving from a 423k-row directory: store only the provider id and re-fetch, or denormalize a display snapshot? Performance/staleness tradeoff for /spec-design.
5. **Clinical copy review** — empty state + sign-in prompt strings need Dr. Dobson sign-off before ship (Rule §7) if they reference conditions/symptoms; keep them content-neutral to minimize review surface.

## Next step

Run `/spec-requirements bookmarks` to expand into user stories and acceptance criteria. Resolve open question #1 (table identity) early — it gates the API contract in design.
