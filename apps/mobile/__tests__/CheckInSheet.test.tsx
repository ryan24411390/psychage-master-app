import { fireEvent, screen } from '@testing-library/react-native';

import { CheckInSheet } from '@/components/check-in/CheckInSheet';

import { renderWithProviders } from './_helpers';

// Minimal S4 (sub-slice E): the five-state selector + save → onSave(state) → close.
// State-only (no note field — that is the full S4, a separate order). Store-agnostic.
describe('CheckInSheet (minimal S4)', () => {
  it('renders the title, five rows, and the privacy line', () => {
    renderWithProviders(<CheckInSheet onSave={() => {}} onClose={() => {}} />, { haptics: true });
    expect(screen.getByText('How are you right now?')).toBeTruthy();
    expect(screen.getAllByRole('radio')).toHaveLength(5);
    expect(screen.getByText('Stays on your phone.')).toBeTruthy();
  });

  it('does not save while nothing is selected (save disabled)', () => {
    const onSave = jest.fn();
    renderWithProviders(<CheckInSheet onSave={onSave} onClose={() => {}} />, { haptics: true });
    fireEvent.press(screen.getByRole('button', { name: 'Save today’s entry' }));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves the selected state', () => {
    const onSave = jest.fn();
    renderWithProviders(<CheckInSheet onSave={onSave} onClose={() => {}} />, { haptics: true });
    fireEvent.press(screen.getByLabelText('Low'));
    fireEvent.press(screen.getByRole('button', { name: 'Save today’s entry' }));
    expect(onSave).toHaveBeenCalledWith(1);
  });
});
