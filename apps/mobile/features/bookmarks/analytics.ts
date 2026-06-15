/**
 * Bookmarks telemetry — count-only (design.md §Telemetry; SR-4 / AC-N.4b).
 *
 * A saved resource_id can imply mental-health interest, so these events carry
 * NO resource id, resource type, slug, or any content identifier — only that a
 * save/open happened. The save→return metric is derived from per-user event
 * presence, not from what was saved. Never add props to these calls.
 */

import { analytics } from '@/lib/adapters/analytics';

export function trackBookmarkAdded(): void {
  analytics.track({ name: 'bookmark_added' });
}

export function trackBookmarkRemoved(): void {
  analytics.track({ name: 'bookmark_removed' });
}

export function trackSavedListOpened(): void {
  analytics.track({ name: 'saved_list_opened' });
}

export function trackSavedItemOpened(): void {
  analytics.track({ name: 'saved_item_opened' });
}
