import { fireEvent, screen } from '@testing-library/react-native';

import { OfflineFallback } from '@/features/offline/OfflineFallback';

import { renderWithProviders } from './_helpers';

describe('OfflineFallback', () => {
  it('offline variant shows the honest line and a working retry', () => {
    const onRetry = jest.fn();
    renderWithProviders(<OfflineFallback variant="offline" onRetry={onRetry} />, { haptics: true });
    expect(screen.getByText("You're offline")).toBeTruthy();
    fireEvent.press(screen.getByTestId('offline-retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('empty variant shows the honest empty line', () => {
    renderWithProviders(<OfflineFallback variant="empty" />);
    expect(screen.getByText('Nothing here yet')).toBeTruthy();
  });
});
