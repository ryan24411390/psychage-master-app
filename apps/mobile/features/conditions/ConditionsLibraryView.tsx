import { router } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

import { GlobalHeader } from '@/components/GlobalHeader';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Text } from '@/components/ui/Text';
import { CONDITIONS_COPY } from '@/features/conditions/copy';
import { selectConditionCategories } from '@/features/conditions/select';
import { colors } from '@/lib/colors';

// Conditions library (list). A pushed route OUTSIDE the tabs, so it renders the
// GlobalHeader itself (carrying the Help-now pill — crisis reachable in ≤1 tap,
// SR-2) plus a native back row, matching the article reader's chrome. The topic
// set is derived from the reviewed taxonomy (≤~15 rows), so a plain ScrollView +
// map is used (no FlashList; the LEARN rail follows the same reasoning). Each row
// opens the topic overview (/conditions/[slug]). No symptom input, no likelihood
// — this is a browse surface, not a diagnostic flow (SR-3).
export function ConditionsLibraryView() {
  const t = CONDITIONS_COPY;
  const categories = selectConditionCategories();

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <GlobalHeader />
      <View className="flex-row items-center px-2">
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={t.back}
          onPress={() => router.back()}
          hitSlop={8}
          testID="conditions-back"
          className="min-h-[44px] flex-row items-center gap-1 px-2"
        >
          <ChevronLeft size={20} color={colors.charcoal[600]} strokeWidth={2} />
          <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
            {t.back}
          </Text>
        </AnimatedPressable>
      </View>

      <ScrollView contentContainerClassName="gap-3 px-5 pb-12" showsVerticalScrollIndicator={false}>
        <Text variant="headingLg">{t.title}</Text>
        <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
          {t.intro}
        </Text>

        {categories.map((cat) => (
          <AnimatedPressable
            key={cat.slug}
            accessibilityRole="button"
            accessibilityLabel={cat.name}
            onPress={() => router.push(`/conditions/${cat.slug}`)}
            testID={`condition-row-${cat.slug}`}
            scaleTo={0.98}
            springPreset="subtle"
            className="min-h-[44px] flex-row items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text variant="bodyMedium" className="flex-1">
              {cat.name}
            </Text>
            <ChevronRight size={18} color={colors.charcoal[600]} strokeWidth={2} />
          </AnimatedPressable>
        ))}

        <Text variant="caption" className="px-1 pt-2">
          {t.disclaimer}
        </Text>
      </ScrollView>
    </View>
  );
}
