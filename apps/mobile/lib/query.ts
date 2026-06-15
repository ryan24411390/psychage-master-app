import { QueryClient } from '@tanstack/react-query';

// Single TanStack Query client for server state (the frozen stack mandates it for
// server data — no useState/useEffect fetching). Articles are public education
// reference data fetched live; the in-memory cache keeps re-visits instant within
// a session. No persistence — offline article reading is a deferred scope
// (CLAUDE.md §5, rules/offline.md not yet written).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min — education content changes slowly
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
