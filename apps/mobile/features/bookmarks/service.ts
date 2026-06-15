/**
 * Bookmarks data-access layer (Q-1, Q-2, M-1, M-2 — see design.md §API contracts).
 *
 * Uses the session-bearing auth client (`lib/supabase/client.ts`); RLS enforces
 * `auth.uid() = user_id`, so reads need no explicit user filter and writes derive
 * `user_id` from the live session (the app's AuthSession carries no id — only the
 * Supabase session does). `packages/api` not yet created (CLAUDE.md §2).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAuthClient } from '@/lib/supabase/client';
import type { Bookmark, BookmarkRef, ResourceType } from './types';

/** DI seam: tests inject a fake client; production binds the auth singleton. */
export interface BookmarkDeps {
  readonly client: SupabaseClient;
}

function defaultDeps(): BookmarkDeps {
  return { client: getSupabaseAuthClient() };
}

/** Resolve the current Supabase user id, or null when signed out. */
export async function currentUserId(deps: BookmarkDeps = defaultDeps()): Promise<string | null> {
  const { data, error } = await deps.client.auth.getUser();
  if (error || !data?.user) return null;
  return data.user.id;
}

/** Q-1: all of the current user's bookmarks, newest first. */
export async function listUserBookmarks(deps: BookmarkDeps = defaultDeps()): Promise<Bookmark[]> {
  const { data, error } = await deps.client
    .from('bookmarks')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Bookmark[];
}

/** Q-2: the set of saved resource ids for one type (detail-screen toggle hydration). */
export async function bookmarkedIdsForType(
  resourceType: ResourceType,
  deps: BookmarkDeps = defaultDeps(),
): Promise<Set<string>> {
  const { data, error } = await deps.client
    .from('bookmarks')
    .select('resource_id')
    .eq('resource_type', resourceType);
  if (error) throw error;
  return new Set((data ?? []).map((row: { resource_id: string }) => row.resource_id));
}

/**
 * M-1: idempotent insert. Upsert with `ignoreDuplicates` so a duplicate save is a
 * no-op (the UNIQUE(user_id,resource_type,resource_id) constraint backs this — EC-3).
 */
export async function addBookmark(ref: BookmarkRef, deps: BookmarkDeps = defaultDeps()): Promise<void> {
  const userId = await currentUserId(deps);
  if (!userId) throw new Error('not-authenticated');
  const { error } = await deps.client.from('bookmarks').upsert(
    { user_id: userId, resource_type: ref.resource_type, resource_id: ref.resource_id },
    { onConflict: 'user_id,resource_type,resource_id', ignoreDuplicates: true },
  );
  if (error) throw error;
}

/** M-2: delete the matching row. Deleting a missing row is a no-op (EC-2/EC-3). */
export async function removeBookmark(ref: BookmarkRef, deps: BookmarkDeps = defaultDeps()): Promise<void> {
  const userId = await currentUserId(deps);
  if (!userId) throw new Error('not-authenticated');
  const { error } = await deps.client.from('bookmarks').delete().match({
    user_id: userId,
    resource_type: ref.resource_type,
    resource_id: ref.resource_id,
  });
  if (error) throw error;
}
