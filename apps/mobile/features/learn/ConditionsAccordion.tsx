import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { AppLoader } from '@/components/ui/AppLoader';
import { Text } from '@/components/ui/Text';
import { ConditionFamilyRow } from '@/features/learn/ConditionFamilyRow';
import { CT4_LEARN } from '@/features/learn/copy';
import { filterConditions, groupByFamily } from '@/lib/conditions/families';
import { useConditionsReference } from '@/lib/conditions/hooks';
import { openConditionGuide } from '@/lib/nav';

// The "Conditions" body of Browse: the ICD-11 family accordion, read live from the
// verified conditions_reference taxonomy (same source as the web /conditions page).
// Families render in canonical ICD-11 order; each shows its member count and
// expands to its conditions; a member routes to its guide. `query` filters family
// + member names live. Open state is local UI state (a set of expanded families).

export function ConditionsAccordion({ query }: { query: string }) {
  const t = CT4_LEARN;
  const { data: conditions, isLoading } = useConditionsReference();
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());

  const groups = useMemo(() => groupByFamily(conditions ?? []), [conditions]);
  const visible = useMemo(() => filterConditions(groups, query), [groups, query]);

  const toggle = (family: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(family)) next.delete(family);
      else next.add(family);
      return next;
    });

  // While searching, auto-expand the matches so hits are visible without a tap.
  const searching = query.trim().length > 0;

  if (conditions === undefined && isLoading) {
    return (
      <View className="px-5 pt-10">
        <AppLoader label="Loading conditions" />
      </View>
    );
  }

  return (
    <View className="px-5 pt-4">
      <Text
        variant="body"
        className="pb-2 text-text-secondary dark:text-text-secondary-dark"
      >
        {t.conditionsIntro}
      </Text>

      {visible.length === 0 ? (
        <Text
          variant="body"
          className="pt-6 text-text-tertiary dark:text-text-tertiary-dark"
        >
          {t.conditionsEmpty}
        </Text>
      ) : (
        visible.map((group) => (
          <ConditionFamilyRow
            key={group.family}
            group={group}
            expanded={searching || open.has(group.family)}
            onToggle={() => toggle(group.family)}
            onSelectCondition={openConditionGuide}
          />
        ))
      )}
    </View>
  );
}
