import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';

import { SettingsRadioRow } from '@/components/settings/SettingsRadioRow';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { Button } from '@/components/ui/Button';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { CT4_SETTINGS } from '@/features/settings/copy';
import { storage } from '@/lib/adapters/storage';
import { colors } from '@/lib/colors';
import {
  type HomeLead,
  loadPersonalization,
  savePersonalization,
} from '@/lib/persistence/personalization';

// S44 Make it yours (modal sheet). Name + which tool leads the home "Right now"
// group. PERSISTS to the personalization store; the live home wiring (greeting +
// "Right now" order) is the home owner's edit (HomeView is read-only in B2).
const LEAD_ORDER: readonly HomeLead[] = ['check-in', 'navigator', 'toolkit'];

export default function MakeItYoursScreen() {
  const t = CT4_SETTINGS.makeItYours;
  const initial = loadPersonalization(storage);
  const [name, setName] = useState(initial.name ?? '');
  const [homeLead, setHomeLead] = useState<HomeLead>(initial.homeLead);

  const onSave = () => {
    savePersonalization(storage, { name: name.trim() === '' ? null : name, homeLead });
    router.back();
  };

  return (
    <ScreenShell edges={['bottom']}>
      <ScrollView contentContainerClassName="gap-5 py-4" showsVerticalScrollIndicator={false}>
        <View className="gap-2">
          <Text variant="bodyMedium">{t.nameLabel}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t.namePlaceholder}
            placeholderTextColor={colors.text.tertiary.light}
            accessibilityLabel={t.nameLabel}
            className="min-h-[44px] rounded-lg border border-border px-3 font-sans text-base text-text-primary dark:border-border-dark dark:text-text-primary-dark"
            testID="personalization-name-input"
          />
        </View>

        <View className="gap-2">
          <Text variant="bodyMedium">{t.leadLabel}</Text>
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
