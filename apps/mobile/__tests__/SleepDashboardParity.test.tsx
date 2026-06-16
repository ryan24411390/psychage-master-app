import { screen } from '@testing-library/react-native';

import { asLocalCalendarDate, DEFAULT_SLEEP_SETTINGS, type SleepEntry } from '@psychage/shared/sleep';

import { CT4_SLEEP } from '@/features/sleep-architect/copy';
import { SleepDashboard } from '@/features/sleep-architect/dashboard/SleepDashboard';

import { renderWithProviders } from './_helpers';

// Dates are built relative to the real clock so the 7-night windows behave the
// same on any run date (WeeklyDigest reads `new Date()`, mirroring the dashboard's
// existing streak call).
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

describe('SleepDashboard — weekly digest', () => {
  it('summarises the count of nights logged this week', () => {
    const entries = [isoDaysAgo(0), isoDaysAgo(1), isoDaysAgo(2)].map((d) => entry(d));
    renderWithProviders(<SleepDashboard entries={entries} settings={DEFAULT_SLEEP_SETTINGS} />);
    expect(screen.getByText(CT4_SLEEP.weeklyDigest.title)).toBeTruthy();
    expect(screen.getByText(CT4_SLEEP.weeklyDigest.nightsLabel(3))).toBeTruthy();
  });

  it('shows the range-empty line when the only nights are older than the scored window', () => {
    const entries = [entry(isoDaysAgo(40))];
    renderWithProviders(<SleepDashboard entries={entries} settings={DEFAULT_SLEEP_SETTINGS} />);
    // The default scoring window is 7 days (web parity, 7/30/90 toggle). A
    // 40-day-old night falls outside it, so the dashboard renders its own
    // range-empty state and short-circuits before the weekly digest.
    expect(screen.getByText('No nights logged in the last 7 days.')).toBeTruthy();
  });

  it('compares to the prior week when prior-week nights exist', () => {
    const entries = [
      // this week: ~8h in bed
      entry(isoDaysAgo(0), { out_of_bed_time: '07:00' }),
      entry(isoDaysAgo(1), { out_of_bed_time: '07:00' }),
      // prior week: ~6h in bed → less rested time, so this week reads "more rested"
      entry(isoDaysAgo(8), { out_of_bed_time: '05:00' }),
      entry(isoDaysAgo(9), { out_of_bed_time: '05:00' }),
    ];
    renderWithProviders(<SleepDashboard entries={entries} settings={DEFAULT_SLEEP_SETTINGS} />);
    expect(screen.getByText(CT4_SLEEP.weeklyDigest.moreRested)).toBeTruthy();
  });
});

describe('SleepDashboard — quality & mood trend', () => {
  it('renders both trend rows once there are at least two nights', () => {
    const entries = [isoDaysAgo(0), isoDaysAgo(1)].map((d) => entry(d));
    renderWithProviders(<SleepDashboard entries={entries} settings={DEFAULT_SLEEP_SETTINGS} />);
    expect(screen.getByText(CT4_SLEEP.trends.qualityTitle)).toBeTruthy();
    expect(screen.getByText(CT4_SLEEP.trends.moodTitle)).toBeTruthy();
  });

  it('hides the trend card with a single night (no trend to draw)', () => {
    renderWithProviders(
      <SleepDashboard entries={[entry(isoDaysAgo(0))]} settings={DEFAULT_SLEEP_SETTINGS} />,
    );
    expect(screen.queryByText(CT4_SLEEP.trends.qualityTitle)).toBeNull();
    expect(screen.queryByText(CT4_SLEEP.trends.moodTitle)).toBeNull();
  });
});
