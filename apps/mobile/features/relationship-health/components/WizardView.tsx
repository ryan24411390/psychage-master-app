import { ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

import { CT4_RELATIONSHIP } from '../copy';
import type { RelationshipQuestion } from '../types';
import { QuestionCard } from './QuestionCard';

// Controlled question stepper. The flow owns currentIndex + answers (so the
// chrome's top Back can step backward through the wizard); this view renders the
// progress, the current statement, and the Skip / Next footer.

export interface WizardViewProps {
  readonly question: RelationshipQuestion;
  readonly index: number;
  readonly total: number;
  readonly value: number | undefined;
  readonly onSelect: (value: number) => void;
  readonly onNext: () => void;
  readonly onSkip: () => void;
}

export function WizardView({ question, index, total, value, onSelect, onNext, onSkip }: WizardViewProps) {
  const t = CT4_RELATIONSHIP;
  const isLast = index === total - 1;
  const progress = Math.round(((index + 1) / total) * 100);
  const areaLabel = t.wizard.areaLabel[question.domain];

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
        <QuestionCard question={question} value={value} onSelect={onSelect} />
      </ScrollView>

      {/* Footer */}
      <View className="flex-row items-center gap-3 pb-2 pt-3">
        <Button variant="ghost" onPress={onSkip} className="flex-1">
          {t.wizard.skipQuestion}
        </Button>
        <Button variant="primary" onPress={onNext} disabled={value === undefined} className="flex-[2]">
          {isLast ? t.wizard.finish : t.wizard.next}
        </Button>
      </View>
    </View>
  );
}
