import { fireEvent, screen } from '@testing-library/react-native';

import { ReflectionView } from '@/features/reflection/ReflectionView';
import type { WeekReflection } from '@/features/reflection/week';

import { renderWithProviders } from './_helpers';

const WEEK: WeekReflection = {
  weekStartIso: '2026-06-01',
  weekEndIso: '2026-06-07',
  rangeLabel: '1 Jun – 7 Jun',
  days: [
    { label: 'Mon', fullLabel: 'Monday', value: 2 },
    { label: 'Tue', fullLabel: 'Tuesday', value: 2 },
    { label: 'Wed', fullLabel: 'Wednesday', value: 3 },
    { label: 'Thu', fullLabel: 'Thursday', value: null },
    { label: 'Fri', fullLabel: 'Friday', value: null },
    { label: 'Sat', fullLabel: 'Saturday', value: null },
    { label: 'Sun', fullLabel: 'Sunday', value: null },
  ],
  notes: [{ day: 'Tuesday', note: 'tired' }],
  lineKey: 'mostly_steady',
  line: 'Mostly steady this week.',
  entryCount: 3,
};

function renderView(reduced = false) {
  const handlers = { onBack: jest.fn(), onEarlier: jest.fn(), onFullRecord: jest.fn() };
  renderWithProviders(<ReflectionView week={WEEK} reduced={reduced} {...handlers} />);
  return handlers;
}

describe('ReflectionView (S9)', () => {
  it('renders the italic template line, that week’s notes, and the two links', () => {
    renderView();
    expect(screen.getByText('Mostly steady this week.')).toBeTruthy();
    // The note renders with its day: "Tuesday — ‘tired’" (curly quotes); match the word.
    expect(screen.getByText(/tired/)).toBeTruthy();
    expect(screen.getByText('See the full record')).toBeTruthy();
    expect(screen.getByText('Earlier weeks')).toBeTruthy();
  });

  it('routes back, to earlier weeks, and to the full record', () => {
    const h = renderView();
    fireEvent.press(screen.getByLabelText('Earlier weeks'));
    fireEvent.press(screen.getByLabelText('See the full record'));
    fireEvent.press(screen.getByLabelText('Back'));
    expect(h.onEarlier).toHaveBeenCalled();
    expect(h.onFullRecord).toHaveBeenCalled();
    expect(h.onBack).toHaveBeenCalled();
  });

  it('reduced motion still renders the surface (settle skipped)', () => {
    renderView(true);
    expect(screen.getByText('Mostly steady this week.')).toBeTruthy();
  });
});
