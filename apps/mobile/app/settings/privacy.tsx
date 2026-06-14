import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { SettingsRow } from '@/components/settings/SettingsRow';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { Button } from '@/components/ui/Button';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { CT4_SETTINGS } from '@/features/settings/copy';
import { getCheckInStore } from '@/lib/check-in-store';
import { readAllEntries, toCSV, toJSON } from '@/lib/export/record-export';
import { type ExportFormat, shareRecordFile } from '@/lib/export/share-record';

// S46 Privacy & your data. A plain trust statement + export my record (CSV/JSON,
// U3). Export reads the RecordStore and hands a file to the OS share sheet — a
// user-initiated local export, NOT SR-4 exfiltration. The delete entry leads to
// the honest two-screen delete pair (S47/S48).
export default function PrivacyScreen() {
  const t = CT4_SETTINGS.privacy;
  const [busy, setBusy] = useState(false);

  const onExport = async (format: ExportFormat) => {
    if (busy) return;
    setBusy(true);
    try {
      const entries = readAllEntries(getCheckInStore());
      const content = format === 'json' ? toJSON(entries) : toCSV(entries);
      await shareRecordFile(format, content);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenShell edges={['bottom']}>
      <ScrollView contentContainerClassName="gap-5 py-4" showsVerticalScrollIndicator={false}>
        <Text variant="body" className="px-1 text-text-secondary dark:text-text-secondary-dark">
          {t.trust}
        </Text>

        <View className="gap-2">
          <Text variant="bodyMedium" className="px-1">
            {t.exportLabel}
          </Text>
          <Text variant="caption" className="px-1 text-text-secondary dark:text-text-secondary-dark">
            {t.exportDescription}
          </Text>
          <Button variant="secondary" onPress={() => onExport('json')} disabled={busy} testID="export-json">
            {t.exportJson}
          </Button>
          <Button variant="secondary" onPress={() => onExport('csv')} disabled={busy} testID="export-csv">
            {t.exportCsv}
          </Button>
        </View>

        <SettingsSection>
          <SettingsRow
            label={t.deleteEntry}
            destructive
            onPress={() => router.push('/settings/delete')}
            testID="privacy-delete-entry"
          />
        </SettingsSection>
      </ScrollView>
    </ScreenShell>
  );
}
