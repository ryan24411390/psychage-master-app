import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithProviders } from './_helpers';

// PR-A wave gate: crisis is reachable from the Help-now pill in ≤1 tap. The pill's
// A1 stub (onPress: noop, "wire the press target, not the destination") is now wired
// to the crisis route. Mock the expo-router singleton so the press target is the only
// thing under test (GlobalHeader only consumes `router` from expo-router).
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

import { GlobalHeader } from '@/components/GlobalHeader';
import { router } from 'expo-router';

describe('Help-now pill → crisis', () => {
  it('navigates to /crisis on press', () => {
    renderWithProviders(<GlobalHeader />);
    fireEvent.press(screen.getByLabelText('Help now'));
    expect(router.push).toHaveBeenCalledWith('/crisis');
  });
});
