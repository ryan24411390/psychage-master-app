import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { __resetToolkitSyncConsentCacheForTests } from '@/features/toolkits/sync-consent';
import type { ProgressMap, ToolkitWithItems } from '@/features/toolkits/types';

import { renderWithProviders } from './_helpers';

let mockToolkit: ToolkitWithItems | null = null;
let mockLoading = false;

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));
jest.mock('@/components/GlobalHeader', () => ({ GlobalHeader: () => null }));
jest.mock('@/features/toolkits/hooks', () => ({
  useToolkit: () => ({ data: mockToolkit, isLoading: mockLoading }),
}));

import { ToolkitDetailView } from '@/features/toolkits/ToolkitDetailView';

const DISCLAIMER =
  "Educational — not a clinical record, and not a substitute for the clinician's own assessment.";

const TOOLKIT: ToolkitWithItems = {
  id: 'tk1',
  theme_title: 'When worry takes over',
  clinical_subtitle: 'For racing thoughts',
  intro_md: 'A short intro.',
  status: 'published',
  needs_clinical_review: true,
  sort_order: 0,
  items: [
    { id: 'i1', toolkit_id: 'tk1', kind: 'tool', ref_id: 'tool:mood-journal', label: 'Mood journal', sort_order: 1 },
    { id: 'i2', toolkit_id: 'tk1', kind: 'term', ref_id: 'term:rumination', label: 'Rumination', sort_order: 2 },
  ],
};

// In-memory ToolkitProgressApi double — render tests never load the syncing
// singleton (which pulls in the Supabase client).
function makeStore() {
  const stub = (itemId: string) => ({
    toolkitId: 'tk1',
    itemId,
    openedAt: null,
    completedAt: null,
    selfRating: null,
    updatedAt: 'x',
  });
  return {
    getForToolkit: jest.fn((): ProgressMap => ({})),
    markOpened: jest.fn((_t: string, id: string) => stub(id)),
    setDone: jest.fn((_t: string, id: string) => stub(id)),
    setRating: jest.fn((_t: string, id: string) => stub(id)),
  };
}

describe('ToolkitDetailView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetToolkitSyncConsentCacheForTests();
    mockToolkit = TOOLKIT;
    mockLoading = false;
  });

  it('renders the ADR-002 disclaimer verbatim at the top', () => {
    renderWithProviders(<ToolkitDetailView id="tk1" store={makeStore()} />, { haptics: true });
    expect(screen.getByTestId('toolkit-disclaimer')).toHaveTextContent(DISCLAIMER);
  });

  it('defaults the sync toggle OFF (opt-in)', () => {
    renderWithProviders(<ToolkitDetailView id="tk1" store={makeStore()} />, { haptics: true });
    expect(screen.getByTestId('toolkit-sync-consent-toggle').props.value).toBe(false);
  });

  it('marks an item done optimistically and persists via the store', () => {
    const store = makeStore();
    renderWithProviders(<ToolkitDetailView id="tk1" store={store} />, { haptics: true });

    const checkbox = screen.getByTestId('toolkit-item-done-i1');
    expect(checkbox.props.accessibilityState.checked).toBe(false);

    fireEvent.press(checkbox);

    expect(store.setDone).toHaveBeenCalledWith('tk1', 'i1', true);
    expect(screen.getByTestId('toolkit-item-done-i1').props.accessibilityState.checked).toBe(true);
  });

  it('opens a built item via its route and disables unbuilt items', () => {
    const store = makeStore();
    renderWithProviders(<ToolkitDetailView id="tk1" store={store} />, { haptics: true });

    // term:rumination has no mobile surface → disabled "Coming soon".
    expect(screen.getByTestId('toolkit-item-open-i2').props.accessibilityState.disabled).toBe(true);

    fireEvent.press(screen.getByTestId('toolkit-item-open-i1'));
    expect(store.markOpened).toHaveBeenCalledWith('tk1', 'i1');
    expect(router.push).toHaveBeenCalledWith('/tools/mood-journal');
  });

  it('shows the not-available state when the toolkit is missing', () => {
    mockToolkit = null;
    renderWithProviders(<ToolkitDetailView id="tk1" store={makeStore()} />, { haptics: true });
    expect(screen.getByTestId('toolkit-detail-missing')).toBeOnTheScreen();
  });
});
