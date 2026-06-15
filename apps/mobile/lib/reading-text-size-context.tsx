import { createContext, type ReactNode, useContext } from 'react';

import type { ReadingTextSize } from '@/lib/persistence/reading-text-size';
import { useReadingTextSize } from '@/lib/use-reading-text-size';

// Scopes the reading text size to a subtree. Text reads this context and scales its
// body variants only when inside a provider; the default value ('default') means any
// Text rendered outside a reading surface is unaffected — so chrome, settings rows,
// and buttons never reflow. Wrap the article reader + Learn content with the
// provider; it subscribes to the persisted size and re-supplies the subtree on change.

const ReadingTextSizeContext = createContext<ReadingTextSize>('default');

export function ReadingTextSizeProvider({ children }: { children: ReactNode }) {
  const { size } = useReadingTextSize();
  return <ReadingTextSizeContext.Provider value={size}>{children}</ReadingTextSizeContext.Provider>;
}

/** The reading size in effect for this subtree ('default' outside any provider). */
export function useReadingScale(): ReadingTextSize {
  return useContext(ReadingTextSizeContext);
}
