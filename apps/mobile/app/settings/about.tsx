import { ScrollView, View } from 'react-native';

import { SettingsRow } from '@/components/settings/SettingsRow';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { CT4_SETTINGS } from '@/features/settings/copy';

// S49 About & legal. Static links + the educational-use disclaimer (U6, store-
// blocking — final copy is CT4/legal sign-off). Links open the documents; the
// destinations are external/legal docs owned outside this wave (no-op stubs here).
export default function AboutScreen() {
  const t = CT4_SETTINGS.about;

  return (
    <ScreenShell edges={['bottom']}>
      <ScrollView contentContainerClassName="gap-4 py-4" showsVerticalScrollIndicator={false}>
        <SettingsSection>
          <SettingsRow label={t.rows.terms} onPress={() => {}} testID="about-row-terms" />
          <SettingsRow label={t.rows.privacy} onPress={() => {}} testID="about-row-privacy" />
          <SettingsRow
            label={t.rows.disclaimer}
            onPress={() => {}}
            testID="about-row-disclaimer"
          />
        </SettingsSection>

        <View className="rounded-xl border border-border px-4 py-3 dark:border-border-dark">
          <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
            {t.disclaimerBody}
          </Text>
        </View>

        <Text variant="caption" className="px-1 text-text-tertiary dark:text-text-tertiary-dark">
          {t.version} 1.0.0
        </Text>
      </ScrollView>
    </ScreenShell>
  );
}
