import { CompareView } from '@/features/directory/CompareView';

// /find/compare — side-by-side comparison of saved providers (max 3). A real
// route (deep-linkable, hardware-back correct), not a step-state machine.
export default function CompareRoute() {
  return <CompareView />;
}
