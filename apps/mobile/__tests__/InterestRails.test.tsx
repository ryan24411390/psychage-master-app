import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/lib/discovery/signal-map', () => ({ resolveInterest: jest.fn() }));
jest.mock('@/lib/nav', () => ({ openArticle: jest.fn() }));

import { resolveInterest } from '@/lib/discovery/signal-map';
import type { SignalToContent } from '@/lib/discovery/types';
import { openArticle } from '@/lib/nav';
import { storage } from '@/lib/adapters/storage';
import { setInterests } from '@/lib/persistence/personalization';

import { InterestRails } from '@/components/home/rails/InterestRails';

import { renderWithProviders } from './_helpers';

const mockResolve = resolveInterest as jest.Mock;

// A resolver result: one category + N wayfinding article refs (no hero image —
// resolveInterest returns refs, posters are the gradient interim).
function signal(slug: string, title: string, articleSlugs: string[]): SignalToContent {
  return {
    categories: [{ slug, title, href: `/conditions/${slug}` }],
    conditions: [],
    articles: articleSlugs.map((s) => ({ slug: s, title: `Guide ${s}`, href: `/article/${s}` })),
  };
}

describe('InterestRails', () => {
  beforeEach(() => {
    mockResolve.mockReset();
    (router.push as jest.Mock).mockClear();
    (openArticle as jest.Mock).mockClear();
    setInterests(storage, []);
  });

  it('renders nothing — and never resolves — when the user has no interests', () => {
    renderWithProviders(<InterestRails />, { haptics: true });
    expect(mockResolve).not.toHaveBeenCalled();
    expect(screen.queryByText('Anxiety & stress')).toBeNull();
  });

  it('renders a category rail per interest: title, live count, See all, poster cards', async () => {
    setInterests(storage, ['anxiety-stress', 'sleep-rest']);
    mockResolve.mockImplementation((tag: string) =>
      Promise.resolve(
        tag === 'anxiety-stress'
          ? signal('anxiety-stress', 'Anxiety & stress', ['a1', 'a2', 'a3'])
          : signal('sleep-rest', 'Sleep & rest', ['s1', 's2']),
      ),
    );

    renderWithProviders(<InterestRails />, { haptics: true });

    expect(await screen.findByText('Anxiety & stress')).toBeTruthy();
    expect(await screen.findByText('Sleep & rest')).toBeTruthy();
    // Live count reflects the resolved article set.
    expect(screen.getByText('3 guides')).toBeTruthy();
    expect(screen.getByText('2 guides')).toBeTruthy();
    // A poster card per article (accessibilityLabel = the article title).
    expect(screen.getByLabelText('Guide a1')).toBeTruthy();

    // "See all" opens the category route; a card opens its article reader.
    fireEvent.press(screen.getByRole('button', { name: 'See all: Anxiety & stress' }));
    expect(router.push as jest.Mock).toHaveBeenCalledWith('/conditions/anxiety-stress');

    fireEvent.press(screen.getByLabelText('Guide a1'));
    expect(openArticle as jest.Mock).toHaveBeenCalledWith('a1');
  });

  it('caps at two rails even when more interests are stored', async () => {
    setInterests(storage, ['anxiety-stress', 'sleep-rest', 'relationships-communication']);
    mockResolve.mockImplementation((tag: string) =>
      Promise.resolve(signal(tag, `Cat ${tag}`, [`${tag}-1`])),
    );

    renderWithProviders(<InterestRails />, { haptics: true });

    await screen.findByText('Cat anxiety-stress');
    expect(mockResolve).toHaveBeenCalledTimes(2);
    expect(mockResolve).toHaveBeenCalledWith('anxiety-stress');
    expect(mockResolve).toHaveBeenCalledWith('sleep-rest');
    expect(mockResolve).not.toHaveBeenCalledWith('relationships-communication');
  });

  it('omits a rail that resolves to no articles (no empty rail)', async () => {
    setInterests(storage, ['anxiety-stress', 'empty-cat']);
    mockResolve.mockImplementation((tag: string) =>
      Promise.resolve(
        tag === 'anxiety-stress'
          ? signal('anxiety-stress', 'Anxiety & stress', ['a1'])
          : signal('empty-cat', 'Empty', []),
      ),
    );

    renderWithProviders(<InterestRails />, { haptics: true });

    await screen.findByText('Anxiety & stress');
    expect(screen.queryByText('Empty')).toBeNull();
  });
});
