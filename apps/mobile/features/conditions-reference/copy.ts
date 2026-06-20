// CT4 FIXTURE — Conditions reference chrome copy. NOT final.
// Chrome strings only (labels, section titles, empty/loading states). The condition
// NAMES + the four definition bodies come from the shared table — never authored here.
// Educational framing only, no diagnostic language (Sacred Rule #2). Any user-facing
// string here that touches conditions needs Dr. Dobson review before ship.
//
// The disclaimer is NOT a fixture — it is the verbatim contract string
// (CONDITION_DISCLAIMER), re-exported so views import one place.
import { CONDITION_DISCLAIMER } from './types';

const FIXTURE = 'FIXTURE — not final copy' as const;

export const CONDITIONS_REF_COPY = {
  _fixture: 'CT4' as const,
  _marker: FIXTURE,

  // Index screen
  title: 'Conditions A–Z',
  intro:
    'Plain-language explanations of mental health conditions, organised A–Z and by ICD-11 family. Educational — not a diagnosis.',
  searchPlaceholder: 'Search a condition or ICD-11 code…',
  searchA11y: 'Search conditions',
  allFamilies: 'All families',
  familyFilterA11y: 'Filter by ICD-11 family',
  scrubberA11y: 'Alphabet index',
  clearSearch: 'Clear search',

  // Empty / loading
  emptyTitle: 'Conditions are on the way',
  emptyBody:
    "This reference is being prepared and reviewed. There's nothing to show here yet — please check back soon.",
  noMatch: 'No conditions match your search.',

  // Detail screen
  back: 'Back',
  notFoundTitle: 'Condition not found',
  notFoundBody: 'We couldn’t find that entry. It may have moved or not be published yet.',
  inReviewTitle: 'Definition in review',
  inReviewBody:
    'A plain-language explanation for this condition is being written and clinically reviewed. Check back soon.',

  // Listen (read-aloud)
  listen: 'Listen',
  stop: 'Stop',
  listenA11y: 'Listen to this condition',
  stopA11y: 'Stop reading',

  // Crisis (shown prominently where crisis_flag is set)
  crisisTitle: 'If you need support now',
  crisisBody: 'Help is available any time. Tap to see crisis support options.',
  crisisCta: 'Get crisis support',

  // Fixed foot disclaimer (verbatim contract string)
  disclaimer: CONDITION_DISCLAIMER,
} as const;
