import type { ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { gradientForKey } from '@/features/learn/art';

// Abstract thumbnail surface for Learn cards. Two modes, one component:
//   • real art — when the article carries a hero_image_url, show it (cover).
//   • token panel — otherwise, a deterministic teal/charcoal gradient (art.ts).
// Never a faux figure/blob (no-invented-art rule). The caller owns the frame
// (aspect ratio, radius, overflow) via className; ArtPanel fills it. When
// `children` are present a bottom scrim is laid down so white overlay text reads.

type ArtPanelProps = {
  /** Stable key for the gradient pick — pass the article slug or category id. */
  artKey: string;
  imageUrl?: string | null;
  /** Frame classes (aspect, rounded, overflow-hidden, width). */
  className?: string;
  /** Lay a bottom-up dark scrim for legible overlay text. */
  scrim?: boolean;
  children?: ReactNode;
};

export function ArtPanel({ artKey, imageUrl, className, scrim = false, children }: ArtPanelProps) {
  const g = gradientForKey(artKey);
  const gradId = `g${Math.abs(hash(artKey))}`;
  return (
    <View className={['overflow-hidden bg-surface-active dark:bg-surface-active-dark', className]
      .filter(Boolean)
      .join(' ')}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          accessibilityIgnoresInvertColors
          resizeMode="cover"
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg height="100%" width="100%">
            <Defs>
              <LinearGradient id={gradId} x1="0" y1="0" x2="0.35" y2="1">
                <Stop offset="0" stopColor={g.top} stopOpacity="1" />
                <Stop offset="1" stopColor={g.bottom} stopOpacity="1" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradId})`} />
          </Svg>
        </View>
      )}

      {scrim ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg height="100%" width="100%">
            <Defs>
              <LinearGradient id={`${gradId}s`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#000000" stopOpacity="0" />
                <Stop offset="0.55" stopColor="#000000" stopOpacity="0" />
                <Stop offset="1" stopColor="#000000" stopOpacity="0.55" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradId}s)`} />
          </Svg>
        </View>
      ) : null}

      {children}
    </View>
  );
}

// Local djb2 (mirrors art.ts) so each panel's <LinearGradient> id is stable and
// unique per key — duplicate SVG def ids inside one tree collide on some renderers.
function hash(key: string): number {
  let h = 5381;
  for (let i = 0; i < key.length; i += 1) h = (h * 33) ^ key.charCodeAt(i);
  return h >>> 0;
}
