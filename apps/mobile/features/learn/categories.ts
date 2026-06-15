export type LearnCategory = {
  id: string;
  label: string;
  /** Real Supabase `article_categories.slug`(s) this curated card maps to.
   * Every slug here is VERIFIED to hold published articles (empty DB twins like
   * `sleep-circadian`/`neurodevelopmental` are deliberately excluded). Together
   * the six cards cover all 19 populated categories. */
  slugs: readonly string[];
};

// FIXED order — never adaptive, never sorted, never personalized (a content
// invariant). The order is frozen here; the rail renders it as-is. The slug
// mappings were resolved against live published-article counts (see the data
// layer); `more` is the catch-all spanning every remaining populated category.
export const LEARN_CATEGORIES: readonly LearnCategory[] = [
  { id: 'anxiety', label: 'Anxiety & stress', slugs: ['anxiety-stress'] },
  { id: 'sleep', label: 'Sleep', slugs: ['sleep-body-connection'] },
  {
    id: 'relationships',
    label: 'Relationships',
    slugs: ['relationships-social', 'loneliness-connection'],
  },
  { id: 'mood', label: 'Mood & low feelings', slugs: ['depression-mood'] },
  { id: 'focus', label: 'Focus & attention', slugs: ['workplace-academic', 'habits-behavior-change'] },
  {
    id: 'more',
    label: 'More topics',
    slugs: [
      'emotional-regulation',
      'chronic-illness-pain',
      'self-esteem-identity',
      'technology-digital-life',
      'mens-mental-health',
      'trauma-healing',
      'aging-dementia-late-life',
      'therapy-navigation',
      'cultural-global',
      'digital-life',
      'mental-health-conditions',
      'spirituality-meaning',
    ],
  },
];

export function getLearnCategory(id: string): LearnCategory | undefined {
  return LEARN_CATEGORIES.find((c) => c.id === id);
}
