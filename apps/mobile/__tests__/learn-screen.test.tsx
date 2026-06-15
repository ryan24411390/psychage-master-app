import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

import LearnScreen from '@/app/(tabs)/learn';
import { LEARN_CATEGORIES } from '@/features/learn/categories';

import { renderWithProviders } from './_helpers';

describe('S6 Learn', () => {
  beforeEach(() => {
    (router.push as jest.Mock).mockClear();
  });

  it('renders every category (fixed order) with its CT2 placeholder', () => {
    renderWithProviders(<LearnScreen />);
    for (const cat of LEARN_CATEGORIES) {
      expect(screen.getByTestId(`learn-category-${cat.id}`)).toBeTruthy();
      expect(screen.getByTestId(`learn-art-${cat.id}`)).toBeTruthy();
    }
  });

  it('opens the full library (S23 WebView) from the library entry', () => {
    renderWithProviders(<LearnScreen />);
    fireEvent.press(screen.getByTestId('learn-library-entry'));
    expect(router.push as jest.Mock).toHaveBeenCalledWith('/library');
  });

  it('uses the token background, never a hardcoded bg-white / text-black', () => {
    renderWithProviders(<LearnScreen />);
    const tree = JSON.stringify(screen.toJSON());
    expect(tree).toContain('bg-background');
    expect(tree).not.toContain('bg-white');
    expect(tree).not.toContain('text-black');
  });
});
