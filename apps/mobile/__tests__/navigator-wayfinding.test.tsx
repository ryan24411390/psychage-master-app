import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

import { WayfindingSection } from '@/features/navigator/components/WayfindingSection';
import type { SignalToContent } from '@/lib/discovery/types';

import { renderWithProviders } from './_helpers';

// WayfindingSection renders a resolved Navigator signal (resolveNavigatorResult) as plain
// deep-link rows. It is presentational: it routes the {slug/id, title, href} refs it is
// handed and reads no scores or symptom data. These tests feed it a fixed SignalToContent
// and assert the rows render and tap to the right destination.

const CONTENT: SignalToContent = {
  categories: [
    { slug: 'anxiety-stress', title: 'Anxiety & Stress', href: '/conditions/anxiety-stress' },
  ],
  conditions: [{ id: 'GAD', title: 'Generalized Anxiety', href: '/conditions/anxiety-stress' }],
  articles: [
    { slug: 'understanding-anxiety', title: 'Understanding anxiety', href: '/article/understanding-anxiety' },
  ],
};

describe('WayfindingSection', () => {
  beforeEach(() => {
    (router.push as jest.Mock).mockClear();
  });

  it('renders the explore heading and a row per category, condition, and article', () => {
    renderWithProviders(<WayfindingSection content={CONTENT} />);

    expect(screen.getByText('Explore what we have')).toBeTruthy();
    expect(screen.getByText('Anxiety & Stress')).toBeTruthy();
    expect(screen.getByText('Generalized Anxiety')).toBeTruthy();
    expect(screen.getByText('Understanding anxiety')).toBeTruthy();
  });

  it('routes a category row via its href', () => {
    renderWithProviders(<WayfindingSection content={CONTENT} />);

    fireEvent.press(screen.getByTestId('wayfind-category-anxiety-stress'));
    expect(router.push as jest.Mock).toHaveBeenCalledWith('/conditions/anxiety-stress');
  });

  it('routes a condition row to its owning-category page (consumed verbatim)', () => {
    renderWithProviders(<WayfindingSection content={CONTENT} />);

    fireEvent.press(screen.getByTestId('wayfind-condition-GAD'));
    expect(router.push as jest.Mock).toHaveBeenCalledWith('/conditions/anxiety-stress');
  });

  it('routes an article row through the shared article reader', () => {
    renderWithProviders(<WayfindingSection content={CONTENT} />);

    fireEvent.press(screen.getByTestId('wayfind-article-understanding-anxiety'));
    expect(router.push as jest.Mock).toHaveBeenCalledWith({
      pathname: '/article/[slug]',
      params: { slug: 'understanding-anxiety' },
    });
  });

  it('renders nothing when content is null', () => {
    renderWithProviders(<WayfindingSection content={null} />);
    expect(screen.queryByText('Explore what we have')).toBeNull();
  });

  it('renders nothing when every list is empty', () => {
    renderWithProviders(
      <WayfindingSection content={{ categories: [], conditions: [], articles: [] }} />,
    );
    expect(screen.queryByText('Explore what we have')).toBeNull();
  });
});
