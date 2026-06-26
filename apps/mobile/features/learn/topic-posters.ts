// Local bundled category posters for the Browse grid.
//
// Each curated browse card's visual is a "wayfinding clay" pictogram poster with
// the category name + subtitle + "Psychage" watermark BAKED INTO the image (16:9
// JPEG). These were pulled from the web's category-covers storage and committed to
// the app so the grid ships in the bundle and renders offline — no runtime hotlink.
// Metro requires literal `require` paths, so the manifest is spelled out below;
// keep it in sync with `browse-manifest.ts` and `assets/images/topics/`.

import type { ImageSourcePropType } from 'react-native';

const POSTERS: Readonly<Record<string, ImageSourcePropType>> = {
  'aging-dementia-late-life': require('@/assets/images/topics/aging-dementia-late-life.jpeg'),
  'anxiety-stress': require('@/assets/images/topics/anxiety-stress.jpeg'),
  'chronic-illness-pain': require('@/assets/images/topics/chronic-illness-pain.jpeg'),
  'creativity-therapeutic-arts': require('@/assets/images/topics/creativity-therapeutic-arts.jpeg'),
  'cultural-global': require('@/assets/images/topics/cultural-global.jpeg'),
  'depression-grief': require('@/assets/images/topics/depression-grief.jpeg'),
  'digital-life': require('@/assets/images/topics/digital-life.jpeg'),
  'eating-body': require('@/assets/images/topics/eating-body.jpeg'),
  'emotional-regulation': require('@/assets/images/topics/emotional-regulation.jpeg'),
  'environmental-eco-psychology': require('@/assets/images/topics/environmental-eco-psychology.jpeg'),
  'family-parenting': require('@/assets/images/topics/family-parenting.jpeg'),
  'financial-wellness': require('@/assets/images/topics/financial-wellness.jpeg'),
  'habits-behavior-change': require('@/assets/images/topics/habits-behavior-change.jpeg'),
  'life-skills-practical-psychology': require('@/assets/images/topics/life-skills-practical-psychology.jpeg'),
  'life-transitions': require('@/assets/images/topics/life-transitions.jpeg'),
  'loneliness-connection': require('@/assets/images/topics/loneliness-connection.jpeg'),
  'mens-mental-health': require('@/assets/images/topics/mens-mental-health.jpeg'),
  'mental-health-conditions': require('@/assets/images/topics/mental-health-conditions.jpeg'),
  'neurodivergence-adhd-autism': require('@/assets/images/topics/neurodivergence-adhd-autism.jpeg'),
  'ocd-related': require('@/assets/images/topics/ocd-related.jpeg'),
  'psychosis-schizophrenia': require('@/assets/images/topics/psychosis-schizophrenia.jpeg'),
  'relationships-communication': require('@/assets/images/topics/relationships-communication.jpeg'),
  'self-worth-identity': require('@/assets/images/topics/self-worth-identity.jpeg'),
  'sleep-body-connection': require('@/assets/images/topics/sleep-body-connection.jpeg'),
  'spirituality-meaning': require('@/assets/images/topics/spirituality-meaning.jpeg'),
  'sports-exercise-psychology': require('@/assets/images/topics/sports-exercise-psychology.jpeg'),
  'substance-addiction': require('@/assets/images/topics/substance-addiction.jpeg'),
  'technology-digital-life': require('@/assets/images/topics/technology-digital-life.jpeg'),
  'therapy-navigation': require('@/assets/images/topics/therapy-navigation.jpeg'),
  'trauma-healing': require('@/assets/images/topics/trauma-healing.jpeg'),
  'womens-mental-health': require('@/assets/images/topics/womens-mental-health.jpeg'),
  'work-productivity': require('@/assets/images/topics/work-productivity.jpeg'),
};

/** The bundled poster for a curated card slug, or `undefined` (→ gradient fallback). */
export function topicPoster(slug: string): ImageSourcePropType | undefined {
  return POSTERS[slug];
}
