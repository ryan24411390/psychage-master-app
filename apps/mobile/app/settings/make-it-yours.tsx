import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { SettingsRadioRow } from '@/components/settings/SettingsRadioRow';
import { Button } from '@/components/ui/Button';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/features/auth';
import { CT4_SETTINGS } from '@/features/settings/copy';
import { storage } from '@/lib/adapters/storage';
import {
  type HomeLead,
  loadPersonalization,
  savePersonalization,
} from '@/lib/persistence/personalization';

// S44 Make it yours (modal sheet). The display name now comes from the VERIFIED login
// method (Google profile name / the full_name from email signup) — read-only (P63); no
// verified method → no name. The editable control here is which tool leads the home
// "Right now" group. PERSISTS to the personalization store, PRESERVING the auth-synced
// name + the onboarding interests (interests omitted from the write are kept — A-flag).
const LEAD_ORDER: readonly HomeLead[] = ['check-in', 'navigator', 'toolkit'];

export default function MakeItYoursScreen() {
  const t = CT4_SETTINGS.makeItYours;
  const { session } = useAuth();
  const initial = loadPersonalization(storage);
  const [homeLead, setHomeLead] = useState<HomeLead>(initial.homeLead);

  // Only a verified method supplies a name; anonymous / no-name → none.
  const accountName = session?.verified ? session.name : null;

  const onSave = () => {
    // This screen only changes homeLead; preserve the auth-synced name + interests.
    savePersonalization(storage, { name: initial.name, homeLead });
    router.back();
  };

  return (
    <ScreenShell edges={['bottom']}>
      <ScrollView contentContainerClassName="gap-5 py-4" showsVerticalScrollIndicator={false}>
        <View className="gap-1">
          <Text variant="bodyLarge">{t.nameLabel}</Text>
          <Text
            variant="body"
            className="text-text-primary dark:text-text-primary-dark"
            testID="personalization-name"
          >
            {accountName ?? t.nameSignInHint}
          </Text>
          {accountName ? (
            <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
              {t.nameFromAccount}
            </Text>
          ) : null}
        </View>

        <View className="gap-2">
          <Text variant="bodyLarge">{t.leadLabel}</Text>
          <SettingsRadioRow
            groupLabel={t.leadLabel}
            options={LEAD_ORDER.map((value) => ({ value, label: t.leadOptions[value] }))}
            value={homeLead}
            onChange={setHomeLead}
          />
        </View>

        <Button onPress={onSave} testID="personalization-save">
          {t.save}
        </Button>
      </ScrollView>
    </ScreenShell>
  );
}
