import { useLocalSearchParams } from 'expo-router';

import { CategoryArticlesView } from '@/features/learn/CategoryArticlesView';

// Category article list — pushed over the tabs. Thin wrapper → CategoryArticlesView,
// keyed by a real `article_categories.slug` from the live taxonomy. The category
// `name` rides along as a route param so the header shows it without a refetch.
export default function LearnCategoryRoute() {
  const { category, name } = useLocalSearchParams<{ category: string; name?: string }>();
  return (
    <CategoryArticlesView
      slug={typeof category === 'string' ? category : ''}
      name={typeof name === 'string' ? name : undefined}
    />
  );
}
