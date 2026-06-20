// Server-state hooks for the Conditions reference (TanStack Query — stack rule:
// server data never lives in useState). Read-only; keyed by the preview flag so the
// public and review surfaces never share a cache entry.

import { useQuery } from '@tanstack/react-query';

import { CONDITIONS_PREVIEW } from './flag';
import { getConditionBySlug, listConditions } from './queries';

/** Every condition for the A–Z index, gated + sorted by name. */
export function useConditions() {
  return useQuery({
    queryKey: ['conditions-reference', 'list', { preview: CONDITIONS_PREVIEW }],
    queryFn: () => listConditions(),
    staleTime: 30 * 60_000,
  });
}

/** A single condition by slug for the detail screen. */
export function useCondition(slug: string) {
  return useQuery({
    queryKey: ['conditions-reference', 'detail', slug, { preview: CONDITIONS_PREVIEW }],
    enabled: slug.length > 0,
    queryFn: () => getConditionBySlug(slug),
    staleTime: 30 * 60_000,
  });
}
