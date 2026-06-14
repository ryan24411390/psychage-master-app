// CT4 FIXTURE — Provider Directory copy (S26 list + S27 detail). NOT final copy.
// Framing is strictly INFORMATIONAL / non-clinical: no "we recommend", no "verified
// by Psychage", no booking language the web doesn't carry. Clinically reviewed
// before ship (root CLAUDE.md §7).
const FIXTURE = 'FIXTURE — not final copy' as const;

export const DIRECTORY_COPY = {
  _fixture: 'CT4' as const,
  _marker: FIXTURE,

  // List (S26)
  title: 'Provider directory',
  searchPlaceholder: 'Search by name, specialty, or place',
  searchAccessibilityLabel: 'Search the provider directory',
  filtersButton: 'Filters',
  nearMe: 'Near me',
  locationDenied: 'Location off — searching by your other filters.',
  emptyPrompt: 'Search or add a filter to browse the directory.',
  noResults: 'No providers match these filters.',
  droppedState: 'No match in that state — showing the city instead.',
  resultCount: (n: number) => `${n.toLocaleString()} ${n === 1 ? 'provider' : 'providers'}`,
  loadingMore: 'Loading more…',
  disclaimer: 'A listing is information, not a recommendation. Psychage does not vet or endorse providers.',

  // Badges (mirror the provider's own DB state — not an endorsement)
  badgeVerified: 'Verified',
  badgeClaimed: 'Claimed',
  badgeUnclaimed: 'Listed',
  telehealth: 'Telehealth',
  inPerson: 'In person',

  // Detail (S27)
  about: 'About',
  specialties: 'Specialties',
  languages: 'Languages',
  insurance: 'Insurance',
  locations: 'Location',
  contact: 'Contact',
  call: 'Call',
  website: 'Website',
  directions: 'Directions',
  email: 'Email',
  booking: 'Booking page',
  useAsTherapist: 'Use in my therapist record',
  notFoundTitle: 'Provider unavailable',
  notFoundBody: 'This listing could not be loaded. It may have been removed.',
} as const;
