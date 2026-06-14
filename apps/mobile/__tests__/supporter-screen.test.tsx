import { fireEvent, screen, waitFor } from '@testing-library/react-native';

jest.mock('@/lib/iap/contribute', () => ({
  purchaseContribution: jest.fn(() => Promise.resolve({ purchased: false, available: false })),
}));

import SupporterScreen from '@/app/settings/supporter';
import { purchaseContribution } from '@/lib/iap/contribute';

import { renderWithProviders } from './_helpers';

const iapMock = purchaseContribution as unknown as jest.Mock;

describe('S50 Supporter (Keep Psychage free)', () => {
  beforeEach(() => {
    iapMock.mockClear();
  });

  it('renders the calm framing and the contribution tiers', () => {
    renderWithProviders(<SupporterScreen />);
    expect(screen.getByText('Keep Psychage free')).toBeTruthy();
    expect(screen.getByTestId('supporter-tier-supporter_small')).toBeTruthy();
    expect(screen.getByTestId('supporter-tier-supporter_large')).toBeTruthy();
  });

  it('uses no crisis or error color anywhere (calm surface)', () => {
    renderWithProviders(<SupporterScreen />);
    const tree = JSON.stringify(screen.toJSON());
    expect(tree).not.toContain('crisis');
    expect(tree).not.toContain('error');
  });

  it('selecting a tier calls the IAP boundary; unavailable shows a calm line, not an error', async () => {
    renderWithProviders(<SupporterScreen />);
    fireEvent.press(screen.getByTestId('supporter-tier-supporter_medium'));
    expect(iapMock).toHaveBeenCalledWith('supporter_medium');
    await waitFor(() => expect(screen.getByTestId('supporter-unavailable')).toBeTruthy());
  });
});
