import { getCategoryBySlug } from '@psychage/shared/peaf';
import { useLocalSearchParams } from 'expo-router';

import { ConditionDetailView } from '@/features/conditions/ConditionDetailView';
import { ConditionGuideView } from '@/features/conditions/ConditionGuideView';

// `/conditions/[slug]` serves two disjoint slug namespaces, branched here:
//   • a reviewed-taxonomy CATEGORY slug (e.g. `anxiety-stress`, reached from a
//     Topics card) → the category overview (ConditionDetailView).
//   • a `conditions_reference` ICD-11 condition slug (e.g. `panic-disorder`,
//     reached from the Conditions accordion) → the condition guide.
// Category slugs are a closed set in @psychage/shared/peaf, so the check is sync
// (no network probe); anything not a known category is a condition guide slug.
export default function ConditionRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const s = typeof slug === 'string' ? slug : '';
  return getCategoryBySlug(s) ? <ConditionDetailView slug={s} /> : <ConditionGuideView slug={s} />;
}
