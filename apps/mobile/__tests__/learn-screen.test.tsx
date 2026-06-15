import { fireEvent, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from 'expo-router';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));

import LearnScreen from '@/app/(tabs)/learn';
import { CT4_LEARN } from '@/features/learn/copy';

import { renderWithProviders } from './_helpers';

// The redesigned Learn feed runs live TanStack Query (recent-articles + saved),
// so every render needs a QueryClient. Retries off so a queryFn that resolves to
// [] (no Supabase env in tests) settles synchronously without backoff noise.
function renderLearn() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderWithProviders(
    <QueryClientProvider client={qc}>
      <LearnScreen />
    </QueryClientProvider>,
    { haptics: true },
  );
}

describe('S6 Learn', () => {
  beforeEach(() => {
    (router.push as jest.Mock).mockClear();
  });

  it('renders the search-first hero (title + search + find-your-path)', () => {
    renderLearn();
    expect(screen.getByText(CT4_LEARN.heroTitle)).toBeTruthy();
    expect(screen.getByTestId('learn-search-trigger')).toBeTruthy();
    expect(screen.getByTestId('learn-find-path')).toBeTruthy();
  });

  it('routes the search trigger to the pushed search screen', () => {
    renderLearn();
    fireEvent.press(screen.getByTestId('learn-search-trigger'));
    expect(router.push as jest.Mock).toHaveBeenCalledWith('/learn/search');
  });

  it('opens the full library (S23 WebView) from the library entry', () => {
    renderLearn();
    fireEvent.press(screen.getByTestId('learn-library-entry'));
    expect(router.push as jest.Mock).toHaveBeenCalledWith('/library');
  });

  it('opens the conditions library from the conditions entry', () => {
    renderLearn();
    fireEvent.press(screen.getByTestId('learn-conditions-entry'));
    expect(router.push as jest.Mock).toHaveBeenCalledWith('/conditions');
  });

  it('uses the token background, never a hardcoded bg-white / text-black', () => {
    renderLearn();
    const tree = JSON.stringify(screen.toJSON());
    expect(tree).toContain('bg-background');
    expect(tree).not.toContain('bg-white');
    expect(tree).not.toContain('text-black');
  });
});
