# Design: Bookmarks (Saved Items)

**Spec ID:** bookmarks
**Status:** Design complete — ready for /spec-tasks
**Reads from:** brief.md, requirements.md
**Created:** 2026-06-15
**Platform:** mobile only

**Reference subagent summary (verbatim):**
> Existing components: `GlobalHeader.tsx` + `HeaderAvatar.tsx` (44pt avatar top-right → `/settings`) is the menu entry; "Saved" appends a route off settings. List mirror = `DirectoryView.tsx` (FlashList + TanStack Query). Save toggle attaches to `ArticleReader` (article detail) and `ProviderDetailView`. Supabase: `lib/supabase.ts` `getSupabaseClient()` (anon read) + auth-bearing client in `lib/supabase/client.ts` (session via secure store); hooks pattern in `features/directory/hooks.ts` (`useQuery`/`useInfiniteQuery`). Tokens — colors: `color.text.primary|secondary`(+`.dark`), `color.primary.default|light`, `color.surface.default|dark`, `color.border.default|dark`, `color.semantic.error`, `color.charcoal.*`; type: `type.family.sans` (IBM Plex), `type.family.display` (Fraunces, display only); motion: `motion.duration.swift`(150) `.base`(300) `.calm`(600), `motion.easing.out|in|standard`; haptic: `haptic.affirm`(light) `haptic.confirm`(medium) `haptic.celebrate`(success); radius: `radius.lg|xl|full`; spacing: 8pt grid (8/16/24/32/44). Mutations: `useMutation` + `invalidateQueries(['bookmarks', userId])`, optimistic via `onMutate`/`onError`. RLS enforces `auth.uid()=user_id`. Gaps: no spring motion token (closest calm+easing.out); empty-state clay figure = Tier 2 or defer; icon swap covered by swift+standard. lucide-react-native has `Bookmark` (filled), `BookmarkPlus` (outline), `BookmarkOff`. Platform deltas: none.

## Locked design decisions

1. Anonymous save → **bottom-sheet prompt**; auto-completes the original save after successful sign-in.
2. Saved providers → **refetch by id** (no snapshot columns; no schema change).
3. Saved list → **single combined list + type-filter chip row** (All / Articles / Providers / Tools).
4. Save signature → **spring-pop scale + `haptic.confirm` (medium)**, expressed via existing motion tokens (no physics-spring token invented).

## UI flow

```
[article / provider / tool detail]
   │  tap Save control (S-1)
   ├─ signed in ──► insert bookmark ──► icon spring-pop + medium haptic ──► saved
   │                       │ server error
   │                       └──► revert to unsaved + inline error toast
   └─ anonymous ──► [Sign-in bottom sheet (S-2)]
                          │ sign-in success
                          └──► auto-complete save ──► saved
                          │ dismiss
                          └──► return to detail, unsaved

[avatar header] → [Settings] → "Saved" ──► [Saved list (S-3)]
   │ tap row ──► resolve resource_id ──► detail surface (return-rate event)
   │ tap saved icon on row ──► unsave (optimistic) 
   │ filter chip ──► client-side filter by resource_type
   └─ empty ──► empty state (calm copy + CTA to Learn/Find)
```

## Screens

---

### S-1: Save control (shared component, not a screen)

**Archetype:** icon button (attaches to detail-screen chrome).

**Mirrors:** circular icon-button pattern in existing detail headers (`ArticleReader`, `ProviderDetailView`).

**Purpose:** toggle saved state for the current article / provider / tool.

**Layout:** 44pt circular pill (`radius.full`) in the detail header trailing slot. Unsaved = `BookmarkPlus` outline (`color.text.secondary`); saved = `Bookmark` filled (`color.primary.default`).

**Components used:** `Pressable` icon button (mobile primitive) + lucide `Bookmark` / `BookmarkPlus`.

**Touch targets:**
| Element | Size (pt) | ≥44pt |
|---|---|---|
| Save icon button | 44×44 | ✓ |

