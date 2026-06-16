import { TabScreen } from '@/components/ui/TabScreen';
import { LearnView } from '@/features/learn/LearnView';

// S6 Learn tab. Thin route → the presentational LearnView. The GlobalHeader (incl.
// the Help-now pill) is injected by the tabs layout. TabScreen cross-fades the
// content in on each tab focus.
export default function LearnScreen() {
  return (
    <TabScreen>
      <LearnView />
    </TabScreen>
  );
}
