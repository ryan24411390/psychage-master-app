import { fireEvent, screen } from '@testing-library/react-native';
import { SaveButton } from '@/features/bookmarks/SaveButton';
import {
  useBookmarkedIds,
  useCurrentUserId,
  useToggleBookmark,
} from '@/features/bookmarks/hooks';
import { renderWithProviders } from './_helpers';

jest.mock('@/features/bookmarks/hooks', () => ({
  useCurrentUserId: jest.fn(),
  useBookmarkedIds: jest.fn(),
  useToggleBookmark: jest.fn(),
}));

const mockUserId = useCurrentUserId as unknown as jest.Mock;
const mockIds = useBookmarkedIds as unknown as jest.Mock;
const mockToggle = useToggleBookmark as unknown as jest.Mock;

function setup(opts: { userId?: string | null; saved?: boolean }) {
  const mutate = jest.fn();
  mockUserId.mockReturnValue({ data: opts.userId ?? null });
  mockIds.mockReturnValue({ data: new Set(opts.saved ? ['a-1'] : []) });
  mockToggle.mockReturnValue({ mutate });
  const onRequestSignIn = jest.fn();
  renderWithProviders(
    <SaveButton resourceType="article" resourceId="a-1" onRequestSignIn={onRequestSignIn} testID="save" />,
    { haptics: true },
  );
  return { mutate, onRequestSignIn };
}

describe('SaveButton (T-004)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('anonymous tap requests sign-in and does NOT write a bookmark (AC-5.1)', () => {
    const { mutate, onRequestSignIn } = setup({ userId: null });
    fireEvent.press(screen.getByTestId('save'));
    expect(onRequestSignIn).toHaveBeenCalledTimes(1);
    expect(mutate).not.toHaveBeenCalled();
  });

  it('signed-in tap on an unsaved item toggles with wasSaved=false (AC-1.2)', () => {
    const { mutate } = setup({ userId: 'u-1', saved: false });
    fireEvent.press(screen.getByTestId('save'));
    expect(mutate).toHaveBeenCalledWith({
      ref: { resource_type: 'article', resource_id: 'a-1' },
      wasSaved: false,
    });
  });

  it('exposes saved state to screen readers and removes on tap (AC-2.1)', () => {
    const { mutate } = setup({ userId: 'u-1', saved: true });
    const btn = screen.getByTestId('save');
    expect(btn.props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByLabelText('Saved. Tap to remove.')).toBeTruthy();
    fireEvent.press(btn);
    expect(mutate).toHaveBeenCalledWith({
      ref: { resource_type: 'article', resource_id: 'a-1' },
      wasSaved: true,
    });
  });
});
