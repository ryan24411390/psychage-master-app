import { fireEvent, screen } from '@testing-library/react-native';
import { SaveButton } from '@/features/bookmarks/SaveButton';
import { useBookmarkedIds, useToggleBookmark } from '@/features/bookmarks/hooks';
import { renderWithProviders } from './_helpers';

jest.mock('@/features/bookmarks/hooks', () => ({
  useBookmarkedIds: jest.fn(),
  useToggleBookmark: jest.fn(),
}));

const mockIds = useBookmarkedIds as unknown as jest.Mock;
const mockToggle = useToggleBookmark as unknown as jest.Mock;

function setup(opts: { saved?: boolean }) {
  const mutate = jest.fn();
  mockIds.mockReturnValue({ data: new Set(opts.saved ? ['a-1'] : []) });
  mockToggle.mockReturnValue({ mutate });
  renderWithProviders(<SaveButton resourceType="article" resourceId="a-1" testID="save" />, { haptics: true });
  return { mutate };
}

describe('SaveButton (T-004, local-first)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('tap on an unsaved item toggles with wasSaved=false — no auth wall (P13)', () => {
    const { mutate } = setup({ saved: false });
    fireEvent.press(screen.getByTestId('save'));
    expect(mutate).toHaveBeenCalledWith({
      ref: { resource_type: 'article', resource_id: 'a-1' },
      wasSaved: false,
    });
  });

  it('exposes saved state to screen readers and removes on tap (AC-2.1)', () => {
    const { mutate } = setup({ saved: true });
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
