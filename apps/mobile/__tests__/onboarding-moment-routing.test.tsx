import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

// Route-level wiring for S3 capture (moment.tsx). The contract under test: mark-seen is
// anchored to the VALUE MOMENT — every path that leaves S3 after a successful save marks
// onboarding seen (a saved Moment, acute or not, means onboarding is done), and the
// "look around first" dismiss is an explicit opt-out. The mark is NOT deferred to founder.
jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
  Stack: { Screen: () => null },
  usePathname: () => '/',
}));
jest.mock('@/lib/persistence/onboarding', () => ({ markOnboardingSeen: jest.fn() }));
jest.mock('@/lib/moment-store', () => ({
  getMomentStore: () => ({ append: jest.fn((d: unknown) => ({ id: 'm0', ...(d as object) })) }),
}));

// Deterministic capture-sheet double (lifted from OnboardingMomentCapture.test.tsx): one
// button per outcome, each calling the real onSave/onClose the container passes in. The
// draft mirrors what the real sheet stamps (it runs shouldRouteToSupport upstream).
jest.mock('@/components/moments/MomentCaptureSheet', () => {
  const { Pressable, Text } = require('react-native');
  return {
    MomentCaptureSheet: ({
      onSave,
      onClose,
    }: {
      onSave: (draft: unknown) => void;
      onClose: () => void;
    }) => (
      <>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="mock-save-calm"
          onPress={() =>
            onSave({ valence: 5, labels: ['calm'], context: [], routedToSupport: false })
          }
        >
          <Text>save calm</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="mock-save-acute"
          onPress={() =>
            onSave({ valence: 1, labels: ['overwhelmed'], context: [], routedToSupport: true })
          }
        >
          <Text>save acute</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="mock-close" onPress={onClose}>
          <Text>close</Text>
        </Pressable>
      </>
    ),
  };
});

import MomentScreen from '@/app/onboarding/moment';
import { markOnboardingSeen } from '@/lib/persistence/onboarding';

import { renderWithProviders } from './_helpers';

const replaceMock = router.replace as jest.Mock;
const seenMock = markOnboardingSeen as jest.Mock;

describe('onboarding moment routing — mark-seen anchored to the first Moment save', () => {
  beforeEach(() => {
    replaceMock.mockClear();
    seenMock.mockClear();
  });

  it('non-acute save → marks seen (not deferred to founder) and advances to acknowledge', () => {
    renderWithProviders(<MomentScreen />, { haptics: true });
    fireEvent.press(screen.getByLabelText('mock-save-calm'));
    expect(seenMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).toHaveBeenCalledWith('/onboarding/acknowledge');
  });

  it('acute save → marks seen, then routes INTO crisis (SR-2)', () => {
    renderWithProviders(<MomentScreen />, { haptics: true });
    fireEvent.press(screen.getByLabelText('mock-save-acute'));
    expect(seenMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).toHaveBeenCalledWith('/crisis');
  });

  it('dismiss ("look around first") → still marks seen and exits home', () => {
    renderWithProviders(<MomentScreen />, { haptics: true });
    fireEvent.press(screen.getByLabelText('mock-close'));
    expect(seenMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).toHaveBeenCalledWith('/');
  });
});
