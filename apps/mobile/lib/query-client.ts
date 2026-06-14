// The app's single TanStack Query client (stack rule: TanStack Query owns server
// state — never useState for fetched data). First consumer is the native provider
// directory (features/directory/queries.ts); more server-state surfaces will share
// this instance. Conservative defaults: one retry, no refetch-on-focus (a directory
// search shouldn't re-run every time the app foregrounds).

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});
