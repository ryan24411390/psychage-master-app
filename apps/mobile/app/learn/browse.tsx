import { BrowseView } from '@/features/learn/BrowseView';

// Learn browse — pushed over the tabs. Static segment, so it resolves before the
// dynamic [category] route. Thin wrapper → BrowseView (hierarchical drill-down).
export default function LearnBrowseRoute() {
  return <BrowseView />;
}
