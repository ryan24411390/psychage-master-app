import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the shared anon client so the cascade is exercised without a network.
vi.mock('@/lib/supabase', () => ({ getSupabaseClient: vi.fn() }));

import { getProviderById, searchProviders } from '@/features/directory/queries';
import { getSupabaseClient } from '@/lib/supabase';

const clientMock = getSupabaseClient as unknown as ReturnType<typeof vi.fn>;

/** Minimal chainable PostgREST-builder stub that resolves to `result`. */
function builder(result: unknown) {
  const b: Record<string, unknown> = {};
  for (const m of ['select', 'in', 'order', 'limit', 'or', 'eq', 'ilike', 'not', 'maybeSingle']) {
    b[m] = () => b;
  }
  // biome-ignore lint/suspicious/noThenProperty: a PostgREST query builder is itself thenable (`await query`); this stub must mirror that so the cascade can await it.
  (b as { then: unknown }).then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
    Promise.resolve(result).then(res, rej);
  return b;
}

beforeEach(() => {
  clientMock.mockReset();
});

describe('searchProviders — fidelity + cascade', () => {
  it('returns an EMPTY result (never fabricates) when no client is configured', async () => {
    clientMock.mockReturnValue(null);
    const res = await searchProviders({ query: 'swanson' });
    expect(res.providers).toEqual([]);
    expect(res.total_count).toBe(0);
    expect(res.has_more).toBe(false);
  });

  it('refuses a wholly-unscoped call: returns EMPTY without hitting the RPC (no 423k-row scan)', async () => {
    const rpc = vi.fn();
    clientMock.mockReturnValue({ rpc });
    const res = await searchProviders({ page: 1, per_page: 20 });
    expect(res.providers).toEqual([]);
    expect(res.total_count).toBe(0);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('maps RPC rows and computes has_more from total_count', async () => {
    const rows = [
      { id: 'p1', display_name: 'BRIAN SWANSON', status: 'seeded', tier: 'free', specialty_tags: [], total_count: 40 },
      { id: 'p2', display_name: 'SHANA SWIMMER', status: 'seeded', tier: 'free', specialty_tags: [], total_count: 40 },
    ];
    clientMock.mockReturnValue({ rpc: vi.fn().mockResolvedValue({ data: rows, error: null }) });

    const res = await searchProviders({ state: 'CA', page: 1, per_page: 20 });
    expect(res.providers.map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(res.providers[0]?.display_name).toBe('BRIAN SWANSON');
    expect(res.total_count).toBe(40);
    expect(res.has_more).toBe(true); // 0 + 20 < 40
  });

  it('throws (so the query retries + surfaces isError) when both paths fail — never a silent empty', async () => {
    clientMock.mockReturnValue({
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'timeout' } }),
      // no state/city → skips the location pre-scope; the providers query errors too
      from: vi.fn(() => builder({ data: null, error: { message: 'boom' } })),
    });

    // A transient failure must NOT look like "0 results" — it rejects so TanStack
    // Query can retry it and the UI can show a recoverable error (NO mock fabrication).
    await expect(searchProviders({ query: 'swanson' })).rejects.toThrow();
  });

  it('returns a genuine empty (no throw) when the RPC succeeds with zero rows', async () => {
    clientMock.mockReturnValue({ rpc: vi.fn().mockResolvedValue({ data: [], error: null }) });
    const res = await searchProviders({ state: 'CA' });
    expect(res.providers).toEqual([]);
    expect(res.total_count).toBe(0);
  });
});

describe('getProviderById', () => {
  it('returns null (not a stub provider) when the client is absent', async () => {
    clientMock.mockReturnValue(null);
    expect(await getProviderById('p1')).toBeNull();
  });

  it('returns null on a genuine not-found, but throws on a query error', async () => {
    clientMock.mockReturnValue({ from: vi.fn(() => builder({ data: null, error: null })) });
    expect(await getProviderById('missing')).toBeNull();

    clientMock.mockReturnValue({ from: vi.fn(() => builder({ data: null, error: { message: 'boom' } })) });
    await expect(getProviderById('p1')).rejects.toThrow();
  });

  it('maps a found row into the detail shape', async () => {
    clientMock.mockReturnValue({
      from: vi.fn(() =>
        builder({
          data: {
            id: 'p1',
            display_name: 'BRIAN SWANSON',
            status: 'seeded',
            tier: 'free',
            provider_type: { id: 't1', slug: 'psychologist', label: 'Psychologist' },
            locations: [],
            specialties: [],
          },
          error: null,
        }),
      ),
    });
    const p = await getProviderById('p1');
    expect(p?.display_name).toBe('BRIAN SWANSON');
    expect(p?.provider_type?.label).toBe('Psychologist');
  });
});
