import { Image, View } from 'react-native';

import { Text } from '@/components/ui/Text';

// Provider avatar — the provider's own photo_url when present (most NPI-seeded
// rows have none), over a calm teal-tinted token surface with initials as the
// fallback. No per-provider color palette (decorative drift). RN's built-in Image
// keeps parity with the article cards; a later dev-client rebuild can swap in
// expo-image for list-scroll caching. Two fixed sizes keep NativeWind classes
// static (no dynamic width interpolation).

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const SIZE = {
  md: { box: 'h-11 w-11', text: 'h6' as const },
  lg: { box: 'h-16 w-16', text: 'h3' as const },
};

export function Avatar({
  name,
  photoUrl,
  size = 'md',
}: {
  name: string;
  photoUrl: string | null;
  size?: 'md' | 'lg';
}) {
  const s = SIZE[size];
  return (
    <View
      className={`${s.box} items-center justify-center overflow-hidden rounded-full bg-surface-accent dark:bg-surface-accent-dark`}
    >
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          resizeMode="cover"
          className={s.box}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Text variant={s.text} className="text-primary dark:text-primary-dark">
          {initialsOf(name)}
        </Text>
      )}
    </View>
  );
}
