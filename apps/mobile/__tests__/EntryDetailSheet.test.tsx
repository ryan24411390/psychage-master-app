import type { CheckInEntry } from '@psychage/shared/check-in';
import { fireEvent, screen } from '@testing-library/react-native';

import { EntryDetailSheet } from '@/components/history/EntryDetailSheet';

import { renderWithProviders } from './_helpers';

// S8 entry detail — read-only: date (Fraunces) + state glyph/label + note, one action
// "Edit". No delete. Mascot absent.
const ENTRY = { id: 'e1', date: '2026-06-04', state: 3, note: 'tired' } as CheckInEntry;

describe('EntryDetailSheet (S8)', () => {
  it('renders the date, state label, note, and a single Edit action (no delete)', () => {
    renderWithProviders(
      <EntryDetailSheet entry={ENTRY} onEdit={() => {}} onClose={() => {}} />,
      { haptics: true },
    );
    expect(screen.getByText('Thursday 4 June 2026')).toBeTruthy();
    expect(screen.getByText('Good')).toBeTruthy();
    expect(screen.getByText('‘tired’')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy();
    expect(screen.queryByText('Delete')).toBeNull();
  });

  it('omits the note line when the entry has none', () => {
    const noNote = { id: 'e2', date: '2026-06-04', state: 2 } as CheckInEntry;
    renderWithProviders(
      <EntryDetailSheet entry={noNote} onEdit={() => {}} onClose={() => {}} />,
      { haptics: true },
    );
    expect(screen.getByText('Okay')).toBeTruthy();
    expect(screen.queryByText(/‘.*’/)).toBeNull();
  });

  it('fires onEdit and onClose', () => {
    const onEdit = jest.fn();
    const onClose = jest.fn();
    renderWithProviders(
      <EntryDetailSheet entry={ENTRY} onEdit={onEdit} onClose={onClose} />,
      { haptics: true },
    );
    fireEvent.press(screen.getByRole('button', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getAllByRole('button', { name: 'Close' })[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
