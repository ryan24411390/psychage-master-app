import { ScrollView, View } from 'react-native';

import type { Symptom } from '@psychage/shared/navigator';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

import { NAVIGATOR_COPY } from '../copy';
import type { SymptomDetail } from '../flow';
import { DurationPicker } from '../components/DurationPicker';
import { FrequencyPicker } from '../components/FrequencyPicker';
import { SeveritySlider } from '../components/SeveritySlider';

// S — Per-symptom Detail (mobile port of web DurationSeverityScreen). One symptom at a
// time; renders only the questions the symptom asks (ask_severity / ask_duration /
// ask_frequency), exactly like web. A progress header shows position in the set; the
// final symptom's CTA reads "See results".

export interface DetailScreenProps {
  readonly symptom: Symptom;
  readonly index: number;
  readonly total: number;
  readonly detail: SymptomDetail | undefined;
  readonly onSet: (patch: SymptomDetail) => void;
  readonly onNext: () => void;
}

export function DetailScreen({ symptom, index, total, detail, onSet, onNext }: DetailScreenProps) {
  const isLast = index >= total - 1;
  const progress = total > 0 ? Math.round(((index + 1) / total) * 100) : 100;

  return (
    <ScrollView contentContainerClassName="gap-7 px-4 pb-10 pt-2" keyboardShouldPersistTaps="handled">
      {/* Progress header */}
      <View className="gap-2">
        <Text variant="caption" className="uppercase tracking-wider text-text-tertiary dark:text-text-tertiary-dark">
          {NAVIGATOR_COPY.detailProgress(index + 1, total)}
        </Text>
        <View className="h-1 overflow-hidden rounded-full bg-border/60 dark:bg-border-dark/60">
          <View className="h-full rounded-full bg-primary dark:bg-primary-dark" style={{ width: `${progress}%` }} />
        </View>
        <Text variant="h1" accessibilityRole="header">
          {symptom.name}
        </Text>
        {symptom.description ? (
          <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
            {symptom.description}
          </Text>
        ) : null}
      </View>

      {symptom.ask_severity ? (
        <View className="gap-3">
          <Text variant="label">{NAVIGATOR_COPY.detailSeverityLabel}</Text>
          <SeveritySlider
            value={detail?.severity ?? 5}
            onChange={(severity) => onSet({ severity })}
          />
        </View>
      ) : null}

      {symptom.ask_duration ? (
        <View className="gap-3">
          <Text variant="label">{NAVIGATOR_COPY.detailDurationLabel}</Text>
          <DurationPicker value={detail?.duration} onChange={(duration) => onSet({ duration })} />
        </View>
      ) : null}

      {symptom.ask_frequency ? (
        <View className="gap-3">
          <Text variant="label">{NAVIGATOR_COPY.detailFrequencyLabel}</Text>
          <FrequencyPicker value={detail?.frequency} onChange={(frequency) => onSet({ frequency })} />
        </View>
      ) : null}

      <Button variant="primary" onPress={onNext} className="mt-1">
        {isLast ? NAVIGATOR_COPY.detailAnalyze : NAVIGATOR_COPY.continue}
      </Button>
    </ScrollView>
  );
}
