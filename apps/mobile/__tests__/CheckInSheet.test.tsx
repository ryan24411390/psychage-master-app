import { fireEvent, screen } from '@testing-library/react-native';

import { CheckInSheet } from '@/components/check-in/CheckInSheet';

import { renderWithProviders } from './_helpers';

// S4 the full check-in / edit sheet: the five-state selector (C0.4) + an optional note
// (≤24) + save. Store-agnostic — onSave(state, note?). Two modes (check-in / edit), the
// failed-write error state, and the verbatim copy are all exercised here.
describe('CheckInSheet — check-in mode', () => {
  it('renders the title, subline, five rows, note field, and the privacy line', () => {
    renderWithProviders(<CheckInSheet onSave={() => {}} onClose={() => {}} />, { haptics: true });
    expect(screen.getByText('How are you right now?')).toBeTruthy();
    expect(screen.getByText('There’s no wrong answer.')).toBeTruthy();
    expect(screen.getAllByRole('radio')).toHaveLength(5);
    expect(screen.getByPlaceholderText('One word, if you want.')).toBeTruthy();
    expect(screen.getByText('Stays on your phone.')).toBeTruthy();
  });

  it('caps the note at 24 characters (the store NOTE_MAX_LENGTH)', () => {
    renderWithProviders(<CheckInSheet onSave={() => {}} onClose={() => {}} />, { haptics: true });
    expect(screen.getByPlaceholderText('One word, if you want.').props.maxLength).toBe(24);
  });

  it('does not save while nothing is selected (save disabled)', () => {
    const onSave = jest.fn();
    renderWithProviders(<CheckInSheet onSave={onSave} onClose={() => {}} />, { haptics: true });
    fireEvent.press(screen.getByRole('button', { name: 'Save today’s entry' }));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves the selected state with no note', () => {
    const onSave = jest.fn();
    renderWithProviders(<CheckInSheet onSave={onSave} onClose={() => {}} />, { haptics: true });
    fireEvent.press(screen.getByLabelText('Low'));
    fireEvent.press(screen.getByRole('button', { name: 'Save today’s entry' }));
    expect(onSave).toHaveBeenCalledWith(1, undefined);
  });

  it('saves the selected state with a trimmed note', () => {
    const onSave = jest.fn();
    renderWithProviders(<CheckInSheet onSave={onSave} onClose={() => {}} />, { haptics: true });
    fireEvent.press(screen.getByLabelText('Good'));
    fireEvent.changeText(screen.getByPlaceholderText('One word, if you want.'), '  tired  ');
    fireEvent.press(screen.getByRole('button', { name: 'Save today’s entry' }));
    expect(onSave).toHaveBeenCalledWith(3, 'tired');
  });
});

describe('CheckInSheet — edit mode', () => {
  it('renders the edit title (no subline) and pre-fills state + note, save enabled', () => {
    const onSave = jest.fn();
    renderWithProviders(
      <CheckInSheet mode="edit" initialState={2} initialNote="okay day" onSave={onSave} onClose={() => {}} />,
      { haptics: true },
    );
    expect(screen.getByText('Edit this entry')).toBeTruthy();
    expect(screen.queryByText('There’s no wrong answer.')).toBeNull();
    expect(screen.getByLabelText('Okay').props.accessibilityState.checked).toBe(true);
    expect(screen.getByPlaceholderText('One word, if you want.').props.value).toBe('okay day');
    // Pre-filled → save is enabled immediately (no fresh selection needed).
    fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith(2, 'okay day');
  });
});

describe('CheckInSheet — failed local write', () => {
  it('shows the verbatim error and preserves the selection so the user can retry', () => {
    let throwOnce = true;
    const onSave = jest.fn(() => {
      if (throwOnce) {
        throwOnce = false;
        throw new Error('storage full');
      }
    });
    renderWithProviders(<CheckInSheet onSave={onSave} onClose={() => {}} />, { haptics: true });

    fireEvent.press(screen.getByLabelText('Very good'));
    fireEvent.press(screen.getByRole('button', { name: 'Save today’s entry' }));

    // The verbatim Flow 2 line; the sheet stays open with the selection intact.
    expect(screen.getByText('We couldn’t save that. Try once more.')).toBeTruthy();
    expect(screen.getByLabelText('Very good').props.accessibilityState.checked).toBe(true);

    // Retry succeeds; the same selection (4) is preserved.
    fireEvent.press(screen.getByRole('button', { name: 'Save today’s entry' }));
    expect(onSave).toHaveBeenLastCalledWith(4, undefined);
  });
});
