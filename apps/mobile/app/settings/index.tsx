import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { SettingsRow } from '@/components/settings/SettingsRow';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { CT4_SETTINGS } from '@/features/settings/copy';
import { storage } from '@/lib/adapters/storage';
import { loadPersonalization } from '@/lib/persistence/personalization';

// S42 Settings hub. A calm list. The native stack header owns the top inset, so
// the shell only guards the bottom.
export default function SettingsHubScreen() {
  const { name } = loadPersonalization(storage);
  const t = CT4_SETTINGS;

  return (
    <ScreenShell edges={['bottom']}>
      <ScrollView contentContainerClassName="gap-4 py-4" showsVerticalScrollIndicator={false}>
        <SettingsSection title={t.hub.profileLabel}>
          <SettingsRow
            label={name ?? t.makeItYours.namePlaceholder}
            value={name ? undefined : t.makeItYours.save}
            onPress={() => router.push('/settings/make-it-yours')}
            testID="settings-row-profile"
          />
        </SettingsSection>

        <SettingsSection>
          <SettingsRow
            label={t.hub.rows.reminders}
            onPress={() => router.push('/settings/reminders')}
            testID="settings-row-reminders"
          />
          <SettingsRow
            label={t.hub.rows.makeItYours}
            onPress={() => router.push('/settings/make-it-yours')}
            testID="settings-row-make-it-yours"
          />
          <SettingsRow
            label={t.hub.rows.appearance}
            onPress={() => router.push('/settings/appearance')}
            testID="settings-row-appearance"
          />
        </SettingsSection>

        <SettingsSection>
          <SettingsRow
            label={t.hub.rows.privacy}
            onPress={() => router.push('/settings/privacy')}
            testID="settings-row-privacy"
          />
          <SettingsRow
            label={t.hub.rows.about}
            onPress={() => router.push('/settings/about')}
            testID="settings-row-about"
          />
        </SettingsSection>

        <SettingsSection>
          <SettingsRow
            label={t.hub.rows.supporter}
            onPress={() => router.push('/settings/supporter')}
            testID="settings-row-supporter"
          />
        </SettingsSection>

        <SettingsSection>
          <SettingsRow
            label={t.hub.rows.signOut}
            chevron={false}
            // STUB(B1): sign-out → S37, gated on rules/auth.md. The row renders so
            // the hub is complete; B1 wires the destination + the audit_events row.
            // Sign-out is NOT destructive — no rust/error tint here.
            onPress={() => {
              /* STUB(B1) — no-op until the auth slice lands */
            }}
            testID="settings-row-sign-out"
          />
        </SettingsSection>

        <View className="px-1">
          <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
            {t._marker}
          </Text>
        </View>
      </ScrollView>
    </ScreenShell>
  );
}
