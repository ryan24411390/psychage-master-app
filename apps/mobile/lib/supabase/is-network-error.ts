// Shared predicate: did a @supabase/supabase-js call fail because of the network
// (offline / transient) rather than a real server-side rejection? Extracted so the
// auth service and the account-deletion cascade classify failures identically —
// an offline failure is recoverable (retry later), a non-network one is not.
//
// supabase-js network failures surface as AuthRetryableFetchError / fetch TypeErrors.
export function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const name = 'name' in error ? String((error as { name: unknown }).name) : '';
  const message = 'message' in error ? String((error as { message: unknown }).message) : '';
  return name === 'AuthRetryableFetchError' || /network|fetch|connection/i.test(message);
}
