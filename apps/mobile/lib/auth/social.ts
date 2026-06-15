// Native provider-credential acquisition for social sign-in (rules/auth.md §3).
//
// This module owns the OS-level halves of Apple + Google sign-in and hands the
// resulting id-token back to the auth service, which exchanges it with Supabase
// (`auth.signInWithIdToken`). It is loaded LAZILY by supabase-auth-service (dynamic
// import) so its native modules (expo-apple-authentication / expo-auth-session)
// never enter the Vitest graph — tests inject a fake `getProviderCredential`.
//
// SECURITY:
//   • Apple: a random nonce is generated; its SHA-256 is sent to Apple, the RAW
//     nonce goes to Supabase, which re-hashes and compares — binds the token to
//     this request (replay protection).
//   • Google: the raw nonce is sent and echoed inside the id-token; Supabase compares.
//
// OPS DEPENDENCY (docs/AUTH-OPS-RUNBOOK.md): Apple needs the Service ID + the
// Supabase Apple provider; Google needs an iOS OAuth client id in
// EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID + the Supabase Google provider. Without these
// the exchange fails (handled as a generic error, never a crash).

import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';

import type { SocialProvider } from '@/features/auth/auth-service';
import { AUTH_SCHEME } from '@/lib/auth/redirects';

export type ProviderCredential =
  | { readonly cancelled: true }
  | { readonly provider: SocialProvider; readonly idToken: string; readonly nonce: string };

const GOOGLE_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
};

async function sha256(value: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
}

async function getAppleCredential(): Promise<ProviderCredential> {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await sha256(rawNonce);
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
    if (!credential.identityToken) return { cancelled: true };
    return { provider: 'apple', idToken: credential.identityToken, nonce: rawNonce };
  } catch (error) {
    // The user dismissing the sheet throws ERR_REQUEST_CANCELED — treat as cancel,
    // not an error toast. Anything else re-throws to the service's catch.
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ERR_REQUEST_CANCELED') {
      return { cancelled: true };
    }
    throw error;
  }
}

async function getGoogleCredential(): Promise<ProviderCredential> {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  if (!clientId) throw new Error('Google OAuth client id not configured');

  const rawNonce = Crypto.randomUUID();
  const redirectUri = AuthSession.makeRedirectUri({ scheme: AUTH_SCHEME });

  const request = new AuthSession.AuthRequest({
    clientId,
    scopes: ['openid', 'email', 'profile'],
    redirectUri,
    responseType: AuthSession.ResponseType.IdToken,
    extraParams: { nonce: rawNonce },
  });

  const result = await request.promptAsync(GOOGLE_DISCOVERY);
  if (result.type !== 'success') return { cancelled: true };
  const idToken = result.params.id_token;
  if (!idToken) return { cancelled: true };
  return { provider: 'google', idToken, nonce: rawNonce };
}

/** Drive the OS sheet for the given provider and return its id-token (or cancel). */
export function getProviderCredential(provider: SocialProvider): Promise<ProviderCredential> {
  return provider === 'apple' ? getAppleCredential() : getGoogleCredential();
}
