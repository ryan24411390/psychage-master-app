import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));

// Resolver is the wayfinding seam (categories + conditions); mock it directly so
// the view test exercises rendering, not the real KB/taxonomy (covered elsewhere).
jest.mock('@/lib/discovery/signal-map', () => ({ resolveQuery: jest.fn() }));

// Partial-mock the article barrel: real types/other exports stay, only the two
// network fns the view calls are stubbed.
jest.mock('@/lib/articles', () => ({
  ...jest.requireActual('@/lib/articles'),
  searchArticles: jest.fn(),
  listPopulatedCategories: jest.fn(),
}));

import { SearchView } from '@/features/learn/SearchView';
import { listPopulatedCategories, searchArticles } from '@/lib/articles';
import type { ArticleCategory, ArticleListItem } from '@/lib/articles';
import { resolveQuery } from '@/lib/discovery/signal-map';

import { renderWithProviders } from './_helpers';

const mockResolve = resolveQuery as jest.Mock;
const mockSearch = searchArticles as jest.Mock;
const mockCats = listPopulatedCategories as jest.Mock;

const article = (slug: string): ArticleListItem => ({
  slug,
  title: `Title ${slug}`,
  seoDescription: '',
  heroImageUrl: null,
  readTime: null,
  tags: [],
  categoryName: '',
  categorySlug: '',
  createdAt: '2026-01-01',
});

const category = (slug: string, name: string): ArticleCategory => ({
  slug,
  name,
  icon: null,
  color: null,
  displayOrder: 0,
  articleCount: 1,
});

function renderSearch() {
  return renderWithProviders(<SearchView />, { haptics: true, query: true });
}

beforeEach(() => {
  (router.push as jest.Mock).mockClear();
  mockResolve.mockReset().mockResolvedValue({ categories: [], conditions: [], articles: [] });
  mockSearch.mockReset().mockResolvedValue([]);
  mockCats.mockReset().mockResolvedValue([]);
});

describe('SearchView — dynamic resolver-backed results', () => {
  it('renders categories, conditions, and articles sections for a query', async () => {
    mockResolve.mockResolvedValue({
      categories: [{ slug: 'anxiety-stress', title: 'Anxiety, Stress & Overwhelm', href: '/conditions/anxiety-stress' }],
      conditions: [{ id: 'GAD', title: 'Generalized Anxiety', href: '/learn/conditions/anxiety' }],
      articles: [],
    });
    mockSearch.mockResolvedValue([article('q1')]);

    renderSearch();
    fireEvent.changeText(screen.getByTestId('search-input'), 'anxiety');

    // All three section headers + the resolved rows appear.
    expect(await screen.findByText('Categories')).toBeTruthy();
    expect(screen.getByText('Conditions')).toBeTruthy();
    expect(screen.getByText('Guides')).toBeTruthy();
    expect(screen.getByText('Anxiety, Stress & Overwhelm')).toBeTruthy();
    expect(screen.getByText('Generalized Anxiety')).toBeTruthy();

    // The 40-cap is lifted at the source: search runs with the raised limit.
    expect(mockSearch).toHaveBeenCalledWith('anxiety', 100);
  });

  it('routes a category row via its resolver href', async () => {
    mockResolve.mockResolvedValue({
      categories: [{ slug: 'anxiety-stress', title: 'Anxiety, Stress & Overwhelm', href: '/conditions/anxiety-stress' }],
      conditions: [],
      articles: [],
    });

    renderSearch();
    fireEvent.changeText(screen.getByTestId('search-input'), 'anxiety');

    fireEvent.press(await screen.findByTestId('search-category-anxiety-stress'));
    expect(router.push).toHaveBeenCalledWith('/conditions/anxiety-stress');
  });

  it('condition-only query renders only the Conditions section and routes to the KB guide', async () => {
    mockResolve.mockResolvedValue({
      categories: [],
      conditions: [{ id: 'SAD', title: 'Social Anxiety', href: '/learn/conditions/social-anxiety' }],
      articles: [],
    });

    renderSearch();
    fireEvent.changeText(screen.getByTestId('search-input'), 'social anxiety');

    expect(await screen.findByText('Social Anxiety')).toBeTruthy();
    // No category section/header → no parent-category chip on the condition.
    expect(screen.queryByText('Categories')).toBeNull();

    fireEvent.press(screen.getByTestId('search-condition-SAD'));
    expect(router.push).toHaveBeenCalledWith('/learn/conditions/social-anxiety');
  });

  it('shows live-category intent chips before typing and pre-fills a query on tap', async () => {
    mockCats.mockResolvedValue([
      category('anxiety-stress', 'Anxiety, Stress & Overwhelm'),
      category('sleep', 'Sleep'),
    ]);

    renderSearch();

    // Chip label is the salient head word; tapping pre-fills it into the input.
    fireEvent.press(await screen.findByTestId('search-chip-anxiety-stress'));
    expect(screen.getByTestId('search-input').props.value).toBe('Anxiety');
  });

  it('uses the token background — no hardcoded bg-white / text-black', () => {
    renderSearch();
    const tree = JSON.stringify(screen.toJSON());
    expect(tree).toContain('bg-background');
    expect(tree).not.toContain('bg-white');
    expect(tree).not.toContain('text-black');
  });
});
