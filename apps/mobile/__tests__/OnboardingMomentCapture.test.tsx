import type { EngagementStore } from '@psychage/shared/engagement';
import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithProviders } from './_helpers';

// Mock the shipped capture sheet so we can drive a deterministic save without exercising the
// word-picker UI. The mock exposes a save button (calls onSave with a new-shape draft) and a
// close affordance. There is no acute-handoff path — no rule is built; the SR-2 crisis pill
// is the safety floor.
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
          accessibilityLabel="mock-save"
          onPress={() => onSave({ labelPrimary: 'calm' })}
        >
          <Text>save</Text>
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

  it('a save persists the Moment and advances to the acknowledgment', () => {
    const store = makeStore();
    const onNamed = jest.fn();
    renderWithProviders(
      <OnboardingMomentCapture store={store} onNamed={onNamed} onExit={() => {}} />,
      { haptics: true },
    );
    fireEvent.press(screen.getByLabelText('mock-save'));
    expect(store.append).toHaveBeenCalledTimes(1);
    expect(store.append).toHaveBeenCalledWith(expect.objectContaining({ labelPrimary: 'calm' }));
    expect(onNamed).toHaveBeenCalledTimes(1);
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
