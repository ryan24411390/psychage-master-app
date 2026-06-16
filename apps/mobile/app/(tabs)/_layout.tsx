import { Tabs } from 'expo-router';

import { AppTabBar } from '@/components/AppTabBar';

// C0.1 + C0.2 chrome. Each tab is now a group folder with its own Stack ((today)/
// (learn)/(compass)/(find)), so content/detail screens nested inside a tab keep the
// AppTabBar visible when the user drills in. The GlobalHeader moved from here onto
// each group's landing screen (see the group _layout files) — keeping it at the
// Tabs level would have rendered it on top of every nested detail screen too. The
// tab titles double as the always-on tab labels read by AppTabBar; haptics fire
// inside AppTabBar's onPress (no screen-level tabPress listener, which would
// double-fire alongside the custom bar's navigation.emit).
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <AppTabBar {...props} />}>
      <Tabs.Screen name="(today)" options={{ title: 'Today' }} />
      <Tabs.Screen name="(learn)" options={{ title: 'Learn' }} />
      <Tabs.Screen name="(compass)" options={{ title: 'Compass' }} />
      <Tabs.Screen name="(find)" options={{ title: 'Find' }} />
    </Tabs>
  );
}
