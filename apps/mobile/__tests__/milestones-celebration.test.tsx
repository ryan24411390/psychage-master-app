import type { EngagementStore, Moment, MomentDraft } from '@psychage/shared/engagement';
import { fireEvent, screen } from '@testing-library/react-native';

import { HomeContainer } from '@/components/home/HomeContainer';
import { MILESTONES_COPY } from '@/features/milestones/copy';
import { storage } from '@/lib/adapters/storage';
import { STORAGE_KEY as MILESTONES_KEY } from '@/lib/persistence/milestones';

import { renderWithProviders } from './_helpers';

// Celebration fires on the capture that CROSSES a celebrated rung, exactly once, and
// never over a crisis route. The milestone math + fire-once persistence are proven in
// the Vitest unit tests; here we prove the wiring at the capture hook.
//
// In-memory EngagementStore double (mirrors HomeContainer.test). Seeded moments are
// dated on PRIOR days so they count toward the cumulative total without marking "today"
// checked-in — which keeps the capture CTA visible so one more capture crosses a rung.

function makeStore(initial: Moment[] = []): EngagementStore {
  const moments = [...initial];
  let n = 0;
  return {
    append: (draft: MomentDraft) => {
      const m: Moment = {
        id: `m${n++}`,
        timestamp: new Date().toISOString(),
        valence: draft.valence,
        labels: draft.labels ?? [],
        context: draft.context ?? [],
        routedToSupport: draft.routedToSupport ?? false,
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

// `count` moments dated on prior days (today - 1 … today - count): cumulative total
// grows, but none is "today", so the capture CTA stays visible.
function priorMoments(count: number): Moment[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => ({
    id: `seed${i}`,
    timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i + 1), 12, 0, 0).toISOString(),
    valence: 3 as Moment['valence'],
    labels: [],
    context: [],
    routedToSupport: false,
  }));
}

// Suppress the reflection-ready row so it can't collide with celebration assertions.
const noReflection = { isOpened: () => true, markOpened: () => {} };

function captureOnce(valenceLevel: number, crisisLabel?: string) {
  fireEvent.press(screen.getByRole('button', { name: 'Check in — 30 seconds' }));
  fireEvent.press(screen.getByLabelText(`Level ${valenceLevel} of 5`));
  if (crisisLabel) fireEvent.press(screen.getByRole('button', { name: crisisLabel }));
  fireEvent.press(screen.getByRole('button', { name: 'Save this moment' }));
}

describe('milestone celebration (S3 capture hook)', () => {
  // Fake timers so the overlay's auto-dismiss timeout never pends past the test (no
  // leaked handle). We assert dismissal via tap, not the auto timer.
  beforeEach(() => {
    jest.useFakeTimers();
    storage.remove(MILESTONES_KEY);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('crossing the 10 rung fires the celebration once', () => {
    // 9 prior moments + 1 capture = 10 total → the 10 rung is newly crossed.
    renderWithProviders(
      <HomeContainer store={makeStore(priorMoments(9))} reflectionGate={noReflection} />,
      { haptics: true },
    );

    expect(screen.queryByText(MILESTONES_COPY.celebrateBody)).toBeNull();
    captureOnce(3);

    // Exactly one celebration surface (getByText throws if duplicated).
    expect(screen.getByText(MILESTONES_COPY.celebrateBody)).toBeTruthy();
    expect(screen.getByLabelText(MILESTONES_COPY.celebrateA11y(10))).toBeTruthy();
  });

  it('a capture that crosses no celebrated rung does not celebrate (1st rung is silent)', () => {
    // 4 prior + 1 = 5 total → crosses only rung 1, which is silent → no overlay.
    renderWithProviders(
      <HomeContainer store={makeStore(priorMoments(4))} reflectionGate={noReflection} />,
      { haptics: true },
    );

    captureOnce(3);
    expect(screen.queryByText(MILESTONES_COPY.celebrateBody)).toBeNull();
  });

  it('never celebrates over a crisis route (acute capture)', () => {
    const crisisSpy = jest.fn();
    renderWithProviders(
      <HomeContainer
        store={makeStore(priorMoments(9))}
        reflectionGate={noReflection}
        navigateToCrisis={crisisSpy}
      />,
      { haptics: true },
    );

    // Lowest valence + a crisis-adjacent word → routedToSupport → routes, no celebration.
    captureOnce(1, 'Hopeless');
    expect(crisisSpy).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(MILESTONES_COPY.celebrateBody)).toBeNull();
  });

  it('dismissing the celebration removes it', () => {
    renderWithProviders(
      <HomeContainer store={makeStore(priorMoments(9))} reflectionGate={noReflection} />,
      { haptics: true },
    );

    captureOnce(3);
    expect(screen.getByText(MILESTONES_COPY.celebrateBody)).toBeTruthy();

    fireEvent.press(screen.getByLabelText(MILESTONES_COPY.celebrateDismiss));
    expect(screen.queryByText(MILESTONES_COPY.celebrateBody)).toBeNull();
  });
});
