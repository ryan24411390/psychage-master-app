import { ScrollView, View } from 'react-native';

import { SettingsRadioRow } from '@/components/settings/SettingsRadioRow';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsToggleRow } from '@/components/settings/SettingsToggleRow';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { CT4_SETTINGS } from '@/features/settings/copy';
import type { AppearanceMode } from '@/lib/persistence/appearance';
import type { ReadingTextSize } from '@/lib/persistence/reading-text-size';
import { ReadingTextSizeProvider } from '@/lib/reading-text-size-context';
import { useAppearance } from '@/lib/use-appearance';
import { useReadingTextSize } from '@/lib/use-reading-text-size';

// S45 Accessibility & appearance. Light / night / system via C-RADIO (charcoal
// marks, never teal). Reduce-motion toggle drives lib/motion.ts useReducedMotion
// app-wide. Reading text size scales article/Learn body copy (wrapped in
// ReadingTextSizeProvider) — the live preview below sits inside one provider so the
// choice is observable here. Dynamic Type is honored by RN's native font scaling.
const MODE_ORDER: readonly AppearanceMode[] = ['light', 'night', 'system'];
const SIZE_ORDER: readonly ReadingTextSize[] = ['small', 'default', 'large'];

export default function AppearanceScreen() {
  const t = CT4_SETTINGS.appearance;
  const { mode, reducedMotion, setMode, setReducedMotion } = useAppearance();
  const { size, setSize } = useReadingTextSize();

  return (
    <ScreenShell edges={['bottom']}>
      <ScrollView contentContainerClassName="gap-5 py-4" showsVerticalScrollIndicator={false}>
        <View className="gap-2">
          <Text variant="bodyLarge" className="px-1">
            {t.appearanceLabel}
          </Text>
          <SettingsRadioRow
            groupLabel={t.appearanceLabel}
            options={MODE_ORDER.map((value) => ({ value, label: t.modeOptions[value] }))}
            value={mode}
            onChange={setMode}
          />
        </View>

        <View className="gap-2">
          <Text variant="bodyLarge" className="px-1">
            {t.textSizeLabel}
          </Text>
          <SettingsRadioRow
            groupLabel={t.textSizeLabel}
            options={SIZE_ORDER.map((value) => ({ value, label: t.textSizeOptions[value] }))}
            value={size}
            onChange={setSize}
          />
          <View className="gap-1 rounded-xl border border-border px-4 py-3 dark:border-border-dark">
            <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
              {t.textSizePreviewLabel}
            </Text>
            <ReadingTextSizeProvider>
              <Text variant="body" testID="text-size-preview">
                {t.textSizePreviewBody}
              </Text>
            </ReadingTextSizeProvider>
          </View>
          <Text variant="caption" className="px-1 text-text-secondary dark:text-text-secondary-dark">
            {t.textSizeNote}
          </Text>
        </View>

        <SettingsSection>
          <SettingsToggleRow
            label={t.reduceMotionLabel}
            description={t.reduceMotionDescription}
            value={reducedMotion}
            onValueChange={setReducedMotion}
            testID="reduce-motion-toggle"
          />
        </SettingsSection>

        <Text variant="caption" className="px-1 text-text-secondary dark:text-text-secondary-dark">
          {t.dynamicTypeNote}
        </Text>
      </ScrollView>
    </ScreenShell>
  );
}
