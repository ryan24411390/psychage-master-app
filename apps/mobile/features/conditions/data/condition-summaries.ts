// Condition topic summaries — SOURCED VERBATIM, NOT AUTHORED.
//
// Each string is the reviewed, user-facing category `description` shown on the
// web app's category landing pages, copied verbatim from psychage-v2
// (src/data/articles/category-NN/_shared.ts, the `Category.description` field;
// authored by the "Clinical Editorial Team" and "Clinical Review Board"). This
// session did NOT write, paraphrase, or summarize any of it — it is a verbatim
// port (extracted programmatically on 2026-06-15). Keyed by the reviewed taxonomy
// slug (@psychage/shared/peaf). Regenerate from the web source if it changes;
// do not hand-edit the strings. No diagnostic framing — these are educational
// topic overviews (SR-3) and inherit the web content's clinical-review status.

/** Reviewed topic overview, verbatim from the web. `undefined` when the topic
 * has no ported summary yet (the screen then shows name + browse only). */
export const CONDITION_SUMMARIES: Readonly<Record<string, string>> = {
  'anxiety-stress': `Understanding anxiety disorders, stress responses, and evidence-based coping strategies for managing worry, panic, and overwhelm.`,
  'relationships-communication': `Building healthier relationships through attachment awareness, communication skills, boundary setting, and conflict resolution.`,
  'self-worth-identity': `Developing self-worth, managing imposter syndrome, building confidence, and understanding identity from a psychological perspective.`,
  'work-productivity': `Protecting mental health in professional settings — burnout prevention, productivity psychology, and work-life balance.`,
  'family-parenting': `Understanding family dynamics, parenting challenges, childhood patterns, and intergenerational healing.`,
  'depression-grief': `Navigating depression, processing grief, and finding paths to recovery with evidence-based approaches.`,
  'sleep-body-connection': `The mind-body connection — sleep science, exercise psychology, nutrition, and somatic awareness for mental wellness.`,
  'trauma-healing': `Understanding trauma, its impact on the brain and body, and evidence-based paths to healing and recovery.`,
  'mental-health-conditions': `Clear, research-based explanations of mental health conditions — symptoms, causes, diagnosis, and treatment.`,
  'loneliness-connection': `Understanding loneliness, building social connection, and finding belonging in an increasingly disconnected world.`,
  'psychosis-schizophrenia': `Comprehensive education on psychotic disorders, schizophrenia spectrum conditions, and severe mental illness — from neuroscience and treatment to family support and recovery.`,
  'womens-mental-health': `Comprehensive coverage of mental health issues affecting women across the lifespan, from reproductive health to gender-specific risk factors, treatment considerations, and sociocultural influences on women's psychological well-being.`,
  'mens-mental-health': `Evidence-based education on men's mental health — exploring the gender paradox in suicide, masked depression, help-seeking barriers, and the impact of cultural norms on men's psychological wellbeing.`,
  'chronic-illness-pain': `Evidence-based education on the psychological dimensions of chronic illness — covering pain neuroscience, medical trauma, identity shifts after diagnosis, and resilience-building strategies for people living with ongoing health conditions.`,
  'brain-neuroscience': `Evidence-based exploration of the brain science behind mental health — neuroplasticity, neurotransmitters, brain-body connections, and how neuroscience informs modern treatment approaches.`,
  'disability-accessibility': `Mental health at the intersection of disability — identity, access to care, chronic illness, neurodivergence, universal design, and the psychology of inclusion and advocacy.`,
  'forensic-legal-justice': `Psychology within the legal and justice systems — criminal behavior, forensic assessment, mental health in incarceration, juvenile justice, victim psychology, and rehabilitation.`,
  'military-veterans-firstresponder': `Mental health for those who serve — combat trauma, moral injury, first responder stress, military families, transition challenges, and evidence-based treatment approaches.`,
  'sexuality-intimacy': `The psychology of human sexuality — sexual health, intimacy, identity, dysfunction, trauma recovery, sex therapy, and the intersection of sexuality with mental wellbeing.`,
  'environmental-eco-psychology': `The psychological dimensions of our relationship with the natural world — eco-anxiety, climate grief, nature-based therapy, urban psychology, and environmental justice.`,
};

/** The verbatim reviewed summary for a topic slug, or `null` if none is ported. */
export function getConditionSummary(slug: string): string | null {
  return CONDITION_SUMMARIES[slug] ?? null;
}
