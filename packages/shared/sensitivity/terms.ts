/**
 * Person-first language sensitivity terms.
 *
 * Lifted from psychage-v2 src/lib/article-framework/constants.ts:217 at
 * SHA 528a8d5. Each entry pairs a flagged phrase with a person-first
 * suggested replacement.
 *
 * Categories: suicide language (7), stigmatizing identity labels (10),
 * suffering/victimhood framing (6), minimizing language (3),
 * clinical-jargon-as-adjective (4). Total: 30.
 *
 * Recon audit (audits/phase5-shared-lift-recon.md §2.2) counted 31; actual
 * code count is 30. Slice 2 verified via grep -c "^\s*{ term:".
 *
 * Per Sacred Rule #5 (CLAUDE.md §4): all generated user-facing copy must
 * be passed through the filter that consumes this list.
 */

export interface SensitivityTerm {
  term: string;
  suggestion: string;
}

export const SENSITIVITY_TERMS: SensitivityTerm[] = [
  // Suicide language
  { term: 'committed suicide', suggestion: 'died by suicide' },
  { term: 'commit suicide', suggestion: 'die by suicide' },
  { term: 'commits suicide', suggestion: 'dies by suicide' },
  { term: 'committing suicide', suggestion: 'dying by suicide' },
  { term: 'successful suicide', suggestion: 'death by suicide' },
  { term: 'failed suicide', suggestion: 'suicide attempt' },
  { term: 'unsuccessful suicide', suggestion: 'survived a suicide attempt' },

  // Stigmatizing identity labels
  { term: 'the mentally ill', suggestion: 'people with mental illness' },
  { term: 'a schizophrenic', suggestion: 'a person with schizophrenia' },
  { term: 'an anorexic', suggestion: 'a person with anorexia' },
  { term: 'a bulimic', suggestion: 'a person with bulimia' },
  { term: 'a depressive', suggestion: 'a person with depression' },
  { term: 'a psychotic', suggestion: 'a person experiencing psychosis' },
  { term: 'the disabled', suggestion: 'people with disabilities' },
  { term: 'substance abuser', suggestion: 'person with substance use disorder' },
  { term: 'drug addict', suggestion: 'person with substance use disorder' },
  { term: 'alcoholic', suggestion: 'person with alcohol use disorder' },

  // Suffering/victimhood framing
  { term: 'suffers from', suggestion: 'lives with / is diagnosed with' },
  { term: 'suffering from', suggestion: 'living with / diagnosed with' },
  { term: 'victim of', suggestion: 'person affected by / survivor of' },
  { term: 'afflicted with', suggestion: 'diagnosed with' },
  { term: 'stricken with', suggestion: 'diagnosed with' },
  { term: 'plagued by', suggestion: 'experiences' },

  // Minimizing language
  { term: 'just a phase', suggestion: '[remove — dismisses lived experience]' },
  { term: 'attention seeking', suggestion: 'expressing a need for support' },
  { term: 'attention-seeking', suggestion: 'expressing a need for support' },

  // Clinical-jargon-as-adjective
  { term: 'is bipolar', suggestion: 'has bipolar disorder' },
  { term: 'is OCD', suggestion: 'has OCD' },
  { term: 'is ADHD', suggestion: 'has ADHD' },
  { term: 'is autistic', suggestion: 'is autistic / has autism (respect community preference)' },
];
