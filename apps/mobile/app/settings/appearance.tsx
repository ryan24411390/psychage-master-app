import { ScrollView, View } from 'react-native';

import { SettingsRadioRow } from '@/components/settings/SettingsRadioRow';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsToggleRow } from '@/components/settings/SettingsToggleRow';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { CT4_SETTINGS } from '@/features/settings/copy';
import type { AppearanceMode } from '@/lib/persistence/appearance';
import { useAppearance } from '@/lib/use-appearance';

// S45 Accessibility & appearance. Light / night / system via C-RADIO (charcoal
// marks, never teal). Reduce-motion toggle drives lib/motion.ts useReducedMotion
// app-wide. Dynamic Type is honored by RN's native font scaling (no stored
// toggle) — surfaced as a note.
const MODE_ORDER: readonly AppearanceMode[] = ['light', 'night', 'system'];

export default function AppearanceScreen() {
  const t = CT4_SETTINGS.appearance;
  const { mode, reducedMotion, setMode, setReducedMotion } = useAppearance();

  return (
    <ScreenShell edges={['bottom']}>
      <ScrollView contentContainerClassName="gap-5 py-4" showsVerticalScrollIndicator={false}>
        <View className="gap-2">
          <Text variant="bodyMedium" className="px-1">
            {t.appearanceLabel}
          </Text>
          <SettingsRadioRow
            groupLabel={t.appearanceLabel}
            options={MODE_ORDER.map((value) => ({ value, label: t.modeOptions[value] }))}
            value={mode}
            onChange={setMode}
          />
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
