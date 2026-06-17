import type { EngagementStore, Moment, MomentDraft } from '@psychage/shared/engagement';
import { fireEvent, screen } from '@testing-library/react-native';

import { HomeContainer } from '@/components/home/HomeContainer';
import { priorWeekBounds } from '@/lib/home-model';

import { renderWithProviders } from './_helpers';

// End-to-end live flow with an in-memory EngagementStore double — the real store imports
// the shared package at runtime, which Jest doesn't transform, so we inject a double here
// and exercise the real store separately under Vitest (moment-store.test).
//
// HomeContainer derives its day view-model through dailyRollupReader(store), which maps each
// moment's primary WORD to a band; the double only needs to back getAll()/append().

function makeStore(initial: Moment[] = []): EngagementStore {
  const moments = [...initial];
  let n = 0;
  return {
    append: (draft: MomentDraft) => {
      const m: Moment = {
        id: `m${n++}`,
        timestamp: new Date().toISOString(),
        labelPrimary: draft.labelPrimary,
        routedToSupport: draft.routedToSupport ?? false,
        ...(draft.labelSecondary !== undefined ? { labelSecondary: draft.labelSecondary } : {}),
        ...(draft.intensity !== undefined ? { intensity: draft.intensity } : {}),
        ...(draft.note !== undefined ? { note: draft.note } : {}),
      };
      moments.push(m);
      return m;
    },
    getAll: () => [...moments],
    getRecent: (count) => [...moments].slice(-count).reverse(),
    getRange: () => [...moments],
    dayRollup: () => [],
    ingestRemote: () => {},
  };
}

function moment(id: string, ts: string, labelPrimary: string): Moment {
  return { id, timestamp: ts, labelPrimary, routedToSupport: false };
}

// A store whose prior Mon–Sun week holds ≥3 moments → the reflection row is available.
function makeAvailableStore(): EngagementStore {
  const { from } = priorWeekBounds(new Date());
  const [y, mo, d] = from.split('-').map(Number);
  const noon = (offset: number) =>
    new Date(y ?? 2026, (mo ?? 1) - 1, (d ?? 1) + offset, 12, 0, 0).toISOString();
  return makeStore([
    moment('a', noon(0), 'steady'),
    moment('b', noon(1), 'steady'),
    moment('c', noon(2), 'steady'),
  ]);
}

const REFLECTION_COPY = 'This week’s reflection is ready.';

describe('HomeContainer (S3 live flow)', () => {
  it('first-run → name a low-band feeling → checked-in + bridge; the capture CTA is replaced', () => {
    renderWithProviders(<HomeContainer store={makeStore()} />, { haptics: true });

    // first-run (empty store)
    expect(screen.getByText('This is your space. It starts whenever you’re ready.')).toBeTruthy();

    // open capture, name 'Anxious' (band 2 → DailyState 1 = Low), save
    fireEvent.press(screen.getByRole('button', { name: 'Check in — 30 seconds' }));
    expect(screen.getByText('Name what you feel')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Anxious' }));
    fireEvent.press(screen.getByRole('button', { name: 'Save this moment' }));

    // checked-in + the bridge (a low band triggers it) — on the home behind the ack beat
    expect(screen.getByText('Checked in · Low. Your record has begun.')).toBeTruthy();
    expect(screen.getByText('Would something steadying help right now?')).toBeTruthy();

    // The adaptive PrimaryAction takes over once today is checked in: the capture CTA and
    // the naming form are gone (the sheet shows its acknowledgment beat).
    expect(screen.queryByRole('button', { name: 'Check in — 30 seconds' })).toBeNull();
    expect(screen.queryByText('Name what you feel')).toBeNull();
    expect(screen.getByText('You noticed that.')).toBeTruthy();
  });

  it('steadying bridge: Breathing chip navigates and "Not now" dismisses it', () => {
    const breathSpy = jest.fn();
    renderWithProviders(<HomeContainer store={makeStore()} navigateToBreathing={breathSpy} />, {
      haptics: true,
    });

    fireEvent.press(screen.getByRole('button', { name: 'Check in — 30 seconds' }));
    fireEvent.press(screen.getByRole('button', { name: 'Anxious' }));
    fireEvent.press(screen.getByRole('button', { name: 'Save this moment' }));
    expect(screen.getByText('Would something steadying help right now?')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Breathing · 1 min' }));
    expect(breathSpy).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByRole('button', { name: 'Not now' }));
    expect(screen.queryByText('Would something steadying help right now?')).toBeNull();
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
    const navSpy = jest.fn();
    renderWithProviders(
      <HomeContainer store={makeAvailableStore()} reflectionGate={gate} navigateToReflection={navSpy} />,
      { haptics: true },
    );

    expect(screen.getByText(REFLECTION_COPY)).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: REFLECTION_COPY }));
    expect(opened).toBe(true);
    expect(navSpy).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(REFLECTION_COPY)).toBeNull();
  });

  it('does not show the row once it has already been opened', () => {
    const gate = { isOpened: () => true, markOpened: () => {} };
    renderWithProviders(<HomeContainer store={makeAvailableStore()} reflectionGate={gate} />, {
      haptics: true,
    });
    expect(screen.queryByText(REFLECTION_COPY)).toBeNull();
  });
});

describe('HomeContainer — autoOpenCheckIn (onboarding → capture)', () => {
  it('opens the capture sheet on mount when autoOpenCheckIn is set', () => {
    renderWithProviders(<HomeContainer store={makeStore()} autoOpenCheckIn />, { haptics: true });
    expect(screen.getByText('Name what you feel')).toBeTruthy();
  });

  it('does not open the sheet by default', () => {
    renderWithProviders(<HomeContainer store={makeStore()} />, { haptics: true });
    expect(screen.queryByText('Name what you feel')).toBeNull();
  });
});
