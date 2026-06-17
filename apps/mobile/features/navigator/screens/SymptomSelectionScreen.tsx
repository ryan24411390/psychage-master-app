import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import type { Symptom, SymptomCategory } from '@psychage/shared/navigator';

import { SearchableList } from '@/components/SearchableList';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/colors';

import { NAVIGATOR_COPY } from '../copy';
import { SafetyBanner } from '../components/SafetyBanner';
import { SymptomCategory as SymptomCategorySection } from '../components/SymptomCategory';
import { SymptomChip } from '../components/SymptomChip';

// S — Symptom selection (mobile port of web SymptomSelectionScreen). Symptoms are
// grouped into collapsible category sections (each with Select-all / Clear), with a
// search escape hatch and an inline SafetyBanner when a CRISIS-flagged symptom is
// selected. ≥1 symptom required to continue.

export interface SymptomSelectionScreenProps {
  /** KB symptoms already filtered to the selected domains (active only). */
  readonly symptoms: readonly Symptom[];
  readonly selectedIds: readonly string[];
  readonly emergencyNumber: string;
  readonly onToggle: (id: string) => void;
  readonly onAddMany: (ids: readonly string[]) => void;
  readonly onRemoveMany: (ids: readonly string[]) => void;
  readonly onContinue: () => void;
}

const CATEGORY_LABELS: Record<SymptomCategory, string> = {
  mood: 'Mood',
  anxiety_fear: 'Anxiety & Fear',
  emotional_regulation: 'Emotional Regulation',
  body_sensations: 'Body Sensations',
  sleep: 'Sleep',
  appetite_weight: 'Appetite & Weight',
  energy: 'Energy',
  cognition: 'Thinking & Focus',
  perception: 'Perception',
  social: 'Social',
  coping: 'Coping',
  activity_level: 'Activity Level',
  identity_self_image: 'Identity & Self-Image',
  somatic_health: 'Physical Health',
};

export function SymptomSelectionScreen({
  symptoms,
  selectedIds,
  emergencyNumber,
  onToggle,
  onAddMany,
  onRemoveMany,
  onContinue,
}: SymptomSelectionScreenProps) {
  const [searching, setSearching] = useState(false);

  // Group symptoms by category, preserving display_order within and across groups.
  const groups = useMemo(() => {
    const byCategory = new Map<SymptomCategory, Symptom[]>();
    for (const s of [...symptoms].sort((a, b) => a.display_order - b.display_order)) {
      const list = byCategory.get(s.category) ?? [];
      list.push(s);
      byCategory.set(s.category, list);
    }
    return [...byCategory.entries()];
  }, [symptoms]);

  const crisisSelected = useMemo(
    () =>
      symptoms.some(
        (s) => selectedIds.includes(s.id) && s.is_red_flag && s.red_flag_level === 'CRISIS',
      ),
    [symptoms, selectedIds],
  );

  if (searching) {
    return (
      <View className="h-[480px] px-4">
        <SearchableList
          items={symptoms}
          getKey={(s) => s.id}
          getLabel={(s) => s.name}
          onSelect={(s) => {
            onToggle(s.id);
            setSearching(false);
          }}
          accentColor={colors.teal[700]}
          searchPlaceholder={NAVIGATOR_COPY.searchPlaceholder}
          searchAccessibilityLabel={NAVIGATOR_COPY.searchA11y}
          noMatchLabel={NAVIGATOR_COPY.noMatch}
        />
      </View>
    );
  }

  return (
    <ScrollView contentContainerClassName="gap-5 px-4 pb-10 pt-2" keyboardShouldPersistTaps="handled">
      <View className="gap-1.5">
        <Text variant="h1" accessibilityRole="header">
          {NAVIGATOR_COPY.symptomsTitle}
        </Text>
        <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
          {NAVIGATOR_COPY.symptomsSubtitle}
        </Text>
      </View>

      {crisisSelected ? <SafetyBanner emergencyNumber={emergencyNumber} /> : null}

      {groups.map(([category, list]) => {
        const ids = list.map((s) => s.id);
        const selectedCount = ids.filter((id) => selectedIds.includes(id)).length;
        return (
          <SymptomCategorySection
            key={category}
            title={CATEGORY_LABELS[category]}
            total={list.length}
            selectedCount={selectedCount}
            onSelectAll={() => onAddMany(ids)}
            onClear={() => onRemoveMany(ids)}
          >
            {list.map((s) => (
              <SymptomChip
                key={s.id}
                label={s.name}
                selected={selectedIds.includes(s.id)}
                onToggle={() => onToggle(s.id)}
              />
            ))}
          </SymptomCategorySection>
        );
      })}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={NAVIGATOR_COPY.somethingElse}
        onPress={() => setSearching(true)}
        hitSlop={6}
        className="min-h-[44px] justify-center"
      >
        <Text variant="bodyLarge" className="text-primary dark:text-primary-dark">
          {NAVIGATOR_COPY.somethingElse}
        </Text>
      </Pressable>

      <Button
        variant="primary"
        disabled={selectedIds.length === 0}
        onPress={onContinue}
        className="mt-1"
      >
        {NAVIGATOR_COPY.continue}
      </Button>
    </ScrollView>
  );
}
