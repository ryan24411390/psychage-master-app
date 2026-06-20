// DEV-ONLY, NON-CLINICAL placeholder rows — UI scaffolding, never shipped content.
//
// Why this exists: the shared `conditions` table is not yet reshaped to the ICD-11
// reference (web owns that migration), so there are zero real rows to render. These
// fake entries let the index/detail/scrubber/Listen be exercised in the simulator and
// in tests BEFORE real content lands. They are deliberately NOT about any real
// condition — no clinical claims, no diagnostic language (Sacred Rule #2). Claude Code
// authors no clinical copy; this is throwaway layout filler.
//
// Reachability: surfaced ONLY when `__DEV__ && CONDITIONS_PREVIEW` and the live table
// returned nothing (see queries.ts). `__DEV__` is false in production bundles and the
// preview flag is off in store builds — double-gated, so this can never reach users.
// DELETE this file once the real table is live.

import type { Condition } from '@/features/conditions-reference/types';

export const SAMPLE_CONDITIONS: Condition[] = [
  {
    slug: 'sample-alpha',
    name: 'Sample Entry Alpha',
    icd11_code: '6X01',
    icd11_grouping: 'Example family one',
    short_definition: 'Placeholder copy to verify the "what it is" block layout. Not real content.',
    what_it_feels_like:
      'Placeholder copy to verify the "what it feels like" block at a comfortable reading measure. Not real content.',
    how_it_differs: 'Placeholder copy to verify the "how it differs" block. Not real content.',
    when_more_than_everyday:
      'Placeholder copy to verify the "when it is more than the everyday" block. Not real content.',
    crisis_flag: false,
    provenance: 'PLACEHOLDER — layout fixture only',
    verification_status: 'verified',
    reading_level: '8th grade',
  },
  {
    slug: 'sample-beta',
    name: 'Sample Entry Beta',
    icd11_code: '6X02',
    icd11_grouping: 'Example family two',
    short_definition: 'Placeholder copy. Verifies a row in a different ICD-11 family for the filter.',
    what_it_feels_like: 'Placeholder copy. Not real content.',
    how_it_differs: null,
    when_more_than_everyday: null,
    crisis_flag: true, // exercises the prominent crisis affordance path
    provenance: 'PLACEHOLDER — layout fixture only',
    verification_status: 'verified',
    reading_level: '8th grade',
  },
  {
    slug: 'sample-gamma',
    name: 'Sample Entry Gamma',
    icd11_code: '6X03',
    icd11_grouping: 'Example family one',
    // All definition fields null → exercises the calm "definition in review" state.
    short_definition: null,
    what_it_feels_like: null,
    how_it_differs: null,
    when_more_than_everyday: null,
    crisis_flag: false,
    provenance: 'PLACEHOLDER — layout fixture only',
    verification_status: 'verified',
    reading_level: '8th grade',
  },
  {
    slug: 'sample-delta',
    name: 'Another Sample Delta',
    icd11_code: '6X04',
    icd11_grouping: 'Example family three',
    short_definition: 'Placeholder copy under the letter "A" to exercise A–Z grouping. Not real content.',
    what_it_feels_like: 'Placeholder copy. Not real content.',
    how_it_differs: 'Placeholder copy. Not real content.',
    when_more_than_everyday: 'Placeholder copy. Not real content.',
    crisis_flag: false,
    provenance: 'PLACEHOLDER — layout fixture only',
    verification_status: 'verified',
    reading_level: '8th grade',
  },
  {
    slug: 'sample-epsilon-unverified',
    name: 'Zeta Draft (unverified)',
    icd11_code: '6X05',
    icd11_grouping: 'Example family two',
    short_definition: 'Placeholder draft. Only visible in preview — verifies the gate. Not real content.',
    what_it_feels_like: 'Placeholder copy. Not real content.',
    how_it_differs: 'Placeholder copy. Not real content.',
    when_more_than_everyday: 'Placeholder copy. Not real content.',
    crisis_flag: false,
    provenance: 'PLACEHOLDER — layout fixture only',
    verification_status: 'unverified',
    reading_level: '8th grade',
  },
];
