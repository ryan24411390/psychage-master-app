-- ============================================================
-- Test: platform claim scopes slice-1 RLS write policies
-- ============================================================
-- Runnable on a preview branch / local supabase (`psql -f`). Confirms the claim
-- this slice ships is the one the (already-applied, slice-1) write policies key
-- off. Mirrors slice 1's preview-branch + smoke pattern.
--
-- Simulates a request JWT by setting request.jwt.claims + role authenticated,
-- exactly as PostgREST does. navigator_history's write policy is:
--   with check (auth.uid() = user_id AND auth.jwt() ->> 'platform' = 'mobile')
--
-- Asserts:
--   A. JWT WITH platform='mobile' + own user_id  -> INSERT succeeds
--   B. JWT WITHOUT platform claim                 -> INSERT denied (RLS)
--   C. JWT WITH platform='web'                    -> INSERT denied (mobile-only)
-- ============================================================

begin;

-- a real auth.users row to satisfy the FK (cleaned up by rollback)
insert into auth.users (id, email)
values ('00000000-0000-0000-0000-0000000000aa', 'rls-test@example.com');

-- ---- A. platform=mobile -> allowed ----
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000aa","platform":"mobile"}',
  true
);

insert into navigator_history
  (user_id, device_id, client_version, matched_conditions, duration_category, flow_completed, crisis_triggered)
values
  ('00000000-0000-0000-0000-0000000000aa', 'dev', '0.0.0', '[]'::jsonb, 'acute', true, false);

do $$
begin
  assert (select count(*) from navigator_history
          where user_id = '00000000-0000-0000-0000-0000000000aa') = 1,
    'A: platform=mobile insert should succeed';
  raise notice 'A passed: platform=mobile write allowed';
end;
$$;

reset role;

-- ---- B. no platform claim -> denied ----
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000aa"}',
  true
);

do $$
begin
  begin
    insert into navigator_history
      (user_id, device_id, client_version, matched_conditions, duration_category, flow_completed, crisis_triggered)
    values
      ('00000000-0000-0000-0000-0000000000aa', 'dev', '0.0.0', '[]'::jsonb, 'acute', true, false);
    assert false, 'B: insert without platform claim MUST be denied';
  exception when insufficient_privilege then
    raise notice 'B passed: no-platform write denied';
  end;
end;
$$;

reset role;

-- ---- C. platform=web -> denied (mobile-only table) ----
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000aa","platform":"web"}',
  true
);

do $$
begin
  begin
    insert into navigator_history
      (user_id, device_id, client_version, matched_conditions, duration_category, flow_completed, crisis_triggered)
    values
      ('00000000-0000-0000-0000-0000000000aa', 'dev', '0.0.0', '[]'::jsonb, 'acute', true, false);
    assert false, 'C: platform=web write MUST be denied on a mobile-only table';
  exception when insufficient_privilege then
    raise notice 'C passed: platform=web write denied';
  end;
end;
$$;

reset role;

-- rollback: this is a non-destructive test against a shared backend
rollback;
