import { type ReactNode, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { gradientForKey } from '@/features/learn/art';

// Abstract thumbnail surface for Learn cards. Two modes, one component:
//   • real art — when the article carries a hero_image_url, show it (uncropped).
//   • token panel — otherwise, a deterministic teal/charcoal gradient (art.ts).
// Never a faux figure/blob (no-invented-art rule). The caller owns the frame
// (aspect ratio, radius, overflow) via className; ArtPanel fills it. When
// `children` are present a bottom scrim is laid down so white overlay text reads.
//
// Image rendering = blur-fill letterbox: the hero is shown `contain` (its full
// content, never cropped) over a blurred+dimmed `cover` copy of itself filling
// the frame's letterbox bars. Same uniform frame for portrait/landscape/square/
// ultrawide → a consistent feed with zero crop and no layout shift (the aspect
// className fixes the height before load). A loading skeleton covers the gap
// while the source decodes; a broken/missing URL falls back to the gradient
// (so a dead 404 host never renders a blank surface).

type ArtPanelProps = {
  /** Stable key for the gradient pick — pass the article slug or category id. */
  artKey: string;
  imageUrl?: string | null;
  /** Frame classes (aspect, rounded, overflow-hidden, width). */
  className?: string;
  /** Lay a bottom-up dark scrim for legible overlay text. */
  scrim?: boolean;
  /** When set, a translucent pill in the top-right shows "<n> min" over the art. */
  readTime?: number | null;
  /**
   * Fill the frame edge-to-edge (contentFit:cover, cropped) instead of the default
   * blur-fill letterbox (contentFit:contain). Use for fixed thumbnail frames — covers
   * in the home rails — where a clean fill reads better than letterbox bars.
   */
  cover?: boolean;
  children?: ReactNode;
};

export function ArtPanel({
  artKey,
  imageUrl,
  className,
  scrim = false,
  readTime,
  cover = false,
  children,
}: ArtPanelProps) {
  const g = gradientForKey(artKey);
  const gradId = `g${Math.abs(hash(artKey))}`;
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  // Reset load/error state when the source changes — FlashList recycles this
  // component across rows, so a stale `errored`/`loaded` would force the gradient
  // (or a missing skeleton) onto a recycled card whose new URL is perfectly valid.
  // Adjusting state during render (vs an effect) avoids a stale-frame flash on recycle.
  const [prevUrl, setPrevUrl] = useState(imageUrl);
  if (imageUrl !== prevUrl) {
    setPrevUrl(imageUrl);
    setLoaded(false);
    setErrored(false);
  }
  const showImage = Boolean(imageUrl) && !errored;

  return (
    <View className={['overflow-hidden bg-surface-active dark:bg-surface-active-dark', className]
      .filter(Boolean)
      .join(' ')}>
      {showImage ? (
        <>
          {/* Cover mode: a single image fills the frame edge-to-edge (cropped). */}
          {cover ? null : (
            /* Letterbox mode: blurred cover copy fills the bars behind the contained image. */
            <>
              <Image
                source={{ uri: imageUrl ?? undefined }}
                recyclingKey={imageUrl ?? undefined}
                accessibilityIgnoresInvertColors
                contentFit="cover"
                blurRadius={24}
                cachePolicy="memory-disk"
                style={StyleSheet.absoluteFill}
              />
              <View style={StyleSheet.absoluteFill} pointerEvents="none" className="bg-black/15" />
            </>
          )}
          {/* The real image — cover fills the frame; contain shows it whole, never cropped. */}
          <Image
            source={{ uri: imageUrl ?? undefined }}
            recyclingKey={imageUrl ?? undefined}
            accessibilityIgnoresInvertColors
            contentFit={cover ? 'cover' : 'contain'}
            transition={250}
            cachePolicy="memory-disk"
            onLoadStart={() => setLoaded(false)}
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
            style={StyleSheet.absoluteFill}
          />
          {loaded ? null : <Skeleton style={StyleSheet.absoluteFill} />}
        </>
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

      {readTime ? (
        <View
          pointerEvents="none"
          className="absolute right-2 top-2 rounded-full bg-black/40 px-2 py-0.5"
        >
          <Text variant="caption" className="font-sans-medium text-white">
            {`${readTime} min`}
          </Text>
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
