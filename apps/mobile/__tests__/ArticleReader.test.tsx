import { screen } from '@testing-library/react-native';

jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));

import { ArticleReader } from '@/features/content/ArticleReader';

import { renderWithProviders } from './_helpers';

describe('S22 ArticleReader', () => {
  it('shows the FULL verbatim Dr. Dobson credit, never truncated', () => {
    renderWithProviders(<ArticleReader slug="anxiety" />);
    const credit = screen.getByText(
      'Reviewed by Dr. Lena Dobson, Ph.D. in Clinical Neuropsychology',
    );
    expect(credit).toBeTruthy();
    // Never shortened: no numberOfLines / truncation on the credential.
    expect(credit.props.numberOfLines).toBeUndefined();
  });

  it('renders the pressed "read on {weekday}" mark for a read article', () => {
    renderWithProviders(<ArticleReader slug="anxiety" />);
    expect(screen.getByTestId('article-read-badge')).toBeTruthy();
    expect(screen.getByText('You read this on Tuesday')).toBeTruthy();
  });
});
