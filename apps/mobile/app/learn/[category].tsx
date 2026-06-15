import { useLocalSearchParams } from 'expo-router';

import { CategoryArticlesView } from '@/features/learn/CategoryArticlesView';

// Category article list — pushed over the tabs. Thin wrapper → CategoryArticlesView
// keyed by the curated topic id (anxiety | sleep | … | more).
export default function LearnCategoryRoute() {
  const { category } = useLocalSearchParams<{ category: string }>();
  return <CategoryArticlesView id={typeof category === 'string' ? category : ''} />;
}
