import { screen } from '@testing-library/react-native';

import { PsychageLogoMark } from '@/components/brand/PsychageLogoMark';

import { renderWithProviders } from './_helpers';

describe('PsychageLogoMark', () => {
  it('renders the brand mark with an accessible label', () => {
    renderWithProviders(<PsychageLogoMark testID="welcome-logo" />);
    expect(screen.getByTestId('welcome-logo', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByLabelText('Psychage', { includeHiddenElements: true })).toBeTruthy();
  });
});
