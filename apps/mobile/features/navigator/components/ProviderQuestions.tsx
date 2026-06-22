import { View } from 'react-native';

import { Text } from '@/components/ui/Text';

import { NAVIGATOR_COPY } from '../copy';

// "Conversation Starters" — mobile port of web ProviderQuestions. Renders the engine-
// generated (generateProviderQuestions) list as a numbered set of prompts the user can
// bring to a clinician. P40 adds a per-item "why this helps" line — a generic, process-
// oriented rationale (cycled), NOT a condition-specific clinical claim. Plain text, no
// diagnostic framing. The why-lines are CT4 FIXTURE (pending Dr. Dobson).

export interface ProviderQuestionsProps {
  readonly questions: readonly string[];
}

export function ProviderQuestions({ questions }: ProviderQuestionsProps) {
  const whyLines = NAVIGATOR_COPY.conversationWhyLines;
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
          <View className="flex-1 gap-1.5">
            <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
              {q}
            </Text>
            <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
              {NAVIGATOR_COPY.conversationWhyPrefix}
              {whyLines[i % whyLines.length]}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
