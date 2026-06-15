import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HapticProvider } from '@/lib/haptic-context';
import { BookmarkSaveSlot } from '@/features/bookmarks/BookmarkSaveSlot';
import {
  useBookmarkedIds,
  useCurrentUserId,
  useToggleBookmark,
} from '@/features/bookmarks/hooks';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useFocusEffect: () => undefined,
}));
jest.mock('@/features/bookmarks/hooks', () => ({
  useCurrentUserId: jest.fn(),
  useBookmarkedIds: jest.fn(),
  useToggleBookmark: jest.fn(),
}));

const METRICS = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } };
function renderSlot(ui: ReactElement) {
  return render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <QueryClientProvider client={new QueryClient()}>
        <HapticProvider>{ui}</HapticProvider>
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}

describe('BookmarkSaveSlot wiring (T-007 / T-008)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('anonymous save tap opens the sign-in sheet; CTA routes to the (auth) flow', () => {
    (useCurrentUserId as unknown as jest.Mock).mockReturnValue({ data: null });
    (useBookmarkedIds as unknown as jest.Mock).mockReturnValue({ data: new Set() });
    (useToggleBookmark as unknown as jest.Mock).mockReturnValue({ mutate: jest.fn() });

    renderSlot(<BookmarkSaveSlot resourceType="article" resourceId="a-1" testID="slot-save" />);

    fireEvent.press(screen.getByTestId('slot-save'));
    expect(screen.getByText('Keep this for later')).toBeTruthy();

    fireEvent.press(screen.getByText('Sign in to save'));
    expect(router.push).toHaveBeenCalledWith('/(auth)/sign-up');
  });

  it('signed-in save tap toggles directly without the sheet', () => {
    const mutate = jest.fn();
    (useCurrentUserId as unknown as jest.Mock).mockReturnValue({ data: 'u-1' });
    (useBookmarkedIds as unknown as jest.Mock).mockReturnValue({ data: new Set() });
    (useToggleBookmark as unknown as jest.Mock).mockReturnValue({ mutate });

    renderSlot(<BookmarkSaveSlot resourceType="provider" resourceId="p-1" testID="slot-save" />);

    fireEvent.press(screen.getByTestId('slot-save'));
    expect(mutate).toHaveBeenCalledWith({ ref: { resource_type: 'provider', resource_id: 'p-1' }, wasSaved: false });
    expect(screen.queryByText('Keep this for later')).toBeNull();
  });
});
