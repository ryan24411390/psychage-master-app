-- ============================================================
-- Test: delete_account() erases every user-scoped row + the auth.users row
-- ============================================================
-- Runnable on a preview branch / local supabase (`psql -f` or `supabase db test`).
-- Confirms the hard-immediate cascade shipped in
-- 20260615000001_delete_account.sql. Mirrors platform_claim_rls.test.sql's
-- preview-branch + transactional-rollback pattern (non-destructive).
--
-- Simulates a PostgREST request by setting request.jwt.claims + role authenticated.
-- delete_account() is SECURITY DEFINER, so inside it runs as the owner (postgres):
-- it bypasses RLS (the still-gated check_ins write policy does not block deletion)
-- and may delete the auth.users row; auth.uid() is read from the request claims.
--
-- Asserts:
--   B. authenticated session with NO sub claim -> delete_account() RAISES,
--      and the seeded rows SURVIVE (fail-closed).
--   A. authenticated session with sub = the user -> every user-scoped row in all
--      six mobile-owned tables is gone AND the auth.users row is gone (cascade).
-- ============================================================

begin;

-- ---- seed: a real auth.users row + one row in every user-scoped table ----
-- Seeded as the default (superuser) role, BEFORE any `set role`, so RLS is bypassed.
insert into auth.users (id, email)
values ('00000000-0000-0000-0000-0000000000de', 'delete-test@example.com');

insert into check_ins (user_id, device_id, client_version, mood_score, experienced_at)
values ('00000000-0000-0000-0000-0000000000de', 'dev', '0.0.0', 5, now());

insert into navigator_history
  (user_id, device_id, client_version, matched_conditions, duration_category, flow_completed, crisis_triggered)
values
  ('00000000-0000-0000-0000-0000000000de', 'dev', '0.0.0', '[]'::jsonb, 'acute', true, false);

insert into journal_entries (user_id, device_id, client_version, content)
values ('00000000-0000-0000-0000-0000000000de', 'dev', '0.0.0', 'a journal entry');

insert into therapist_links (user_id, device_id, client_version, display_name, role)
values ('00000000-0000-0000-0000-0000000000de', 'dev', '0.0.0', 'Dr Example', 'therapist');

insert into share_history (user_id, device_id, client_version, share_type, format, payload_summary)
values ('00000000-0000-0000-0000-0000000000de', 'dev', '0.0.0', 'check_in_summary', 'pdf', '{}'::jsonb);

insert into audit_events (user_id, event_type, success)
values ('00000000-0000-0000-0000-0000000000de', 'sign_in', true);

-- sanity: every table seeded
do $$
begin
  assert (select count(*) from check_ins        where user_id = '00000000-0000-0000-0000-0000000000de') = 1, 'seed: check_ins';
  assert (select count(*) from navigator_history where user_id = '00000000-0000-0000-0000-0000000000de') = 1, 'seed: navigator_history';
  assert (select count(*) from journal_entries  where user_id = '00000000-0000-0000-0000-0000000000de') = 1, 'seed: journal_entries';
  assert (select count(*) from therapist_links  where user_id = '00000000-0000-0000-0000-0000000000de') = 1, 'seed: therapist_links';
  assert (select count(*) from share_history    where user_id = '00000000-0000-0000-0000-0000000000de') = 1, 'seed: share_history';
  assert (select count(*) from audit_events     where user_id = '00000000-0000-0000-0000-0000000000de') = 1, 'seed: audit_events';
  raise notice 'seed passed: one row in every user-scoped table';
end;
$$;

-- ---- B. no sub claim -> fail closed (raises, deletes nothing) ----
set local role authenticated;
select set_config('request.jwt.claims', '{}', true);

do $$
begin
  begin
    perform delete_account();
    assert false, 'B: delete_account with no auth.uid() MUST raise';
  exception when others then
    raise notice 'B passed: unauthenticated delete_account rejected';
  end;
end;
$$;

reset role;

do $$
begin
  assert (select count(*) from check_ins where user_id = '00000000-0000-0000-0000-0000000000de') = 1,
    'B: a rejected (unauthenticated) call must not delete anything';
end;
$$;

-- ---- A. sub = the user -> full cascade ----
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000de"}',
  true
);

select delete_account();

reset role;

do $$
begin
  assert (select count(*) from check_ins        where user_id = '00000000-0000-0000-0000-0000000000de') = 0, 'A: check_ins not cleared';
  assert (select count(*) from navigator_history where user_id = '00000000-0000-0000-0000-0000000000de') = 0, 'A: navigator_history not cleared';
  assert (select count(*) from journal_entries  where user_id = '00000000-0000-0000-0000-0000000000de') = 0, 'A: journal_entries not cleared';
  assert (select count(*) from therapist_links  where user_id = '00000000-0000-0000-0000-0000000000de') = 0, 'A: therapist_links not cleared';
  assert (select count(*) from share_history    where user_id = '00000000-0000-0000-0000-0000000000de') = 0, 'A: share_history not cleared';
  assert (select count(*) from audit_events     where user_id = '00000000-0000-0000-0000-0000000000de') = 0, 'A: audit_events not cleared';
  assert (select count(*) from auth.users        where id      = '00000000-0000-0000-0000-0000000000de') = 0, 'A: auth.users row not deleted';
  raise notice 'A passed: all user-scoped rows + auth.users removed by delete_account()';
end;
$$;

-- non-destructive: undo the seed
rollback;
