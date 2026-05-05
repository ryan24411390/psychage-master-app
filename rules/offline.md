# Offline strategy — the rule file

> **Scope:** This file defines how Psychage Mobile V1 behaves without internet, and how it reconciles when connection returns. Loaded by Claude Code whenever data persistence, sync, or network-dependent code is written. While this file existed-but-empty, the offline scope was BLOCKED per `CLAUDE.md` §5. With this file populated, that scope is unblocked — but only within these boundaries.
>
> **Last decided:** 2026-05-03
> **V1 model:** *Online with aggressive cache for spine-features; online-only with graceful degradation for everything else.*
> **V2 model (target):** *Local-first with full bidirectional sync.* Documented at the bottom for context.

---

## 1. Per-surface offline behavior

The deciding question for each surface: *if the user opens this surface offline, what's the right experience?* Three answers exist:

- **Fully offline-capable** — works exactly the same as online, no degraded UI, no error states. Required for safety and acute moments.
- **Offline-with-queue** — input is accepted and stored locally with a sync flag; the user is told "saved, will sync." Required for the daily-spine feature.
- **Online-only with graceful degradation** — a clear "you're offline" empty state with retry. No silent failures.

| Surface | Offline behavior | Reason |
|---|---|---|
| **Crisis surface** | Fully offline-capable | Sacred Rule #3 — must work in any condition. |
| **Symptom Navigator** | Fully offline-capable | Acute moments cannot depend on signal. |
| **Daily Check-In** | Offline-with-queue | The daily spine. Cannot break for offline users. |
| **Article reader (last 5 viewed)** | Fully offline-capable | Recently-read articles cached on view. |
| **Article library (browse all)** | Online-only | The reference, used deliberately. |
| **My Therapist (view + edit)** | Offline-with-queue | Edits queued, synced on reconnect. |
| **Therapist share (PDF generation)** | Fully offline-capable | PDF generation is local. Sending the email/sharing the file requires online. |
| **Sleep Architect (WebView)** | Online-only | WebView surface, cannot easily ship offline. |
| **Relationship Health Check (WebView)** | Online-only | Same. |
| **Medication Tracker (WebView)** | Online-only | Same. |
| **Clarity Score (WebView)** | Online-only | Same. |
| **Provider Directory (WebView)** | Online-only | Same. |
| **Account features (sign-in, sign-up, password reset, account deletion)** | Online-only | Auth requires server. |
| **Settings (non-account)** | Fully offline-capable | All non-auth settings stored locally. |
| **Trends and history view** | Fully offline-capable for cached data | Renders from MMKV — what the user can see is what's already on device. |

If a surface isn't in this table, the default is **online-only with graceful degradation**.

---

## 2. The cache: what's pre-loaded, what's lazy

### Pre-loaded on first launch (after onboarding completes)

Bundled with the app or fetched once on first online session, then cached indefinitely until app is uninstalled:

- **Crisis resources.** All ~29 regional resources from web's database. ~150KB JSON. Refresh in background daily; serve from cache always.
- **Symptom Navigator data.** Symptoms list, conditions list, scoring data, mappings (~448 entries). ~500KB. Refresh weekly.
- **Sensitivity filter rules.** The 26 person-first language rules. <10KB.
- **Onboarding language packs.** Just the 5 supported language strings for crisis + Navigator + onboarding flows. ~80KB total.

Total pre-load: ~750KB. App launch cost: imperceptible on modern devices.

### Lazy-cached (cached on first view)

- **Articles.** Each opened article cached locally. Cache LRU with 50-article cap (older articles evicted when cap hit). ~40KB per article = 2MB max.
- **Last 7 days of check-ins** (anonymous tier) or **last 30 days** (account tier) are always present in MMKV.

### Never cached

- WebView surfaces (online-only by design).
- Provider directory results (search-driven, contextual).
- MindMate AI conversations (V2; never offline-able by nature).

---

## 3. The sync queue (V1)

### Architecture

One MMKV-backed FIFO queue per data type. V1 has three:

```
queue:check-ins        pending Daily Check-In submissions
queue:journal-entries  pending journal/note saves
queue:therapist-edits  pending "my therapist" updates
```

Each queue entry has shape:

```typescript
{
  id: string;              // UUID generated client-side
  type: 'check-in' | 'journal-entry' | 'therapist-edit';
  payload: Record<string, unknown>; // schema-versioned per data type
  payload_version: number; // for forward-compat per Sacred Rule #13
  enqueued_at: string;     // ISO timestamp
  attempt_count: number;   // increments on each retry
  last_error?: string;     // populated on failure
}
```

### Drain logic

When the app comes online (NetInfo → `isConnected: true`):

