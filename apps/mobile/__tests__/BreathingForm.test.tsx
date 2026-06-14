import { screen } from '@testing-library/react-native';

import { BreathingForm } from '@/features/toolkit/components/BreathingForm';
import { BREATHING } from '@/features/toolkit/exercises';

import { renderWithProviders } from './_helpers';

describe('BreathingForm (C-BREATH)', () => {
  it('full motion renders the breathing circle + the active phase cue', () => {
    renderWithProviders(<BreathingForm exercise={BREATHING} reduced={false} />);
    expect(screen.getByTestId('breath-circle')).toBeTruthy();
    expect(screen.getByText('Breathe in')).toBeTruthy();
  });

  it('REDUCED motion REMOVES the form entirely — phase word only, no circle', () => {
    renderWithProviders(<BreathingForm exercise={BREATHING} reduced={true} />);
    expect(screen.queryByTestId('breath-circle')).toBeNull();
    expect(screen.getByText('Breathe in')).toBeTruthy();
  });
});
