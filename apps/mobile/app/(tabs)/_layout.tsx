import { Tabs } from 'expo-router';
import { BookOpen, Compass, MapPin, Sun } from 'lucide-react-native';
// TODO(tier-3-illustrator): replace lucide `Compass` with bespoke compass-rose
// glyph per DESIGN.mobile.md §2.4 / clay-figures library V2 batch
// (workspace.json clayFigures ETA).

import { HeaderAvatar } from '@/components/HeaderAvatar';
import { useHaptics } from '@/lib/haptic-context';

export default function TabsLayout() {
  const { fireHaptic } = useHaptics();

  return (
    <Tabs
      screenOptions={{
        headerRight: () => <HeaderAvatar />,
        tabBarActiveTintColor: '#1A9B8C',
      }}
      screenListeners={{
        tabPress: () => fireHaptic('tab'),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => <Sun color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Learn',
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="compass"
        options={{
          title: 'Compass',
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="find"
        options={{
          title: 'Find',
          tabBarIcon: ({ color, size }) => <MapPin color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
