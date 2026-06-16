import { useState } from 'react';
import { useColorScheme } from 'nativewind';
import { TextInput, View } from 'react-native';

import { calculateOptimalBedtimes, formatDuration } from '@psychage/shared/sleep';

import { Text } from '@/components/ui/Text';
import { CT4_SLEEP } from '@/features/sleep-architect/copy';
import { colors } from '@/lib/colors';

// Bedtime calculator. Works back from a wake time through ~90-minute cycles using
// the shared, tested calculateOptimalBedtimes.

const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function BedtimeCalculator() {
  const t = CT4_SLEEP.tools;
  const { colorScheme } = useColorScheme();
  const [wake, setWake] = useState('07:00');

  const valid = HHMM_RE.test(wake);
  const suggestions = valid ? calculateOptimalBedtimes(wake) : [];
  const tint = colorScheme === 'dark' ? colors.text.tertiary.dark : colors.text.tertiary.light;

  return (
    <View className="gap-4">
      <View className="gap-1.5">
        <Text variant="bodySmall">{t.bedtimeWake}</Text>
        <TextInput
          value={wake}
          onChangeText={setWake}
          placeholder={CT4_SLEEP.form.timeHint}
          placeholderTextColor={tint}
          keyboardType="numbers-and-punctuation"
          maxLength={5}
          accessibilityLabel={t.bedtimeWake}
          className="min-h-[44px] rounded-lg border border-border bg-surface px-3 py-2 text-base text-text-primary dark:border-border-dark dark:bg-surface-dark dark:text-text-primary-dark"
        />
      </View>

      {valid ? (
        <View className="gap-2">
          <Text variant="bodySmall" className="text-text-secondary dark:text-text-secondary-dark">
            {t.bedtimeResult}
          </Text>
          {suggestions.map((s) => (
            <View
              key={s.cycles}
              className={`flex-row items-center justify-between rounded-xl border bg-surface px-4 py-3 dark:bg-surface-dark ${
                s.recommended
                  ? 'border-primary dark:border-primary-dark'
                  : 'border-border dark:border-border-dark'
              }`}
            >
              <Text variant="h5">{s.bedtime}</Text>
              <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
                {t.bedtimeCycles(s.cycles, formatDuration(s.sleep_duration_minutes))}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text variant="bodySmall" className="text-error dark:text-error-dark">
          {CT4_SLEEP.form.invalid}
        </Text>
      )}
    </View>
  );
}
