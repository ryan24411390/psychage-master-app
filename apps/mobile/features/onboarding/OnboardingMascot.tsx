import { Mascot } from '@/components/home/Mascot';

// Onboarding HOST mascot — S1's biggest moment. Now a thin host-scale wrapper over the
// route-aware <Mascot>: on /onboarding/welcome it auto-selects 'hi' (one arm raised,
// waving) via the surface binding. Host size = 130 (1.7× the standard 96 footprint).
// Decorative; breathing/motion + a11y-hiding are handled inside <Mascot>.

const HOST_WIDTH = 169;

export function OnboardingMascot({ testID }: { testID?: string }) {
  return <Mascot testID={testID} size={HOST_WIDTH} />;
}
