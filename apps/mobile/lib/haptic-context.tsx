import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

import { fireHaptic, type HapticEvent } from "./haptics";

type HapticContextValue = {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  fireHaptic: (event: HapticEvent) => void;
};

const HapticContext = createContext<HapticContextValue | null>(null);

// TODO(slice-6): persist `enabled` via MMKV per apps/mobile/CLAUDE.md DI seam
// (rules/conventions.md convention #3). Sacred Rule #13 (versioned migrator)
// applies — the persisted shape needs a `version` field + N→N+1 migrator from
// day one so a stored `enabled` survives future schema changes without silent
// data loss. For Slice 4 the toggle is in-memory only and resets to `true` on
// every app launch.
export function HapticProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(true);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const fire = useCallback((event: HapticEvent) => {
    fireHaptic(event, () => enabledRef.current);
  }, []);

  const value = useMemo<HapticContextValue>(
    () => ({ enabled, setEnabled, fireHaptic: fire }),
    [enabled, fire],
  );

  return <HapticContext.Provider value={value}>{children}</HapticContext.Provider>;
}

export function useHaptics(): HapticContextValue {
  const value = useContext(HapticContext);
  if (!value) {
    throw new Error("useHaptics must be used within a HapticProvider");
  }
  return value;
}
