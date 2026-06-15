import { ScrollView, View } from 'react-native';

import { SettingsSection } from '@/components/settings/SettingsSection';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { CT4_SETTINGS } from '@/features/settings/copy';

// Acknowledgments — the open-source libraries the app is built on (a curated,
// real list drawn from apps/mobile/package.json; there is no on-device filesystem
// to generate a license manifest from at runtime).
export default function AcknowledgmentsScreen() {
  const t = CT4_SETTINGS.acknowledgments;

  return (
    <ScreenShell edges={['bottom']}>
      <ScrollView contentContainerClassName="gap-4 py-4" showsVerticalScrollIndicator={false}>
        <Text variant="body" className="px-1 text-text-secondary dark:text-text-secondary-dark">
          {t.intro}
        </Text>

        <SettingsSection>
          {t.items.map((item) => (
            <View
              key={item.name}
              className="min-h-[44px] flex-row items-center justify-between gap-3 px-1 py-3"
            >
              <Text variant="bodyMedium" className="flex-1">
                {item.name}
              </Text>
              <Text variant="bodySm" className="text-text-tertiary dark:text-text-tertiary-dark">
                {item.license}
              </Text>
            </View>
          ))}
        </SettingsSection>
      </ScrollView>
    </ScreenShell>
  );
}
