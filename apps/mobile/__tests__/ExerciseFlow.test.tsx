import { fireEvent, screen } from '@testing-library/react-native';

import { ExerciseFlow } from '@/features/toolkit/ExerciseFlow';
import { BREATHING, GROUNDING } from '@/features/toolkit/exercises';

import { renderWithProviders } from './_helpers';

describe('ExerciseFlow (S19–S21)', () => {
  it('grounding: intro → tap-advance through prompts → "Done." (no meter)', () => {
    renderWithProviders(
      <ExerciseFlow exercise={GROUNDING} onExit={() => {}} onHelp={() => {}} />,
      { haptics: true },
    );
    // S19 intro: the need leads, the name is the secondary label.
    expect(screen.getByText('Come back to where you are.')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Begin' }));
    expect(screen.getByText('Notice five things you can see.')).toBeTruthy();
    expect(screen.getByText('SEE · 5')).toBeTruthy();
    expect(screen.queryByRole('progressbar')).toBeNull();

    // Tap anywhere advances; five prompts → five taps reach S21.
    for (let i = 0; i < 5; i++) {
      fireEvent.press(screen.getByRole('button', { name: 'Next' }));
    }
    expect(screen.getByText('Done.')).toBeTruthy();
  });

  it('keeps the Help-now pill reachable on the exercise surface', () => {
    renderWithProviders(
      <ExerciseFlow exercise={GROUNDING} onExit={() => {}} onHelp={() => {}} />,
      { haptics: true },
    );
    expect(screen.getByLabelText('Help now')).toBeTruthy();
  });

  it('breathing: Begin reveals the breathing form (full motion default)', () => {
    renderWithProviders(
      <ExerciseFlow exercise={BREATHING} onExit={() => {}} onHelp={() => {}} />,
      { haptics: true },
    );
    fireEvent.press(screen.getByRole('button', { name: 'Begin' }));
    expect(screen.getByTestId('breath-circle')).toBeTruthy();
  });
});
