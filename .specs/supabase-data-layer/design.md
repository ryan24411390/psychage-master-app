# Design: Supabase Data Layer (V1 [A])

**Spec ID:** supabase-data-layer
**Status:** Design complete — ready for /spec-tasks
**Reads from:** brief.md, requirements.md
**Created:** 2026-06-08

**Reference summary (infra spec — no design-system subagent):** This is a backend/data spec with
**no UI surface**, so the Reference-Load subagent (DESIGN.{web,mobile}.md + tokens) is N/A — there
are no screens, tokens, or sensorial events to distill. The governing reference material was loaded
directly in recon: **ARCHITECTURE.md** §2 (forward-compat fields), §3 (table schemas), §4 (RLS +
platform-claim write gate), §9 (migration strategy), §12 (forward-compat goal); **rules/security.md**
§2.1 (column encryption: `therapist_links.email/phone_e164/notes` via pgsodium, AES-256-equiv,
server-side at-rest, **not** E2EE); **rules/regulatory.md** §2.3 (encryption standard) + §3 (data
classification) + §4 (deletion); **packages/shared/CLAUDE.md** (no runtime deps, DI seam, barrel-only
surface); **constitution.md** (SR-4); **docs/adr/001** (check-in write gate, status Proposed).

## UI flow

N/A — no UI surface. Data flow per ARCHITECTURE.md §1: mobile is the sole V1 writer of personal
data; web reads. Both go through RLS-enforced Supabase + the `@psychage/shared/data` access layer.

```
[A feature in apps/mobile]
   │  injects Supabase client + platform-claim provider ('mobile')
   ▼
[@psychage/shared/data wrappers]  ── typed read/write, stamps §2 fields ──►  [Supabase Postgres]
   │                                                                              │ RLS default-deny
   │  writeCheckIn() ── GATED OFF (CHECKIN_PERSISTENCE_ENABLED=false) ──X         │ + platform claim
   ▼                                                                              ▼
[therapist contact] ── SECURITY DEFINER RPC (encrypt/decrypt, owner-scoped) ──► [pgsodium + Vault]
```

## Screens

N/A — no UI surface.

## Data model

Six personal-data tables. Each inherits the ARCHITECTURE.md §2 forward-compat fields
(`id`, `user_id`, `created_at`, `updated_at`, `device_id`, `client_version`, `schema_version`).
Schemas below are the **applied V1 set** (lifted verbatim from ARCHITECTURE.md §3, except
`therapist_links` whose sensitive fields become encrypted `bytea` per US-4).

| Entity | Storage | Schema source | Notes |
|---|---|---|---|
| `profiles` | Supabase | §3 | PII home; bidirectional write (US-1) |
| `check_ins` | Supabase | §3 | Schema applied; **write policy NOT applied** (US-2, ADR-001) |
| `navigator_history` | Supabase | §3 | Summary-only, SR-4 (US-3) |
| `journal_entries` | Supabase | §3 | Forward-compat, no V1 [A] writer (US-6) |
| `therapist_links` | Supabase | §3 + encryption | email/phone/notes encrypted at rest (US-4) |
| `share_history` | Supabase | §3 | high-level payload summary only (US-5) |

`profiles`, `check_ins`, `navigator_history`, `journal_entries`, `share_history`: schema exactly per
ARCHITECTURE.md §3 with all check constraints + indexes (`(user_id, created_at desc)` etc.).
`navigator_history` has **no raw-symptom column** (AC-3.1); `matched_conditions` jsonb is
`[{condition_id, confidence, tier}]` with persisted `confidence` ≤ 0.75 (AC-3.2).

**`therapist_links` — encrypted variant** (replaces §3 plaintext `email`/`phone_e164`/`notes`):

