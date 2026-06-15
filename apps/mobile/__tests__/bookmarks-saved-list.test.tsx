import { fireEvent, screen } from '@testing-library/react-native';
import { SavedList } from '@/features/bookmarks/SavedList';
import { useBookmarks } from '@/features/bookmarks/hooks';
import { renderWithProviders } from './_helpers';

// SavedRow does per-row resource resolution via its own useQuery; stub it to a
// plain labelled row so this suite covers the list shell (filter + empty), not row
// resolution (own concern). Real FlashList is mocked globally (jest.setup.js).
jest.mock('@/features/bookmarks/SavedRow', () => {
  const { Text } = require('react-native');
  return { SavedRow: ({ item }: { item: { id: string; resource_type: string } }) =>
    <Text>{`row:${item.resource_type}:${item.id}`}</Text> };
});
jest.mock('@/features/bookmarks/hooks', () => ({ useBookmarks: jest.fn() }));

const mockBookmarks = useBookmarks as unknown as jest.Mock;

const ROWS = [
  { id: 'a1', user_id: 'u', resource_type: 'article', resource_id: 's1', created_at: 't1' },
  { id: 'p1', user_id: 'u', resource_type: 'provider', resource_id: 'pid', created_at: 't2' },
];

describe('SavedList (T-006)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the empty state when there are no bookmarks (EC-7)', () => {
    mockBookmarks.mockReturnValue({ data: [], isLoading: false, isError: false });
    renderWithProviders(<SavedList />, { haptics: true });
    expect(screen.getByText('Nothing saved yet')).toBeTruthy();
  });

  it('renders all rows under the "All" filter', () => {
    mockBookmarks.mockReturnValue({ data: ROWS, isLoading: false, isError: false });
    renderWithProviders(<SavedList />, { haptics: true });
    expect(screen.getByText('row:article:a1')).toBeTruthy();
    expect(screen.getByText('row:provider:p1')).toBeTruthy();
  });

  it('filters to providers when the Providers chip is selected (AC-3 type filter)', () => {
    mockBookmarks.mockReturnValue({ data: ROWS, isLoading: false, isError: false });
    renderWithProviders(<SavedList />, { haptics: true });
    fireEvent.press(screen.getByText('Providers'));
    expect(screen.queryByText('row:article:a1')).toBeNull();
    expect(screen.getByText('row:provider:p1')).toBeTruthy();
  });

  it('shows the load-error state', () => {
    mockBookmarks.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    renderWithProviders(<SavedList />, { haptics: true });
    expect(screen.getByText("Couldn't load your saved items.")).toBeTruthy();
  });
});
