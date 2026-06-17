import Constants from 'expo-constants';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { SettingsRow } from '@/components/settings/SettingsRow';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { CT4_SETTINGS } from '@/features/settings/copy';

// S49 About & legal. What Psychage is (educational, non-clinical), the U6
// educational-use disclaimer (store-blocking — final copy is CT4/legal sign-off),
// acknowledgments, and the real app version (single-sourced from app.json via
// expo-constants). DEFERRED here (flagged, NOT shipped as dead rows): Terms /
// Privacy external links (need canonical URLs) and a team/credential surface (needs
// Dr. Lena Dobson's full approved credential — App Store 1.4.1, never invented).
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function AboutScreen() {
  const t = CT4_SETTINGS.about;

  return (
    <ScreenShell edges={['bottom']}>
      <ScrollView contentContainerClassName="gap-4 py-4" showsVerticalScrollIndicator={false}>
        <View className="gap-1">
          <Text variant="bodyLarge" className="px-1">
            {t.aboutLabel}
          </Text>
          <Text variant="caption" className="px-1 text-text-secondary dark:text-text-secondary-dark">
            {t.aboutBody}
          </Text>
        </View>

        <View className="rounded-xl border border-border px-4 py-3 dark:border-border-dark">
          <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
            {t.disclaimerBody}
          </Text>
        </View>

        <SettingsSection>
          <SettingsRow
            label={t.rows.disclaimer}
            onPress={() => router.push('/settings/disclaimer')}
            testID="about-row-disclaimer"
          />
          <SettingsRow
            label={t.rows.terms}
            onPress={() => router.push('/settings/terms')}
            testID="about-row-terms"
          />
          <SettingsRow
            label={t.rows.privacy}
            onPress={() => router.push('/settings/privacy-policy')}
            testID="about-row-privacy"
          />
          <SettingsRow
            label={t.rows.acknowledgments}
            onPress={() => router.push('/settings/acknowledgments')}
            testID="about-row-acknowledgments"
          />
        </SettingsSection>

        <Text variant="caption" className="px-1 text-text-tertiary dark:text-text-tertiary-dark">
          {t.version} {APP_VERSION}
        </Text>
      </ScrollView>
    </ScreenShell>
  );
}
