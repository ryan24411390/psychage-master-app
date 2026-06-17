import { MILESTONE_THRESHOLDS } from '@psychage/shared/engagement';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { MILESTONES_COPY } from '@/features/milestones/copy';

// Cumulative milestone markers for the history surface — collectible, count-up only.
// A reached marker is filled (teal); an upcoming one is a quiet outline. There is NO
// run counter, NO "X to go", NO "missed"/"locked"/deficit framing — markers simply
// light up as the total grows, and a gap day changes nothing. NativeWind classes only
// (no inline styles, no raw hex) per the design contract.

type MilestonesStripProps = {
  /** Threshold values already reached (from the milestones persistence store). */
  reached: readonly number[];
};

export function MilestonesStrip({ reached }: MilestonesStripProps) {
  const reachedSet = new Set(reached);

  return (
    <View className="pb-3 pt-1" accessibilityRole="summary">
      <Text variant="bodyLarge" className="mb-0.5">
        {MILESTONES_COPY.title}
      </Text>
      <Text variant="caption" className="mb-3 text-text-secondary dark:text-text-secondary-dark">
        {MILESTONES_COPY.subline}
      </Text>

      <View className="flex-row items-start justify-between">
        {MILESTONE_THRESHOLDS.map((threshold) => {
          const isReached = reachedSet.has(threshold);
          return (
            <View
              key={threshold}
              className="items-center gap-1.5"
              accessibilityRole="image"
              accessibilityLabel={
                isReached
                  ? MILESTONES_COPY.markerReached(threshold)
                  : MILESTONES_COPY.markerUpcoming(threshold)
              }
            >
              <View
                className={
                  isReached
                    ? 'h-12 w-12 items-center justify-center rounded-full bg-primary dark:bg-primary-dark'
                    : 'h-12 w-12 items-center justify-center rounded-full border border-border opacity-50 dark:border-border-dark'
                }
              >
                <Text
                  variant="bodyLarge"
                  className={
                    isReached
                      ? 'text-white'
                      : 'text-text-tertiary dark:text-text-tertiary-dark'
                  }
                >
                  {threshold}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
