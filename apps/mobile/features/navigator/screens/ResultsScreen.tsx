import { Activity, AlertTriangle, FileDown, History, Home, Stethoscope, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';

import type { NavigatorResults } from '@psychage/shared/navigator';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DomainRadar, type RadarDatum } from '@/components/ui/charts';
import { Text } from '@/components/ui/Text';
import type { HelplineRow } from '@/features/crisis/helpline-schema';
import { useReducedMotion } from '@/lib/motion';
import { useThemeColors } from '@/lib/use-theme-colors';

import { NAVIGATOR_COPY } from '../copy';
import { staggerItemEnter } from '../animations';
import { NextStepCards, type NextStepItem } from '../components/NextStepCards';
import { ProviderQuestions } from '../components/ProviderQuestions';
import { ResultCard } from '../components/ResultCard';
import { CrisisBanner, WatchBanner } from '../components/ResultsBanners';

// S — Results (mobile port of web ResultsScreen). Full educational report: header,
// crisis/watch banners, Your-Symptoms, Possible-Patterns (strong vs exploratory split +
// no-match panel), Recommended-Next-Steps (When-to-see-a-clinician rules + action
// cards), Conversation Starters, and the disclaimer. Section order/copy mirror web 1:1.
// Web-only integrations (ProviderQuickMatch, ToolRecommendation, FeedbackWidget) are
// intentionally omitted — they depend on web services with no mobile equivalent yet.

export interface ResultSymptomVM {
  readonly id: string;
  readonly name: string;
  readonly severity?: number;
  readonly frequency?: string;
}

export interface ResultsScreenProps {
  readonly results: NavigatorResults;
  readonly symptomDetails: readonly ResultSymptomVM[];
  readonly questions: readonly string[];
  /** "Areas your experience touches" — domain coverage (descriptive breadth, NOT
   *  confidence). Rendered as a DomainRadar only when ≥3 areas have data (P39). */
  readonly areaPoints: readonly RadarDatum[];
  readonly emergencyNumber: string;
  readonly helplines: readonly HelplineRow[];
  readonly onTrack: () => void;
  readonly onFindCare: () => void;
  readonly onLearn: () => void;
  readonly onStartOver: () => void;
  /** P39 — build + share the summary-only PDF. Omitted in render tests / dev harness. */
  readonly onDownloadSummary?: () => void;
  /** P41 — results action row. All optional so tests/dev can omit them. */
  readonly onHome?: () => void;
  readonly onViewHistory?: () => void;
  /** P41 — opt out of the auto-saved run (delete it from on-device history). */
  readonly onRemoveSaved?: () => void;
}

function severityLabel(severity?: number): string | null {
  if (!severity) return null;
  if (severity <= 3) return 'Mild';
  if (severity <= 6) return 'Moderate';
  if (severity <= 8) return 'Significant';
  return 'Severe';
}

function severityColorClass(severity?: number): string {
  if (!severity) return 'text-text-tertiary dark:text-text-tertiary-dark';
  if (severity <= 3) return 'text-text-tertiary dark:text-text-tertiary-dark';
  if (severity <= 8) return 'text-warning dark:text-warning-dark';
  return 'text-crisis dark:text-crisis-dark';
}

function SectionLabel({ number, label }: { number: string; label: string }) {
  return (
    <View className="mb-3 flex-row items-center gap-3">
      <View className="h-6 w-6 items-center justify-center rounded-full border border-border bg-surface-accent dark:border-border-dark dark:bg-surface-accent-dark">
        <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
          {number}
        </Text>
      </View>
      <Text variant="caption" className="uppercase tracking-wider text-text-tertiary dark:text-text-tertiary-dark">
        {label}
      </Text>
    </View>
  );
}

function ClinicianRule({ tone, children }: { tone: 'crisis' | 'warning' | 'muted'; children: React.ReactNode }) {
  const dot =
    tone === 'crisis'
      ? 'bg-crisis dark:bg-crisis-dark'
      : tone === 'warning'
        ? 'bg-warning dark:bg-warning-dark'
        : 'bg-border dark:bg-border-dark';
  return (
    <View className="flex-row items-start gap-2.5">
      <View className={`mt-2 h-1.5 w-1.5 rounded-full ${dot}`} />
      <Text variant="caption" className="flex-1 text-text-secondary dark:text-text-secondary-dark">
        {children}
      </Text>
    </View>
  );
}

