import { useSyncExternalStore } from 'react';

import {
  getRecentlyViewedSnapshot,
  type RecentProvider,
  recordRecentlyViewed,
  subscribeRecentlyViewed,
} from '@/lib/persistence/recently-viewed';

// Reactive read of the recently-viewed providers rail. Recording on a detail
// screen re-renders the directory's rail on return without a navigation event.
export interface UseRecentlyViewed {
  items: readonly RecentProvider[];
  record: (next: RecentProvider) => void;
}

export function useRecentlyViewed(): UseRecentlyViewed {
  const snapshot = useSyncExternalStore(
    subscribeRecentlyViewed,
    getRecentlyViewedSnapshot,
    getRecentlyViewedSnapshot,
  );
  return { items: snapshot.items, record: recordRecentlyViewed };
}
