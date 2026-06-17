import Animated, { FadeIn } from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { AUTH_COPY } from '@/features/auth/copy';
import type { MigrationStatus } from '@/features/auth/migration/orchestrate';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

// S36 migration surface — calm, honest, NO spinner-theatre. A quiet settle line
// while merging; an honest result line when done (with the same-day-conflict note
// only if one was resolved, and the empty line when there was nothing to move);
// an honest offline line if the gated remote was unreachable.
//
// The remote write is STUBBED/GATED (SR-4 ADR) — this surface reports the LOCAL
// merge result, which is all that actually happens in this wave.

type MigrationProgressProps = {
  status: MigrationStatus;
  mergedCount?: number;
  conflictsResolved?: number;
};

export function MigrationProgress({
  status,
  mergedCount = 0,
  conflictsResolved = 0,
}: MigrationProgressProps) {
  const reduced = useReducedMotion();

  const line =
    status === 'merging'
      ? AUTH_COPY.migrateSettleLine
      : status === 'offline'
        ? AUTH_COPY.offlineLine
        : mergedCount === 0
          ? AUTH_COPY.migrateEmptyLine
          : AUTH_COPY.migrateDoneLine;

  const showConflictNote = status === 'done' && conflictsResolved > 0;

  return (
    <Animated.View
      entering={reduced ? undefined : FadeIn.duration(DURATION.base).easing(easingFn('out'))}
      accessibilityLiveRegion="polite"
      accessible
      className="gap-2"
    >
      <Text variant="body">{line}</Text>
      {showConflictNote ? (
        <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
          {AUTH_COPY.migrateConflictNote}
        </Text>
      ) : null}
    </Animated.View>
  );
}
