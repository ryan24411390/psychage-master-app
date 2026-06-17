import { View } from 'react-native';

import { Text } from '@/components/ui/Text';

// "Conversation Starters" — mobile port of web ProviderQuestions. Renders the engine-
// generated (generateProviderQuestions) list as a numbered set of prompts the user can
// bring to a clinician. Plain, copyable text — no diagnostic framing.

export interface ProviderQuestionsProps {
  readonly questions: readonly string[];
}

export function ProviderQuestions({ questions }: ProviderQuestionsProps) {
  return (
    <View className="gap-3">
      {questions.map((q, i) => (
        <View
          key={q}
          className="flex-row gap-3 rounded-xl border border-border bg-surface-accent p-4 dark:border-border-dark dark:bg-surface-accent-dark"
        >
          <Text variant="label" className="text-primary dark:text-primary-dark">
            {i + 1}.
          </Text>
          <Text variant="body" className="flex-1 text-text-secondary dark:text-text-secondary-dark">
            {q}
          </Text>
        </View>
      ))}
    </View>
  );
}
