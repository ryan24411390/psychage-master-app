// Server-state hooks for Learn (TanStack Query — stack rule: server data never
// lives in useState). The hub reads its categories live from the DB taxonomy;
// each category's article list paginates on scroll. Both swallow errors at the
// repo layer and surface empty, so screens fall back gracefully (never block).

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import {
  type ArticleListItem,
  CATEGORY_PAGE_SIZE,
  listArticlesByCategorySlug,
  listBrowseCategories,
} from '@/lib/articles';

/** The browse taxonomy — all DB-populated categories with live counts and
 * group labels, never hardcoded to the reviewed-taxonomy constant. */
export function useLearnCategories() {
  return useQuery({
    queryKey: ['learn', 'categories'],
    queryFn: () => listBrowseCategories(),
    // Taxonomy changes rarely; keep it fresh for the whole session.
    staleTime: 30 * 60_000,
  });
}

/** One category's published articles, paginated (0-based pages). A short last
 * page (< CATEGORY_PAGE_SIZE) signals the end. Returns the flattened list. */
export function useCategoryArticles(slug: string) {
  const query = useInfiniteQuery({
    queryKey: ['articles', 'category', slug],
    enabled: slug.length > 0,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => listArticlesByCategorySlug(slug, pageParam as number),
    getNextPageParam: (last: ArticleListItem[], pages) =>
      last.length === CATEGORY_PAGE_SIZE ? pages.length : undefined,
    staleTime: 5 * 60_000,
  });

  const articles: ArticleListItem[] = query.data?.pages.flat() ?? [];
  return { ...query, articles };
}
