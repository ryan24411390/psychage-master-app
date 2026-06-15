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
  recentlyViewed: 'Recently viewed',
  scopeAllStates: 'All states',
  editScope: 'Change location',

  // Sort (order, not a ranking of quality). Maps to search_providers_v3 sort_by.
  sortButton: 'Sort',
  sortTitle: 'Sort',
  sortNote: 'Sorting changes order only. It is not a ranking of quality.',
  sortRelevance: 'Relevance',
  sortName: 'Name (A–Z)',
  sortNearest: 'Nearest',

  // Thin-coverage banner (real total). CT-pending.
  coverageNote: (place: string, n: number) => `Limited coverage in ${place} (${n}).`,
  coverageAction: 'Browse all states',

  // Specialty quick-suggestions under the search box.
  searchSpecialtyHint: (label: string) => `Search ${label}`,
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
  acceptingPatients: 'Accepting new patients',

  // Provenance / credentials (detail). Informational — provider's own registry
  // data, not a Psychage endorsement. CT-pending.
  credentialsTitle: 'Credentials & verification',
  npiLabel: 'NPI',
  licenseLabel: 'License',
  npiSource: 'Listed from the NPI registry',
  lastConfirmed: (when: string) => `Last confirmed ${when}`,

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
