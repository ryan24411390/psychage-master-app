import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// S46 file hand-off. Writes the serialized record to a cache file and opens the
// OS share sheet. Native modules — jest render tests mock 'expo-file-system' and
// 'expo-sharing'. The pure serialization (toJSON/toCSV) lives in record-export.ts.

export type ExportFormat = 'json' | 'csv';

const META: Record<ExportFormat, { filename: string; mimeType: string; uti: string }> = {
  json: {
    filename: 'psychage-record.json',
    mimeType: 'application/json',
    uti: 'public.json',
  },
  csv: {
    filename: 'psychage-record.csv',
    mimeType: 'text/csv',
    uti: 'public.comma-separated-values-text',
  },
};

export async function shareRecordFile(format: ExportFormat, content: string): Promise<void> {
  const meta = META[format];
  const file = new File(Paths.cache, meta.filename);
  if (file.exists) file.delete();
  file.create();
  file.write(content);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: meta.mimeType,
      UTI: meta.uti,
      dialogTitle: 'Export your Psychage record',
    });
  }
}
