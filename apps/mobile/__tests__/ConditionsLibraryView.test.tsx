import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));

import { ConditionsLibraryView } from '@/features/conditions/ConditionsLibraryView';
import { selectConditionCategories } from '@/features/conditions/select';

import { renderWithProviders } from './_helpers';

// Forbidden diagnostic-claim phrases (root CLAUDE.md SR-2 / Sacred Rule #2).
const DIAGNOSTIC_PHRASES = ['you have', 'diagnosed with', 'diagnosis confirmed'];

describe('Conditions library (list)', () => {
  beforeEach(() => {
    (router.push as jest.Mock).mockClear();
  });

  it('renders every condition topic from the reviewed taxonomy', () => {
    renderWithProviders(<ConditionsLibraryView />);
    for (const cat of selectConditionCategories()) {
      expect(screen.getByTestId(`condition-row-${cat.slug}`)).toBeTruthy();
    }
  });

  it('opens a topic overview on press', () => {
    renderWithProviders(<ConditionsLibraryView />);
    fireEvent.press(screen.getByTestId('condition-row-anxiety-stress'));
    expect(router.push as jest.Mock).toHaveBeenCalledWith('/conditions/anxiety-stress');
  });

  it('keeps the crisis Help-now pill reachable (SR-2)', () => {
    renderWithProviders(<ConditionsLibraryView />);
    expect(screen.getByLabelText('Help now')).toBeTruthy();
  });

  it('uses token background, never hardcoded bg-white / text-black', () => {
    renderWithProviders(<ConditionsLibraryView />);
    const tree = JSON.stringify(screen.toJSON());
    expect(tree).toContain('bg-background');
    expect(tree).not.toContain('bg-white');
    expect(tree).not.toContain('text-black');
  });

  it('contains no diagnostic-claim language (SR-2) and is not a diagnostic flow (SR-3)', () => {
    renderWithProviders(<ConditionsLibraryView />);
    const tree = JSON.stringify(screen.toJSON()).toLowerCase();
    for (const phrase of DIAGNOSTIC_PHRASES) {
      expect(tree).not.toContain(phrase);
    }
  });
});
