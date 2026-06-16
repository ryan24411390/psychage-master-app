import { render, screen } from '@testing-library/react-native';
import { usePathname } from 'expo-router';

import { Mascot } from '@/components/home/Mascot';

// usePathname is the only expo-router surface Mascot touches; mock it so we can drive
// the route the component "sees" (jest-expo otherwise defaults it to '/').
jest.mock('expo-router', () => ({ usePathname: jest.fn(() => '/') }));
const mockPathname = usePathname as jest.MockedFunction<typeof usePathname>;

// Mascot is the route-aware presence layer over the founder clay-figure assets. These
// tests prove (1) it mounts and (2) the Sacred-Rule null-gating on forbidden surfaces —
// the resolver logic is covered exhaustively in mascot-forbidden.test.ts.
describe('Mascot', () => {
  it('mounts on an allowed route with an explicit state (decorative — hidden from VoiceOver)', () => {
    mockPathname.mockReturnValue('/settings');
    render(<Mascot testID="mascot" state="friendly" />);
    expect(screen.getByTestId('mascot', { includeHiddenElements: true })).toBeTruthy();
  });

  it('renders nothing on a forbidden route — even when forced with an explicit state', () => {
    for (const route of ['/crisis', '/navigator', '/settings/delete-confirm']) {
      mockPathname.mockReturnValue(route);
      render(<Mascot testID="mascot" state="hi" />);
      expect(screen.queryByTestId('mascot', { includeHiddenElements: true })).toBeNull();
    }
  });

  it('renders nothing when suppressed (Storm Check sub-state guard)', () => {
    mockPathname.mockReturnValue('/');
    render(<Mascot testID="mascot" state="seated" suppressed />);
    expect(screen.queryByTestId('mascot', { includeHiddenElements: true })).toBeNull();
  });
});
