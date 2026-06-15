import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { SettingsRow } from '@/components/settings/SettingsRow';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/features/auth';
import { CT4_SETTINGS } from '@/features/settings/copy';
import { storage } from '@/lib/adapters/storage';
import { loadPersonalization } from '@/lib/persistence/personalization';

// S42 Settings hub. A calm list. The native stack header owns the top inset, so
// the shell only guards the bottom.
export default function SettingsHubScreen() {
  const { name } = loadPersonalization(storage);
  const { session } = useAuth();
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

        <SettingsSection title={t.hub.crisisLabel}>
          <SettingsRow
            label={t.hub.rows.crisis}
            // SR-2: crisis access is always reachable. This is one more entry point
            // to the always-on /crisis surface (also on the GlobalHeader Help-now pill).
            onPress={() => router.push('/crisis')}
            testID="settings-row-crisis"
          />
        </SettingsSection>

        <SettingsSection>
          <SettingsRow
            label={t.hub.rows.supporter}
            onPress={() => router.push('/settings/supporter')}
            testID="settings-row-supporter"
          />
        </SettingsSection>

        <SettingsSection title={t.hub.accountLabel}>
          <SettingsRow
            label={t.hub.rows.account}
            value={session ? session.email : t.hub.notSignedIn}
            chevron={false}
            testID="settings-row-account-status"
          />
          <SettingsRow
            label={t.hub.rows.signOut}
            // Sign-out is NOT destructive — no rust/error tint. Routes to the wired
            // S37 confirm sheet (app/(auth)/sign-out.tsx), which calls the auth
            // service + clears the session. Navigation only — no auth model built here.
            onPress={() => router.push('/sign-out')}
            testID="settings-row-sign-out"
          />
          <SettingsRow
            label={t.hub.rows.deleteAccount}
            destructive
            // The hard-immediate, no-recovery delete flow (S47 → S48).
            onPress={() => router.push('/settings/delete')}
            testID="settings-row-delete-account"
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
