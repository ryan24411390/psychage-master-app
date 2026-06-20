import { ConditionsIndexView } from '@/features/conditions-reference/ConditionsIndexView';

// Conditions A–Z reference route — pushed over the tabs (auto-registers with the root
// Stack's headerShown:false; the view renders its own GlobalHeader). Distinct from the
// existing /conditions categories route. Thin wrapper.
export default function ConditionsReferenceRoute() {
  return <ConditionsIndexView />;
}
