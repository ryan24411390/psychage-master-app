import { useCallback, useEffect, useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import { type ReadMeta, readingProgressStore } from '@/lib/reading-progress-store';

// How often a scroll position is persisted while actively reading. Writes go
// straight to the MMKV store (never component state) so scrolling never triggers
// a re-render. The final position is flushed on unmount so a quick exit still
// records where the reader stopped.
const WRITE_THROTTLE_MS = 1000;

// Pure reading-progress math: fraction of the scrollable extent covered, clamped
// to 0..1. When the content is shorter than the viewport there is nothing to
// scroll, so it counts as fully read.
export function scrollProgress(
  offsetY: number,
  contentHeight: number,
  layoutHeight: number,
): number {
  const scrollable = contentHeight - layoutHeight;
  if (scrollable <= 0) return 1;
  const p = offsetY / scrollable;
  if (p < 0) return 0;
  if (p > 1) return 1;
  return p;
}

// Drives scroll-based reading progress for the article reader. Returns an
// `onScroll` handler to attach to the reader's ScrollView (with
// `scrollEventThrottle={16}`). Throttled persistence + unmount flush via refs —
// no state, no re-renders.
export function useReadingProgressTracker(slug: string, meta: ReadMeta) {
  const latest = useRef(0);
  const lastWrite = useRef(0);
  // Keep the freshest metadata without re-creating the scroll handler (the
  // article title/readTime arrive after the async fetch resolves).
  const metaRef = useRef(meta);
  metaRef.current = meta;

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!slug) return;
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const p = scrollProgress(contentOffset.y, contentSize.height, layoutMeasurement.height);
      latest.current = p;
      const now = Date.now();
      if (now - lastWrite.current >= WRITE_THROTTLE_MS) {
        lastWrite.current = now;
        readingProgressStore.setProgress(slug, p, metaRef.current);
      }
    },
    [slug],
  );

  useEffect(() => {
    return () => {
      if (slug && latest.current > 0) {
        readingProgressStore.setProgress(slug, latest.current, metaRef.current);
      }
    };
  }, [slug]);

  return { onScroll };
}
