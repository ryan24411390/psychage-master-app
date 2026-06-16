import { NativeModule, requireNativeModule } from 'expo';

// biome-ignore lint/complexity/noBannedTypes: NativeModule constraint requires empty object type
declare class PsychageHapticsModule extends NativeModule<{}> {
  playBreathIn(): void;
  playBreathOut(): void;
  playCompleteSequence(): void;
}

export default requireNativeModule<PsychageHapticsModule>('PsychageHaptics');
