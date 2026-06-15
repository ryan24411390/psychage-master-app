// Server-state hooks for the directory (TanStack Query — stack rule: server data
// never lives in useState). The directory is filter-first: the paginated search
// query only runs once the user has set at least one filter / text / geo (the
// RPC times out on a wholly-unscoped scan of the 423k-row table), and the default
// browse surface uses a small featured slice.

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { getFeaturedProviders, getSpecialties, searchProviders } from './queries';
import type { ProviderCardData, ProviderSearchParams } from './types';

/** True when the user has narrowed the directory in any way. */
export function hasActiveSearch(p: ProviderSearchParams): boolean {
  return Boolean(
    (p.query && p.query.trim().length > 0) ||
      p.state ||
      p.city ||
      p.specialty_slugs?.length ||
      p.telehealth ||
      p.in_person ||
      p.accepting_patients ||
      p.latitude != null,
  );
}

export function useProviderSearch(params: ProviderSearchParams, enabled: boolean) {
  const query = useInfiniteQuery({
    queryKey: ['providers', 'search', params],
    enabled,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => searchProviders({ ...params, page: pageParam as number }),
    getNextPageParam: (last) => (last.has_more ? last.page + 1 : undefined),
    staleTime: 60_000,
  });

  const providers: ProviderCardData[] = query.data?.pages.flatMap((p) => p.providers) ?? [];
  const total = query.data?.pages[0]?.total_count ?? 0;
  const dropped = query.data?.pages[0]?.dropped_filters;
  return { ...query, providers, total, dropped };
}

export function useFeaturedProviders(enabled: boolean) {
  return useQuery({
    queryKey: ['providers', 'featured'],
    enabled,
    queryFn: () => getFeaturedProviders(12),
    staleTime: 5 * 60_000,
  });
}

export function useSpecialties() {
  return useQuery({
    queryKey: ['providers', 'specialties'],
    queryFn: () => getSpecialties(),
    staleTime: 30 * 60_000,
  });
}
