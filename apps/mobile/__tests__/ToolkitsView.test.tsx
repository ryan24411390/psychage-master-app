import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import type { Toolkit } from '@/features/toolkits/types';

import { renderWithProviders } from './_helpers';

// Control the server-state hook + isolate heavy chrome / native image.
let mockResult: { data: Toolkit[] | undefined; isLoading: boolean } = { data: [], isLoading: false };

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));
jest.mock('@/components/GlobalHeader', () => ({ GlobalHeader: () => null }));
jest.mock('expo-image', () => ({ Image: require('react-native').View }));
jest.mock('@/features/toolkits/hooks', () => ({
  usePublishedToolkits: () => mockResult,
}));

import { ToolkitsView } from '@/features/toolkits/ToolkitsView';

const TK: Toolkit = {
  id: 'tk1',
  theme_title: 'When worry takes over',
  clinical_subtitle: 'For racing, restless thoughts',
  intro_md: null,
  status: 'published',
  needs_clinical_review: true,
  sort_order: 0,
};

describe('ToolkitsView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResult = { data: [], isLoading: false };
  });

  it('shows the empty state when nothing is published', () => {
    renderWithProviders(<ToolkitsView />, { haptics: true });
    expect(screen.getByTestId('toolkits-empty')).toBeOnTheScreen();
  });

  it('shows the loading state while fetching', () => {
    mockResult = { data: undefined, isLoading: true };
    renderWithProviders(<ToolkitsView />, { haptics: true });
    expect(screen.getByTestId('toolkits-loading')).toBeOnTheScreen();
  });

  it('renders cards and pushes the detail route on press', () => {
    mockResult = { data: [TK], isLoading: false };
    renderWithProviders(<ToolkitsView />, { haptics: true });
    expect(screen.getByText('When worry takes over')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('toolkit-card-tk1'));
    expect(router.push).toHaveBeenCalledWith('/toolkits/tk1');
  });
});
