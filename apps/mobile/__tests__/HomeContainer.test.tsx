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
    // No prior-week history in this fixture → reflection never available (no row).
    getRange: () => [],
  };
}

// A live store whose prior week holds ≥3 entries → the reflection row is available.
// getRange ignores its bounds (isReflectionAvailable only checks the count); contents
// are irrelevant, so plain casts avoid a shared-package runtime import on the Jest path.
function makeAvailableStore(): HomeStore {
  const three = [{}, {}, {}] as unknown as CheckInEntry[];
  return {
    getToday: () => undefined,
    getRecent: () => [{ id: 'r1', date: '2026-01-01', state: 2 }] as unknown as CheckInEntry[],
    saveToday: (state) => ({ id: 's', date: '2026-01-01', state }) as unknown as CheckInEntry,
    getRange: () => three,
  };
}

const REFLECTION_COPY = 'This week’s reflection is ready.';

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

describe('HomeContainer — reflection-ready row (Flow 12, one-time)', () => {
  it('shows the row when available, and opening it marks-opened + hides it', () => {
    let opened = false;
    const gate = {
      isOpened: () => opened,
      markOpened: () => {
        opened = true;
      },
    };
    const navSpy = jest.fn(); // A2/PR-D: nav seam — never touch the real router in a render test
    renderWithProviders(
      <HomeContainer
        store={makeAvailableStore()}
        reflectionGate={gate}
        navigateToReflection={navSpy}
      />,
      { haptics: true },
    );

    expect(screen.getByText(REFLECTION_COPY)).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: REFLECTION_COPY }));

    expect(opened).toBe(true); // dismissal persisted via the gate
    expect(navSpy).toHaveBeenCalledTimes(1); // A2/PR-D: and navigates to S9
    expect(screen.queryByText(REFLECTION_COPY)).toBeNull(); // and gone, in place
  });

  it('does not show the row once it has already been opened', () => {
    const gate = { isOpened: () => true, markOpened: () => {} };
    renderWithProviders(<HomeContainer store={makeAvailableStore()} reflectionGate={gate} />, {
      haptics: true,
    });
    expect(screen.queryByText(REFLECTION_COPY)).toBeNull();
  });
});

// A2/PR-E: onboarding's "Do your first check-in" arrives with ?checkin=1, which the
// index route maps to autoOpenCheckIn → S4 opens over the first-run home on mount.
describe('HomeContainer — autoOpenCheckIn (onboarding → S4)', () => {
  it('opens the check-in sheet on mount when autoOpenCheckIn is set', () => {
    renderWithProviders(<HomeContainer store={makeFakeStore()} autoOpenCheckIn />, { haptics: true });
    expect(screen.getByText('How are you right now?')).toBeTruthy();
  });

  it('does not open the sheet by default', () => {
    renderWithProviders(<HomeContainer store={makeFakeStore()} />, { haptics: true });
    expect(screen.queryByText('How are you right now?')).toBeNull();
  });
});
