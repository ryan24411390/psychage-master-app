import { describe, expect, it, vi } from 'vitest';

import {
  type SupabaseAuthStorage,
  secureStoreStorage,
} from '@/lib/supabase/secure-store-storage';
import { createSupabaseAuthService } from '@/features/auth/supabase-auth-service';

// Minimal fake of the supabase-js surface the service touches. We record calls so
// we can assert the platform claim source, generic error mapping, and audit emission
// WITHOUT a real backend.
function makeFakeClient(overrides: {
  signUp?: unknown;
  signIn?: unknown;
  signOut?: unknown;
  getSession?: unknown;
  resend?: unknown;
} = {}) {
  const calls = {
    signUp: vi.fn(
      async (_args: unknown) => overrides.signUp ?? { data: { session: {}, user: {} }, error: null },
    ),
    signInWithPassword: vi.fn(
      async (_args: unknown) => overrides.signIn ?? { data: { session: {}, user: {} }, error: null },
    ),
    signOut: vi.fn(async () => overrides.signOut ?? { error: null }),
    getSession: vi.fn(
      async () => overrides.getSession ?? { data: { session: null }, error: null },
    ),
    resend: vi.fn(async (_args: unknown) => overrides.resend ?? { error: null }),
  };
  const rpc = vi.fn(async () => ({ data: null, error: null }));
  // biome-ignore lint/suspicious/noExplicitAny: narrow fake, not the full client type.
  const client = { auth: calls, rpc } as any;
  return { client, calls, rpc };
}

describe('supabase auth service — platform claim', () => {
  it('signUp carries platform=mobile in options.data (the JWT claim source)', async () => {
    const { client, calls } = makeFakeClient();
    const svc = createSupabaseAuthService({ client, deviceId: 'dev-1' });

    await svc.signUp('a@b.co', 'password123');

    expect(calls.signUp).toHaveBeenCalledTimes(1);
    const arg = calls.signUp.mock.calls[0]?.[0] as { options?: { data?: { platform?: string } } };
    expect(arg.options?.data?.platform).toBe('mobile');
  });
});

describe('supabase auth service — audit emission (checklist #5)', () => {
  it('records sign_up via record_auth_event RPC on success', async () => {
    const { client, rpc } = makeFakeClient();
    const svc = createSupabaseAuthService({ client, deviceId: 'dev-1' });

    await svc.signUp('a@b.co', 'password123');

    expect(rpc).toHaveBeenCalledWith('record_auth_event', {
      p_event_type: 'sign_up',
      p_device_id: 'dev-1',
      p_success: true,
    });
  });

  it('records sign_in on success', async () => {
    const { client, rpc } = makeFakeClient();
    const svc = createSupabaseAuthService({ client, deviceId: 'dev-1' });

    await svc.signIn('a@b.co', 'password123');

    expect(rpc).toHaveBeenCalledWith(
      'record_auth_event',
      expect.objectContaining({ p_event_type: 'sign_in', p_success: true }),
    );
  });

  it('a failed audit write never breaks the auth result', async () => {
    const { client, rpc } = makeFakeClient();
    rpc.mockRejectedValueOnce(new Error('rpc down'));
    const svc = createSupabaseAuthService({ client, deviceId: 'dev-1' });

    const result = await svc.signIn('a@b.co', 'password123');

    expect(result.ok).toBe(true);
  });
});

describe('supabase auth service — generic errors (checklist #3, no existence leak)', () => {
  it('signIn maps any auth error to invalid-credentials (no message leak)', async () => {
    const { client } = makeFakeClient({
      signIn: { data: { session: null, user: null }, error: { message: 'Invalid login credentials' } },
    });
    const svc = createSupabaseAuthService({ client, deviceId: 'dev-1' });

    const result = await svc.signIn('a@b.co', 'wrong');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('invalid-credentials');
    // No raw message surfaces — only the generic union code.
    expect(Object.values(result)).not.toContain('Invalid login credentials');
  });

  it('signUp never reveals "already registered" — collapses to invalid-credentials', async () => {
    const { client } = makeFakeClient({
      signUp: { data: { session: null, user: null }, error: { message: 'User already registered' } },
    });
    const svc = createSupabaseAuthService({ client, deviceId: 'dev-1' });

    const result = await svc.signUp('taken@b.co', 'password123');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('invalid-credentials');
  });

  it('network failures map to offline', async () => {
    const { client } = makeFakeClient({
      signIn: { data: { session: null, user: null }, error: { name: 'AuthRetryableFetchError', message: 'fetch failed' } },
    });
    const svc = createSupabaseAuthService({ client, deviceId: 'dev-1' });

    const result = await svc.signIn('a@b.co', 'password123');

    expect(result.error).toBe('offline');
  });
});

describe('secure-store session storage (checklist #4)', () => {
  it('satisfies the async getItem/setItem/removeItem contract', async () => {
    const store: SupabaseAuthStorage = secureStoreStorage;
    await store.setItem('k', 'v');
    expect(await store.getItem('k')).toBe('v');
    await store.removeItem('k');
    expect(await store.getItem('k')).toBeNull();
  });
});
