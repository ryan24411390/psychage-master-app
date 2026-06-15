import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
// The hub reads its topics from the live DB taxonomy; mock the hook so the screen
// test stays pure (no network, no QueryClient) and exercises the render path.
jest.mock('@/features/learn/hooks', () => ({ useLearnCategories: jest.fn() }));

import LearnScreen from '@/app/(tabs)/learn';
import { useLearnCategories } from '@/features/learn/hooks';

import { renderWithProviders } from './_helpers';

const CATEGORIES = [
  {
    slug: 'anxiety-stress',
    name: 'Anxiety, Stress & Overwhelm',
    icon: 'Brain',
    color: '#14B8A6',
    displayOrder: 2,
    articleCount: 82,
  },
  {
    slug: 'sleep-body-connection',
    name: 'Sleep, Body & Mind-Body Connection',
    icon: 'Moon',
    color: '#14B8A6',
    displayOrder: 9,
    articleCount: 60,
  },
];

function mockCategories(value: {
  data?: typeof CATEGORIES;
  isLoading?: boolean;
  isError?: boolean;
}) {
  (useLearnCategories as jest.Mock).mockReturnValue({
    data: value.data,
    isLoading: value.isLoading ?? false,
    isError: value.isError ?? false,
  });
}

describe('S6 Learn', () => {
  beforeEach(() => {
    (router.push as jest.Mock).mockClear();
    (useLearnCategories as jest.Mock).mockReset();
  });

  it('renders each populated DB category and routes by slug + name (no hardcoded ids)', () => {
    mockCategories({ data: CATEGORIES });
    renderWithProviders(<LearnScreen />);
    for (const cat of CATEGORIES) {
      expect(screen.getByTestId(`learn-category-${cat.slug}`)).toBeTruthy();
      expect(screen.getByTestId(`learn-art-${cat.slug}`)).toBeTruthy();
    }
    fireEvent.press(screen.getByTestId('learn-category-anxiety-stress'));
    expect(router.push as jest.Mock).toHaveBeenCalledWith({
      pathname: '/learn/[category]',
      params: { category: 'anxiety-stress', name: 'Anxiety, Stress & Overwhelm' },
    });
  });

  it('reports absence (never fabricates) when the taxonomy fails to load', () => {
    mockCategories({ data: [], isError: true });
    renderWithProviders(<LearnScreen />);
    expect(screen.queryByTestId('learn-category-anxiety-stress')).toBeNull();
    expect(screen.getByText('This could not be loaded right now. Please try again.')).toBeTruthy();
  });

  it('opens the full library (S23 WebView) from the library entry', () => {
    mockCategories({ data: CATEGORIES });
    renderWithProviders(<LearnScreen />);
    fireEvent.press(screen.getByTestId('learn-library-entry'));
    expect(router.push as jest.Mock).toHaveBeenCalledWith('/library');
  });

  it('uses the token background, never a hardcoded bg-white / text-black', () => {
    mockCategories({ data: CATEGORIES });
    renderWithProviders(<LearnScreen />);
    const tree = JSON.stringify(screen.toJSON());
    expect(tree).toContain('bg-background');
    expect(tree).not.toContain('bg-white');
    expect(tree).not.toContain('text-black');
  });
});