**Haptic events:**
| Interaction | Token | Reduce-Haptics fallback |
|---|---|---|
| Save | `haptic.confirm` (medium) | none (silent) |
| Unsave | `haptic.affirm` (light) | none (silent) |

**Animation events:**
| Interaction | Token | Library | Duration | Reduce-Motion fallback |
|---|---|---|---|---|
| Save spring-pop | `motion.duration.swift`→`base`, `motion.easing.out` (scale 1→1.15→1 via `withSequence`) | Reanimated | 150ms+300ms | instant fill, no scale |
| Unsave | `motion.duration.swift`, `motion.easing.standard` | Reanimated | 150ms | instant outline |

**Signature moment:** the save spring-pop + medium haptic. One per detail surface; earns the ceiling because saving is the feature's defining action.

**Accessibility:**
| Element | VoiceOver label | State |
|---|---|---|
| Save button (unsaved) | "Save this article" (/ provider / tool) | not selected |
| Save button (saved) | "Saved. Tap to remove." | selected |

Dynamic Type: icon scales with control; High Contrast: filled state uses `color.primary.default` (AA against `color.surface.default`).

**Error state:** server failure → optimistic state reverts; non-blocking inline toast "Couldn't save — check your connection."

**Tokens used:**
| Element | Token |
|---|---|
| Saved fill | `color.primary.default` |
| Unsaved outline | `color.text.secondary` |
| Button radius | `radius.full` |
| Pop motion | `motion.duration.swift`/`base` + `motion.easing.out` |

**New tokens introduced:** None. (Optional future enhancement: a `motion.spring.savePop` physics token — non-blocking; current sequence approximates the pop.)

**i18n keys:** `bookmarks.save.article`, `bookmarks.save.provider`, `bookmarks.save.tool`, `bookmarks.saved.aria`, `bookmarks.error.save`.

**Maps to ACs:** US-1/AC-1.1–1.5, US-2/AC-2.1–2.3, EC-1, EC-5, EC-6.

---

### S-2: Sign-in bottom sheet (anonymous save)

**Archetype:** sheet.

**Mirrors:** existing bottom-sheet idiom (mobile sheet pattern); reuses shipped `(auth)` flow on CTA.

**Purpose:** explain that saving needs an account; route to sign-in; resume the save.

**Layout (thumb zones):**
```
┌─────────────────────┐
│        (dim scrim)  │  ← tap to dismiss
├─────────────────────┤
│  [BookmarkPlus icon]│  ← natural zone: title + body
│  "Keep this for     │
│   later"            │
│  educational body   │
├─────────────────────┤
│  [ Sign in ]  (CTA) │  ← easy zone: primary
│  [ Not now ]        │
└─────────────────────┘
```

**Components used:** sheet container + primary `Button` + text link.

**Touch targets:** Sign in CTA 56×full-width; "Not now" 44pt min.

**Haptic events:**
| Interaction | Token | Reduce-Haptics fallback |
|---|---|---|
| Sign in CTA tap | `haptic.affirm` (light) | none |

**Animation events:**
| Interaction | Token | Library | Duration | Reduce-Motion fallback |
|---|---|---|---|---|
| Sheet slide-up | `motion.duration.base`, `motion.easing.out` | Reanimated | 300ms | instant present |

**Signature moment:** None — transit surface.

**Accessibility:** focus traps to sheet; CTA labeled "Sign in to save"; scrim dismiss exposed as "Close". Copy content-neutral (SR-3).

**Empty/error:** n/a (transient).

**Tokens used:** `color.surface.default` (sheet), `color.text.primary` (title), `color.text.secondary` (body), `color.primary.default` (CTA), `radius.xl` (sheet top), `type.family.sans`.

**i18n keys:** `bookmarks.signin.title`, `bookmarks.signin.body`, `bookmarks.signin.cta`, `bookmarks.signin.dismiss`.

**Maps to ACs:** US-5/AC-5.1–5.3.

---

### S-3: Saved list (route: `app/saved.tsx`, reached from Settings → "Saved")

