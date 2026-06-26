// Curated Browse taxonomy — the web psychage.com Browse card set.
//
// The mobile grid is driven by THIS manifest, not the live `article_categories`
// table: the DB taxonomy is messy (legacy slugs, missing posters) while the web's
// Browse uses a clean, poster-aligned set. Every slug here has a bundled poster in
// `topic-posters.ts` and a card visual whose title is baked into the image.
//
// `group` is EXPLICIT, not derived — `@psychage/shared/peaf` getCategoryGroup()
// mis-buckets some of these (e.g. `mental-health-conditions`, `chronic-illness-pain`
// fall to "Life & Society" via its keyword regex), so it can't be the source of
// truth for presentation. The "Conditions & Disorders" group + order are locked to
// reference images 1–2. The other two groups' membership/order are authored (not
// shown in the references) and open to tuning.
//
// `title` is an accessibility / search-filter label only — the card renders the
// poster (which already shows the title). Reconcile against the baked poster text;
// CT4 FIXTURE, Dr. Dobson-reviewable like the rest of the Browse copy.

export const BROWSE_GROUP_ORDER = [
  'Conditions & Disorders',
  'Behavior & Wellness',
  'Life & Society',
] as const;

export type BrowseGroup = (typeof BROWSE_GROUP_ORDER)[number];

export type BrowseCard = {
  /** Canonical taxonomy slug — keys the bundled poster + the tap route. */
  slug: string;
  /** A11y / search label. The visible title is baked into the poster. */
  title: string;
  group: BrowseGroup;
};

// Order within each group is presentation order. Conditions matches the reference.
export const BROWSE_CARDS: readonly BrowseCard[] = [
  // ── Conditions & Disorders (verified against reference images 1–2) ──
  { slug: 'anxiety-stress', title: 'Anxiety & Stress', group: 'Conditions & Disorders' },
  { slug: 'depression-grief', title: 'Depression & Grief', group: 'Conditions & Disorders' },
  { slug: 'trauma-healing', title: 'Trauma & Healing', group: 'Conditions & Disorders' },
  { slug: 'mental-health-conditions', title: 'Mental Health Conditions', group: 'Conditions & Disorders' },
  { slug: 'psychosis-schizophrenia', title: 'Psychosis & Schizophrenia', group: 'Conditions & Disorders' },
  { slug: 'neurodivergence-adhd-autism', title: 'Neurodivergence', group: 'Conditions & Disorders' },
  { slug: 'eating-body', title: 'Eating & Body', group: 'Conditions & Disorders' },
  { slug: 'chronic-illness-pain', title: 'Chronic Illness & Pain', group: 'Conditions & Disorders' },
  { slug: 'aging-dementia-late-life', title: 'Aging & Late-Life', group: 'Conditions & Disorders' },
  { slug: 'ocd-related', title: 'OCD & Related', group: 'Conditions & Disorders' },
  { slug: 'substance-addiction', title: 'Substance Use & Addiction', group: 'Conditions & Disorders' },

  // ── Behavior & Wellness (authored — not shown in references) ──
  { slug: 'emotional-regulation', title: 'Emotional Regulation', group: 'Behavior & Wellness' },
  { slug: 'habits-behavior-change', title: 'Habits & Behavior Change', group: 'Behavior & Wellness' },
  { slug: 'sleep-body-connection', title: 'Sleep & Body', group: 'Behavior & Wellness' },
  { slug: 'self-worth-identity', title: 'Self-Worth & Identity', group: 'Behavior & Wellness' },
  { slug: 'therapy-navigation', title: 'Therapy & Treatment', group: 'Behavior & Wellness' },
  { slug: 'sports-exercise-psychology', title: 'Sports & Exercise', group: 'Behavior & Wellness' },
  { slug: 'creativity-therapeutic-arts', title: 'Creativity & the Arts', group: 'Behavior & Wellness' },
  { slug: 'life-skills-practical-psychology', title: 'Life Skills', group: 'Behavior & Wellness' },

  // ── Life & Society (authored — not shown in references) ──
  { slug: 'relationships-communication', title: 'Relationships & Communication', group: 'Life & Society' },
  { slug: 'work-productivity', title: 'Work & Productivity', group: 'Life & Society' },
  { slug: 'loneliness-connection', title: 'Loneliness & Connection', group: 'Life & Society' },
  { slug: 'family-parenting', title: 'Family & Parenting', group: 'Life & Society' },
  { slug: 'life-transitions', title: 'Life Transitions', group: 'Life & Society' },
  { slug: 'digital-life', title: 'Digital Life', group: 'Life & Society' },
  { slug: 'technology-digital-life', title: 'Technology & Mental Health', group: 'Life & Society' },
  { slug: 'cultural-global', title: 'Cultural & Global', group: 'Life & Society' },
  { slug: 'womens-mental-health', title: "Women's Mental Health", group: 'Life & Society' },
  { slug: 'mens-mental-health', title: "Men's Mental Health", group: 'Life & Society' },
  { slug: 'financial-wellness', title: 'Financial Wellness', group: 'Life & Society' },
  { slug: 'spirituality-meaning', title: 'Spirituality & Meaning', group: 'Life & Society' },
  { slug: 'environmental-eco-psychology', title: 'Environment & Eco-Psychology', group: 'Life & Society' },
];

export type GroupedBrowseCards = {
  /** Groups that hold cards, in BROWSE_GROUP_ORDER (none are empty here). */
  orderedGroups: BrowseGroup[];
  byGroup: Map<BrowseGroup, BrowseCard[]>;
};

// Bucket the manifest by group, preserving manifest order within each group and the
// canonical group order across them. Empty groups are omitted (none today).
export function groupBrowseCards(
  cards: readonly BrowseCard[] = BROWSE_CARDS,
): GroupedBrowseCards {
  const byGroup = new Map<BrowseGroup, BrowseCard[]>();
  for (const c of cards) {
    const bucket = byGroup.get(c.group);
    if (bucket) bucket.push(c);
    else byGroup.set(c.group, [c]);
  }
  const orderedGroups = BROWSE_GROUP_ORDER.filter((g) => byGroup.has(g));
  return { orderedGroups, byGroup };
}

/** Case-insensitive title filter for the live search box (Topics mode). */
export function filterBrowseCards(cards: readonly BrowseCard[], query: string): BrowseCard[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...cards];
  return cards.filter((c) => c.title.toLowerCase().includes(q));
}
