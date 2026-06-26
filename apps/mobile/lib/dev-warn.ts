// Dev-only visibility for silently-swallowed backend failures.
//
// The data repos and the best-effort sync paths return a safe empty/null (offline-
// first posture) on a query error. That's correct for users, but it ALSO hides
// genuine drift — a table dropped from the shared DB, a tightened RLS policy, a
// renamed column — behind an innocent "no content" state. This surfaces such errors
// in the DEV runtime only so they're caught before release.
//
// Gating: `process.env.NODE_ENV === 'development'` (Metro-inlined). Silent in
// production AND in the test runner (NODE_ENV==='test'), so it adds no test noise and
// never crashes where a `__DEV__` global isn't defined.
//
// SR-11 (no PII leaves the device unsanitized): callers pass ONLY a scope label and
// the backend error. PostgREST/Supabase error messages describe schema / constraints
// / RLS — never the inserted or queried row values — so no user content is logged.
export function devWarnSilentFailure(
  scope: string,
  error: { message?: string } | null | undefined,
): void {
  if (!error) return;
  if (process.env.NODE_ENV !== 'development') return;
  console.warn(`[${scope}] backend query failed — showing fallback: ${error.message ?? 'unknown error'}`);
}
