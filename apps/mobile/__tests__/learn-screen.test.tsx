import { screen } from '@testing-library/react-native';

import LearnScreen from '@/app/(tabs)/learn';

import { renderWithProviders } from './_helpers';

describe('LearnScreen — canonical token-conformant template', () => {
  it('renders title + placeholder body', () => {
    renderWithProviders(<LearnScreen />);
    expect(screen.getByText('Learn')).toBeOnTheScreen();
    expect(screen.getByText('Coming soon.')).toBeOnTheScreen();
  });

  it('uses the token background, never a hardcoded bg-white / text-black', () => {
    renderWithProviders(<LearnScreen />);
    const tree = JSON.stringify(screen.toJSON());
    expect(tree).toContain('bg-background');
    expect(tree).not.toContain('bg-white');
    expect(tree).not.toContain('text-black');
  });
});
