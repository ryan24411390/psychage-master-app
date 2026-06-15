// Toolkits — server-state hooks (TanStack Query; stack rule: server data never
// lives in useState). Reads are cheap, public, and rarely change, so a 5-minute
// staleTime keeps the index/detail snappy without re-fetching on every focus.

import { useQuery } from '@tanstack/react-query';

import { getToolkit, listPublishedToolkits } from './queries';

const STALE = 5 * 60_000;

/** Published toolkits for the index grid. */
export function usePublishedToolkits() {
  return useQuery({
    queryKey: ['toolkits', 'published'],
    queryFn: () => listPublishedToolkits(),
    staleTime: STALE,
  });
}

/** One toolkit (with items) for the detail screen. Disabled until an id exists. */
export function useToolkit(id: string) {
  return useQuery({
    queryKey: ['toolkits', 'detail', id],
    enabled: Boolean(id),
    queryFn: () => getToolkit(id),
    staleTime: STALE,
  });
}
