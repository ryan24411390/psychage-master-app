import { SearchView } from '@/features/learn/SearchView';

// Learn search — pushed over the tabs. Static segment, so it resolves before the
// dynamic [category] route. Thin wrapper → SearchView.
export default function LearnSearchRoute() {
  return <SearchView />;
}
