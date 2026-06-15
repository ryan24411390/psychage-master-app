import type { MomentEntry, MomentInput, MoodJournalStore } from '@psychage/shared/mood-journal';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { AddMomentSheet } from '@/features/mood-journal/AddMomentSheet';
import { CT4_MOOD_JOURNAL } from '@/features/mood-journal/copy';
import { PatternView } from '@/features/mood-journal/PatternView';

// Mood Journal tool body. Empty-state ↔ PatternView, with a persistent "Add a
// moment" CTA that opens the AddMomentSheet overlay. Takes the store as a prop so
// render tests inject an in-memory double (the route passes the real singleton).
//
// Mood is single-sourced in the check-in record; this view never re-captures it.
// (The check-in store joins in only when the gated co-occurrence section ships —
// see PatternView's safety note.)

type MoodJournalViewProps = {
  momentStore: MoodJournalStore;
};

export function MoodJournalView({ momentStore }: MoodJournalViewProps) {
  const [moments, setMoments] = useState<MomentEntry[]>(() => momentStore.getAll());
  const [sheetOpen, setSheetOpen] = useState(false);
  const t = CT4_MOOD_JOURNAL;

  const handleSave = (input: MomentInput) => {
    // May throw on a full local store — AddMomentSheet wraps this call and, on throw,
    // keeps the sheet open with the selection intact. On success we refresh + close.
    momentStore.addMoment(input);
    setMoments(momentStore.getAll());
    setSheetOpen(false);
  };

  const handleDelete = (id: string) => {
    // Local-only delete; refresh from the store so the timeline + insights re-derive.
    momentStore.deleteMoment(id);
    setMoments(momentStore.getAll());
  };

  return (
    <View className="flex-1">
      <ScrollView contentContainerClassName="gap-4 px-4 py-4" showsVerticalScrollIndicator={false}>
        <View>
          <Text variant="headingLg">{t.title}</Text>
          <Text variant="body" className="mt-1 text-text-secondary dark:text-text-secondary-dark">
            {t.intro}
          </Text>
        </View>

        {moments.length === 0 ? (
          <Card testID="mood-journal-empty" className="p-5">
            <Text variant="heading">{t.empty.heading}</Text>
            <Text variant="body" className="mt-1 text-text-secondary dark:text-text-secondary-dark">
              {t.empty.body}
            </Text>
          </Card>
        ) : (
          <PatternView moments={moments} onDelete={handleDelete} />
        )}
      </ScrollView>

      <View className="px-4 pb-4 pt-2">
        <Button variant="primary" onPress={() => setSheetOpen(true)} testID="mood-journal-add-cta">
          {t.addCta}
        </Button>
      </View>

      {sheetOpen && (
        <AddMomentSheet onSave={handleSave} onClose={() => setSheetOpen(false)} />
      )}
    </View>
  );
}
