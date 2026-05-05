# Architecture — cross-app data and integration

> **Scope:** This file defines how Psychage Mobile and Psychage Web share data, sessions, and runtime state. Loaded by Claude Code whenever schema design, RLS policies, cross-app concerns, or WebView integration code is written. While this file existed-but-empty, the cross-app scope was BLOCKED per `CLAUDE.md` §5. With this file populated, that scope is unblocked.
>
> **Last decided:** 2026-05-03
> **V1 model:** *Unidirectional read from web; mobile is the only writer for personal data. Schema designed for V2 bidirectional.*
> **V2 target:** Bidirectional sync, web writes personal data, real-time updates between devices.
>
> **Companion files:** `rules/auth.md` (auth tier model), `rules/offline.md` (sync queue and conflict rules), `PROJECT_CONTEXT.md` §6 (lift plan for shared package).

---

## 1. The cross-app contract (V1)

Two apps. One Supabase project. One database. Different roles per data category.

| Data category | Mobile (V1) | Web V2 (existing) | V2 mobile target |
|---|---|---|---|
| **Articles** (PEAF content) | Read | Read + write (admin) | Read |
| **Conditions, Symptoms, Crisis Resources** (reference data) | Read | Read + write (admin) | Read |
| **Provider directory** (NPPES + manual entries) | Read | Read + write (admin) | Read |
| **Check-ins, journal, navigator history (per-user personal data)** | **Read + write** | Read | Read + write |
| **Therapist links, share history** | **Read + write** | Read | Read + write |
| **User profile, preferences, premium subscription** | **Read + write** | Read + write | Read + write |
| **Analytics events** | Write only | Write only | Write only |

**The asymmetry to internalize:** Mobile is the *write surface* for personal user data in V1. Web *reads* it (so the user opens psychage.com and sees their check-ins) but does not *write* it. This is enforced by RLS policies (§4 below). When V2 ships, web's RLS gains write permissions and the asymmetry disappears.

This means: a user's daily ritual happens on mobile. Their reflection / deep reading happens on web. Their data flows mobile → server → web in V1. V2 makes it flow both ways.

---

## 2. Schema principles (forward-compatible from day one)

Every personal-data table includes these fields, populated on every write, from V1:

```sql
id uuid primary key default gen_random_uuid()
user_id uuid references auth.users(id) on delete cascade
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
device_id text not null              -- the device that wrote this row
client_version text not null         -- e.g., "mobile@1.0.3"
schema_version int not null default 1 -- per-row schema version for migrations (Sacred Rule #13)
```

**Why this matters:**
- `device_id` + `client_version`: V2 conflict resolution and debugging. "This row was written by an old mobile version with a known bug" → diagnosable.
- `schema_version`: per-row, not per-table. Different rows can be on different versions during a migration window. Migrators handle the version range.
- `updated_at`: V2 LWW resolution.
- `created_at` vs `updated_at`: distinct from each other. Daily check-in on Tuesday that's edited Wednesday has `created_at` Tuesday, `updated_at` Wednesday.

**Forbidden in personal-data tables:**
- `email`, `phone_number`, `full_name` columns directly on the data table — those live on `profiles` table only, joined via `user_id`. Per Sacred Rule #11 (no PII in unexpected places).
- Free-text fields without a length cap (DoS vector).
- Foreign keys to `auth.users.email` (changes if user updates email; use `user_id` UUID always).

---

## 3. Personal data tables (V1 schema)

The minimum schema V1 needs. Each table inherits the §2 forward-compat fields.

### `check_ins`

```sql
create table check_ins (
  -- §2 fields here
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  device_id text not null,
  client_version text not null,
  schema_version int not null default 1,
  -- table-specific
  mood_score int not null check (mood_score between 1 and 10),
  experienced_at timestamptz not null,  -- when the user says they felt this; can differ from created_at
  prompt_id text,                        -- which contextual prompt was answered (e.g., "what_on_mind")
  prompt_response text check (length(prompt_response) <= 2000),
  context jsonb default '{}'::jsonb      -- timezone, language, etc. — non-PII metadata
);

create index check_ins_user_created on check_ins(user_id, created_at desc);
create index check_ins_user_experienced on check_ins(user_id, experienced_at desc);
```

### `journal_entries`

```sql
create table journal_entries (
  -- §2 fields
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  device_id text not null,
  client_version text not null,
  schema_version int not null default 1,
  -- specific
  content text not null check (length(content) between 1 and 50000),
  tags text[] default '{}',
  attachments jsonb default '[]'::jsonb  -- file references, not the files themselves
);

create index journal_entries_user_created on journal_entries(user_id, created_at desc);
```

### `navigator_history`

