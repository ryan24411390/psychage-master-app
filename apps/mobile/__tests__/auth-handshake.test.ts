import { describe, expect, it } from 'vitest';

import {
  AUTH_SIGN_IN_ROUTE,
  WvtUnavailableError,
  stubWvtIssuer,
} from '@/features/webview/auth-handshake';

describe('WebView auth handshake (B2 stub)', () => {
  it('the stub issuer throws WvtUnavailableError — no network, no token returned', async () => {
    await expect(stubWvtIssuer.issue('library')).rejects.toBeInstanceOf(WvtUnavailableError);
  });

  it('the visible-failure path targets B1 sign-in (S34) at its real grouped URL', () => {
    // `(auth)` is an Expo Router group — not a URL segment — so the route is
    // `/sign-in`, not `/auth/sign-in`. The latter dead-ended on +not-found.
    expect(AUTH_SIGN_IN_ROUTE).toBe('/sign-in');
  });
});
