// Auth deep-link redirect targets (rules/auth.md §3 — verification link + password
// reset via the standard Supabase flow). Plain strings, NOT built via expo-linking,
// so this module stays free of native imports and is safe to pull into the auth
// service (which runs under Vitest). The scheme matches app.json `scheme: "psychage"`.
//
// OPS DEPENDENCY: these exact URLs must be registered in the Supabase dashboard
// under Authentication → URL Configuration → Redirect URLs, or the emailed links
// will be rejected. See docs/AUTH-OPS-RUNBOOK.md.

export const AUTH_SCHEME = 'psychage' as const;

/** Route path the recovery deep-link resolves to (sets a PASSWORD_RECOVERY session). */
export const RESET_PASSWORD_PATH = '/reset-password' as const;
/** Route path the email-confirmation deep-link resolves to. */
export const VERIFY_SUCCESS_PATH = '/verify-success' as const;

/** `supabase.auth.resetPasswordForEmail(..., { redirectTo })` target. */
export const PASSWORD_RESET_REDIRECT = `${AUTH_SCHEME}:/${RESET_PASSWORD_PATH}` as const;
/** `supabase.auth.signUp(..., { emailRedirectTo })` target. */
export const EMAIL_VERIFY_REDIRECT = `${AUTH_SCHEME}:/${VERIFY_SUCCESS_PATH}` as const;
