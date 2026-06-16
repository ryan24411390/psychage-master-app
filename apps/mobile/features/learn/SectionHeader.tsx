import { ArrowRight } from 'lucide-react-native';
import { View } from 'react-native';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Text } from '@/components/ui/Text';
import { useHaptics } from '@/lib/haptic-context';
import { useThemeColors } from '@/lib/use-theme-colors';

// One header for every Learn section. Two registers:
//   • default — a Fraunces section title (+ optional count) with an optional
//     "See all" affordance on the right (teal, 44pt target, haptic.tap on nav).
//   • overline — a small uppercase eyebrow (Editor's pick, Most read this month).

type SectionHeaderProps = {
  title: string;
  /** e.g. "24 guides" — rendered as a muted count beside the title. */
  count?: string;
  onSeeAll?: () => void;
  /** Render as an uppercase eyebrow instead of a section title. */
  overline?: boolean;
  seeAllLabel?: string;
};

export function SectionHeader({
  title,
  count,
  onSeeAll,
  overline = false,
  seeAllLabel = 'See all',
}: SectionHeaderProps) {
  const { fireHaptic } = useHaptics();
  const tc = useThemeColors();

  if (overline) {
    return (
      <Text
        variant="caption"
        className="mb-2 font-sans-bold uppercase tracking-[0.12em] text-teal-700 dark:text-primary-dark"
        accessibilityRole="header"
      >
        {title}
      </Text>
    );
  }

  return (
    <View className="mb-3 flex-row items-end justify-between gap-3">
      <View className="flex-1 flex-row items-baseline gap-2">
        <Text variant="headingLg" accessibilityRole="header">
          {title}
        </Text>
        {count ? (
          <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
            {count}
          </Text>
        ) : null}
      </View>

      {onSeeAll ? (
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={`${seeAllLabel}: ${title}`}
          onPress={() => {
            fireHaptic('tab');
            onSeeAll();
          }}
          hitSlop={8}
          className="min-h-[44px] flex-row items-center gap-1 pl-2"
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Text variant="bodySm" className="font-sans-medium text-teal-700 dark:text-primary-dark">
            {seeAllLabel}
          </Text>
          <ArrowRight size={15} color={tc.primary} strokeWidth={2} />
        </AnimatedPressable>
      ) : null}
    </View>
  );
}