**Archetype:** list.

**Mirrors:** `DirectoryView.tsx` (FlashList + TanStack Query, pagination, empty state) — simpler: no search, `created_at` DESC, client-side type filter.

**Purpose:** browse and manage saved items; tap to reopen (drives save→return metric).

**Layout (thumb zones):**
```
┌─────────────────────┐
│  ‹ Saved            │  ← avoid zone: header
├─────────────────────┤
│ [All][Articles]     │  ← filter chips (horizontal)
│ [Providers][Tools]  │
├─────────────────────┤
│  ▣ Article title    │  ← natural/easy: FlashList rows
│  ▣ Provider name    │     each row: icon + title/name + type
│  ▣ Tool name        │     trailing saved-icon (tap = unsave)
│  ...                │
└─────────────────────┘
```

**Components used:** `FlashList` (required, list >20), filter `Chip` row, row `Card`/`Pressable`, lucide `Bookmark`.

**Touch targets:**
| Element | Size (pt) | ≥44pt |
|---|---|---|
| List row | full×≥64 | ✓ |
| Row unsave icon | 44×44 | ✓ |
| Filter chip | ≥44 height | ✓ |

**Haptic events:**
| Interaction | Token | Reduce-Haptics fallback |
|---|---|---|
| Row unsave | `haptic.affirm` (light) | none |
| Filter chip select | `haptic.affirm` (light) | none |

**Animation events:**
| Interaction | Token | Library | Duration | Reduce-Motion fallback |
|---|---|---|---|---|
| Row open transition | `motion.duration.base`, `motion.easing.standard` | Reanimated (nav) | 300ms | system default |
| Row remove on unsave | `motion.duration.swift` | Reanimated (layout) | 150ms | instant removal |

**Signature moment:** None — destination list, restraint over flourish.

**Accessibility:**
| Element | VoiceOver | Notes |
|---|---|---|
| Filter chip | "Filter: Articles, 1 of 4" | selected state announced |
| Row | "<title>, <type>. Saved." | action: open |
| Row unsave icon | "Remove from saved" | — |

Dynamic Type scales row text; High Contrast uses `color.text.primary`.

**Loading state:** skeleton rows (no spinner).
**Empty state:** lucide `BookmarkPlus` glyph (clay-figure illustration deferred to illustration delivery) + calm copy "Nothing saved yet — tap the bookmark on any article, provider, or tool to keep it here." + CTA → Learn. Never sad-emoji.
**Stale/unavailable row (EC-4):** if `resource_id` no longer resolves, row renders "No longer available" with a Remove action; tap does not navigate/crash.
**Error state:** load failure → calm retry row.

**Platform deltas:** none (RLS at DB; haptics via expo-haptics universal).

**Tokens used:**
| Element | Token |
|---|---|
| Background | `color.surface.default` |
| Row title | `color.text.primary` / `type.family.sans` |
| Row type label | `color.text.secondary` |
| Chip selected | `color.primary.default` |
| Row radius | `radius.xl` |
| Divider | `color.border.default` |

**New tokens introduced:** None.

**i18n keys:** `bookmarks.list.title`, `bookmarks.filter.all|articles|providers|tools`, `bookmarks.row.unavailable`, `bookmarks.empty.title`, `bookmarks.empty.cta`, `bookmarks.error.load`.

**Maps to ACs:** US-3/AC-3.1–3.4, US-4/AC-4.1–4.2, US-6/AC-6.1–6.3, EC-4, EC-7, EC-8, EC-9.

---

## Copy strings (EN) — SR-3 reviewable artifact

The full EN string set (resolves `_review.md` B-1: SR-3 needs inspectable copy, not key names).
T-003 lands these verbatim in `features/bookmarks/copy.ts`. All content-neutral, person-first,
educational, non-medical (App Store 1.4.1). Condition-referencing strings: **none** — kept neutral
to minimize the Dr. Dobson review surface (Rule §7). `sr3_diagnostic_language.sh` is a seed-phrase
scan only; these strings are additionally hand-checked against the forbidden-phrase set.

