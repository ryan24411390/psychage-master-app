/**
 * Bookmarks React Query hooks (design.md §State management).
 *
 * Server state only (frozen stack: TanStack Query for server data). Optimistic
 * toggle with revert on error; invalidate on settle. Fires count-only analytics.
 * This is the app's first useMutation — sets the optimistic pattern.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { trackBookmarkAdded, trackBookmarkRemoved } from './analytics';
import {
  addBookmark,
  bookmarkedIdsForType,
  currentUserId,
  listUserBookmarks,
  removeBookmark,
} from './service';
import type { BookmarkRef, ResourceType } from './types';

/** Pure optimistic transform — exported for unit testing the add/remove/revert math. */
export function toggleIds(prev: ReadonlySet<string>, resourceId: string, wasSaved: boolean): Set<string> {
  const next = new Set(prev);
  if (wasSaved) next.delete(resourceId);
  else next.add(resourceId);
  return next;
}

/** Current Supabase user id (null when signed out). Drives the per-user query keys. */
export function useCurrentUserId() {
  return useQuery({ queryKey: ['auth', 'uid'], queryFn: () => currentUserId(), staleTime: 5 * 60_000 });
}

/** Q-1: the signed-in user's full bookmark list, newest-first. */
export function useBookmarks() {
  const { data: userId } = useCurrentUserId();
  return useQuery({
    queryKey: ['bookmarks', userId],
    queryFn: () => listUserBookmarks(),
    enabled: Boolean(userId),
  });
}

/** Q-2: saved-id set for one type — hydrates a detail-screen SaveButton. */
export function useBookmarkedIds(resourceType: ResourceType) {
  const { data: userId } = useCurrentUserId();
  return useQuery({
    queryKey: ['bookmarks', userId, resourceType],
    queryFn: () => bookmarkedIdsForType(resourceType),
    enabled: Boolean(userId),
  });
}

interface ToggleVars {
  readonly ref: BookmarkRef;
  /** Saved state BEFORE the tap — true ⇒ this toggle removes. */
  readonly wasSaved: boolean;
}

interface ToggleContext {
  readonly idsKey: readonly unknown[];
  readonly prevIds: Set<string> | undefined;
}

/**
 * Toggle a bookmark with optimistic UI. onMutate flips the cached id-set,
 * onError reverts it, onSettled invalidates the per-user keys (prefix match
 * also refreshes the full list). Analytics are count-only (SR-4).
 */
export function useToggleBookmark() {
  const qc = useQueryClient();
  const { data: userId } = useCurrentUserId();

  return useMutation<void, unknown, ToggleVars, ToggleContext>({
    mutationFn: async ({ ref, wasSaved }) => {
      if (wasSaved) await removeBookmark(ref);
      else await addBookmark(ref);
    },
    onMutate: async ({ ref, wasSaved }) => {
      const idsKey = ['bookmarks', userId, ref.resource_type] as const;
      await qc.cancelQueries({ queryKey: idsKey });
      const prevIds = qc.getQueryData<Set<string>>(idsKey);
      if (prevIds) qc.setQueryData(idsKey, toggleIds(prevIds, ref.resource_id, wasSaved));
      return { idsKey, prevIds };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevIds !== undefined) qc.setQueryData(ctx.idsKey, ctx.prevIds);
    },
    onSuccess: (_data, { wasSaved }) => {
      if (wasSaved) trackBookmarkRemoved();
      else trackBookmarkAdded();
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['bookmarks', userId] });
    },
  });
}
