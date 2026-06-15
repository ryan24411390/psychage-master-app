import { Stack } from 'expo-router';

import { CT4_SETTINGS } from '@/features/settings/copy';

// Settings stack (Flow 18). Pushed over the tabs as its own stack, so it carries
// a native header (back chevron + title) instead of the GlobalHeader. Titles +
// the S44 modal presentation are declared once here; PR B (privacy/delete) and
// PR C (supporter) add only their route FILES — these option entries are already
// in place so those PRs never touch this layout.
export default function SettingsLayout() {
  const t = CT4_SETTINGS;
  return (
    <Stack screenOptions={{ headerShown: true, headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="index" options={{ title: t.hub.title }} />
      <Stack.Screen name="reminders" options={{ title: t.reminders.title }} />
      <Stack.Screen
        name="make-it-yours"
        options={{ title: t.makeItYours.title, presentation: 'modal' }}
      />
      <Stack.Screen name="appearance" options={{ title: t.appearance.title }} />
      <Stack.Screen name="about" options={{ title: t.about.title }} />
      <Stack.Screen name="acknowledgments" options={{ title: t.acknowledgments.title }} />
      {/* PR B */}
      <Stack.Screen name="privacy" options={{ title: t.hub.rows.privacy }} />
      <Stack.Screen name="delete" options={{ title: 'Delete' }} />
      <Stack.Screen name="delete-confirm" options={{ title: 'Delete', presentation: 'modal' }} />
      {/* PR C */}
      <Stack.Screen name="supporter" options={{ title: t.hub.rows.supporter }} />
    </Stack>
  );
}
