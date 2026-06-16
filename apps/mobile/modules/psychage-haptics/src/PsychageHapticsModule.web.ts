import { registerWebModule, NativeModule } from 'expo';

// PsychageHapticsModule is not available on the web platform.
// biome-ignore lint/complexity/noBannedTypes: NativeModule constraint requires empty object type
class PsychageHapticsModule extends NativeModule<{}> {}

export default registerWebModule(PsychageHapticsModule, 'PsychageHapticsModule');