| Key | EN string |
|---|---|
| `save.article` | Save this article |
| `save.provider` | Save this provider |
| `save.tool` | Save this tool |
| `saved.aria` | Saved. Tap to remove. |
| `error.save` | Couldn't save — check your connection and try again. |
| `error.load` | Couldn't load your saved items. |
| `signin.title` | Keep this for later |
| `signin.body` | Sign in to save articles, providers, and tools to your account, so they're here whenever you come back — on any device. |
| `signin.cta` | Sign in to save |
| `signin.dismiss` | Not now |
| `list.title` | Saved |
| `filter.all` | All |
| `filter.articles` | Articles |
| `filter.providers` | Providers |
| `filter.tools` | Tools |
| `row.unavailable` | No longer available |
| `row.remove` | Remove |
| `empty.title` | Nothing saved yet |
| `empty.body` | Tap the bookmark on any article, provider, or tool to keep it here. |
| `empty.cta` | Explore Learn |

None of the above asserts a diagnosis, condition, or clinical claim; none uses "you have / you are
/ diagnosed". Person-first and content-neutral throughout. PT/ES/SV/FR deferred until `packages/i18n`
(CLAUDE.md §2).

## Data model

| Entity | Storage | Schema | Notes |
|---|---|---|---|
| Bookmark | Supabase `public.bookmarks` | `id`, `user_id`, `resource_type∈{article,video,provider,tool}`, `resource_id`, `created_at`, `UNIQUE(user_id,resource_type,resource_id)` | RLS per `auth.uid()`; insert/delete only (no UPDATE). No mobile migration. |
| Resolved resource | (refetch) | article via `lib/articles`, provider via `features/directory` | Saved list re-fetches by `resource_id`; no denormalized snapshot. |

## API contracts

Service: `apps/mobile/features/bookmarks/service.ts` using auth client `lib/supabase/client.ts` (`packages/api` not yet created — CLAUDE.md §2).

### Q-1: listUserBookmarks
- **Method:** `client.from('bookmarks').select('*').order('created_at',{ascending:false})`
- **Returns:** `Bookmark[]` (RLS scopes to current user — no explicit `user_id` filter needed but pass for index use)
- **React Query key:** `['bookmarks', userId]`

### Q-2: bookmarkedIdsForType (toggle-state hydration on detail screens)
- **Method:** select `resource_id` where `resource_type = $1`
- **Returns:** `Set<string>`
- **Key:** `['bookmarks', userId, resourceType]`

### M-1: addBookmark
- **Method:** `client.from('bookmarks').upsert({user_id, resource_type, resource_id}, {onConflict:'user_id,resource_type,resource_id', ignoreDuplicates:true})`
- **Side effects:** invalidate `['bookmarks', userId]`; optimistic via `onMutate`; telemetry `bookmark_added` (no resource id/type — see telemetry).

### M-2: removeBookmark
- **Method:** `client.from('bookmarks').delete().match({user_id, resource_type, resource_id})`
- **Side effects:** invalidate `['bookmarks', userId]`; optimistic; no-op on missing row (EC-2/EC-3).

## State management

- **Server (React Query):** `['bookmarks', userId]`, `['bookmarks', userId, resourceType]`.
- **Local:** filter chip selection (component state on S-3); optimistic toggle state.
- **Global:** none new (auth/session from existing `AuthProvider`).

## Error handling

| Error | User message | Recovery |
|---|---|---|
| Offline on toggle | "Couldn't save — check your connection." | optimistic revert; retry on next tap (no queue) |
| Session expired | route to sign-in via S-2 path | re-auth; revert |
| List load failure | "Couldn't load your saved items." | retry row |
| Resource unavailable | "No longer available" | Remove action |

## Sensorial design

### Haptic vocabulary
| Token | Purpose | Used at |
|---|---|---|
| `haptic.confirm` (medium) | save confirm | S-1 save |
| `haptic.affirm` (light) | unsave / chip / sign-in CTA | S-1 unsave, S-3, S-2 |

