// Condition topic content — SOURCED VERBATIM, NOT AUTHORED.
//
// Each `summary` and `subTopics` list is reviewed, user-facing copy shown on the
// web app's category landing pages, copied VERBATIM from psychage-v2
// (src/data/articles/category-NN/_shared.ts — the `Category.description` and
// `Category.subTopics` fields; authored by the "Clinical Editorial Team" and
// "Clinical Review Board"). This session did NOT write, paraphrase, or summarize
// any of it — it is a verbatim port (extracted programmatically on 2026-06-15 via
// JSON.stringify, so escaping is exact). Keyed by the reviewed taxonomy slug
// (@psychage/shared/peaf). Regenerate from the web source if it changes; do not
// hand-edit the strings. No diagnostic framing — these are educational topic
// overviews/outlines (SR-3) and inherit the web content's clinical-review status.

export type ConditionTopicContent = {
  /** Reviewed one-line topic overview, verbatim from the web. */
  summary: string;
  /** Reviewed sub-topic outline ("what this covers"), verbatim from the web. */
  subTopics: readonly string[];
};

export const CONDITION_TOPICS: Readonly<Record<string, ConditionTopicContent>> = {
  "anxiety-stress": {
    summary: "Understanding anxiety disorders, stress responses, and evidence-based coping strategies for managing worry, panic, and overwhelm.",
    subTopics: ["Understanding Anxiety","Panic, Physical Anxiety & Somatic Symptoms","Social Anxiety & Fear of Judgment","Chronic Stress & Overwhelm","Burnout & Emotional Exhaustion","Phobias & Specific Fears","Evidence-Based Coping Strategies","Anxiety in Relationships, Work & Daily Life","Treatment Approaches & Recovery"],
  },
  "relationships-communication": {
    summary: "Building healthier relationships through attachment awareness, communication skills, boundary setting, and conflict resolution.",
    subTopics: ["Attachment Styles & Relationship Patterns","Setting & Maintaining Boundaries","Communication Skills for Connection","Navigating Conflict & Repair","Romantic Relationships & Intimacy","Friendships & Social Circles","Toxic Dynamics & Relationship Red Flags","Breakups, Endings & Moving Forward"],
  },
  "self-worth-identity": {
    summary: "Developing self-worth, managing imposter syndrome, building confidence, and understanding identity from a psychological perspective.",
    subTopics: ["Understanding Self-Esteem","Self-Compassion & Inner Dialogue","Imposter Syndrome & Self-Doubt","Body Image & Self-Perception","Identity, Authenticity & Values","Building Confidence Through Action","Perfectionism & People-Pleasing"],
  },
  "work-productivity": {
    summary: "Protecting mental health in professional settings — burnout prevention, productivity psychology, and work-life balance.",
    subTopics: ["Workplace Mental Health Fundamentals","Burnout: Recognition & Recovery","Work-Life Balance & Boundaries","Productivity, Focus & Attention","Workplace Relationships & Dynamics","Career Transitions & Uncertainty","Remote Work & the Digital Workplace","Leadership & Organizational Wellbeing"],
  },
  "family-parenting": {
    summary: "Understanding family dynamics, parenting challenges, childhood patterns, and intergenerational healing.",
    subTopics: ["Understanding Family Systems","Childhood Experiences & Adult Patterns","Parenting Stress & Mental Health","Intergenerational Trauma & Healing","Co-Parenting, Divorce & Blended Families","Supporting Children's Mental Health","Eldercare, Caregiving & Aging Parents","Sibling Relationships & Family Roles"],
  },
  "depression-grief": {
    summary: "Navigating depression, processing grief, and finding paths to recovery with evidence-based approaches.",
    subTopics: ["Understanding Depression","Types of Depression & How They Differ","Grief, Loss & Bereavement","Coping with Depression","Seasonal Patterns & Mood Cycles","Depression in Specific Populations","Treatment, Recovery & Moving Forward"],
  },
  "sleep-body-connection": {
    summary: "The mind-body connection — sleep science, exercise psychology, nutrition, and somatic awareness for mental wellness.",
    subTopics: ["Sleep Science & Mental Health","Sleep Disorders & Common Problems","Exercise, Movement & Mental Wellness","Nutrition, Gut Health & the Brain","Somatic Awareness & Body-Based Healing","Pain, Chronic Illness & Psychological Impact"],
  },
  "trauma-healing": {
    summary: "Understanding trauma, its impact on the brain and body, and evidence-based paths to healing and recovery.",
    subTopics: ["Understanding Trauma & Its Impact","PTSD & Complex Trauma","Trauma Responses & Survival Patterns","Body-Based Trauma Healing","Trauma-Informed Care & Relationships","Collective Trauma, Resilience & Growth"],
  },
  "mental-health-conditions": {
    summary: "Clear, research-based explanations of mental health conditions — symptoms, causes, diagnosis, and treatment.",
    subTopics: ["Anxiety Disorders","Mood Disorders","Trauma & Dissociative Disorders","OCD Spectrum & Impulse Control Disorders","Neurodevelopmental Conditions","Eating Disorders","Substance Use, Sleep & Somatic Disorders","Psychotic, Personality & Adjustment Disorders"],
  },
  "loneliness-connection": {
    summary: "Understanding loneliness, building social connection, and finding belonging in an increasingly disconnected world.",
    subTopics: ["The Science of Loneliness & Social Connection","Loneliness Across the Lifespan","Building & Deepening Friendships","Community, Belonging & Purpose","Digital Connection & Modern Isolation"],
  },
  "psychosis-schizophrenia": {
    summary: "Comprehensive education on psychotic disorders, schizophrenia spectrum conditions, and severe mental illness — from neuroscience and treatment to family support and recovery.",
    subTopics: ["Understanding Psychosis","Schizophrenia","Treatment for Psychotic Conditions","Supporting Someone With Psychosis","Related Severe Conditions","Psychosis Research and Emerging Approaches"],
  },
  "womens-mental-health": {
    summary: "Comprehensive coverage of mental health issues affecting women across the lifespan, from reproductive health to gender-specific risk factors, treatment considerations, and sociocultural influences on women's psychological well-being.",
    subTopics: ["Reproductive Mental Health","Perinatal and Postpartum Mental Health","Menopause and Perimenopause","Trauma and PTSD in Women","Eating Disorders","Depression and Anxiety in Women","Sociocultural Factors"],
  },
  "mens-mental-health": {
    summary: "Evidence-based education on men's mental health — exploring the gender paradox in suicide, masked depression, help-seeking barriers, and the impact of cultural norms on men's psychological wellbeing.",
    subTopics: ["Understanding Men's Mental Health","Men's Relationships and Family","Men's Physical and Mental Health","Men in Specific Contexts","Myths About Men's Mental Health","Men's Health Interventions Part 1","Men's Health Interventions Part 2"],
  },
  "chronic-illness-pain": {
    summary: "Evidence-based education on the psychological dimensions of chronic illness — covering pain neuroscience, medical trauma, identity shifts after diagnosis, and resilience-building strategies for people living with ongoing health conditions.",
    subTopics: ["Psychology of Chronic Illness","Chronic Pain and the Mind","Specific Medical Conditions and Mental Health","Medical Trauma and Healthcare Experiences","Supporting Wellbeing Alongside Illness","Psychological Resilience in Medical Settings"],
  },
  "brain-neuroscience": {
    summary: "Evidence-based exploration of the brain science behind mental health — neuroplasticity, neurotransmitters, brain-body connections, and how neuroscience informs modern treatment approaches.",
    subTopics: ["Brain Basics","Brain Fundamentals"],
  },
  "disability-accessibility": {
    summary: "Mental health at the intersection of disability — identity, access to care, chronic illness, neurodivergence, universal design, and the psychology of inclusion and advocacy.",
    subTopics: ["Access & Service Design","Accessing Mental Health Care With a Disability","Aging, Disability & Mental Health","Caregiving & Family Systems","Chronic Illness & Mental Health","Disability & Identity","Disability Advocacy and Future Directions","Disability Identity and Community","Disability Myths","Disability, Sexuality & Relationships","Employment & Economic Inclusion","Intellectual & Developmental Disability","Neurodivergence & Disability","Sensory Disability & Mental Health","Specific Disability Contexts","Universal Design & Inclusion"],
  },
  "forensic-legal-justice": {
    summary: "Psychology within the legal and justice systems — criminal behavior, forensic assessment, mental health in incarceration, juvenile justice, victim psychology, and rehabilitation.",
    subTopics: ["Forensic Assessment and Evaluation","Forensic Ethics and Professional Issues","Juvenile Justice and Mental Health","Mental Health in the Justice System","Psychology of Criminal Behavior","Reentry, Rehabilitation & Prevention","Specialized Forensic Topics","Victims and Survivors"],
  },
  "military-veterans-firstresponder": {
    summary: "Mental health for those who serve — combat trauma, moral injury, first responder stress, military families, transition challenges, and evidence-based treatment approaches.",
    subTopics: ["Combat-Related Mental Health","First Responder Mental Health","Military Culture & Psychology","Military Families & Relationships","Transition & Reintegration","Treatment & Recovery","Veteran-Specific Issues"],
  },
  "sexuality-intimacy": {
    summary: "The psychology of human sexuality — sexual health, intimacy, identity, dysfunction, trauma recovery, sex therapy, and the intersection of sexuality with mental wellbeing.",
    subTopics: ["Gender, Identity & Sexuality","Intimacy & Relationships","Myths & Future Directions","Sex Therapy and Professional Help","Sexual Dysfunction & Treatment","Sexual Health & Education","Sexual Trauma & Recovery","Sexuality Myths","Sexuality and Specific Populations"],
  },
  "environmental-eco-psychology": {
    summary: "The psychological dimensions of our relationship with the natural world — eco-anxiety, climate grief, nature-based therapy, urban psychology, and environmental justice.",
    subTopics: ["Climate and Eco-Anxiety","Climate, Seasons, and Psychological Rhythms","Emerging Topics in Environmental Psychology","Environmental Justice and Mental Health","Nature-Based Therapy and Ecotherapy","Planetary Mental Health","Resilience, Adaptation, and the Future","Sustainability and Wellbeing","Urban Psychology and Built Environment"],
  },
};

/** Verbatim reviewed summary for a topic slug, or `null` if none is ported. */
export function getConditionSummary(slug: string): string | null {
  return CONDITION_TOPICS[slug]?.summary ?? null;
}

/** Verbatim reviewed sub-topic outline for a slug; `[]` if none is ported. */
export function getConditionSubTopics(slug: string): readonly string[] {
  return CONDITION_TOPICS[slug]?.subTopics ?? [];
}
