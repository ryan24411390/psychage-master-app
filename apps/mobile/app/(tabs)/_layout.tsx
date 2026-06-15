import { Tabs } from 'expo-router';

import { AppTabBar } from '@/components/AppTabBar';
import { GlobalHeader } from '@/components/GlobalHeader';

// C0.1 + C0.2 chrome. The GlobalHeader is the navigation `header` (persistent on
// every tab); the AppTabBar replaces the default bottom bar to carry the pressed-
// pill active treatment, always-visible labels, and the four pictograms. Tab
// titles double as the always-visible tab labels (read by AppTabBar). Haptics
// fire inside AppTabBar's onPress (no screen-level tabPress listener, which would
// double-fire alongside the custom bar's navigation.emit).
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ header: () => <GlobalHeader /> }}
      tabBar={(props) => <AppTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="learn" options={{ title: 'Learn' }} />
      <Tabs.Screen name="compass" options={{ title: 'Compass' }} />
      {/* Find renders its own header (prototype port), so suppress the global one. */}
      <Tabs.Screen name="find" options={{ title: 'Find', headerShown: false }} />
    </Tabs>
  );
}
