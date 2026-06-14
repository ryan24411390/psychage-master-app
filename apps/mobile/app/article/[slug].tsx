import { useLocalSearchParams } from 'expo-router';

import { ArticleReader } from '@/features/content/ArticleReader';

// S22 route — pushed over the tabs. Thin wrapper → ArticleReader keyed by slug.
export default function ArticleRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <ArticleReader slug={typeof slug === 'string' ? slug : ''} />;
}
