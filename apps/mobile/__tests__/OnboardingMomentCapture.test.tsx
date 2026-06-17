import type { EngagementStore } from '@psychage/shared/engagement';
import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithProviders } from './_helpers';

// Mock the shipped capture sheet so we can drive deterministic acute / non-acute drafts
// without exercising the valence slider UI. The mock exposes one button per outcome plus
// a close affordance, each calling the real onSave/onClose the container passes in. The
// draft mirrors what the real sheet stamps (it runs shouldRouteToSupport and sets
// routedToSupport before handing up — tested separately in moment-acute.test.ts).
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

// Imported AFTER the mock is registered.
const { OnboardingMomentCapture } = require('@/features/onboarding/OnboardingMomentCapture');

function makeStore() {
  const append = jest.fn((draft: unknown) => ({ id: 'm0', ...(draft as object) }));
  return { append } as unknown as EngagementStore & { append: jest.Mock };
}

describe('OnboardingMomentCapture (S3)', () => {
  it('keeps the Help-now pill reachable while capturing', () => {
    const store = makeStore();
    renderWithProviders(
      <OnboardingMomentCapture store={store} onNamed={() => {}} onExit={() => {}} />,
      { haptics: true },
    );
    expect(screen.getByLabelText('Help now')).toBeTruthy();
  });

  it('a non-acute save persists the Moment and advances to the acknowledgment', () => {
    const store = makeStore();
    const onNamed = jest.fn();
    const navigateToCrisis = jest.fn();
    renderWithProviders(
      <OnboardingMomentCapture
        store={store}
        onNamed={onNamed}
        onExit={() => {}}
        navigateToCrisis={navigateToCrisis}
      />,
      { haptics: true },
    );
    fireEvent.press(screen.getByLabelText('mock-save-calm'));
    expect(store.append).toHaveBeenCalledTimes(1);
    expect(store.append).toHaveBeenCalledWith(
      expect.objectContaining({ valence: 5, routedToSupport: false }),
    );
    expect(onNamed).toHaveBeenCalledTimes(1);
    expect(navigateToCrisis).not.toHaveBeenCalled();
  });

  it('an acute save persists the Moment then routes INTO crisis, never to acknowledgment (SR-2)', () => {
    const store = makeStore();
    const onNamed = jest.fn();
    const navigateToCrisis = jest.fn();
    renderWithProviders(
      <OnboardingMomentCapture
        store={store}
        onNamed={onNamed}
        onExit={() => {}}
        navigateToCrisis={navigateToCrisis}
      />,
      { haptics: true },
    );
    fireEvent.press(screen.getByLabelText('mock-save-acute'));
    expect(store.append).toHaveBeenCalledWith(
      expect.objectContaining({ valence: 1, routedToSupport: true }),
    );
    expect(navigateToCrisis).toHaveBeenCalledTimes(1);
    expect(onNamed).not.toHaveBeenCalled();
  });

  it('dismissing the sheet exits to the first-run home', () => {
    const store = makeStore();
    const onExit = jest.fn();
    renderWithProviders(
      <OnboardingMomentCapture store={store} onNamed={() => {}} onExit={onExit} />,
      { haptics: true },
    );
    fireEvent.press(screen.getByLabelText('mock-close'));
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(store.append).not.toHaveBeenCalled();
  });
});
