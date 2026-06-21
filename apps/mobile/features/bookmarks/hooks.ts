/**
 * Bookmarks hooks — local-first (P13).
 *
 * Backed by the on-device store (`./store`) via useSyncExternalStore, NOT the
 * server (frozen stack reserves TanStack Query for SERVER data — bookmarks are now
 * local). The exported API is unchanged so every consumer (the article reader,
 * Learn save buttons + "Saved to read" rail, the provider directory star, the
 * /saved list) keeps working — and now works fully signed-out.
 */

import { useMemo, useSyncExternalStore } from 'react';
import { trackBookmarkAdded, trackBookmarkRemoved } from './analytics';
import {
  bookmarkKey,
  getBookmarksSnapshot,
  removeBookmark,
  saveBookmark,
  type StoredBookmark,
  subscribeBookmarks,
} from './store';
import type { Bookmark, BookmarkRef, ResourceType } from './types';

/** Local-first: there is no auth wall, so a stable non-null id always "signs in". */
const LOCAL_USER = 'local';

/** Pure optimistic transform — kept as a tiny, unit-testable add/remove helper. */
export function toggleIds(prev: ReadonlySet<string>, resourceId: string, wasSaved: boolean): Set<string> {
  const next = new Set(prev);
  if (wasSaved) next.delete(resourceId);
  else next.add(resourceId);
  return next;
}

/** Map a stored row → the public Bookmark shape consumers already read. */
function toBookmark(s: StoredBookmark): Bookmark {
  return {
    id: bookmarkKey(s),
    user_id: LOCAL_USER,
    resource_type: s.resource_type,
    resource_id: s.resource_id,
    created_at: s.savedAt,
  };
}

/** Reactive read of the raw stored items (stable snapshot ref between mutations). */
function useStoredBookmarks(): readonly StoredBookmark[] {
  return useSyncExternalStore(subscribeBookmarks, getBookmarksSnapshot).items;
}

/**
 * Always non-null in local-first mode (`'local'`). Kept so existing consumers —
 * which gate saved surfaces on a truthy id — render signed-out without changes.
 */
export function useCurrentUserId(): { data: string | null } {
  return { data: LOCAL_USER };
}

/** Q-1: the full saved list, newest-first. */
export function useBookmarks(): { data: Bookmark[]; isLoading: boolean; isError: boolean } {
  const items = useStoredBookmarks();
  const data = useMemo(() => items.map(toBookmark), [items]);
  return { data, isLoading: false, isError: false };
}

/** Q-2: the saved-id set for one type — hydrates a detail-screen SaveButton. */
export function useBookmarkedIds(
  resourceType: ResourceType,
): { data: Set<string>; isLoading: boolean; isError: boolean } {
  const items = useStoredBookmarks();
  const data = useMemo(
    () => new Set(items.filter((b) => b.resource_type === resourceType).map((b) => b.resource_id)),
    [items, resourceType],
  );
  return { data, isLoading: false, isError: false };
}

interface ToggleVars {
  readonly ref: BookmarkRef;
  /** Saved state BEFORE the tap — true ⇒ this toggle removes. */
  readonly wasSaved: boolean;
}

/**
 * Toggle a bookmark. The local write is synchronous + reactive (the store
 * notifies subscribers), so there's no optimistic/revert dance. Analytics stay
 * count-only (SR-4). Returns a `mutate` to keep the call sites unchanged.
 */
export function useToggleBookmark(): { mutate: (vars: ToggleVars) => void } {
  return {
    mutate: ({ ref, wasSaved }: ToggleVars) => {
      if (wasSaved) {
        removeBookmark(ref);
        trackBookmarkRemoved();
      } else {
        saveBookmark(ref);
        trackBookmarkAdded();
      }
    },
  };
}
