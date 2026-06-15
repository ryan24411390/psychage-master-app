import { ConditionsLibraryView } from '@/features/conditions/ConditionsLibraryView';

// Conditions library route — pushed over the tabs (auto-registers with the root
// Stack's headerShown:false; the view renders its own GlobalHeader). Thin wrapper.
export default function ConditionsRoute() {
  return <ConditionsLibraryView />;
}