```sql
create table therapist_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  device_id text not null,
  client_version text not null,
  schema_version int not null default 1,
  -- non-sensitive (plaintext, normal RLS)
  display_name text not null check (length(display_name) <= 200),
  role text not null check (role in ('therapist','psychiatrist','primary_care','other')),
  treats_tags text[] default '{}',
  session_frequency text,
  -- sensitive (pgsodium-encrypted at rest; plaintext never stored — US-4 / AC-4.1)
  email_enc bytea,        -- ciphertext of email      (≤320 plaintext, validated pre-encrypt)
  phone_enc bytea,        -- ciphertext of phone_e164 (^\+[1-9]\d{1,14}$ validated pre-encrypt)
  notes_enc bytea         -- ciphertext of notes      (≤2000 plaintext, validated pre-encrypt)
);
create index therapist_links_user on therapist_links(user_id);
```

Format/length validation for the three encrypted fields moves to the write RPC / data-access wrapper
(can't `check`-constrain ciphertext) — AC-4.4.

## Migration plan

Ordered files under `supabase/migrations/` (ARCHITECTURE.md §9; never edit a published migration;
forward-only). Every `supabase/migrations/*.sql` is **sequential-only** per workspace.json
`review.sequentialOnlyFiles` → all migration tasks are `parallel=false`.

| # | File | Contents |
|---|---|---|
| 1 | `<ts>_extensions.sql` | `create extension if not exists pgsodium;` (+ confirm `pgcrypto`/`gen_random_uuid` available) |
| 2 | `<ts>_profiles.sql` | `profiles` table + RLS enable + read-own + **both-platform** write (§4 exception) |
| 3 | `<ts>_check_ins.sql` | `check_ins` table + RLS enable + **read-own ONLY** (no insert/update — US-2/AC-2.3) |
| 4 | `<ts>_navigator_history.sql` | table + RLS enable + read-own + mobile-write |
| 5 | `<ts>_journal_entries.sql` | table + RLS enable + read-own + mobile-write |
| 6 | `<ts>_therapist_links.sql` | encrypted table + RLS enable + read-own + pgsodium key ref + `get_therapist_links()` + `upsert_therapist_link()` RPCs |
| 7 | `<ts>_share_history.sql` | table + RLS enable + read-own + mobile-write |

**GATED (NOT in the applied set):** `supabase/policies-gated/check_ins_write.sql.gated` — the
mobile-write insert/update policy for `check_ins`. The `.sql.gated` extension keeps it **outside**
the Supabase CLI's `*.sql` apply glob, so it is provably not applied (AC-2.5). A header comment
reads `-- DO NOT APPLY until ADR-001 is Accepted (Dr. Dobson + security review)`. When ADR-001 lands
Accepted, it is renamed to a timestamped `supabase/migrations/<ts>_check_ins_write.sql` in a separate
PR — schema unchanged, policy added.

## RLS design

Default-deny on all six tables (AC-7.1). Policies (one read + conditional write per table):

```sql
-- applied to ALL six tables
alter table <t> enable row level security;

-- read (all six): owner-only, platform-agnostic (web reads mobile-written data)
create policy "users read own <t>" on <t> for select using (auth.uid() = user_id);

-- write (the FOUR mobile-only tables: navigator_history, journal_entries, share_history,
--        and check_ins ONLY via the gated file): mobile platform claim required
create policy "mobile writes own <t>" on <t> for insert
  with check (auth.uid() = user_id and auth.jwt() ->> 'platform' = 'mobile');
create policy "mobile updates own <t>" on <t> for update
  using (auth.uid() = user_id and auth.jwt() ->> 'platform' = 'mobile');

-- profiles EXCEPTION (§4): both platforms write, no platform claim
create policy "users write own profile" on profiles for insert with check (auth.uid() = user_id);
create policy "users update own profile" on profiles for update using (auth.uid() = user_id);
```

- `check_ins` in the applied set has the **read policy only**; its write policy lives in the gated
  file → default-deny denies all check-in writes (AC-2.2/2.3). Verifiable: grep applied migrations
  for `on check_ins` `for insert|update` → 0 matches.
- Default-deny negative check (AC-7.2): documented test — anon request → 0 rows; user A reading
  user B's row → 0 rows; web-platform JWT writing a mobile-only table → denied (EC-3).

## Encryption design (pgsodium + Supabase Vault)

Resolved primitive: **pgsodium** (honors workspace.json `tooling.databaseEncryption: pgsodium`,
security §2.1, regulatory §2.3 — no tooling override, no ADR). Server-side at-rest, owner-scoped
decrypt. Not E2EE (security §3).

- **Key:** a single named pgsodium key for therapist contact, its key material managed by Supabase
  Vault; referenced by stable key id (never shipped to the client; never in mobile binary).
- **Write** — `upsert_therapist_link(...)` `SECURITY DEFINER`:
  1. Re-check inside the function (DEFINER bypasses RLS): `auth.uid()` not null AND
     `auth.jwt() ->> 'platform' = 'mobile'` (mirrors the RLS write gate — AC-4.3).
  2. Validate email/phone_e164/notes format+length on plaintext (AC-4.4).
  3. Encrypt each via `pgsodium.crypto_aead_det_encrypt(plaintext::bytea, context, key_id)`;
     insert/update with `user_id = auth.uid()`. Plaintext never persists (AC-4.1).
- **Read** — `get_therapist_links()` `SECURITY DEFINER`: returns rows `where user_id = auth.uid()`
  with the three fields decrypted. Owner-only; web calls the **same** RPC (cross-app read
  contract — AC-4.2). Direct `select` on the table returns ciphertext bytea only.

## Data-access layer (`packages/shared/data`)

Follows packages/shared/CLAUDE.md: **no runtime deps**, **DI seam** (Supabase client + platform-claim
injected, safe no-op defaults), **barrel-only** public surface via the existing `./data` export.

Files (all within the owned `data` submodule):

- `data/types.ts` — six record interfaces: `ProfileRecord`, `CheckInRecord`,
  `NavigatorHistoryRecord`, `TherapistLinkRecord` (plaintext-facing shape — RPC handles cipher),
  `ShareHistoryRecord`, `JournalEntryRecord` (AC-8.1). Each includes the §2 fields.
- `data/adapters.ts` — DI interfaces: `SupabaseLike` (minimal `{ from, rpc }` surface — the real
  `@supabase/supabase-js` client is injected by apps/mobile or packages/api, **never imported here**)
  and `PlatformClaimProvider = () => 'mobile' | 'web'`. Safe defaults: a no-op client that throws
  `"no Supabase client injected"`, and `() => 'web'` (AC-8.2).
- `data/wrappers.ts` — typed read/write functions: `readProfile`/`writeProfile`,
  `readCheckIns` (read-only), `writeNavigatorHistory`/`readNavigatorHistory`,
  `readTherapistLinks`→`get_therapist_links()` RPC / `writeTherapistLink`→`upsert_therapist_link()`
  RPC, `writeShareHistory`/`readShareHistory`, journal read/write. Every write stamps `device_id`,
  `client_version`, `schema_version` (AC-8.3).
- `data/checkin-gate.ts` — `export const CHECKIN_PERSISTENCE_ENABLED = false;` and a
  `writeCheckIn(...)` that early-throws while the flag is false. **Not re-exported** from
  `data/index.ts` (AC-2.4/AC-8.4). Two independent OFF layers: flag-guarded wrapper + no DB write
  policy (EC-4).
- `data/migrations.ts` — the SR-13 migration-runner **contract** per ARCHITECTURE.md §9: read
  `schema_version`, apply v1→v2→… in-memory, persist on next write. V1 ships
  `schema_version = 1` with an **empty migrator registry** (contract present, no migrators —
  AC-9.2).
- `data/index.ts` — barrel: exports types, adapter interfaces, and the **live** wrappers. Does NOT
  export `writeCheckIn` (gated).

## State management

N/A — the layer is stateless pass-through. Consumers own TanStack Query keys + Zustand (per stack).

## API contracts

| ID | Surface | Method | Returns | Notes |
|---|---|---|---|---|
| Q-1 | profile read/write | `from('profiles')` select/upsert | `ProfileRecord` | RLS owner-only, both-platform write |
| Q-2 | check-in read | `from('check_ins')` select | `CheckInRecord[]` | read-only; no write surface (gated) |
| Q-3 | navigator summary | `from('navigator_history')` select/insert | `NavigatorHistoryRecord` | mobile-write; summary only |
| Q-4 | therapist read | `rpc('get_therapist_links')` | `TherapistLinkRecord[]` | SECURITY DEFINER decrypt, owner-only |
| Q-5 | therapist write | `rpc('upsert_therapist_link', {...})` | `{ id }` | SECURITY DEFINER encrypt + platform check |
| Q-6 | share read/write | `from('share_history')` select/insert | `ShareHistoryRecord` | mobile-write |
| Q-7 | journal read/write | `from('journal_entries')` select/insert | `JournalEntryRecord` | mobile-write; no V1 [A] caller |

## Sacred Rules compliance map

| Rule | This spec's compliance |
|---|---|
| SR-1 (confidence cap) | `navigator_history.matched_conditions.confidence` persisted ≤ 0.75; the data layer never computes or raises confidence (originates in `@psychage/shared/navigator`). AC-3.2. |
| SR-2 (crisis bypass) | N/A — no crisis-detection branch in scope. `crisis_triggered` is a stored boolean count only (AC-3.4); crisis flow is reference-data + offline (ARCHITECTURE.md §10). |
| SR-3 (diagnostic language) | N/A — no user-facing copy in this spec. |
| SR-4 (symptom data on device) | `navigator_history` is summary-only — **no raw-symptom column exists** (AC-3.1). The layer fires **no telemetry** and never passes symptom/mood identifiers to any sink (see MUST-NOT-FIRE). Raw symptom data never reaches Supabase. |
| SR-11 (PII isolation) | PII only on `profiles` (`display_name`) + `therapist_links` (encrypted email/phone/notes). FKs by `user_id` UUID. AC-1.3, AC-4.1. |
| SR-13 (versioned migrators) | `schema_version` on every row; runner contract in `data/migrations.ts`. AC-9.1/9.2. |

## Telemetry / analytics

The data layer emits **no** telemetry — analytics is a separate, injected concern and the vendor is
undecided (out of scope per CLAUDE.md §5). MUST-NOT-FIRE (enforced by `sr4_no_symptom_telemetry.sh`
on any future call site): any event/breadcrumb containing **mood selections, symptom selections,
severity/duration/frequency, journal content, navigator raw choices, or therapist contact info**.
Because the layer holds no telemetry call sites, SR-4 is satisfied by construction here.

## Anti-slop check

| Pattern | Present? | Justification |
|---|---|---|
| Purple/cyan mesh gradient | No | no UI |
| Glassmorphism | No | no UI |
| Three-rounded-cards row | No | no UI |
| Inter-as-default | N/A | no UI |
| Hardcoded shadow values | No | no UI |
| Decorative spark-lines | No | no UI |
| Generic 4-tab nav | No | no UI |
| Card-list-everywhere | No | no UI |
| Sad-emoji empty states | No | no UI |
| JS-thread animations | No | no UI |
| Missing haptics on CTAs | N/A | no UI |
| Missing Reduce-* fallbacks | N/A | no UI |

(Anti-slop is UI hygiene; this spec has no UI surface, so the relevant axis is **schema/RLS hygiene**:
default-deny everywhere, no plaintext PII, no speculative tables, no enabled mood-write — all asserted
above.)

## Token discipline

N/A — no design tokens (no UI surface).

## Open design decisions

None blocking /spec-tasks. Carried to the ADR-001 security review (not blockers for designing tasks):
- **pgsodium key provisioning** — exact key-id sourcing (migration-created named key vs Vault-secret
  reference) confirmed at implement with the security review; both satisfy "key in Vault, owner-only
  decrypt." Feeds ADR-001's "encryption at rest, exactly which fields" item.
- **Supabase region lock** — deferred to Day-5 lawyer review (regulatory §5); does not block schema.
- **ADR-001 status** — `check_ins` write stays gated OFF until Accepted; spec is complete regardless.

## Next step

Run `/spec-tasks supabase-data-layer` to decompose this design into atomic, parallelizable tasks.
