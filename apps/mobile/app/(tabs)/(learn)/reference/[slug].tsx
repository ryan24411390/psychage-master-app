import { useLocalSearchParams } from 'expo-router';

import { ConditionDetailView } from '@/features/conditions-reference/ConditionDetailView';

// Condition detail route — pushed over the tabs. Thin wrapper, keyed by the condition
// slug. An unknown / gated-off slug renders a safe "not found" state.
export default function ConditionReferenceDetailRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <ConditionDetailView slug={typeof slug === 'string' ? slug : ''} />;
}
