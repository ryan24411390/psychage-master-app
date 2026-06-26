import { fireEvent, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from 'expo-router';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));

import LearnScreen from '@/app/(tabs)/(learn)/learn';
import { CT4_LEARN } from '@/features/learn/copy';

import { renderWithProviders } from './_helpers';

// The Browse rebuild (web parity) is a topic index: editorial header, a "not sure
// where to start?" prompt, an INLINE live search box (no pushed search screen), and
// a Topics / Conditions segmented control. ConditionsAccordion runs live TanStack
// Query, so every render needs a QueryClient; retries off so a queryFn resolving to
// [] (no Supabase env in tests) settles synchronously.
function renderLearn() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderWithProviders(
    <QueryClientProvider client={qc}>
      <LearnScreen />
    </QueryClientProvider>,
    { haptics: true },
  );
}

describe('S6 Learn (Browse)', () => {
  beforeEach(() => {
    (router.push as jest.Mock).mockClear();
  });

  it('renders the editorial header, find-path prompt, inline search, and the segmented control', () => {
    renderLearn();
    expect(screen.getByText(CT4_LEARN.browseTitle)).toBeTruthy();
    expect(screen.getByTestId('browse-find-path')).toBeTruthy();
    expect(screen.getByTestId('browse-search-input')).toBeTruthy();
    expect(screen.getByText(CT4_LEARN.segTopics)).toBeTruthy();
    expect(screen.getByText(CT4_LEARN.segConditions)).toBeTruthy();
  });

  it('filters topics inline: a no-match query shows the empty-topics line (search is local, not a route)', () => {
    renderLearn();
    fireEvent.changeText(screen.getByTestId('browse-search-input'), 'zzzzzzzz');
    expect(screen.getByText(CT4_LEARN.topicsEmpty)).toBeTruthy();
    // Inline search must never navigate.
    expect(router.push as jest.Mock).not.toHaveBeenCalled();
  });

  it('switches to Conditions mode via the segmented control (placeholder flips to the all-content one)', () => {
    renderLearn();
    // Topics mode shows the topics-scoped placeholder…
    expect(screen.getByPlaceholderText(CT4_LEARN.searchTopicsPlaceholder)).toBeTruthy();
    fireEvent.press(screen.getByText(CT4_LEARN.segConditions));
    // …Conditions mode swaps it for the broad placeholder (mode state is wired).
    expect(screen.getByPlaceholderText(CT4_LEARN.searchPlaceholder)).toBeTruthy();
  });

  it('uses the token background, never a hardcoded bg-white / text-black', () => {
    renderLearn();
    const tree = JSON.stringify(screen.toJSON());
    expect(tree).toContain('bg-background');
    expect(tree).not.toContain('bg-white');
    expect(tree).not.toContain('text-black');
  });
});
