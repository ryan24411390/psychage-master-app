import { screen } from '@testing-library/react-native';

import { asLocalCalendarDate, DEFAULT_SLEEP_SETTINGS, type SleepEntry } from '@psychage/shared/sleep';

import { CT4_SLEEP } from '@/features/sleep-architect/copy';
import { SleepDashboard } from '@/features/sleep-architect/dashboard/SleepDashboard';

import { renderWithProviders } from './_helpers';

function entry(date: string): SleepEntry {
  return {
    id: `e-${date}`,
    date: asLocalCalendarDate(date),
    created_at: '2026-01-01T00:00:00.000Z',
    bedtime: '23:00',
    lights_out: '23:15',
    sleep_onset_minutes: 15,
    wake_time: '07:00',
    out_of_bed_time: '07:15',
    night_wakings: 0,
    night_waking_duration_minutes: 0,
    sleep_quality: 4,
    morning_mood: 4,
    dream_recall: false,
    naps: [],
    substances: { alcohol: false, exercise: false, medication_sleep_aid: false },
  };
}

describe('SleepDashboard', () => {
  it('shows the empty state before any nights are logged', () => {
    renderWithProviders(<SleepDashboard entries={[]} settings={DEFAULT_SLEEP_SETTINGS} />);
    expect(screen.getByText(CT4_SLEEP.dashboard.emptyTitle)).toBeTruthy();
  });

  it('shows a banded score and factual metrics once nights exist', () => {
    const entries = ['2026-06-17', '2026-06-16', '2026-06-15'].map(entry); // newest-first
    renderWithProviders(<SleepDashboard entries={entries} settings={DEFAULT_SLEEP_SETTINGS} />);
    expect(screen.getByText(CT4_SLEEP.metrics.avgSleep)).toBeTruthy();
    const bandLabels = Object.values(CT4_SLEEP.bands).map((b) => b.label);
    expect(bandLabels.some((label) => screen.queryAllByText(label).length > 0)).toBe(true);
  });
});
