-- ============================================================
-- Test: custom_access_token_hook — platform claim lift
-- ============================================================
-- Runnable on a preview branch / local supabase (`psql -f`). Plpgsql ASSERT
-- raises on mismatch (plpgsql.check_asserts is on by default), so a clean run =
-- pass. Mirrors slice 1's documented-AC verification style.
--
-- Asserts:
--   1. user_metadata.platform='mobile' -> top-level claims.platform='mobile'
--   2. user_metadata.platform='web'    -> top-level claims.platform='web'
--   3. no user_metadata.platform       -> no claims.platform, no error (fail-open)
--   4. unrecognized value ('evil')     -> NOT lifted (only mobile/web)
--   5. existing claims are preserved (e.g. sub untouched)
-- ============================================================

do $$
declare
  result jsonb;
  event jsonb;
begin
  -- 1. mobile is lifted
  event := '{"claims":{"sub":"u-1","user_metadata":{"platform":"mobile"}}}'::jsonb;
  result := public.custom_access_token_hook(event);
  assert result #>> '{claims,platform}' = 'mobile',
    'expected claims.platform=mobile, got: ' || coalesce(result #>> '{claims,platform}', '<null>');

  -- 2. web is lifted
  event := '{"claims":{"sub":"u-2","user_metadata":{"platform":"web"}}}'::jsonb;
  result := public.custom_access_token_hook(event);
  assert result #>> '{claims,platform}' = 'web', 'expected claims.platform=web';

  -- 3. absent -> no platform claim, no crash (fail-open)
  event := '{"claims":{"sub":"u-3","user_metadata":{}}}'::jsonb;
  result := public.custom_access_token_hook(event);
  assert result #>> '{claims,platform}' is null, 'expected NO platform claim when absent';

  -- 4. unrecognized value is NOT lifted
  event := '{"claims":{"sub":"u-4","user_metadata":{"platform":"evil"}}}'::jsonb;
  result := public.custom_access_token_hook(event);
  assert result #>> '{claims,platform}' is null, 'unrecognized platform must NOT be lifted';

  -- 5. existing claims preserved
  event := '{"claims":{"sub":"u-5","user_metadata":{"platform":"mobile"}}}'::jsonb;
  result := public.custom_access_token_hook(event);
  assert result #>> '{claims,sub}' = 'u-5', 'existing sub claim must be preserved';

  raise notice 'custom_access_token_hook: ALL ASSERTIONS PASSED';
end;
$$;
