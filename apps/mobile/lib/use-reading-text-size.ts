import { useSyncExternalStore } from 'react';

import {
  getReadingTextSizeSnapshot,
  type ReadingTextSize,
  type ReadingTextSizeState,
  setReadingTextSize,
  subscribeReadingTextSize,
} from '@/lib/persistence/reading-text-size';

// Reactive read+write of the reading text size for the S45 radio. Reads through
// useSyncExternalStore so changing the size re-renders immediately; the setter
// persists and notifies any mounted ReadingTextSizeProvider (article reader / Learn).
export interface UseReadingTextSize extends ReadingTextSizeState {
  setSize: (size: ReadingTextSize) => void;
}

export function useReadingTextSize(): UseReadingTextSize {
  const state = useSyncExternalStore(
    subscribeReadingTextSize,
    getReadingTextSizeSnapshot,
    getReadingTextSizeSnapshot,
  );
  return { ...state, setSize: setReadingTextSize };
}
