import type { CheckInEntry, CheckInState } from '@psychage/shared/check-in';
import { fireEvent, screen } from '@testing-library/react-native';

import { HistoryContainer, type HistoryStore } from '@/components/history/HistoryContainer';

import { renderWithProviders } from './_helpers';

// S7 History — the continuum reads the local store (injected double; the real store imports
// the shared package at runtime, which Jest doesn't transform). The terrain is the only
// voice — no aggregates. Tapping an entry column → S8 (wired in R3).

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function entry(date: string, state: CheckInState, note?: string): CheckInEntry {
  return (note === undefined ? { id: date, date, state } : { id: date, date, state, note }) as CheckInEntry;
}

function makeStore(entries: CheckInEntry[], priorWeekCount = 0): HistoryStore {
  return {
    getRecent: (n) =>
      [...entries].sort((a, b) => (b.date as string).localeCompare(a.date as string)).slice(0, n),
    // isReflectionAvailable only checks the count; contents are irrelevant here.
    getRange: () => Array.from({ length: priorWeekCount }, () => ({}) as CheckInEntry),
  };
}

describe('HistoryContainer (S7)', () => {
  it('renders the "Your record" heading', () => {
    renderWithProviders(<HistoryContainer store={makeStore([])} />);
    expect(screen.getByText('Your record')).toBeTruthy();
  });

  it('renders a tappable entry column with the verbatim VoiceOver label', () => {
    const today = entry(ymd(new Date()), 3, 'tired');
    renderWithProviders(<HistoryContainer store={makeStore([today])} />);
    // The entry's overlay hit-target carries the verbatim "…: Good, with a note: tired."
    expect(screen.getByLabelText(/: Good, with a note: tired\.$/)).toBeTruthy();
  });

  it('shows the reflection-ready row when available and navigates on press', () => {
    const navSpy = jest.fn();
    renderWithProviders(
      <HistoryContainer store={makeStore([], 3)} navigateToReflection={navSpy} />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'This week’s reflection is ready.' }));
    expect(navSpy).toHaveBeenCalledTimes(1);
  });

  it('hides the reflection-ready row when no reflection is available', () => {
    renderWithProviders(<HistoryContainer store={makeStore([])} />);
    expect(screen.queryByText('This week’s reflection is ready.')).toBeNull();
  });

  it('empty record renders the current week with no entry targets (no unlock copy)', () => {
    renderWithProviders(<HistoryContainer store={makeStore([])} />);
    expect(screen.getByText('Your record')).toBeTruthy();
    expect(screen.queryByLabelText(/: (Very low|Low|Okay|Good|Very good)/)).toBeNull();
  });
});
