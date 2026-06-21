import { render, fireEvent, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HapticProvider } from '@/lib/haptic-context';
import { BookmarkSaveSlot } from '@/features/bookmarks/BookmarkSaveSlot';
import { useBookmarkedIds, useToggleBookmark } from '@/features/bookmarks/hooks';

jest.mock('@/features/bookmarks/hooks', () => ({
  useBookmarkedIds: jest.fn(),
  useToggleBookmark: jest.fn(),
}));

const METRICS = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } };
function renderSlot(ui: ReactElement) {
  return render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <HapticProvider>{ui}</HapticProvider>
    </SafeAreaProvider>,
  );
}

describe('BookmarkSaveSlot wiring (T-007 / T-008, local-first)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('save tap toggles directly — no sign-in sheet, works signed-out (P13)', () => {
    const mutate = jest.fn();
    (useBookmarkedIds as unknown as jest.Mock).mockReturnValue({ data: new Set() });
    (useToggleBookmark as unknown as jest.Mock).mockReturnValue({ mutate });

    renderSlot(<BookmarkSaveSlot resourceType="provider" resourceId="p-1" testID="slot-save" />);

    fireEvent.press(screen.getByTestId('slot-save'));
    expect(mutate).toHaveBeenCalledWith({ ref: { resource_type: 'provider', resource_id: 'p-1' }, wasSaved: false });
    expect(screen.queryByText('Keep this for later')).toBeNull();
  });
});
