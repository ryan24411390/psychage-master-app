import { type ReactNode, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { gradientForKey } from '@/features/learn/art';
import { categoryPosterUrl } from '@/features/learn/category-posters';

// Abstract thumbnail surface for Learn cards. Two modes, one component:
//   • real art — an article's hero_image_url, OR a category's pictogram poster
//     (when `posterSlug` is set) — shown uncropped.
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
  /**
   * Canonical category slug. When set (and the article has no `imageUrl`), the
   * category's pictogram poster is shown; an orphan slug with no poster resolves
   * to nothing and the gradient renders. Article cards never set this.
   */
  posterSlug?: string | null;
  /** Frame classes (aspect, rounded, overflow-hidden, width). */
  className?: string;
  /** Lay a bottom-up dark scrim for legible overlay text. */
  scrim?: boolean;
  /** When set, a translucent pill in the top-right shows "<n> min" over the art. */
  readTime?: number | null;
  children?: ReactNode;
};

export function ArtPanel({
  artKey,
  imageUrl,
  posterSlug,
  className,
  scrim = false,
  readTime,
  children,
}: ArtPanelProps) {
  const g = gradientForKey(artKey);
  const gradId = `g${Math.abs(hash(artKey))}`;
  // The article hero wins; otherwise a category poster (when the slug has one).
  // Either way the gradient is the fallback when there's no resolvable image.
  const effectiveUrl = imageUrl ?? categoryPosterUrl(posterSlug);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  // Reset load/error state when the source changes — FlashList recycles this
  // component across rows, so a stale `errored`/`loaded` would force the gradient
  // (or a missing skeleton) onto a recycled card whose new URL is perfectly valid.
  // Adjusting state during render (vs an effect) avoids a stale-frame flash on recycle.
  const [prevUrl, setPrevUrl] = useState(effectiveUrl);
  if (effectiveUrl !== prevUrl) {
    setPrevUrl(effectiveUrl);
    setLoaded(false);
    setErrored(false);
  }
  const showImage = Boolean(effectiveUrl) && !errored;

  return (
    <View className={['overflow-hidden bg-surface-active dark:bg-surface-active-dark', className]
      .filter(Boolean)
      .join(' ')}>
      {showImage ? (
        <>
          {/* Blurred cover copy fills the letterbox bars behind the real image. */}
          <Image
            source={{ uri: effectiveUrl ?? undefined }}
            recyclingKey={effectiveUrl ?? undefined}
            accessibilityIgnoresInvertColors
            contentFit="cover"
            blurRadius={24}
            cachePolicy="memory-disk"
            style={StyleSheet.absoluteFill}
          />
          <View style={StyleSheet.absoluteFill} pointerEvents="none" className="bg-black/15" />
          {/* The real image, fully visible (contain) — never cropped. */}
          <Image
            source={{ uri: effectiveUrl ?? undefined }}
            recyclingKey={effectiveUrl ?? undefined}
            accessibilityIgnoresInvertColors
            contentFit="contain"
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