All haptics respect Reduce-Haptics (silent fallback).

### Audio vocabulary
None — this feature has no audio events.

### Motion vocabulary
| Token | Library | Duration | Used at |
|---|---|---|---|
| `motion.duration.swift` + `easing.out` | Reanimated | 150ms | icon swap, row remove |
| `motion.duration.base` + `easing.out/standard` | Reanimated | 300ms | sheet present, save pop tail, nav |

All motion respects Reduce-Motion (instant/static fallbacks per screen).

### Signature moments inventory
Total: **1** (the only destination interaction worth the ceiling).
- S-1 save: spring-pop scale (`swift`→`base`, `easing.out`) + `haptic.confirm`. Reduce-Motion → instant fill; Reduce-Haptics → silent.

## Sacred Rules compliance map
| Rule | Compliance |
|---|---|
| SR-1 | N/A — no confidence value. |
| SR-2 | N/A — no crisis/Navigator surface. |
| SR-3 | All S-1/S-2/S-3 copy + i18n keys educational, person-first; sr3 hook enforces. Empty-state and sign-in copy content-neutral. |
| SR-4 | N/A for symptom data (stores content refs only). **AC-N.4b:** telemetry excludes `resource_id`/`resource_type` (content-interest inference guard). |

## Telemetry / analytics
| Event | Payload | Scrubbed |
|---|---|---|
| `bookmark_added` | `{}` (count only) | no resource id/type |
| `bookmark_removed` | `{}` | no resource id/type |
| `saved_list_opened` | `{}` | — |
| `saved_item_opened` | `{}` | no resource id/type |

Save→return metric derived from per-user presence of `bookmark_added` then `saved_item_opened` within 7 days — no content identifiers needed.

**MUST NOT FIRE:** any event containing `resource_id`, `resource_type`, article slug, provider id, or any symptom/mood data. sr4 hook enforces. Sentry `beforeSend` strips bookmark identifiers.

## Anti-slop check
| Pattern | Present? | Justification/removal |
|---|---|---|
| Purple/cyan mesh gradient | No | — |
| Glassmorphism w/o purpose | No | — |
| Three-rounded-cards-in-a-row | No | — |
| Inter as default | No | App uses IBM Plex Sans (`type.family.sans`) — brand, not slop default |
| Hardcoded shadow values | No | elevation via tokens |
| Decorative spark-lines | No | — |
| Generic 4-tab nav | No | Saved is a route off Settings, not a tab |
| Card-list-everywhere | Partial | S-3 is a list — appropriate for a saved-items collection; rows are content, not decorative cards |
| Sad-emoji empty states | No | Calm copy + bookmark glyph (clay figure pending) |
| JS-thread animations | No | Reanimated (UI thread) only |
| Missing haptics on primary CTA | No | save/unsave/CTA all mapped |
| Missing Reduce-* fallbacks | No | every sensorial event has a fallback |

## Token discipline
| Element | Token | Forbidden raw |
|---|---|---|
| Brand/saved | `color.primary.default` | `#1A9B8C` |
| Body | `type.family.sans` | `IBM Plex Sans`/`16px` |
| Radius | `radius.full`/`xl` | `9999px`/`16px` |
| Motion | `motion.duration.*` | `150ms` literal |

## Open design decisions (non-blocking)
- **Empty-state clay figure** — using lucide `BookmarkPlus` placeholder; upgrade to a clay-figure illustration when illustration delivery reaches empty-states tier (DESIGN.mobile.md §4). Does not block implementation.
- **Optional `motion.spring.savePop` token** — current pop uses a timing sequence; a physics-spring token could be added later for fidelity. Non-blocking.
- **Saved entry placement** — placed as a "Saved" row in Settings (avatar → Settings). If a more direct avatar-menu shortcut is wanted, add later; does not block.

## Next step
Run `/spec-tasks bookmarks` to decompose into atomic, parallelizable tasks.
