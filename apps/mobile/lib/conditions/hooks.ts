// Server-state hooks for the conditions reference (TanStack Query — stack rule:
// server data never lives in useState). All read live from the shared DB; the repo
// swallows errors and returns empty/null, so screens fall back gracefully.

import { useQuery } from '@tanstack/react-query';

import { getConditionReference, listArticlesForCondition, listConditionsReference } from './repo';

/** Every verified condition, grouped into families by the consumer. Taxonomy
 * changes rarely — keep it fresh for the session. */
export function useConditionsReference() {
  return useQuery({
    queryKey: ['conditions', 'reference'],
    queryFn: () => listConditionsReference(),
    staleTime: 30 * 60_000,
  });
}

/** One condition's reviewed definition (guide screen). */
export function useConditionGuide(slug: string) {
  return useQuery({
    queryKey: ['conditions', 'guide', slug],
    enabled: slug.length > 0,
    queryFn: () => getConditionReference(slug),
    staleTime: 30 * 60_000,
  });
}

/** Articles linked to a condition (guide "related" rail). Disabled until the id
 * resolves from the guide query. */
export function useConditionArticles(conditionId: string | undefined) {
  return useQuery({
    queryKey: ['conditions', 'articles', conditionId ?? ''],
    enabled: Boolean(conditionId),
    queryFn: () => listArticlesForCondition(conditionId ?? ''),
    staleTime: 5 * 60_000,
  });
}
