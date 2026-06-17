import { Check } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';

import type { SymptomDomain } from '@psychage/shared/navigator';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/colors';

import { NAVIGATOR_COPY } from '../copy';

// S — Domain selection (mobile port of web DomainSelectionScreen). Multi-select across
// the four symptom domains + a Select-All shortcut. Continue is disabled until ≥1 chosen.

export interface DomainSelectionScreenProps {
  readonly selected: readonly SymptomDomain[];
  readonly onToggle: (domain: SymptomDomain) => void;
  readonly onSelectAll: () => void;
  readonly onNext: () => void;
}

export const DOMAINS: ReadonlyArray<{ id: SymptomDomain; label: string; description: string }> = [
  { id: 'emotional', label: 'Emotional & Mood', description: 'Feelings, mood, worry, fear' },
  { id: 'physical', label: 'Physical Responses', description: 'Body sensations, energy, sleep, appetite' },
  { id: 'cognitive', label: 'Cognitive & Focus', description: 'Thinking, memory, concentration' },
  { id: 'behavioral', label: 'Behavioral Changes', description: 'Habits, activity, how you cope' },
];

export function DomainSelectionScreen({
  selected,
  onToggle,
  onSelectAll,
  onNext,
}: DomainSelectionScreenProps) {
  return (
    <ScrollView contentContainerClassName="gap-4 px-4 pb-10 pt-2" keyboardShouldPersistTaps="handled">
      <View className="gap-1.5">
        <Text variant="h1" accessibilityRole="header">
          {NAVIGATOR_COPY.domainTitle}
        </Text>
        <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
          {NAVIGATOR_COPY.domainSubtitle}
        </Text>
      </View>

      {DOMAINS.map((domain) => {
        const isSelected = selected.includes(domain.id);
        return (
          <Pressable
            key={domain.id}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${domain.label}. ${domain.description}`}
            onPress={() => onToggle(domain.id)}
            className={`min-h-[72px] flex-row items-center justify-between rounded-2xl border px-5 py-4 ${
              isSelected
                ? 'border-teal-700 bg-teal-50 dark:bg-teal-900'
                : 'border-border bg-surface dark:border-border-dark dark:bg-surface-dark'
            }`}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <View className="flex-1 gap-0.5">
              <Text variant="label" className={isSelected ? 'text-teal-900 dark:text-teal-50' : undefined}>
                {domain.label}
              </Text>
              <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
                {domain.description}
              </Text>
            </View>
            {isSelected ? <Check size={20} color={colors.teal[700]} strokeWidth={2} /> : null}
          </Pressable>
        );
      })}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={NAVIGATOR_COPY.selectAll}
        onPress={onSelectAll}
        hitSlop={6}
        className="min-h-[44px] justify-center"
      >
        <Text variant="bodyLarge" className="text-primary dark:text-primary-dark">
          {NAVIGATOR_COPY.selectAll}
        </Text>
      </Pressable>

      <Button variant="primary" disabled={selected.length === 0} onPress={onNext} className="mt-2">
        {NAVIGATOR_COPY.continue}
      </Button>
    </ScrollView>
  );
}
