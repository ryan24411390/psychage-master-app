import { fireEvent, screen } from '@testing-library/react-native';

import { InterestPickView } from '@/features/onboarding/InterestPickView';

import { renderWithProviders } from './_helpers';

// The picker renders exactly the categories handed in (the route feeds it the
// canonical DB-populated taxonomy via useLearnCategories) — never a hardcoded set.
const CATEGORIES = [
  { slug: 'emotional-regulation', name: 'Emotional Regulation' },
  { slug: 'anxiety-stress', name: 'Anxiety & Stress' },
] as const;

describe('InterestPickView (P18)', () => {
  it('renders a chip per provided category and nothing more', () => {
    renderWithProviders(<InterestPickView categories={CATEGORIES} onDone={jest.fn()} />, {
      haptics: true,
    });

    expect(screen.getByText('What would you like to explore?')).toBeTruthy();
    expect(screen.getByTestId('interest-chip-emotional-regulation')).toBeTruthy();
    expect(screen.getByTestId('interest-chip-anxiety-stress')).toBeTruthy();
    // A category absent from the provided set is not rendered.
    expect(screen.queryByTestId('interest-chip-sleep-body')).toBeNull();
  });

  it('toggles chips and resolves Continue with the chosen category slugs', () => {
    const onDone = jest.fn();
    renderWithProviders(<InterestPickView categories={CATEGORIES} onDone={onDone} />, {
      haptics: true,
    });

    fireEvent.press(screen.getByTestId('interest-chip-emotional-regulation'));
    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(onDone).toHaveBeenCalledWith(['emotional-regulation']);
  });

  it('Skip resolves with an empty selection (onboarding still completes)', () => {
    const onDone = jest.fn();
    renderWithProviders(<InterestPickView categories={CATEGORIES} onDone={onDone} />, {
      haptics: true,
    });

    fireEvent.press(screen.getByRole('button', { name: 'Skip for now' }));
    expect(onDone).toHaveBeenCalledWith([]);
  });

  it('still offers Continue + Skip when the category set is empty (loading/offline)', () => {
    const onDone = jest.fn();
    renderWithProviders(<InterestPickView categories={[]} onDone={onDone} />, { haptics: true });

    expect(screen.getByRole('button', { name: 'Continue' })).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(onDone).toHaveBeenCalledWith([]);
  });
});
