import { useLocalSearchParams } from 'expo-router';

import { ConditionDetailView } from '@/features/conditions/ConditionDetailView';

// Condition topic overview route — pushed over the tabs. Thin wrapper → keyed by
// the taxonomy slug. An unknown / non-condition slug renders a safe "not found".
export default function ConditionDetailRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <ConditionDetailView slug={typeof slug === 'string' ? slug : ''} />;
}
