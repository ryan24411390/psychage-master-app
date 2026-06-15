# Auth Ops Runbook — psychage-mobile

Operational steps that **cannot be done from app code** and must be applied in the Supabase
dashboard / provider consoles before the auth-experience features work end-to-end. Code is
shipped and correct; these are the external dependencies it relies on.

> Project ref: `ozourhqyqtpppvpbhphw` (shared with web — coordinate changes).

## 1. SMTP (BLOCKER for email verification + password reset)

Live confirm-email is ON but no working SMTP is configured, so verification and reset emails
do not actually deliver (known blocker — see memory `auth-live-confirm-email-blocker`).

- Authentication → Providers → Email → enable a real SMTP sender (custom SMTP or a provider
  like Resend/Postmark/SES). Until then, test with the local Inbucket (`supabase start` →
  http://localhost:54324) which captures outbound mail.

## 2. Redirect URLs (BLOCKER for deep links)

Authentication → URL Configuration → Redirect URLs — add:

```
psychage://reset-password
psychage://verify-success
```

These match `apps/mobile/lib/auth/redirects.ts`. Without them Supabase rejects the
`redirectTo` / `emailRedirectTo` and the emailed links won't return to the app.
(The `psychage://` scheme is already declared in `app.json`.)

## 3. Email templates

Authentication → Email Templates — ensure the **Reset Password** and **Confirm signup**
templates point at the redirect URLs above (default `{{ .ConfirmationURL }}` works once the
redirect URLs are allow-listed). The app's deep-link handler
(`apps/mobile/lib/auth/deep-link.ts`) accepts BOTH the PKCE `?code=` and implicit
`#access_token=` shapes, so either template style is fine.

## 4. Sign in with Apple

- Apple Developer → Identifiers → create/confirm the **App ID** `com.psychage.app` with
  "Sign in with Apple" capability, plus a **Services ID** + key for the web/Supabase callback.
- Supabase → Authentication → Providers → **Apple**: enable, fill the Services ID, Team ID,
  Key ID, and private key.
- Native build: `expo-apple-authentication` requires the entitlement — run a fresh dev-client
  build (`expo prebuild` / `expo run:ios`), it adds the entitlement via the config plugin.
- Store compliance: swap the plain "Continue with Apple" button in
  `components/auth/SocialAuthButtons.tsx` for the native `AppleAuthenticationButton` (guarded
  by `Platform.OS === 'ios'`) before submission (Apple HIG).

## 5. Sign in with Google

- Google Cloud Console → create an **OAuth client ID** (iOS) for `com.psychage.app`, plus a
  Web client ID (Supabase needs the web client for token verification).
- Set `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` in `apps/mobile/.env` (and EAS env for builds).
  `lib/auth/social.ts` reads it; absent → Google sign-in throws a handled generic error.
- Supabase → Authentication → Providers → **Google**: enable, add the Web client ID + secret.

## 6. JWT / platform claim (already live — do not change)

The `custom_access_token_hook` (migration `20260614000007`) and the platform-gated RLS
policies are applied. Social sign-ups do NOT carry `platform: 'mobile'` in `user_metadata`
the way email sign-up does, so a social account's first write would fail the
`auth.jwt() ->> 'platform' = 'mobile'` write check. **Follow-up:** decide whether to stamp the
platform claim for social users (e.g. via the access-token hook reading app metadata) before
enabling personal-data writes for social accounts. Tracked, not blocking sign-in itself.

## 7. Verification checklist (local, with Inbucket)

1. `supabase start`, point `.env` at local, set redirect URLs in local `config.toml`.
2. Sign up → confirmation mail in Inbucket → tap link → app opens `verify-success`.
3. Forgot password → reset mail → tap link → app opens `reset-password?status=ready` →
   set new password → `sign-in`.
4. Apple/Google require real provider config (sections 4–5) — not testable against Inbucket.
