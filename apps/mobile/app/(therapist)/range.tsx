import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';

import type { RangeOption } from '@/components/therapist/RangeRadio';
import { RangePicker } from '@/components/therapist/RangePicker';
import { summarizeRange, THERAPIST_COPY, windowForDays } from '@/features/therapist';
import { getCheckInStore } from '@/lib/check-in-store';

// S40 — Date range. Thin route: presets + the HONEST count for the selected range,
// read from the local RecordStore (the same store the PDF reads). Advances to preview.
const OPTIONS: readonly RangeOption[] = [
  { key: '7', label: THERAPIST_COPY.rangeOption7, days: 7 },
  { key: '14', label: THERAPIST_COPY.rangeOption14, days: 14 },
  { key: '30', label: THERAPIST_COPY.rangeOption30, days: 30 },
];

export default function RangeScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const countLine = useMemo(() => {
    const option = OPTIONS.find((o) => o.key === selected);
    if (!option) return null;
    const { from, to } = windowForDays(new Date(), option.days);
    const entries = getCheckInStore().getRange(from, to);
    const { dayCount, entryCount } = summarizeRange(from, to, entries);
    return THERAPIST_COPY.rangeCountLine(dayCount, entryCount);
  }, [selected]);

  return (
    <RangePicker
      options={OPTIONS}
      value={selected}
      onChange={setSelected}
      countLine={countLine}
      onPreview={() => {
        if (selected) router.push({ pathname: '/preview', params: { days: selected } });
      }}
    />
  );
}
