// CT1 FIXTURE — placeholder article CONTENT, NOT final/published copy. Body is
// educational framing only (no diagnostic language). The 13 PEAF block renderers
// are a separate workstream and out of B2 scope; the reader renders the body as
// plain paragraphs (TODO(content): PEAF blocks). The Dr. Dobson credit is NOT a
// fixture — it is the imported READ_CREDIT constant, rendered by ReviewedByCredit.

const FIXTURE = 'FIXTURE — not final copy' as const;

export type Ct1Article = {
  _fixture: 'CT1';
  _marker: typeof FIXTURE;
  slug: string;
  tag: string;
  meta: string;
  title: string;
  body: readonly string[];
  read: boolean;
  readWeekday: string | null;
};

const article = (
  slug: string,
  tag: string,
  title: string,
  body: readonly string[],
  read: { weekday: string } | null = null,
): Ct1Article => ({
  _fixture: 'CT1',
  _marker: FIXTURE,
  slug,
  tag,
  meta: '4 min read',
  title,
  body,
  read: read !== null,
  readWeekday: read?.weekday ?? null,
});

export const CT1_ARTICLES = {
  anxiety: article(
    'anxiety',
    'Anxiety & stress',
    'Why your chest gets tight when you worry',
    [
      'People who experience anxiety often describe a tight chest, a racing heart, or shallow breathing. These are the body’s stress response — a normal system doing its job, even when there is no clear danger in front of you.',
      'What is commonly called a “panic response” tends to peak within a few minutes and then ease. Naming what is happening can make it feel less alarming.',
      'A slow exhale — longer than the inhale — is one of the simplest ways to signal to the body that it is safe to settle.',
    ],
    { weekday: 'Tuesday' },
  ),
  sleep: article('sleep', 'Sleep', 'Why worry gets louder at night', [
    'For many people, worries feel sharpest at night. With fewer distractions, the mind has more room to circle the same thoughts.',
    'This is common and does not mean anything is wrong. Small, steady wind-down habits can give the mind somewhere else to rest.',
  ]),
  relationships: article('relationships', 'Relationships', 'When closeness feels complicated', [
    'Relationships can bring both comfort and strain, sometimes at once. People often notice patterns in how they connect and pull away.',
    'Understanding those patterns is a starting point — not a fixed label.',
  ]),
} satisfies Record<string, Ct1Article>;

/** Resolve a slug to a CT1 article, falling back to the anxiety lead article. */
export function getCt1Article(slug: string): Ct1Article {
  return (CT1_ARTICLES as Record<string, Ct1Article>)[slug] ?? CT1_ARTICLES.anxiety;
}
