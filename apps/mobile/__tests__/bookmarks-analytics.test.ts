import { describe, expect, it, vi } from 'vitest';

const track = vi.fn();
vi.mock('@/lib/adapters/analytics', () => ({ analytics: { track: (e: unknown) => track(e) } }));

import {
  trackBookmarkAdded,
  trackBookmarkRemoved,
  trackSavedItemOpened,
  trackSavedListOpened,
} from '@/features/bookmarks/analytics';

describe('bookmarks analytics (SR-4 / AC-N.4b — count only)', () => {
  it('emits the four events by name with NO resource identifiers', () => {
    trackBookmarkAdded();
    trackBookmarkRemoved();
    trackSavedListOpened();
    trackSavedItemOpened();

    const names = track.mock.calls.map((c) => c[0].name);
    expect(names).toEqual(['bookmark_added', 'bookmark_removed', 'saved_list_opened', 'saved_item_opened']);

    // No payload may carry resource_id / resource_type / slug or any identifier.
    for (const [event] of track.mock.calls) {
      expect(event.props).toBeUndefined();
    }
  });
});
