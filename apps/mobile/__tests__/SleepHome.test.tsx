import { fireEvent, screen } from '@testing-library/react-native';

import { asLocalCalendarDate, DEFAULT_SLEEP_SETTINGS, type SleepEntry } from '@psychage/shared/sleep';

import { CT4_SLEEP } from '@/features/sleep-architect/copy';
import { SleepHome } from '@/features/sleep-architect/home/SleepHome';

import { renderWithProviders } from './_helpers';

// Home tab (P58): the merged Overview + Patterns + Insights surface. Empty state is a
// single calm card + Log CTA (no Export until there is something to share); with data
// it shows both CTAs plus the dashboard. Export is user-initiated (SR-4).

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const y = String(d.getFullYear()).padStart(4, '0');
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function entry(date: string, overrides: Partial<SleepEntry> = {}): SleepEntry {
  return {
    id: `e-${date}`,
    date: asLocalCalendarDate(date),
    created_at: '2026-01-01T00:00:00.000Z',
    bedtime: '23:00',
    lights_out: '23:15',
    sleep_onset_minutes: 15,
    wake_time: '07:00',
    out_of_bed_time: '07:00',
    night_wakings: 0,
    night_waking_duration_minutes: 0,
    sleep_quality: 4,
    morning_mood: 4,
    dream_recall: false,
    naps: [],
    substances: { alcohol: false, exercise: false, medication_sleep_aid: false },
    ...overrides,
  };
}

describe('SleepHome', () => {
  it('empty state: shows the Log CTA + a calm card, hides Export', () => {
    renderWithProviders(
      <SleepHome entries={[]} settings={DEFAULT_SLEEP_SETTINGS} onLog={() => {}} onExport={() => {}} />,
    );
    expect(screen.getByText(CT4_SLEEP.diary.logToday)).toBeTruthy();
    expect(screen.getByText(CT4_SLEEP.dashboard.emptyTitle)).toBeTruthy();
    expect(screen.queryByText(CT4_SLEEP.home.exportCta)).toBeNull();
  });

  it('with data: shows both CTAs and the dashboard', () => {
    const entries = [isoDaysAgo(0), isoDaysAgo(1), isoDaysAgo(2)].map((d) => entry(d));
    renderWithProviders(
      <SleepHome entries={entries} settings={DEFAULT_SLEEP_SETTINGS} onLog={() => {}} onExport={() => {}} />,
    );
    expect(screen.getByText(CT4_SLEEP.diary.logToday)).toBeTruthy();
    expect(screen.getByText(CT4_SLEEP.home.exportCta)).toBeTruthy();
    expect(screen.getByText(CT4_SLEEP.weeklyDigest.title)).toBeTruthy();
  });

  it('Export CTA is user-initiated — fires onExport on press', () => {
    const onExport = jest.fn();
    const entries = [isoDaysAgo(0), isoDaysAgo(1)].map((d) => entry(d));
    renderWithProviders(
      <SleepHome entries={entries} settings={DEFAULT_SLEEP_SETTINGS} onLog={() => {}} onExport={onExport} />,
    );
    fireEvent.press(screen.getByText(CT4_SLEEP.home.exportCta));
    expect(onExport).toHaveBeenCalledTimes(1);
  });
});
