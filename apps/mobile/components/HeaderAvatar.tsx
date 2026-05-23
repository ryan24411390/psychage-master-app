import { User } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

export function HeaderAvatar() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Account"
      // TODO(slice-?-auth): open identity sheet per DESIGN.mobile.md §2.3
      // (account, premium, prefs, language, accessibility, data export, sign-out).
      // Avatar destination is gated on rules/auth.md.
      onPress={() => {}}
      hitSlop={8}
      className="mr-4"
    >
      <View className="h-8 w-8 items-center justify-center rounded-full border border-neutral-300 bg-white">
        <User size={18} color="#57534E" strokeWidth={1.75} />
      </View>
    </Pressable>
  );
}
