import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  addBookmark,
  bookmarkedIdsForType,
  currentUserId,
  listUserBookmarks,
  removeBookmark,
} from '@/features/bookmarks/service';

/**
 * Fake auth client honoring the chains the service uses:
 *   from(t).select(c).order(...)            (Q-1)
 *   from(t).select('resource_id').eq(...)   (Q-2)
 *   from(t).upsert(row, opts)               (M-1)
 *   from(t).delete().match(crit)            (M-2)
 *   auth.getUser()
 */
function makeClient(opts: {
  user?: { id: string } | null;
  rows?: Array<Record<string, unknown>>;
  error?: { message: string } | null;
  spies?: { upsert?: ReturnType<typeof vi.fn>; del?: ReturnType<typeof vi.fn>; match?: ReturnType<typeof vi.fn> };
}): SupabaseClient {
  const { user = { id: 'u-1' }, rows = [], error = null, spies = {} } = opts;
  const order = vi.fn(async () => ({ data: rows, error }));
  const eq = vi.fn(async () => ({ data: rows, error }));
  const select = vi.fn(() => ({ order, eq }));
  const match = spies.match ?? vi.fn(async () => ({ error }));
  const del = spies.del ?? vi.fn(() => ({ match }));
  const upsert = spies.upsert ?? vi.fn(async () => ({ error }));
  const from = vi.fn(() => ({ select, upsert, delete: del }));
  const getUser = vi.fn(async () => ({ data: { user }, error: null }));
  return { from, auth: { getUser } } as unknown as SupabaseClient;
}

describe('bookmarks service', () => {
  it('currentUserId returns the session user id, or null when signed out', async () => {
    expect(await currentUserId({ client: makeClient({ user: { id: 'u-9' } }) })).toBe('u-9');
    expect(await currentUserId({ client: makeClient({ user: null }) })).toBeNull();
  });

  it('listUserBookmarks returns rows newest-first (RLS-scoped, no user filter)', async () => {
    const rows = [{ id: 'b1', user_id: 'u-1', resource_type: 'article', resource_id: 'a', created_at: 't' }];
    const out = await listUserBookmarks({ client: makeClient({ rows }) });
    expect(out).toEqual(rows);
  });

  it('bookmarkedIdsForType returns a Set of resource ids', async () => {
    const rows = [{ resource_id: 'a' }, { resource_id: 'b' }];
    const ids = await bookmarkedIdsForType('article', { client: makeClient({ rows }) });
    expect(ids).toEqual(new Set(['a', 'b']));
  });

  it('addBookmark upserts with ignoreDuplicates (idempotent — EC-3)', async () => {
    const upsert = vi.fn(async () => ({ error: null }));
    await addBookmark({ resource_type: 'article', resource_id: 'a' }, { client: makeClient({ spies: { upsert } }) });
    expect(upsert).toHaveBeenCalledWith(
      { user_id: 'u-1', resource_type: 'article', resource_id: 'a' },
      { onConflict: 'user_id,resource_type,resource_id', ignoreDuplicates: true },
    );
  });

  it('addBookmark throws when signed out', async () => {
    await expect(
      addBookmark({ resource_type: 'tool', resource_id: 'clarity' }, { client: makeClient({ user: null }) }),
    ).rejects.toThrow('not-authenticated');
  });

  it('removeBookmark deletes the matching row (delete-missing is a no-op)', async () => {
    const match = vi.fn(async () => ({ error: null }));
    const del = vi.fn(() => ({ match }));
    await removeBookmark(
      { resource_type: 'provider', resource_id: 'p-1' },
      { client: makeClient({ spies: { del, match } }) },
    );
    expect(match).toHaveBeenCalledWith({ user_id: 'u-1', resource_type: 'provider', resource_id: 'p-1' });
  });

  it('listUserBookmarks surfaces server errors', async () => {
    await expect(
      listUserBookmarks({ client: makeClient({ error: { message: 'boom' } }) }),
    ).rejects.toEqual({ message: 'boom' });
  });
});
