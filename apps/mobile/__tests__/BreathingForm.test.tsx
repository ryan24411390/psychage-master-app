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

  // The countdown is hidden from the a11y tree (it ticks each second — announcing it would
  // spam VoiceOver; the phase word carries the meaning), so queries opt into hidden elements.
  it('shows the per-phase countdown (visible count) in full motion — inhale starts at 4', () => {
    renderWithProviders(<BreathingForm exercise={BREATHING} reduced={false} />);
    expect(screen.getByText('4', { includeHiddenElements: true })).toBeTruthy();
  });

  it('shows the countdown under reduced motion too (informational, not animation)', () => {
    renderWithProviders(<BreathingForm exercise={BREATHING} reduced={true} />);
    expect(screen.getByText('4', { includeHiddenElements: true })).toBeTruthy();
  });

  it('honours a passed pacing override (drives the countdown, not exercise.pacing)', () => {
    renderWithProviders(
      <BreathingForm
        exercise={BREATHING}
        pacing={{ inhale: 8000, hold: 0, exhale: 8000 }}
        reduced={false}
      />,
    );
    expect(screen.getByText('8', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByText('4', { includeHiddenElements: true })).toBeNull();
  });
});
