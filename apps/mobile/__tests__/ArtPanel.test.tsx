import { render, screen } from '@testing-library/react-native';

import { ArtPanel } from '@/features/learn/ArtPanel';

// ArtPanel renders a category pictogram poster when given a `posterSlug` that has
// one, an article hero when given `imageUrl`, and falls back to the token gradient
// (no <Image>) when neither resolves. The poster URL is built from the Supabase
// base, so pin it for the duration of the suite.
const BASE = 'https://proj.supabase.co';
const POSTER = `${BASE}/storage/v1/object/public/article-images/category-covers`;

const prevBase = process.env.EXPO_PUBLIC_SUPABASE_URL;
beforeAll(() => {
  process.env.EXPO_PUBLIC_SUPABASE_URL = BASE;
});
afterAll(() => {
  process.env.EXPO_PUBLIC_SUPABASE_URL = prevBase;
});

const tree = () => JSON.stringify(screen.toJSON());

describe('ArtPanel category posters', () => {
  it('shows the pictogram poster for a known category slug', () => {
    render(<ArtPanel artKey="anxiety-stress" posterSlug="anxiety-stress" />);
    expect(tree()).toContain(`${POSTER}/anxiety-stress.jpeg`);
  });

  it('falls back to the gradient (no image) for an orphan slug with no poster', () => {
    render(<ArtPanel artKey="family-parenting" posterSlug="family-parenting" />);
    expect(tree()).not.toContain('category-covers');
    expect(tree()).not.toContain('storage/v1');
  });

  it('renders the gradient when no posterSlug and no imageUrl are given', () => {
    render(<ArtPanel artKey="some-key" />);
    expect(tree()).not.toContain('storage/v1');
  });

  it('prefers the article hero over a category poster when both are set', () => {
    const hero = 'https://cdn.example.com/covers/hero.jpeg';
    render(<ArtPanel artKey="anxiety-stress" imageUrl={hero} posterSlug="anxiety-stress" />);
    const out = tree();
    expect(out).toContain(hero);
    expect(out).not.toContain('category-covers');
  });
});
