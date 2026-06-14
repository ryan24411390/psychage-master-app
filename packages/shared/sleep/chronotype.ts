// Sleep Architect — chronotype scoring. Ported verbatim from psychage-v2
// `src/lib/sleep/chronotype.ts`. Implements the reduced Morningness–Eveningness
// Questionnaire (rMEQ) scoring and maps results to animal chronotypes. Pure.

import type { ChronotypeAnimal, ChronotypeCategory, ChronotypeResult } from './types';

interface AnimalProfile {
  readonly animal: ChronotypeAnimal;
  readonly label: string;
  readonly description: string;
  readonly ideal_bedtime: string;
  readonly ideal_wake_time: string;
}

const ANIMAL_PROFILES: Record<ChronotypeAnimal, AnimalProfile> = {
  lion: {
    animal: 'lion',
    label: 'Lion',
    description:
      'People with this pattern tend to thrive in the early morning — energy peaks before noon and winds down early. Morning routines and early workouts often fit best.',
    ideal_bedtime: '21:30',
    ideal_wake_time: '05:30',
  },
  bear: {
    animal: 'bear',
    label: 'Bear',
    description:
      'This pattern follows the solar cycle — most productive mid-morning to early afternoon, and it adapts well to conventional schedules. It is the most common chronotype.',
    ideal_bedtime: '23:00',
    ideal_wake_time: '07:00',
  },
  wolf: {
    animal: 'wolf',
    label: 'Wolf',
    description:
      'People with this pattern tend to come alive in the evening — creative energy peaks later in the day, and mornings are the slowest period.',
    ideal_bedtime: '00:00',
    ideal_wake_time: '08:00',
  },
  dolphin: {
    animal: 'dolphin',
    label: 'Dolphin',
    description:
      'This pattern describes a light, irregular sleeper. Consistent schedules can be harder; a calming bedtime routine and steady sleep hygiene often help most.',
    ideal_bedtime: '23:30',
    ideal_wake_time: '06:30',
  },
};

function getCategory(score: number): ChronotypeCategory {
  if (score >= 22) return 'definitely_morning';
  if (score >= 18) return 'moderately_morning';
  if (score >= 12) return 'neither';
  if (score >= 8) return 'moderately_evening';
  return 'definitely_evening';
}

function mapToAnimal(category: ChronotypeCategory): ChronotypeAnimal {
  switch (category) {
    case 'definitely_morning':
    case 'moderately_morning':
      return 'lion';
    case 'neither':
      return 'bear';
    case 'moderately_evening':
    case 'definitely_evening':
      return 'wolf';
  }
}

/**
 * Score the rMEQ from 5 numeric answer values. Throws on the wrong count rather
 * than silently scoring a partial questionnaire.
 */
export function scoreChronotype(answers: readonly number[]): ChronotypeResult {
  if (answers.length !== 5) {
    throw new Error('rMEQ requires exactly 5 answers');
  }

  const score = answers.reduce((sum, v) => sum + v, 0);
  const category = getCategory(score);
  let animal = mapToAnimal(category);

  // Low-ish total with poor morning alertness (Q3) reads as dolphin (light/irregular).
  if (category === 'neither' && answers[2] <= 2) {
    animal = 'dolphin';
  }

  const profile = ANIMAL_PROFILES[animal];
  return {
    score,
    category,
    animal: profile.animal,
    label: profile.label,
    description: profile.description,
    ideal_bedtime: profile.ideal_bedtime,
    ideal_wake_time: profile.ideal_wake_time,
  };
}

export function getCategoryLabel(category: ChronotypeCategory): string {
  const labels: Record<ChronotypeCategory, string> = {
    definitely_morning: 'Definitely Morning',
    moderately_morning: 'Moderately Morning',
    neither: 'Neither',
    moderately_evening: 'Moderately Evening',
    definitely_evening: 'Definitely Evening',
  };
  return labels[category];
}

export { ANIMAL_PROFILES };
