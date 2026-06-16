import { AlertTriangle, CheckCircle2, Compass, TrendingUp } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { DomainRadar } from '@/components/ui/charts/DomainRadar';
import { useReducedMotion } from '@/lib/motion';
import { useThemeColors } from '@/lib/use-theme-colors';

import { DIMENSION_META, DIMENSION_ORDER } from '../../dimensions';
import { TIER_DESCRIPTIONS } from '../../results-content';
import { getStrengthsAndGrowthDetailed, getTierHexColor } from '../../scoring';
import type { ClarityScoreResult, DomainKey, Recommendation } from '../../types';
import { AnimatedGauge } from '../AnimatedGauge';
import { ConsultationGuidance } from '../ConsultationGuidance';
import { DimensionBar } from '../DimensionBar';
import { PhaseNextSteps } from '../PhaseNextSteps';

// OverviewTab — faithful RN port of the web OverviewTab. Section order preserved:
// gauge + radar, supplementary stat grid, dimension breakdown (staggered bars),
// strengths/growth cards (strengths gated ≥12/20 with a neutral fallback), phase next
// steps, personalized recommendations, clinical indicators, consultation guidance.

const CARD = 'rounded-2xl border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark';

export interface OverviewTabProps {
  readonly results: ClarityScoreResult;
  readonly recommendations: Recommendation[];
  readonly onNavigateToDimension: (key: DomainKey) => void;
  readonly onRecommend: (route: string) => void;
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center">
      <Text variant="caption" className="mb-0.5 text-center text-text-secondary dark:text-text-secondary-dark">
        {label}
      </Text>
      <Text variant="bodyBold" className="text-center text-[13px]">
        {value}
      </Text>
    </View>
  );
}

