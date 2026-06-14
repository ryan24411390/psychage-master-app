# scripts/

Workspace scripts: bash worktree helpers (no Node dependency) and TypeScript
build/verification scripts run via `tsx`.

## TypeScript scripts (Node via `tsx`)

Run from the mobile package context so `tsx` and `@supabase/supabase-js` resolve.
Secrets are read from the environment only — never committed.

- `export-crisis-bundle.ts` — build-time export of the verified CT3 crisis bundle.
- `verify-checkin-rls.ts` — live RLS verification for `check_ins` (see below).

### `verify-checkin-rls.ts`

Proves the `check_ins` Row-Level-Security isolation that unit tests cannot: it
provisions three real users and exercises the policies as authenticated sessions.

**Security model.** The `service_role` key is used **only** to create/delete the
test users (admin work). Every isolation assertion runs through a per-user client
built from the **anon key + that user's own JWT** — `service_role` bypasses RLS and
would produce a false pass, so it never touches the assertion path.

**What it asserts.** A & B (mobile claim) write their own check-ins; A cannot
read/update/delete B's rows (and symmetric); a non-mobile claim (C, `platform=web`)
is denied the write — proving the `auth.jwt() ->> 'platform' = 'mobile'` gate. It
self-diagnoses by decoding each JWT to confirm the `platform` claim is present
(absent ⇒ the `custom_access_token_hook` is not registered).

**Exit codes** (drive a hard gate): `0` PASS · `1` ENV-MISSING (prints runbook) ·
`2` PRECONDITION-UNMET (write policy/hook not live — *not* a pass) · `3`
FAIL-CRITICAL (cross-account access succeeded or platform gate missing — STOP).

**Preconditions.** The check_ins **write** policy must be applied (it ships gated in
`supabase/policies-gated/check_ins_write.sql.gated`, lifted only in the write-flip
slice) **and** the access-token hook must be registered. With neither, A's own
mobile write is denied (default-deny) and the script reports PRECONDITION-UNMET.

#### Run — local stack (credential-free; recommended first)

```bash
supabase start                 # prints local API URL + anon + service_role keys
supabase db reset              # applies migrations 000001–000007 (read RLS + hook fn);
                               # config.toml auto-registers the access-token hook locally
# apply the gated WRITE policy to the LOCAL db only (do NOT commit this lift):
psql "$(supabase status -o env | grep '^DB_URL' | cut -d= -f2- | tr -d '\"')" \
     -f supabase/policies-gated/check_ins_write.sql.gated

SUPABASE_URL=http://127.0.0.1:54321 \
SUPABASE_ANON_KEY=<local anon key> \
SUPABASE_SERVICE_ROLE_KEY=<local service_role key> \
pnpm --filter @psychage/mobile exec tsx ../../scripts/verify-checkin-rls.ts

supabase stop
```

> iCloud-dataless caveat: this `~/Documents` checkout serves dataless placeholder
> files that `supabase start`/`db reset` can fail to read. If the local stack won't
> come up, run it from a fully-materialized clone (e.g. under `~/Developer`).

#### Run — hosted project (founder, creds required)

```bash
SUPABASE_URL=… SUPABASE_ANON_KEY=… SUPABASE_SERVICE_ROLE_KEY=… \
pnpm --filter @psychage/mobile exec tsx ../../scripts/verify-checkin-rls.ts
```

Hosted prerequisites (one-time, manual founder steps):

1. **Apply the migrations to the project** — migrations `000001`–`000008`
   (incl. the `check_ins` INSERT/UPDATE write policy, landed on `main` via #72)
   must be applied to the target project: `supabase link --project-ref <ref>`
   then `supabase db push`. A fresh/unmigrated project denies all writes
   (default-deny) until they are applied.
2. **Register the access-token hook** — Dashboard → Authentication → Hooks →
   *Customize Access Token (JWT)* → enable `public.custom_access_token_hook`
   (or via the Management API). Without this, every mobile write is denied.

A clean run (no env) prints the runbook and exits `1`.

## Worktree scripts

Three thin wrappers around `git worktree` for parallel feature work:

- `worktree-create.sh <branch>` — creates a sibling worktree at `<parent-of-repo>/<repo-name>-<branch>/` and checks out `<branch>` (creating it from HEAD if it doesn't exist).
- `worktree-list.sh` — lists all worktrees with the current one marked.
- `worktree-remove.sh <branch>` — removes the sibling worktree directory and the git bookkeeping. Does not delete the branch itself.

### Layout

Sibling-directory layout, not `.worktrees/`. Each worktree lives at `<parent-of-repo>/<repo-name>-<branch>/`, so for a repo at `~/Documents/psychage-master-app/` and a branch `feat/foo`, the worktree lands at `~/Documents/psychage-master-app-feat-foo/`. Slashes in branch names become dashes to keep paths flat.

### When to use

Parallel feature work without `git stash` / `git checkout` ceremony. One session per worktree, each session pinned to a different branch, all sharing the same git history. Useful when reviewing one feature while continuing work on another, or running long test suites in the background without blocking new edits.

### Origin

Surfaced in Phase 5 Slice 3 close-out as the workspace's parallel-agent infrastructure. The 5-layer enforcement (spec-review intersection, worktree-add fail-closed install, pre-commit hook, CI intersection, pre-merge spec-review re-run) builds on this script trio.