Stores **summary only** per Sacred Rule #4 — never raw symptom selections.

```sql
create table navigator_history (
  -- §2 fields
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  device_id text not null,
  client_version text not null,
  schema_version int not null default 1,
  -- specific (summary only, no raw symptoms)
  matched_conditions jsonb not null,     -- [{ condition_id, confidence, tier }]
  duration_category text not null,       -- "acute", "subacute", "chronic" — bucketed, not exact
  flow_completed boolean not null,
  crisis_triggered boolean not null,
  outcome text                           -- what user did next: "saved", "shared", "abandoned", etc.
);

create index navigator_history_user_created on navigator_history(user_id, created_at desc);
```

### `therapist_links`

```sql
create table therapist_links (
  -- §2 fields
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  device_id text not null,
  client_version text not null,
  schema_version int not null default 1,
  -- specific (encrypted at rest via Supabase column encryption)
  display_name text not null check (length(display_name) <= 200),
  email text check (length(email) <= 320),
  phone_e164 text check (phone_e164 ~ '^\+[1-9]\d{1,14}$'),
  role text not null check (role in ('therapist', 'psychiatrist', 'primary_care', 'other')),
  treats_tags text[] default '{}',
  session_frequency text,
  notes text check (length(notes) <= 2000)
);

create index therapist_links_user on therapist_links(user_id);
```

### `share_history`

```sql
create table share_history (
  -- §2 fields
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  device_id text not null,
  client_version text not null,
  schema_version int not null default 1,
  -- specific
  share_type text not null check (share_type in ('navigator_result', 'check_in_summary', 'journal_export', 'trend_summary')),
  shared_with_therapist_id uuid references therapist_links(id) on delete set null,
  format text not null check (format in ('pdf', 'email', 'link')),
  payload_summary jsonb not null         -- what was shared (high-level), not the full content
);

create index share_history_user_created on share_history(user_id, created_at desc);
```

### `profiles`

The PII home. Other tables join here via `user_id`.

```sql
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  -- §2 fields adapted (no separate id, user_id is pk)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  schema_version int not null default 1,
  -- profile-specific
  display_name text check (length(display_name) <= 100),
  preferred_language text not null check (preferred_language in ('en', 'pt', 'es', 'sv', 'fr')),
  onboarding_reason text check (onboarding_reason in ('curious', 'struggling', 'supporting')),
  daily_check_in_time time,
  daily_check_in_enabled boolean default false,
  region text,                            -- ISO country code, for crisis resource defaults
  premium_status text not null default 'free' check (premium_status in ('free', 'premium')),
  premium_until timestamptz
);
```

**Schema design notes:**

