import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useReducedMotion } from '@/lib/motion';

import { CT4_RELATIONSHIP } from '../copy';
import type { RelationshipQuestion } from '../types';
import { QuestionCard } from './QuestionCard';

// Controlled question stepper. Tapping an answer auto-advances after a brief
// confirm window (so the selection registers visually) — no Next button, which
// roughly halves the taps to run the check. Skip moves on without recording an
// answer; the chrome's top Back steps back to revise. The flow owns currentIndex
// + answers (so Back can rewind through the wizard) and commits the answer.

// Confirm window before auto-advancing — long enough to see the selection, short
// enough to keep the run fast. Zero when the user prefers reduced motion.
const CONFIRM_MS = 220;

export interface WizardViewProps {
  readonly question: RelationshipQuestion;
  readonly index: number;
  readonly total: number;
  readonly value: number | undefined;
  /** Commit the chosen value AND advance (or finish on the last question). */
  readonly onAnswer: (value: number) => void;
  /** Advance without recording an answer. */
  readonly onSkip: () => void;
}

export function WizardView({ question, index, total, value, onAnswer, onSkip }: WizardViewProps) {
  const t = CT4_RELATIONSHIP;
  const reduced = useReducedMotion();
  const progress = Math.round(((index + 1) / total) * 100);
  const areaLabel = t.wizard.areaLabel[question.domain];

  // Local highlight for the just-tapped option during the confirm window, so the
  // selection shows before the flow swaps in the next question. The flow remounts
  // this view per question (key=question.id), so `pending` is naturally fresh on
  // each question and on Back — no reset effect needed.
  const [pending, setPending] = useState<number | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any in-flight auto-advance timer on unmount (covers advancing, Back, and
  // leaving the wizard) so a pending tap can never trigger a stray advance.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const handlePick = useCallback(
    (v: number) => {
      if (pending !== undefined) return; // ignore taps during the confirm window
      setPending(v);
      if (reduced) {
        onAnswer(v);
        return;
      }
      timer.current = setTimeout(() => onAnswer(v), CONFIRM_MS);
    },
    [pending, reduced, onAnswer],
  );

  const shown = pending ?? value;

  return (
    <View className="flex-1 px-4">
      {/* Progress */}
      <View className="gap-2 pb-4 pt-2">
        <View className="flex-row items-center justify-between">
          <Text
            variant="caption"
            className="uppercase tracking-wider text-text-secondary dark:text-text-secondary-dark font-sans-medium"
          >
            {areaLabel}
          </Text>
          <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
            {index + 1} {t.wizard.of} {total}
          </Text>
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ now: progress, min: 0, max: 100 }}
          className="h-1.5 overflow-hidden rounded-full bg-surface-active dark:bg-surface-active-dark"
        >
          <View className="h-full rounded-full bg-primary dark:bg-primary-dark" style={{ width: `${progress}%` }} />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-6 pt-3"
        showsVerticalScrollIndicator={false}
      >
        <QuestionCard question={question} value={shown} onSelect={handlePick} />
      </ScrollView>

      {/* Footer — Skip only; answering advances automatically */}
      <View className="items-center pb-2 pt-3">
        <Button variant="ghost" onPress={onSkip}>
          {t.wizard.skipQuestion}
        </Button>
      </View>
    </View>
  );
}
