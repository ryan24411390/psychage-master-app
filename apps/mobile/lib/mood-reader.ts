// Mood projection over the unified Moments store. The Mood Journal kept a separate
// record of feeling words; it was folded into Moments (P42–P44). The Insights "most
// noted feeling" summary and the therapist export still want a per-moment view of
// "instant + feeling words", so this adapter exposes exactly that over the one store —
// no second store, no duplicate plumbing.
//
// LOCAL-ONLY (SR-4): a pure read projection; it touches no network and no Supabase.
// A moment's `labels` (the feeling words / descriptors) map to `emotions`; the capture
// instant `timestamp` maps to `createdAt`.

import type { EngagementStore, LocalCalendarDate, Moment } from '@psychage/shared/engagement';

import type { MoodMomentView } from '@/features/insights/aggregate';

function toView(moment: Moment): MoodMomentView {
  return { createdAt: moment.timestamp, emotions: moment.labels };
}

/** The read surface the mood consumers depend on (a subset of the old MoodJournalStore). */
export interface MoodReaderView {
  getRecent(n: number): MoodMomentView[];
  getRange(from: LocalCalendarDate, to: LocalCalendarDate): MoodMomentView[];
}

/** Wrap a Moments store in the mood projection. Each read derives fresh from the store. */
export function moodReaderFromMoments(store: EngagementStore): MoodReaderView {
  return {
    getRecent: (n) => store.getRecent(n).map(toView),
    getRange: (from, to) => store.getRange(from, to).map(toView),
  };
}