- `auth.users` is Supabase-managed; `profiles` is our extension via `user_id` foreign key.
- `crisis_triggered` boolean on `navigator_history` is for service-quality counts only (Sacred Rule #11). The *actual* crisis flow content never goes here.
- Encrypted-at-rest fields (therapist info) use Supabase Vault or Supabase column encryption — implementation detail in Phase 6 / 9.

---

## 4. Row-Level Security (RLS) policies

RLS is the enforcement mechanism for §1's cross-app contract. Mobile writes; web reads V1; V2 web writes.

### Default-deny

All tables have RLS enabled. No row visible without explicit policy.

```sql
alter table check_ins enable row level security;
alter table journal_entries enable row level security;
alter table navigator_history enable row level security;
alter table therapist_links enable row level security;
alter table share_history enable row level security;
alter table profiles enable row level security;
```

### Read policy (V1 + V2): user can read their own rows

```sql
create policy "users read own check_ins" on check_ins
  for select using (auth.uid() = user_id);

-- (analogous policies for all five other personal tables)
```

This is platform-agnostic — same policy applies whether the request comes from mobile or web. So a logged-in web user *automatically* sees their mobile-written data.

### Write policy (V1): mobile-platform writes only

The "platform" identification in V1 comes from a custom JWT claim added at Supabase Auth sign-in:

```sql
create policy "mobile platform writes own check_ins" on check_ins
  for insert with check (
    auth.uid() = user_id
    and auth.jwt() ->> 'platform' = 'mobile'
  );

create policy "mobile platform updates own check_ins" on check_ins
  for update using (
    auth.uid() = user_id
    and auth.jwt() ->> 'platform' = 'mobile'
  );
```

(Analogous policies for all five other personal tables. Profiles is the exception — both platforms can write to profile, since web has profile editing UI.)

### Why platform-claim instead of platform-table-suffix

Three alternatives considered:
1. **Two separate tables (`check_ins_mobile` and `check_ins_web`) reconciled at read time.** Rejected: schema duplication, migration complexity for V2.
2. **Platform-aware service role.** Rejected: needs server-side proxy; defeats Supabase's client-direct model.
3. **JWT custom claim** (chosen): adds `platform: 'mobile' | 'web'` to JWT during sign-in. RLS reads it. Trivial in Supabase Auth; rejected by client tampering because the JWT is signed.

### V2 transition

When V2 web ships personal-data writes, the policies become:

```sql
create policy "any authenticated platform writes own check_ins" on check_ins
  for insert with check (auth.uid() = user_id);
```

The platform claim still exists for analytics ("which platform did this come from") but is no longer a write gate.

---

## 5. Auth bridging (single Supabase Auth, shared session)

One Supabase project. One `auth.users` table. One sign-up = both apps.

### Sign-up sources

A user's account can be created from either mobile or web. The flow is identical (per `rules/auth.md` §3): email/password, Apple, or Google. The created `auth.users` row is the same regardless of origin.

**Implication:** A user who signs up on mobile, then later opens psychage.com in their browser, can sign in with the same credentials. They see their own data immediately. This is the "yes, web users see mobile check-ins" promise from PRODUCT_BRIEF.md.

### Account-linking complexity (and why we avoid it in V1)

In V1, a single email can have only one account. We do NOT support:
- "I have a web account and now I'm signing up on mobile with a different email — link them."
- "I signed in with Google on web and Apple on mobile — link them."

Multi-method-same-account linking is V3 if at all. V1 enforces "use the same auth method on both platforms" via a UX hint at signup ("Already have an account? Sign in instead.").

### Session storage

- Mobile: `expo-secure-store` per `rules/auth.md` §6.
- Web: HTTPOnly secure cookies via Supabase JS client default config.
- Refresh tokens are independent per device — same as Sacred Rule territory.

---

## 6. WebView session bridge (the 6 WebView surfaces in V1)

The mobile app embeds 6 surfaces from psychage.com via WebView (per `V1_FEATURE_SCOPE.md`). The user is signed in on mobile; they expect the WebView to show them as signed in too.

### Bridge mechanism

When a WebView surface opens:

1. Mobile generates a one-time WebView token by POSTing to a Supabase Edge Function (`/webview-token-issue`). The function returns a short-lived (60-second) JWT signed with a session-specific secret.
2. Mobile loads the WebView URL with the token: `https://psychage.com/m/sleep-architect?wvt=<token>`.
3. Web receives the request, validates the WVT, and exchanges it for a normal web session cookie via `/m/auth-handshake`. Cookie is set; user is now signed in on web for this WebView session.
4. WebView session expires when the WebView is closed. The cookie is `Secure`, `HttpOnly`, `SameSite=Strict` for the WebView origin.

### Why not just pass the existing Supabase access token

Two reasons:
1. The mobile access token is bearer; if leaked (e.g., URL logging), it's reusable for ~1 hour. WVT is one-time, 60-second TTL, exchanged for a session-bound cookie.
2. Mobile and web sessions have different lifecycles. The bridge cleanly separates them so signing out of one doesn't cascade unexpectedly.

### Implementation pointers

- WVT issue/exchange functions live in `supabase/functions/webview-token/`.
- Mobile WebView wrapper component lives in `apps/mobile/src/features/webview/`.
- WebView analytics tag the platform as `'webview'` so events correlate (Phase 9 observability).
- WebView surfaces inherit mobile's theme (dark/light) and language via URL params: `?theme=dark&lang=pt`.

### What the WebView CANNOT do

- It cannot write to mobile-only data tables (check-ins, journal, navigator) per §4 RLS — even though the user is signed in.
- It cannot trigger mobile push notifications.
- It cannot access expo-secure-store (it's a WebView, not native).
- It cannot bypass Sacred Rules — same crisis surface, same person-first language, same content gates.

---

## 7. Real-time updates (V1 design)

V1 does NOT use Supabase Realtime. Web shows the user's mobile data on next page navigation or manual refresh.

**Why:** Realtime adds a persistent WebSocket per session, which on web is fine but on mobile is battery cost. V1's freemium model doesn't yet justify the cost. V2 may.

**V2 path:** Supabase Realtime channels on the `check_ins`, `journal_entries`, `navigator_history` tables. Mobile and web both subscribe. Cross-device updates appear within ~1 second.

---

## 8. Analytics architecture

Analytics events are written by both platforms. Schema lives in a single `events` table (subject to PostHog/Amplitude decision per `PROJECT_CONTEXT.md` §5 row 5).

```sql
-- Sketch only; finalize after analytics provider chosen
create table events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,  -- nullable: anonymous events allowed
  device_id text,
  platform text not null check (platform in ('mobile', 'web', 'webview')),
  event_name text not null,
  properties jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

**Events MUST be sanitized before insert** per Sacred Rule #11. The `properties` jsonb never contains symptom selections, journal content, navigator raw choices, therapist contact info, or anything matching the PII regex set defined in `packages/shared/sensitivity/`.

If PostHog or Amplitude is chosen as primary analytics, the in-Supabase `events` table becomes a backup/audit log only (small subset of events flagged for retention). Live analytics flow to the chosen provider.

---

## 9. Migration strategy (Sacred Rule #13 implementation)

Per-row schema versioning means migrations operate on a *range* of versions, not a single old→new step.

### File structure

```
packages/shared/migrations/
  check-ins/
    v1-to-v2.ts       (when v2 ships)
    v2-to-v3.ts
  journal-entries/
    ...
```

### Migration runner

When the app loads a row from MMKV (offline) or Supabase (online):

1. Read the row's `schema_version`.
2. If less than current app version expected, run migrations sequentially: v1 → v2, v2 → v3, etc., until current.
3. Migrated row is used in-memory immediately; the persisted version is updated on next write.

### Backward compatibility window

The mobile app accepts data written by any schema_version from 1 (V1 launch) onward. Forward migrations only — never remove a migration unless that version is unreachable in any active install (typically 12+ months after sunset).

### Server-side migrations

Supabase migrations live in `supabase/migrations/` (existing convention from web V2's 250+ files). New mobile-specific tables get their own migration files. **Never edit a published migration**; always add a new one.

---

## 10. Sacred Rule alignment

| Rule | How architecture respects it |
|---|---|
| **#3 Crisis cannot be disabled** | Crisis resources are reference data (read-only on mobile, served from cache per `rules/offline.md` §6). No DB-write dependency for crisis to function. |
| **#4 Navigator state client-only** | `navigator_history` table stores summary only (matched conditions, outcome). Raw symptom selections never reach the server. RLS enforces no INSERT path bypasses this in client code. |
| **#11 No PII unsanitized** | PII isolated to `profiles` and `therapist_links` tables. Both have stricter access patterns. Analytics events are sanitized at write-time per `packages/shared/sensitivity/`. |
| **#13 Versioned migrators** | `schema_version` field on every personal-data row from V1 launch. Migration files per data type per version. Forward-only, with backward compatibility window. |

---

## 11. Edge cases

- **User signs up on mobile, then signs in on web in a country we haven't translated to.** Web defaults to English; profile language preference still synced (so `preferred_language='pt'` from mobile signup shows even on Swedish-locale browsers).
- **User changes their email via web.** Web allows email changes (it's profile editing). Mobile detects the change on next sign-in and updates secure-store. Existing JWT becomes invalid; user re-authenticates.
- **Two users on the same device (account A signs out, account B signs in).** Per `rules/auth.md` §5, the `psychage-account` MMKV instance is cleared on sign-out. Account B starts fresh. Tier 1 anonymous data in `psychage-anonymous` is per-device and persists across account changes (which is correct — anonymous data has no owner).
- **User on Android 8 (older OS).** Expo SDK 54 minimum is Android 7. We support but don't optimize for older devices.
- **Cellular-only user behind a NAT that breaks Supabase Realtime later in V2.** V1 doesn't use Realtime; V2 falls back to polling for these users.

---

## 12. V1 → V2 evolution path

| V1 (current) | V2 (target) |
|---|---|
| Mobile = only personal-data writer, web = read-only | Both write, RLS adjusted |
| No real-time updates (refresh on navigation) | Supabase Realtime on personal tables |
| WebView session bridge (6 surfaces) | Native rewrite of WebView surfaces; bridge sunset |
| `auth.jwt() ->> 'platform' = 'mobile'` write gate | Remove platform write gate (any platform writes own data) |
| Account-linking not supported | Multi-method linking (Google + Apple → same account) |
| Single-device session | Optional cross-device active-session list with revoke |

**Forward compatibility is the design goal.** V2 changes must NOT require schema rewrites. Adding columns and adding policies are forward-compatible. Removing or restructuring is not.

---

## What this file deliberately omits

- Specific Supabase Edge Function implementations — those are code files in `supabase/functions/`
- Specific Supabase migration SQL — those are files in `supabase/migrations/`
- Build pipeline architecture (EAS Build, EAS Update) — Phase 8 (CI/CD) when written
- Observability topology (Sentry, analytics provider routing) — Phase 9 (observability) when written
- Test architecture for cross-app behavior — Phase 10 (test harness) when written
- Provider portal architecture (the V2 $79-149/mo tier) — V2 design document, not V1 work
- Detailed performance benchmarks for sync, query latency, etc. — Phase 9 instrumentation will produce baseline metrics; revise this file then