export function ResultsScreen({
  results,
  symptomDetails,
  questions,
  areaPoints,
  emergencyNumber,
  helplines,
  onTrack,
  onFindCare,
  onLearn,
  onStartOver,
  onDownloadSummary,
  onHome,
  onViewHistory,
  onRemoveSaved,
}: ResultsScreenProps) {
  const reduced = useReducedMotion();
  const tc = useThemeColors();
  const [removed, setRemoved] = useState(false);
  const showAreasChart = areaPoints.length >= 3; // a radar needs ≥3 axes

  const safety = results.safety;
  const matches = results.results;
  const symptomCount = symptomDetails.length;
  const hasUrgent = safety.has_crisis || safety.has_urgent;
  const hasWatch = safety.has_watch;
  const anyProfessional = matches.some((r) => r.always_recommend_professional);

  const strong = matches.filter((r) => r.relevance_level === 'high' || r.relevance_level === 'moderate');
  const exploratory = matches.filter((r) => r.relevance_level === 'low' || r.relevance_level === 'minimal');
  const allWeak = matches.length > 0 && strong.length === 0;

  const nextSteps: NextStepItem[] = [
    {
      id: 'ns1',
      type: 'track',
      title: 'Track Your Symptoms',
      description:
        'Keep a daily log of how you feel, noting patterns, triggers, and what helps. This is invaluable for any future clinical conversations.',
      actionText: 'Start Tracking',
      onPress: onTrack,
    },
    {
      id: 'ns2',
      type: 'professional',
      title: 'Talk to a Professional',
      description:
        'Share these insights with a therapist, counselor, or doctor. They can provide an accurate assessment based on your full history.',
      actionText: 'Find a Provider',
      onPress: onFindCare,
    },
    {
      id: 'ns3',
      type: 'selfcare',
      title: 'Explore Self-Care Resources',
      description:
        'Our library includes guided exercises, educational content, and coping strategies tailored to different experiences.',
      actionText: 'Browse Library',
      onPress: onLearn,
    },
  ];

  return (
    <ScrollView contentContainerClassName="gap-10 px-4 pb-16 pt-2" keyboardShouldPersistTaps="handled">
      {/* Header (P40 — enlarged display title) */}
      <View className="gap-3">
        <Text variant="display" accessibilityRole="header">
          {NAVIGATOR_COPY.resultsTitle}
        </Text>
        <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
          Based on the {symptomCount} symptom{symptomCount !== 1 ? 's' : ''} you reported, here is what
          we found. This is an educational overview — not a diagnosis.
        </Text>
      </View>

      {hasUrgent ? <CrisisBanner emergencyNumber={emergencyNumber} helplines={helplines} /> : null}
      {hasWatch && !hasUrgent ? <WatchBanner /> : null}

      {/* P39 — "Areas your experience touches": domain coverage (descriptive breadth,
          NEVER confidence). Shown only when ≥3 areas have data so the radar reads. */}
      {showAreasChart ? (
        <View className="items-center gap-2">
          <Text variant="h2" accessibilityRole="header" className="self-start">
            {NAVIGATOR_COPY.areasChartTitle}
          </Text>
          <Text variant="caption" className="self-start text-text-secondary dark:text-text-secondary-dark">
            {NAVIGATOR_COPY.areasChartCaption}
          </Text>
          <DomainRadar
            points={areaPoints}
            size={260}
            accessibilityLabel={`${NAVIGATOR_COPY.areasChartTitle}: ${areaPoints.map((p) => p.label).join(', ')}`}
          />
        </View>
      ) : null}

      {/* Section 1 — Your Symptoms */}
      <View className="gap-4 border-b border-border pb-10 dark:border-border-dark">
        <View>
          <SectionLabel number="1" label="Your Symptoms" />
          <Text variant="h2">What You Reported</Text>
          <Text variant="caption" className="mt-1.5 text-text-secondary dark:text-text-secondary-dark">
            {symptomCount} symptom{symptomCount !== 1 ? 's' : ''} across your selected areas of concern.
          </Text>
        </View>
        <View className="gap-2">
          {symptomDetails.map((s) => (
            <View
              key={s.id}
              className="flex-row items-center justify-between gap-4 rounded-lg border border-border bg-surface-accent px-4 py-3 dark:border-border-dark dark:bg-surface-accent-dark"
            >
              <View className="min-w-0 flex-1 flex-row items-center gap-3">
                <Activity size={14} color={tc.inkTertiary} strokeWidth={2} />
                <Text variant="bodyLarge" numberOfLines={1} className="flex-1">
                  {s.name.replace(/_/g, ' ')}
                </Text>
              </View>
              <View className="flex-row items-center gap-3">
                {s.severity ? (
                  <Text variant="caption" className={severityColorClass(s.severity)}>
                    {severityLabel(s.severity)}
                  </Text>
                ) : null}
                {s.frequency ? (
                  <Text variant="caption" className="capitalize text-text-tertiary dark:text-text-tertiary-dark">
                    {s.frequency}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Section 2 — Possible Patterns */}
      <View className="gap-4 border-b border-border pb-10 dark:border-border-dark">
        <SectionLabel number="2" label="Possible Patterns" />

        {strong.length > 0 ? (
          <View className="gap-3">
            <View>
              <Text variant="h2">Likely Patterns</Text>
              <Text variant="caption" className="mt-1.5 text-text-secondary dark:text-text-secondary-dark">
                These profiles reflect patterns commonly associated with the symptoms you described.
                Ranked by relevance — not certainty.
              </Text>
            </View>
            {strong.map((match, i) => (
              <Animated.View key={match.condition_id} entering={staggerItemEnter(i, reduced)}>
                <ResultCard result={match} />
              </Animated.View>
            ))}
          </View>
        ) : null}

        {exploratory.length > 0 ? (
          <View className="mt-2 gap-3">
            <View>
              <Text variant="h2">{strong.length > 0 ? 'Worth Exploring' : 'Possible Patterns'}</Text>
              <Text variant="caption" className="mt-1.5 text-text-secondary dark:text-text-secondary-dark">
                {strong.length > 0
                  ? 'These showed a weaker connection but may be worth discussing with a professional.'
                  : 'Your symptoms showed a partial match with these patterns. They may be a helpful starting point for a conversation with a provider.'}
              </Text>
            </View>
            {allWeak ? (
              <View className="rounded-lg border border-warning/30 bg-warning/10 p-4">
                <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
                  <Text variant="bodyLarge" className="text-warning dark:text-warning-dark">
                    Tip:{' '}
                  </Text>
                  Providing more detail about severity, duration, and frequency can help produce
                  stronger matches. You can also try selecting additional symptoms.
                </Text>
              </View>
            ) : null}
            {exploratory.map((match, i) => (
              <Animated.View key={match.condition_id} entering={staggerItemEnter(i, reduced)}>
                <ResultCard result={match} />
              </Animated.View>
            ))}
          </View>
        ) : null}

        {matches.length === 0 ? (
          <View className="gap-3">
            <Text variant="h2">No Strong Matches Found</Text>
            <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
              We couldn't find a clear match for your specific combination. This doesn't mean your
              experience isn't valid.
            </Text>
            <View className="gap-3 rounded-xl border border-border bg-surface-accent p-5 dark:border-border-dark dark:bg-surface-accent-dark">
              <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
                This can happen when symptoms span multiple areas or don't fit neatly into common
                patterns. A professional can help you understand what you're going through.
              </Text>
              <Text variant="bodyLarge">What you can try:</Text>
              <View className="gap-1.5">
                {[
                  'Go back and select additional symptoms you may be experiencing',
                  'Provide more detail about duration, severity, and frequency',
                  'Rate symptoms you feel strongly about at a higher severity',
                ].map((tip) => (
                  <Text key={tip} variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
                    •  {tip}
                  </Text>
                ))}
              </View>
            </View>
          </View>
        ) : null}
      </View>

      {/* P39 — plain-language explanation */}
      <View className="gap-2 border-b border-border pb-10 dark:border-border-dark">
        <Text variant="h2" accessibilityRole="header">
          {NAVIGATOR_COPY.plainLanguageTitle}
        </Text>
        <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
          {NAVIGATOR_COPY.plainLanguageBody}
        </Text>
      </View>

      {/* Section 3 — Recommended Next Steps */}
      <View className="gap-6 border-b border-border pb-10 dark:border-border-dark">
        <View>
          <SectionLabel number="3" label="Recommended Next Steps" />
          <Text variant="h2">Where to Go from Here</Text>
          <Text variant="caption" className="mt-1.5 text-text-secondary dark:text-text-secondary-dark">
            These results are a starting point. Here's how to make the most of them.
          </Text>
        </View>

        <Card variant="accent" className="gap-4">
          <View className="flex-row items-center gap-2.5">
            <Stethoscope size={16} color={tc.inkSecondary} strokeWidth={2} />
            <Text variant="caption" className="uppercase tracking-wide text-text-primary dark:text-text-primary-dark">
              When to See a Clinician
            </Text>
          </View>
          <View className="gap-3">
            {hasUrgent ? (
              <ClinicianRule tone="crisis">
                Immediately — your responses included experiences that suggest you may need urgent
                professional support.
              </ClinicianRule>
            ) : null}
            {anyProfessional ? (
              <ClinicianRule tone="warning">
                As soon as practical — one or more of the patterns identified is best assessed by a
                trained professional.
              </ClinicianRule>
            ) : null}
            <ClinicianRule tone="muted">
              If your symptoms persist for more than two weeks or interfere with daily activities,
              work, or relationships.
            </ClinicianRule>
            <ClinicianRule tone="muted">
              If you notice symptoms worsening over time or new symptoms emerging.
            </ClinicianRule>
            <ClinicianRule tone="muted">
              If self-care strategies aren't providing relief, or you're unsure about what you're
              experiencing.
            </ClinicianRule>
          </View>
        </Card>

        <NextStepCards steps={nextSteps} />
      </View>

      {/* Conversation Starters (P40 — per-item "why this helps" + Find Care CTA) */}
      <View className="gap-4 border-b border-border pb-10 dark:border-border-dark">
        <Text variant="caption" className="uppercase tracking-wide text-text-primary dark:text-text-primary-dark">
          Conversation Starters
        </Text>
        <ProviderQuestions questions={questions} />
        <Button variant="primary" onPress={onFindCare} className="mt-1">
          {NAVIGATOR_COPY.talkToProfessional}
        </Button>
      </View>

      {/* P39 — "Things to know" */}
      <View className="gap-3 border-b border-border pb-10 dark:border-border-dark">
        <Text variant="h2" accessibilityRole="header">
          {NAVIGATOR_COPY.thingsToKnowTitle}
        </Text>
        <View className="gap-2">
          {NAVIGATOR_COPY.thingsToKnow.map((item) => (
            <View key={item} className="flex-row items-start gap-2.5">
              <View className="mt-2 h-1.5 w-1.5 rounded-full bg-border dark:bg-border-dark" />
              <Text variant="body" className="flex-1 text-text-secondary dark:text-text-secondary-dark">
                {item}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Disclaimer */}
      <View className="flex-row items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-5">
        <AlertTriangle size={16} color={tc.inkSecondary} strokeWidth={2} />
        <View className="flex-1 gap-2">
          <Text variant="label">Important Disclaimer</Text>
          <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
            This tool provides educational information only and is not a substitute for professional
            medical advice, diagnosis, or treatment.
          </Text>
          <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
            Always consult a qualified healthcare provider for personal medical concerns. If you are
            in crisis, contact emergency services or a crisis helpline immediately.
          </Text>
        </View>
      </View>

      {/* P41 — results actions (Home / Save state / Past explorations / Download / Start over) */}
      <View className="gap-3">
        {onDownloadSummary ? (
          <Button variant="secondary" onPress={onDownloadSummary}>
            <View className="flex-row items-center gap-2">
              <FileDown size={16} color={tc.ink} strokeWidth={2} />
              <Text variant="bodyLarge">{NAVIGATOR_COPY.downloadSummary}</Text>
            </View>
          </Button>
        ) : null}

        <View className="flex-row flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {onHome ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={NAVIGATOR_COPY.goHome}
              onPress={onHome}
              hitSlop={6}
              className="min-h-[44px] flex-row items-center gap-2"
            >
              <Home size={16} color={tc.inkSecondary} strokeWidth={2} />
              <Text variant="bodyLarge" className="text-text-secondary dark:text-text-secondary-dark">
                {NAVIGATOR_COPY.goHome}
              </Text>
            </Pressable>
          ) : null}
          {onViewHistory ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={NAVIGATOR_COPY.viewPastExplorations}
              onPress={onViewHistory}
              hitSlop={6}
              className="min-h-[44px] flex-row items-center gap-2"
            >
              <History size={16} color={tc.inkSecondary} strokeWidth={2} />
              <Text variant="bodyLarge" className="text-text-secondary dark:text-text-secondary-dark">
                {NAVIGATOR_COPY.viewPastExplorations}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {onRemoveSaved ? (
          <View className="flex-row items-center justify-center gap-2">
            {removed ? (
              <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
                {NAVIGATOR_COPY.removedFromDevice}
              </Text>
            ) : (
              <>
                <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
                  {NAVIGATOR_COPY.savedOnDevice}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={NAVIGATOR_COPY.removeThisExploration}
                  onPress={() => {
                    onRemoveSaved();
                    setRemoved(true);
                  }}
                  hitSlop={6}
                  className="min-h-[44px] flex-row items-center gap-1.5"
                >
                  <Trash2 size={14} color={tc.inkTertiary} strokeWidth={2} />
                  <Text variant="caption" className="text-text-secondary underline dark:text-text-secondary-dark">
                    {NAVIGATOR_COPY.removeThisExploration}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        ) : null}

        <View className="items-center pt-1">
          <Button variant="secondary" onPress={onStartOver}>
            {NAVIGATOR_COPY.startOver}
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
