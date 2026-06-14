// Sleep Architect — local crisis-content detection. Ported from psychage-v2
// `detectCrisisContent`. A purely on-device keyword scan over free-text the user
// types (notes, dream notes, brain dump): a match lets the screen surface the
// crisis affordance more prominently. NEVER blocks input and NEVER leaves the
// device (SR-2/SR-3/SR-4).

import { CRISIS_KEYWORDS } from './constants';

/** True when `text` contains any crisis keyword (case-insensitive substring). */
export function detectCrisisContent(text: string): boolean {
  if (!text || text.trim().length === 0) return false;
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((keyword) => lower.includes(keyword));
}
