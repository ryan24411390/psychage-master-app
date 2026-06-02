import type { ReactNode } from "react";
import { type Edge, SafeAreaView } from "react-native-safe-area-context";

// Safe-area + padding wrapper for tab-root screens. Consumes themed background
// (bg-background dark:bg-background-dark) so screens don't redeclare it.
// Entrance motion intentionally lives on the screen file (not here) so each
// screen can branch on useReducedMotion() independently — DESIGN.mobile.md §3.1
// two-tier rule must be encoded at the component level, not deferred to a wrapper.

type ScreenShellProps = {
  children: ReactNode;
  edges?: readonly Edge[];
  className?: string;
};

export function ScreenShell({ children, edges = ["top", "bottom"], className }: ScreenShellProps) {
  const composed = ["flex-1 bg-background dark:bg-background-dark px-4", className]
    .filter(Boolean)
    .join(" ");
  return (
    <SafeAreaView edges={edges} className={composed}>
      {children}
    </SafeAreaView>
  );
}
