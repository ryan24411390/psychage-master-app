import { render, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('@/lib/articles', () => ({ getArticleBySlug: jest.fn() }));

import { ArticleReader } from '@/features/content/ArticleReader';
import { getArticleBySlug } from '@/lib/articles';

const ARTICLE = {
  slug: 'why-your-chest-gets-tight',
  title: 'Why your chest gets tight',
  seoDescription: 'A short summary.',
  heroImageUrl: null,
  readTime: 5,
  tags: [],
  categoryName: 'Anxiety, Stress & Overwhelm',
  categorySlug: 'anxiety-stress',
  createdAt: '2026-03-20T00:00:00Z',
  subtitle: null,
  contentHtml: '<p>People who experience anxiety often describe a tight chest.</p>',
  contentFormat: 'html' as const,
  authorName: 'Psychage Team',
  authorRole: 'Editor',
};

const INITIAL_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function renderReader(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>
    </SafeAreaProvider>,
  );
}

describe('S22 ArticleReader', () => {
  beforeEach(() => {
    (getArticleBySlug as jest.Mock).mockReset();
  });

  it('shows the FULL verbatim Dr. Dobson credit + author byline, never truncated', async () => {
    (getArticleBySlug as jest.Mock).mockResolvedValue(ARTICLE);
    renderReader(<ArticleReader slug={ARTICLE.slug} />);
    const credit = await screen.findByText(
      'Reviewed by Dr. Lena Dobson, Ph.D. in Clinical Neuropsychology',
    );
    expect(credit).toBeTruthy();
    expect(credit.props.numberOfLines).toBeUndefined(); // never shortened
    expect(screen.getByText('Psychage Team · Editor')).toBeTruthy();
  });

  it('renders the real title, category and verbatim body prose', async () => {
    (getArticleBySlug as jest.Mock).mockResolvedValue(ARTICLE);
    renderReader(<ArticleReader slug={ARTICLE.slug} />);
    expect(await screen.findByText('Why your chest gets tight')).toBeTruthy();
    expect(screen.getByText('Anxiety, Stress & Overwhelm')).toBeTruthy();
    expect(
      screen.getByText('People who experience anxiety often describe a tight chest.'),
    ).toBeTruthy();
  });

  it('reports absence (never placeholder prose) when the article is missing', async () => {
    (getArticleBySlug as jest.Mock).mockResolvedValue(null);
    renderReader(<ArticleReader slug="does-not-exist" />);
    expect(await screen.findByText('This article isn’t available.')).toBeTruthy();
  });
});
