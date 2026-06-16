import { NativeModule, requireOptionalNativeModule } from 'expo';

// biome-ignore lint/complexity/noBannedTypes: NativeModule constraint requires empty object type
declare class PsychageHapticsModule extends NativeModule<{}> {
  playBreathIn(): void;
  playBreathOut(): void;
  playCompleteSequence(): void;
}

// Optional resolution: returns null when the native module is absent from the
// binary (Expo Go, or a dev build made before this module was added) instead of
// throwing at import time and crashing the entire JS bundle. Callers must
// null-check and fall back to the JS haptic sequences.
export default requireOptionalNativeModule<PsychageHapticsModule>('PsychageHaptics');
