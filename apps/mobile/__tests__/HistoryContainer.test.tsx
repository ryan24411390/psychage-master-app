import type { CheckInEntry, CheckInState } from '@psychage/shared/check-in';
import { fireEvent, screen } from '@testing-library/react-native';

import { HistoryContainer, type HistoryStore } from '@/components/history/HistoryContainer';

import { renderWithProviders } from './_helpers';

// S7 History — the continuum reads the local store (injected double; the real store imports
// the shared package at runtime, which Jest doesn't transform). The terrain is the only
// voice — no aggregates. Tapping an entry → S8; S8 "Edit" → S4 edit mode keyed to the
// entry's STORED date (Date Rule 2: editEntry never re-dates).

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function entry(id: string, date: string, state: CheckInState, note?: string): CheckInEntry {
  return (note === undefined ? { id, date, state } : { id, date, state, note }) as CheckInEntry;
}

// In-memory store double honouring the store's contract: editEntry preserves the entry's
// stored date (Date Rule 2). `editEntry` is a jest.fn so calls can be asserted.
function makeStore(
  initial: CheckInEntry[],
  opts: { priorWeekCount?: number; getEntryReturnsUndefined?: boolean } = {},
): HistoryStore & { editEntry: jest.Mock } {
  const entries = [...initial];
  const editEntry = jest.fn((id: string, state: CheckInState, note?: string) => {
    const i = entries.findIndex((e) => e.id === id);
    if (i < 0) throw new Error('not found');
    const prev = entries[i] as CheckInEntry;
    // Date preserved — only state/note change (the store's editEntry never re-dates).
    const updated = (note === undefined
      ? { id: prev.id, date: prev.date, state }
      : { id: prev.id, date: prev.date, state, note }) as CheckInEntry;
    entries[i] = updated;
    return updated;
  });
  return {
    getRecent: (n) =>
      [...entries].sort((a, b) => (b.date as string).localeCompare(a.date as string)).slice(0, n),
    getRange: () => Array.from({ length: opts.priorWeekCount ?? 0 }, () => ({}) as CheckInEntry),
    getEntry: (id) => (opts.getEntryReturnsUndefined ? undefined : entries.find((e) => e.id === id)),
    editEntry,
  };
}

describe('HistoryContainer (S7)', () => {
  it('renders the "Your record" heading', () => {
    renderWithProviders(<HistoryContainer store={makeStore([])} />, { haptics: true });
    expect(screen.getByText('Your record')).toBeTruthy();
  });

  it('renders a tappable entry column with the verbatim VoiceOver label', () => {
    const today = entry('e1', ymd(new Date()), 3, 'tired');
    renderWithProviders(<HistoryContainer store={makeStore([today])} />, { haptics: true });
    expect(screen.getByLabelText(/: Good, with a note: tired\.$/)).toBeTruthy();
  });

  it('shows the reflection-ready row when available and navigates on press', () => {
    const navSpy = jest.fn();
    renderWithProviders(
      <HistoryContainer store={makeStore([], { priorWeekCount: 3 })} navigateToReflection={navSpy} />,
      { haptics: true },
    );
    fireEvent.press(screen.getByRole('button', { name: 'This week’s reflection is ready.' }));
    expect(navSpy).toHaveBeenCalledTimes(1);
  });

  it('hides the reflection-ready row when no reflection is available', () => {
    renderWithProviders(<HistoryContainer store={makeStore([])} />, { haptics: true });
    expect(screen.queryByText('This week’s reflection is ready.')).toBeNull();
  });

  it('empty record renders the current week with no entry targets (no unlock copy)', () => {
    renderWithProviders(<HistoryContainer store={makeStore([])} />, { haptics: true });
    expect(screen.getByText('Your record')).toBeTruthy();
    expect(screen.queryByLabelText(/: (Very low|Low|Okay|Good|Very good)/)).toBeNull();
  });
});

describe('HistoryContainer — S8 detail + S4 edit (Flow 11)', () => {
  it('tap entry → S8 opens with the date, label, and note', () => {
    const past = entry('e1', '2026-06-04', 3, 'tired');
    renderWithProviders(<HistoryContainer store={makeStore([past])} />, { haptics: true });

    fireEvent.press(screen.getByLabelText(/: Good, with a note: tired\.$/));

    expect(screen.getByText('Thursday 4 June 2026')).toBeTruthy();
    expect(screen.getByText('‘tired’')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy();
  });

  it('S8 Edit → S4 edit mode (pre-filled); save keys to the stored id and re-reads', () => {
    const store = makeStore([entry('e1', '2026-06-04', 3, 'tired')]);
    renderWithProviders(<HistoryContainer store={store} />, { haptics: true });

    // Open S8, then Edit.
    fireEvent.press(screen.getByLabelText(/: Good, with a note: tired\.$/));
    fireEvent.press(screen.getByRole('button', { name: 'Edit' }));

    // S4 edit mode, pre-filled.
    expect(screen.getByText('Edit this entry')).toBeTruthy();
    expect(screen.getByLabelText('Good').props.accessibilityState.checked).toBe(true);
    expect(screen.getByPlaceholderText('One word, if you want.').props.value).toBe('tired');

    // Change the state and save → editEntry keyed to the stored id (NOT a date), note kept.
    fireEvent.press(screen.getByLabelText('Okay'));
    fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(store.editEntry).toHaveBeenCalledWith('e1', 2, 'tired');
    // Stored date preserved (Date Rule 2 — editEntry never re-dates).
    expect(store.getEntry('e1')?.date).toBe('2026-06-04');
    // Returns to S8, now showing the updated state.
    expect(screen.getByText('Okay')).toBeTruthy();
    expect(screen.getByText('Thursday 4 June 2026')).toBeTruthy();
  });

  it('defensive: a missing entry does not render S8 (silent return to S7)', () => {
    const today = entry('e1', ymd(new Date()), 3, 'tired');
    renderWithProviders(
      <HistoryContainer store={makeStore([today], { getEntryReturnsUndefined: true })} />,
      { haptics: true },
    );
    fireEvent.press(screen.getByLabelText(/: Good, with a note: tired\.$/));
    // getEntry returns undefined ⇒ no detail sheet (no Edit action surfaces).
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
  });
});
