import { LearnView } from '@/features/learn/LearnView';

// S6 Learn tab. Thin route → the presentational LearnView. The GlobalHeader (incl.
// the Help-now pill) is injected by the tabs layout.
export default function LearnScreen() {
  return <LearnView />;
}
