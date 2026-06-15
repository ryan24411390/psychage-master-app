import { useSyncExternalStore } from 'react';

import {
  type AppearanceMode,
  type AppearanceState,
  getAppearanceSnapshot,
  setAppearanceMode,
  setReducedMotionOverride,
  subscribeAppearance,
} from '@/lib/persistence/appearance';

// Reactive read+write of the appearance preferences for the S45 screen. Reads
// through useSyncExternalStore so a setter re-renders the row immediately; the
// setters persist and notify lib/motion.ts (reduced-motion override). NB: `mode`
// is persisted but its app-wide theming is gated on a tailwind darkMode:'class'
// migration — see lib/persistence/appearance.ts header.
export interface UseAppearance extends AppearanceState {
  setMode: (mode: AppearanceMode) => void;
  setReducedMotion: (on: boolean) => void;
}

export function useAppearance(): UseAppearance {
  const state = useSyncExternalStore(
    subscribeAppearance,
    getAppearanceSnapshot,
    getAppearanceSnapshot,
  );
  return { ...state, setMode: setAppearanceMode, setReducedMotion: setReducedMotionOverride };
}
