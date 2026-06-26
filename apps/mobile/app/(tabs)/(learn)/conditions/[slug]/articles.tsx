import { useLocalSearchParams } from 'expo-router';

import { ConditionArticlesView } from '@/features/conditions/ConditionArticlesView';

// `/conditions/[slug]/articles` — the "See all" target from a condition guide's
// related-articles preview. Lists the full condition↔article join.
export default function ConditionArticlesRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <ConditionArticlesView slug={typeof slug === 'string' ? slug : ''} />;
}