1. Drain `queue:check-ins` first (it's the spine; user-perceptible).
2. Then `queue:journal-entries`.
3. Then `queue:therapist-edits`.

For each entry, oldest-first:
- POST to Supabase
- Success → remove from queue
- Failure (5xx, timeout) → exponential backoff (1m, 5m, 30m, 2h, max), increment `attempt_count`, store `last_error`
- Failure (4xx — bad request) → move to `queue:dead-letter`, alert user via in-app banner ("1 entry couldn't sync — tap to review"). Never silently drop.

### After 5 failed attempts on a 5xx

Move to dead-letter queue. Surface a banner. Don't keep retrying forever; the user deserves to know.

### When user is offline AND has unsynced entries

Show a small badge in the app header: "3 unsynced." Tap → list of pending items. This is non-negotiable per §5 below (the silent-drop prevention rule).

### NOT in V1

- No Redux Offline, no RxDB, no WatermelonDB. The 50-line MMKV queue is sufficient.
- No background-task drain (Expo Background Fetch is V2 — until then, drain happens on foreground).
- No optimistic UI updates that get rolled back on conflict (no conflicts possible in V1 per §4).

---

## 4. Conflict resolution

### V1 reality

There is exactly one writer for any user's account data: their mobile app. Web V2 reads from the shared Supabase but doesn't write personal data back to it (per `ARCHITECTURE.md` §1 cross-app rule, V1 = unidirectional). So **V1 has no conflict scenarios**.

### V1 rule (encoded for V2 readiness)

When the schema is created, every account-data table includes:

- `updated_at` (server timestamp on write)
- `device_id` (the device that last wrote)
- `last_modified_by` (the auth user UID — for V2 multi-account scenarios)

V1 mobile writes with these populated. V2 will use them for last-write-wins resolution. **The rule encodes the future contract; V1 implementation is just "always populate these fields."**

### V2 (target — not V1)

When V2 ships bidirectional sync:

- Last-write-wins per row, by server `updated_at`
- For free-text fields (journal content), conflicts notify the user with a "two versions exist — keep both?" prompt
- For structured fields (check-in mood score), pure LWW is acceptable — losing 5 minutes of work in a once-in-a-blue-moon conflict is preferable to a CRDT in the daily-check-in path

CRDTs and operational transform stay out of scope unless V2 user-data shows actual conflicts in the wild.

---

## 5. Visibility rules (the silent-drop prevention)

**Hard rule:** the app must NEVER silently fail to persist user data. The user must always be able to see whether their last write made it.

Specifically:

- **Daily Check-In submit button:** transitions through visible states. Default → "Saving..." → either "Saved" (online, immediate) or "Saved offline — will sync" (queued).
- **Header badge:** if any queued items exist, the app header shows a small unsynced-count badge. Tap → list view of pending items. Always reachable in 1 tap.
- **Failed sync banner:** if dead-letter queue has any items, a non-dismissible (until reviewed) banner appears in Settings → Sync. Reads: "1 entry couldn't sync. Tap to review or retry."
- **Offline-mode banner:** when offline AND inside an online-only surface, a top banner reads: "You're offline. This screen needs internet." Banner persists until reconnect or until user navigates back to a working surface.

### What this prevents

The Sanvello 2023 incident: silent journal-write drops. Users discovered days later that journal entries were missing. Sanvello had no offline indicator and no failed-sync surfacing. The fix took weeks of UX work and damaged user trust.

The rule above prevents Psychage from ever being in that situation.

### Negative rule

**No "automatically retried in background, sorry it didn't sync" silent failures.** Either it synced, or the user knows it didn't.

---

## 6. Crisis offline guarantees

The strictest section of this file. Crisis is non-negotiable per Sacred Rule #3.

### Always-true invariants

1. The crisis button is reachable in ≤2 taps from any screen — including offline screens.
2. The crisis surface fully renders without a network call. All resources rendered come from the on-device cache populated at first launch.
3. Hotline numbers can be tapped to dial directly via the OS dialer. This works offline by definition (cell service ≠ data service).
4. SMS shortcuts (e.g., "Text HOME to 741741") work offline by definition.
5. Grounding exercises in crisis surface are bundled in-app (no remote fetch).
6. Regional resources are detected from the user's locale + last-known location, NOT from a network call. If location services are off and locale is ambiguous, we show a global default set + manual region selector.

### Never-true invariants

- Crisis content is NEVER lazy-fetched. NEVER cache-on-first-view.
- Crisis content is NEVER paywalled, ever, ever.
- The crisis cache is NEVER expired or invalidated by app version. If the bundled cache is older than the latest published, the user gets the older one — a slightly outdated crisis number is infinitely better than no crisis number.

### Cache update strategy

- App ships with bundled cache (bundled in JS bundle, not fetched at install).
- Background: once per day on app foreground, fetch latest from Supabase. If fetch succeeds, update cache. If fails, keep existing.
- Offline at install: bundled-only cache used. Works.
- Stale cache after 30 days: a debug log warning fires (Sentry breadcrumb, no user-facing alert) so we can detect users with very long offline periods.

---

## 7. Battery and storage budgets

Mental health apps that drain battery get uninstalled. Storage that grows unbounded gets uninstalled.

### Battery rules

- No always-on location. Region detection is one-shot at app open + manual override.
- No background sync timer. Drain on foreground transition only (V1).
- No persistent network connections. Pure REST + on-demand.
- Network requests retry with exponential backoff per §3, capped at the values listed there.

### Storage rules

- Article cache: LRU with 50-article cap. Maximum ~2MB.
- Pre-loaded data: ~750KB total, indefinite.
- Sync queues: each queue capped at 1000 entries. If a queue grows beyond 1000, oldest entries move to dead-letter.
- Total app data budget for V1: ~10MB target, 25MB hard ceiling. Above 25MB, force-eviction of cache LRUs runs.

### Why these matter

- iOS App Store rejects apps with >50MB initial download size on cellular without user consent. Our sweet spot is well below that.
- Android Play Store starts surfacing storage warnings at 100MB. We have headroom.
- Battery budget aligns with mental health UX research: <2% per hour of active use.

---

## 8. Sacred Rule alignment

| Rule | How offline strategy respects it |
|---|---|
| **#3 Crisis cannot be disabled** | §6 entire section. Bundled crisis cache, never lazy, never expired, accessible offline. |
| **#4 Navigator state client-only** | Navigator runs from local cache; raw selections never sync. Per `rules/auth.md` §4, only summary metadata syncs to account. |
| **#11 No PII unsanitized** | Sync queue payloads are encrypted-at-rest in MMKV via OS keystore. Network sends use HTTPS only. Sentry breadcrumbs for sync errors strip PII fields. |
| **#13 Versioned migrators** | Sync queue entries include `payload_version`. Migration functions in `psychage-shared/migrations/` map old payload shapes to new on drain (so an offline-for-2-weeks user with old-schema queued data can sync after app update). |

---

## 9. Edge cases

- **App updated while user has queued data with old schema.** Migration runs on app launch before queue drain. Per Sacred Rule #13 — versioned migrators are non-negotiable. If a migration fails, queue entries move to dead-letter with a clear "couldn't migrate" reason.
- **User signs out with queued data.** Block sign-out with a confirmation: "You have N unsynced entries. Sign out anyway? (Data will be lost)." Default action: cancel. Affirmative requires explicit confirm.
- **User deletes account with queued data.** Same as sign-out, but stronger language: "Deleting your account is permanent. N unsynced entries will be lost."
- **Device clock is wrong.** All timestamps in queue use `Date.now()` at enqueue (device clock). Server overwrites with its own `created_at` on persist. Sync logic tolerates client-time skew of ±1 hour for ordering; beyond that, server-time wins.
- **User flies through 3 timezones with offline check-ins queued.** Each entry has its own `enqueued_at` from the device clock at the time. Drain happens in queue order, not timestamp order. The server's `created_at` reflects sync time, which is correct for "when did this enter the system" but may not match "when did the user actually check in." V1 accepts this; V2 may add a separate `experienced_at` field.
- **Account-tier data on shared device.** Tier 1 data on a shared device gets cleared on sign-out. Tier 2 data is per-account in `psychage-account` MMKV instance and is invisible across accounts on the same device.

---

## 10. V1 → V2 evolution path (for forward planning)

Documenting now so V2 doesn't surprise us:

| V1 (current) | V2 (target) |
|---|---|
| Online-with-cache for spine, online-only for non-spine | Local-first across all surfaces |
| Single FIFO queue per data type | Multi-priority queue with conflict-aware ordering |
| Last-write-wins (no actual conflicts in V1) | Real LWW resolution + free-text conflict UI prompts |
| Foreground-only drain | Expo Background Fetch + push-triggered drain |
| MMKV instances `psychage-anonymous` and `psychage-account` | Same instances + WatermelonDB or RxDB layer over for full local-first queries |
| WebView surfaces are online-only | Pre-rendered + cached snapshots for some surfaces (provider directory results, article library index) |

The path is forward-compatible. V1 schemas, sync metadata, and queue shapes are designed to extend, not replace, when V2 ships.

---

## What this file deliberately omits

- Specific NetInfo wrapper API — that's `apps/mobile/src/lib/network/`, code lives there
- Specific MMKV wrapper API for sync queues — that's `apps/mobile/src/lib/sync/`, code lives there
- The actual list of regional crisis resources — that's in Supabase, lifted from web V2's existing data (~29 resources)
- Push-notification offline behavior — notifications are delivered by APNs/FCM, which handle their own offline queueing; we don't manage that
- WebView session passing for the 6 WebView surfaces — that's in `ARCHITECTURE.md` §3 (WebView bridge) once written
- Performance benchmarks for queue drain — V1 doesn't have measured baselines yet; instrument in Phase 9 (observability) and revise targets here if needed
