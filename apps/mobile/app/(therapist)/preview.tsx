import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import { PdfPreview } from '@/components/therapist/PdfPreview';
import type { TerrainDay } from '@/components/terrain/terrain-geometry';
import {
  buildTherapistPdfHtml,
  enumerateDays,
  generateAndShare,
  summarizeRange,
  THERAPIST_COPY,
  windowForDays,
} from '@/features/therapist';
import { expoPdfPrinter } from '@/features/therapist/pdf/expo-printer';
import { getCheckInStore } from '@/lib/check-in-store';

// S41 — PDF preview + share. Thin route: reads the selected range from the local
// RecordStore, builds the on-screen terrain preview, and on Share generates the PDF
// LOCALLY (expo-print) and hands it to the platform sheet. The record shared is the
// LOCAL store (the synced/account record is the gated sync layer — out of this wave).
export default function PreviewScreen() {
  const params = useLocalSearchParams<{ days?: string }>();
  const days = Number(typeof params.days === 'string' ? params.days : '7') || 7;

  const data = useMemo(() => {
    const { from, to } = windowForDays(new Date(), days);
    const entries = getCheckInStore().getRange(from, to);
    const byDate = new Map(entries.map((entry) => [entry.date, entry]));
    const terrainDays: TerrainDay[] = enumerateDays(from, to).map((d) => {
      const entry = byDate.get(d);
      return { label: d.slice(8, 10), value: entry ? entry.state : null };
    });
    const { dayCount, entryCount } = summarizeRange(from, to, entries);
    return { from, to, entries, terrainDays, dayCount, entryCount };
  }, [days]);

  const handleShare = (fullName: string) => {
    const html = buildTherapistPdfHtml({
      fullName,
      from: data.from,
      to: data.to,
      entries: data.entries,
    });
    void generateAndShare(html, expoPdfPrinter);
  };

  return (
    <PdfPreview
      initialName=""
      summaryLine={THERAPIST_COPY.rangeCountLine(data.dayCount, data.entryCount)}
      terrainDays={data.terrainDays}
      isEmpty={data.entryCount === 0}
      onShare={handleShare}
    />
  );
}
