import { fireEvent, screen } from '@testing-library/react-native';

import { FirstRunTour } from '@/features/onboarding/FirstRunTour';

import { renderWithProviders } from './_helpers';

// The four tab-intro slides, in order. Slide 1 (Today) was realigned to the event-initiated
// Moments model — the retired daily check-in framing must be gone.
const BODIES = [
  'A calm home base — notice a moment whenever you want.',
  'Plain-language guides on what you might be experiencing.',
  'Tools to explore patterns over time, at your own pace.',
  'Search for licensed providers near you, whenever you’re ready.',
] as const;

describe('FirstRunTour copy (#132)', () => {
  it('slide 1 reads in the Moments register and names no daily / check-in cadence', () => {
    renderWithProviders(<FirstRunTour onDone={() => {}} />);
    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getByText(BODIES[0])).toBeTruthy();
    expect(screen.queryByText(/daily|check-?in/i)).toBeNull();
  });

  it('walks all four slides — none mentions daily/check-in — and ends at "Get started"', () => {
    const onDone = jest.fn();
    renderWithProviders(<FirstRunTour onDone={onDone} />);

    BODIES.forEach((body, i) => {
      expect(screen.getByText(body)).toBeTruthy();
      expect(screen.queryByText(/daily|check-?in/i)).toBeNull();
      if (i < BODIES.length - 1) {
        fireEvent.press(screen.getByRole('button', { name: 'Next' }));
      }
    });

    // terminal slide: structure intact (4 slides) → "Get started" closes the tour
    expect(screen.getByText('Get started')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Finish the tour' }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
