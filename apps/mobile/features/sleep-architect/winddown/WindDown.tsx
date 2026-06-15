import { router } from 'expo-router';
import { useState } from 'react';
import { useColorScheme } from 'nativewind';
import { TextInput, View } from 'react-native';

import { detectCrisisContent } from '@psychage/shared/sleep';

import { Button } from '@/components/ui/Button';
import { CrisisPill } from '@/components/CrisisPill';
import { Text } from '@/components/ui/Text';
import { CT4_SLEEP } from '@/features/sleep-architect/copy';
import { colors } from '@/lib/colors';

// Wind-down tab. Calming options for before bed. Breathing REUSES the existing
// native Toolkit (no rebuild) — it pushes /toolkit?exercise=breathing. The brain
// dump is ephemeral local state (never persisted, never leaves the device, SR-4);
// its free-text is scanned with detectCrisisContent so the crisis affordance can
// surface (SR-2). CBT-I cards are educational only (SR-3).

export function WindDown() {
  const t = CT4_SLEEP.windDown;
  const { colorScheme } = useColorScheme();
  const [brainDump, setBrainDump] = useState('');
  const tint = colorScheme === 'dark' ? colors.text.tertiary.dark : colors.text.tertiary.light;
  const crisisFlagged = detectCrisisContent(brainDump);

  return (
    <View className="gap-4">
      <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
        {t.intro}
      </Text>

      <View className="gap-2 rounded-xl border border-border bg-surface px-4 py-4 dark:border-border-dark dark:bg-surface-dark">
        <Text variant="bodyBold">{t.breathingTitle}</Text>
        <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
          {t.breathingBody}
        </Text>
        <Button
          variant="secondary"
          className="mt-1 self-start"
          onPress={() => router.push('/toolkit?exercise=breathing')}
        >
          {t.breathingCta}
        </Button>
      </View>

      <View className="gap-2 rounded-xl border border-border bg-surface px-4 py-4 dark:border-border-dark dark:bg-surface-dark">
        <Text variant="bodyBold">{t.brainDumpTitle}</Text>
        <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
          {t.brainDumpBody}
        </Text>
        <TextInput
          value={brainDump}
          onChangeText={setBrainDump}
          multiline
          maxLength={2000}
          placeholder={t.brainDumpPlaceholder}
          placeholderTextColor={tint}
          accessibilityLabel={t.brainDumpTitle}
          className="min-h-[96px] rounded-lg border border-border bg-background px-3 py-2 text-base text-text-primary dark:border-border-dark dark:bg-background-dark dark:text-text-primary-dark"
        />
        {crisisFlagged ? (
          <View className="gap-2 rounded-lg border border-crisis px-3 py-2">
            <Text variant="bodySm">{t.crisisLine}</Text>
            <CrisisPill />
          </View>
        ) : null}
        {brainDump.length > 0 ? (
          <Button variant="ghost" className="self-start" onPress={() => setBrainDump('')}>
            {t.brainDumpClear}
          </Button>
        ) : null}
      </View>

      <Text
        variant="caption"
        className="uppercase tracking-wider text-text-secondary dark:text-text-secondary-dark"
      >
        {t.cbtiTitle}
      </Text>
      {CT4_SLEEP.cbtiCards.map((card) => (
        <View
          key={card.id}
          className="gap-1 rounded-xl border border-border bg-surface px-4 py-4 dark:border-border-dark dark:bg-surface-dark"
        >
          <Text variant="bodyBold">{card.title}</Text>
          <Text variant="bodySm" className="leading-5 text-text-secondary dark:text-text-secondary-dark">
            {card.body}
          </Text>
        </View>
      ))}
    </View>
  );
}
