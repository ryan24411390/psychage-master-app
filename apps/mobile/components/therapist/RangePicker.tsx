import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { RangeRadio, type RangeOption } from '@/components/therapist/RangeRadio';
import { Button } from '@/components/ui/Button';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { THERAPIST_COPY } from '@/features/therapist/copy';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

// S40 — Date range. The C-RADIO options + an HONEST count line for the selected
// range ("18 days, 14 entries"). Router-agnostic: the route computes the count from
// the RecordStore and wires Preview.
type RangePickerProps = {
  options: readonly RangeOption[];
  value: string | null;
  onChange: (key: string) => void;
  /** Honest count of the selected range, or null when nothing is selected. */
  countLine: string | null;
  onPreview: () => void;
};

export function RangePicker({ options, value, onChange, countLine, onPreview }: RangePickerProps) {
  const reduced = useReducedMotion();

  return (
    <ScreenShell>
      <Animated.View
        entering={reduced ? undefined : FadeIn.duration(DURATION.base).easing(easingFn('out'))}
        className="flex-1 gap-6 pt-6"
      >
        <Text variant="h2">{THERAPIST_COPY.rangeTitle}</Text>

        <RangeRadio options={options} value={value} onChange={onChange} />

        {countLine ? (
          <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
            {countLine}
          </Text>
        ) : null}

        <View className="mt-auto">
          <Button variant="primary" disabled={value === null} onPress={onPreview}>
            {THERAPIST_COPY.rangePrimary}
          </Button>
        </View>
      </Animated.View>
    </ScreenShell>
  );
}