export function OverviewTab({
  results,
  recommendations,
  onNavigateToDimension,
  onRecommend,
}: OverviewTabProps) {
  const reduced = useReducedMotion();
  const tc = useThemeColors();
  const detailed = getStrengthsAndGrowthDetailed(results.domainScores);
  const tierDesc = TIER_DESCRIPTIONS[results.tier];
  const tierHex = getTierHexColor(results.tier);

  const radarPoints = DIMENSION_ORDER.map((key) => ({
    label: DIMENSION_META[key].shortName,
    value: (results.domainScores[key] / 20) * 100,
  }));

  return (
    <Animated.View
      entering={reduced ? undefined : FadeInDown.duration(300)}
      className="gap-6"
    >
      {/* Gauge + supplementary grid */}
      <View className={CARD}>
        <View className="items-center">
          <AnimatedGauge score={results.totalScore} tier={results.tier} label={results.label} />
        </View>
        <View className="mt-6 flex-row flex-wrap gap-y-4 border-t border-border pt-5 dark:border-border-dark">
          <StatCell label="Score Range" value={tierDesc.range} />
          <StatCell label="Strongest Area" value={detailed.strengths[0]?.name ?? '—'} />
          <StatCell label="Needs Attention" value={detailed.growthAreas[0]?.name ?? '—'} />
          {results.structuredFlags.length > 0 ? (
            <StatCell label="Clinical Flags" value={`${results.structuredFlags.length} flagged`} />
          ) : null}
        </View>
      </View>

      {/* Dimension radar */}
      <View className={CARD}>
        <Text variant="bodyBold" className="mb-2 text-[14px]">
          Dimension Profile
        </Text>
        <View className="items-center">
          <DomainRadar points={radarPoints} />
        </View>
      </View>

      {/* Dimension breakdown */}
      <View className={CARD}>
        <Text variant="bodyBold" className="mb-4">
          Dimension Breakdown
        </Text>
        <View className="gap-4">
          {DIMENSION_ORDER.map((key, i) => (
            <DimensionBar
              key={key}
              dimensionKey={key}
              score={results.domainScores[key]}
              delayMs={i * 100}
              showTier
              onPress={() => onNavigateToDimension(key)}
            />
          ))}
        </View>
      </View>

      {/* Strengths + growth */}
      <View className="gap-6">
        <View className={CARD}>
          {detailed.strengths.length > 0 ? (
            <>
              <View className="mb-5 flex-row items-center gap-2.5">
                <CheckCircle2 size={16} color="#10b981" />
                <Text variant="bodyBold">Core Strengths</Text>
              </View>
              <View className="gap-3">
                {detailed.strengths.map((s) => {
                  const Icon = DIMENSION_META[s.key].icon;
                  return (
                    <View key={s.key} className="rounded-xl border border-border p-4 dark:border-border-dark">
                      <View className="mb-1.5 flex-row items-center gap-2">
                        <Icon size={14} color={DIMENSION_META[s.key].hexColor} />
                        <Text variant="bodyMedium" className="text-[14px]">
                          {s.name}
                        </Text>
                        <Text variant="caption" className="ml-auto text-text-secondary dark:text-text-secondary-dark">
                          {Math.round(s.score)}/20
                        </Text>
                      </View>
                      <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
                        {s.insight}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </>
          ) : (
            <>
              <View className="mb-5 flex-row items-center gap-2.5">
                <Compass size={16} color={tc.primary} />
                <Text variant="bodyBold">Areas to Support</Text>
              </View>
              <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
                Every dimension has room to grow right now — that's common, and it's a workable place to
                start. The growth areas here show where small, focused steps can help most.
              </Text>
            </>
          )}
        </View>

        <View className={CARD}>
          <View className="mb-5 flex-row items-center gap-2.5">
            <TrendingUp size={16} color="#f59e0b" />
            <Text variant="bodyBold">Growth Opportunities</Text>
          </View>
          <View className="gap-3">
            {detailed.growthAreas.map((g) => {
              const Icon = DIMENSION_META[g.key].icon;
              return (
                <View key={g.key} className="rounded-xl border border-border p-4 dark:border-border-dark">
                  <View className="mb-1.5 flex-row items-center gap-2">
                    <Icon size={14} color={DIMENSION_META[g.key].hexColor} />
                    <Text variant="bodyMedium" className="text-[14px]">
                      {g.name}
                    </Text>
                    <Text variant="caption" className="ml-auto text-text-secondary dark:text-text-secondary-dark">
                      {Math.round(g.score)}/20
                    </Text>
                  </View>
                  <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
                    {g.insight}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Phase next steps */}
      <PhaseNextSteps tier={results.tier} />

      {/* Personalized recommendations */}
      {recommendations.length > 0 ? (
        <View className={CARD}>
          <Text variant="bodyBold" className="mb-1">
            Personalized for Your Growth Areas
          </Text>
          <Text variant="bodySm" className="mb-5 text-text-secondary dark:text-text-secondary-dark">
            Actions tailored to the dimensions that need the most attention.
          </Text>
          <View className="gap-3">
            {recommendations.map((rec, i) => (
              <View
                key={rec.dimension + rec.linkLabel}
                className="flex-row items-start justify-between gap-4 rounded-xl border border-border p-4 dark:border-border-dark"
              >
                <View className="min-w-0 flex-1 flex-row items-start gap-3">
                  <View
                    style={{
                      marginTop: 2,
                      width: 24,
                      height: 24,
                      borderRadius: 999,
                      backgroundColor: tierHex,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{i + 1}</Text>
                  </View>
                  <Text variant="bodySm" className="flex-1">
                    {rec.text}
                  </Text>
                </View>
                <Text
                  accessibilityRole="button"
                  accessibilityLabel={rec.linkLabel}
                  onPress={() => onRecommend(rec.link)}
                  style={{
                    overflow: 'hidden',
                    borderRadius: 8,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    fontSize: 12,
                    fontWeight: '700',
                    color: '#fff',
                    backgroundColor: tierHex,
                  }}
                >
                  {rec.linkLabel}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Clinical indicators */}
      {results.structuredFlags.length > 0 ? (
        <View className="overflow-hidden rounded-2xl border border-border dark:border-border-dark">
          <View className="flex-row items-center gap-2 border-b border-border px-5 py-4 dark:border-border-dark">
            <AlertTriangle size={16} color="#f59e0b" />
            <Text variant="bodyBold" className="text-[14px]">
              Clinical Indicators
            </Text>
          </View>
          {results.structuredFlags.map((flag) => (
            <View
              key={flag.label}
              className="flex-row items-center justify-between border-b border-border px-5 py-3.5 dark:border-border-dark"
            >
              <View className="flex-row items-center gap-3">
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    backgroundColor: flag.severity === 'significant' ? '#f97316' : '#f59e0b',
                  }}
                />
                <Text variant="bodySm">{flag.label}</Text>
              </View>
              <Text variant="bodyMedium" className="text-[14px]">
                {flag.result}
              </Text>
            </View>
          ))}
          <View className="px-5 py-3">
            <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
              Derived from validated screening instruments. These are indicators, not diagnoses.
            </Text>
          </View>
        </View>
      ) : null}

      {/* Consultation guidance */}
      <ConsultationGuidance tier={results.tier} score={results.totalScore} flags={results.flags} />
    </Animated.View>
  );
}
