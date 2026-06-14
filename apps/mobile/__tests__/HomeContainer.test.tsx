import type { CheckInEntry, CheckInState } from '@psychage/shared/check-in';
import { fireEvent, screen } from '@testing-library/react-native';

import { HomeContainer } from '@/components/home/HomeContainer';
import type { HomeStore } from '@/lib/home-model';

import { renderWithProviders } from './_helpers';

// End-to-end live flow (sub-slice E) with an in-memory store double — the real store
// imports the shared package at runtime, which Jest doesn't transform, so we inject a
// double here and exercise the real store separately under Vitest (check-in-store.test).
function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function makeFakeStore(): HomeStore {
  const today = ymd(new Date());
  const entries: { id: string; date: string; state: CheckInState }[] = [];
  let n = 0;
  return {
    getToday: () => entries.find((e) => e.date === today) as unknown as CheckInEntry | undefined,
    getRecent: (count) =>
      [...entries]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, count) as unknown as CheckInEntry[],
    saveToday: (state) => {
      const existing = entries.find((e) => e.date === today);
      if (existing) {
        existing.state = state;
        return existing as unknown as CheckInEntry;
      }
      const created = { id: `id${n++}`, date: today, state };
      entries.push(created);
      return created as unknown as CheckInEntry;
    },
  };
}

describe('HomeContainer (S3 live flow)', () => {
  it('first-run → check in Low → checked-in + bridge; Good re-save overwrites + clears the bridge', () => {
    renderWithProviders(<HomeContainer store={makeFakeStore()} />, { haptics: true });

    // first-run (empty store)
    expect(screen.getByText('This is your space. It starts whenever you’re ready.')).toBeTruthy();

    // open the minimal S4, choose Low, save
    fireEvent.press(screen.getByRole('button', { name: 'Check in — 30 seconds' }));
    expect(screen.getByText('How are you right now?')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Low'));
    fireEvent.press(screen.getByRole('button', { name: 'Save today’s entry' }));

    // checked-in + the bridge (Low triggers it)
    expect(screen.getByText('Checked in · Low. Your record has begun.')).toBeTruthy();
    expect(screen.getByText('Would something steadying help right now?')).toBeTruthy();

    // re-save as Good — overwrite, no new day, bridge clears (state > 1)
    fireEvent.press(screen.getByRole('button', { name: 'Update today’s check-in' }));
    fireEvent.press(screen.getByLabelText('Good'));
    fireEvent.press(screen.getByRole('button', { name: 'Save today’s entry' }));

    expect(screen.getByText('Checked in · Good. Your record has begun.')).toBeTruthy();
    expect(screen.queryByText('Would something steadying help right now?')).toBeNull();
  });

  it('reaches the away and checked-in states via the dev toggle', () => {
    renderWithProviders(<HomeContainer store={makeFakeStore()} />, { haptics: true });

    fireEvent.press(screen.getByLabelText('dev-state-away'));
    expect(screen.getByText('Your record waited. Nothing was lost.')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('dev-state-checked-in'));
    expect(screen.getByText('Would something steadying help right now?')).toBeTruthy();
  });
});
