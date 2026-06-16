import { useState } from 'react';
import { View } from 'react-native';

import { type ChronotypeResult, scoreChronotype } from '@psychage/shared/sleep';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { CT4_SLEEP } from '@/features/sleep-architect/copy';

// Chronotype quiz (rMEQ). Question content is CT4; scoring is the shared, tested
// scoreChronotype. Educational framing — a "pattern", never a verdict (SR-1/SR-3).

type ChronotypeQuizProps = {
  onSaveTargets: (result: ChronotypeResult) => void;
};

export function ChronotypeQuiz({ onSaveTargets }: ChronotypeQuizProps) {
  const t = CT4_SLEEP.tools;
  const questions = CT4_SLEEP.chronotypeQuestions;
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const allAnswered = questions.every((q) => answers[q.id] !== undefined);
  const result: ChronotypeResult | null = allAnswered
    ? scoreChronotype(questions.map((q) => answers[q.id] ?? 0))
    : null;

  if (result) {
    return (
      <View className="gap-4">
        <Text
          variant="caption"
          className="uppercase tracking-wider text-text-secondary dark:text-text-secondary-dark"
        >
          {t.chronotypeResult}
        </Text>
        <Text variant="headingLg">{result.label}</Text>
        <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
          {result.description}
        </Text>
        <Card className="gap-1 px-4 py-3">
          <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
            {t.chronotypeIdeal}
          </Text>
          <Text variant="bodyBold">
            {result.ideal_bedtime} – {result.ideal_wake_time}
          </Text>
        </Card>
        <Button variant="primary" className="w-full" onPress={() => onSaveTargets(result)}>
          {t.chronotypeSave}
        </Button>
        <Button variant="ghost" className="w-full" onPress={() => setAnswers({})}>
          {t.chronotypeRetake}
        </Button>
      </View>
    );
  }

  return (
    <View className="gap-5">
      <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
        {t.chronotypeIntro}
      </Text>
      {questions.map((q) => (
        <View key={q.id} className="gap-2">
          <Text variant="bodyMedium">{q.question}</Text>
          {q.options.map((opt) => {
            const selected = answers[q.id] === opt.value;
            return (
              <AnimatedPressable
                key={opt.label}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={opt.label}
                onPress={() => setAnswers((a) => ({ ...a, [q.id]: opt.value }))}
                className={`min-h-[44px] justify-center rounded-lg border bg-surface px-3 dark:bg-surface-dark ${
                  selected
                    ? 'border-primary dark:border-primary-dark'
                    : 'border-border dark:border-border-dark'
                }`}
              >
                <Text
                  variant={selected ? 'bodyBold' : 'body'}
                  className={selected ? 'text-primary dark:text-primary-dark' : ''}
                >
                  {opt.label}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
