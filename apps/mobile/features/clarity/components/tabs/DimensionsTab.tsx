import { AlertCircle, CheckCircle2, ChevronRight, Info, Lightbulb } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { useReducedMotion } from '@/lib/motion';
import { useThemeColors } from '@/lib/use-theme-colors';

import { DIMENSION_META, DIMENSION_ORDER, getDimensionTier } from '../../dimensions';
import { DIMENSION_CONTENT } from '../../results-content';
import type { ClarityScoreResult, DomainKey } from '../../types';
import { ScorePositionBar } from '../ScorePositionBar';
import { TierBadge } from '../TierBadge';
import { openClarityAction } from '../open-action';

// DimensionsTab — faithful RN port of the web DimensionsTab: a dimension selector row,
// then a detail panel (what it measures, why it matters, score position, strengths,
// concerns, numbered actions, optional tool link, instrument badge, per-dimension
// consultation guidance) driven by DIMENSION_CONTENT[selected][tier].

const CARD = 'rounded-2xl border border-border bg-surface dark:border-border-dark dark:bg-surface-dark';

function consultLevel(score: number): 'self-guided' | 'guided' | 'professional' {
  if (score >= 12) return 'self-guided';
  if (score >= 8) return 'guided';
  return 'professional';
}

const CONSULT_COPY = {
  'self-guided': {
    title: 'Keep Building on This Foundation',
    body: 'Your score suggests self-guided tools and habits are working well for this dimension. Keep it up.',
    color: '#10b981',
  },
  guided: {
    title: 'Consider Guided Support',
    body: 'Psychage tools can help, and speaking with a mental health professional is a smart next step if this area does not improve.',
    color: '#f59e0b',
  },
  professional: {
    title: 'Professional Consultation Recommended',
    body: 'This is not a failure — reaching out for professional support is the most effective path to improvement in this area.',
    color: '#f97316',
  },
} as const;

export interface DimensionsTabProps {
  readonly results: ClarityScoreResult;
  readonly initialDimension?: DomainKey;
}

export function DimensionsTab({ results, initialDimension }: DimensionsTabProps) {
  const reduced = useReducedMotion();
  const tc = useThemeColors();
  const [selected, setSelected] = useState<DomainKey>(initialDimension ?? 'emotional');

  const meta = DIMENSION_META[selected];
  const Icon = meta.icon;
  const score = results.domainScores[selected];
  const tier = getDimensionTier(score);
  const content = DIMENSION_CONTENT[selected][tier];
  const consult = consultLevel(score);
  const consultCfg = CONSULT_COPY[consult];

  return (
    <Animated.View entering={reduced ? undefined : FadeInDown.duration(300)} className="gap-6">
      {/* Selector */}
      <View className="flex-row flex-wrap gap-2">
        {DIMENSION_ORDER.map((key) => {
          const m = DIMENSION_META[key];
          const DimIcon = m.icon;
          const isActive = key === selected;
          const dimScore = Math.round(results.domainScores[key]);
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${m.name}, ${dimScore} out of 20`}
              onPress={() => setSelected(key)}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                minHeight: 44,
                borderRadius: 12,
                paddingHorizontal: 14,
                borderWidth: isActive ? 2 : 1,
                borderColor: isActive ? m.hexColor : tc.inkTertiary,
                backgroundColor: isActive ? `${m.hexColor}1A` : 'transparent',
              })}
            >
              <DimIcon size={16} color={m.hexColor} />
              <Text style={{ color: isActive ? m.hexColor : tc.inkSecondary, fontSize: 13, fontWeight: '600' }}>
                {m.shortName}
              </Text>
              <Text style={{ color: isActive ? m.hexColor : tc.inkSecondary, fontSize: 12, fontWeight: '700' }}>
                {dimScore}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Detail panel */}
      <View className={`overflow-hidden ${CARD}`}>
        {/* Header with hex tint */}
        <View className="flex-row items-center gap-4 p-5" style={{ backgroundColor: `${meta.hexColor}10` }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: `${meta.hexColor}22`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={28} color={meta.hexColor} />
          </View>
          <View className="flex-1">
            <Text variant="heading">{meta.name}</Text>
            <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
              {meta.instrument} — {meta.instrumentFull}
            </Text>
          </View>
          <View className="items-end">
            <Text variant="headingLg">
              {Math.round(score)}
              <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
                /20
              </Text>
            </Text>
            <TierBadge tier={tier} size="sm" />
          </View>
        </View>

        <View className="gap-6 p-5">
          {/* What this measures */}
          <View className="rounded-xl border border-border p-4 dark:border-border-dark">
            <Text variant="caption" className="mb-2 text-text-secondary dark:text-text-secondary-dark">
              WHAT THIS MEASURES
            </Text>
            <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
              {meta.description}
            </Text>
          </View>

          {/* Why this matters */}
          {content.context ? (
            <View className="rounded-xl border border-border p-4 dark:border-border-dark">
              <View className="mb-2 flex-row items-center gap-1.5">
                <Info size={12} color={meta.hexColor} />
                <Text variant="caption" style={{ color: meta.hexColor }}>
                  WHY THIS MATTERS
                </Text>
              </View>
              <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
                {content.context}
              </Text>
            </View>
          ) : null}

          {/* Score position */}
          <ScorePositionBar score={score} maxScore={20} tier={tier} />

          {/* Strengths */}
          {content.strengths && content.strengths.length > 0 ? (
            <View>
              <View className="mb-3 flex-row items-center gap-2">
                <CheckCircle2 size={16} color="#10b981" />
                <Text variant="bodyBold" className="text-[14px]">
                  What's Going Well
                </Text>
              </View>
              <View className="gap-2">
                {content.strengths.map((s) => (
                  <View key={s} className="rounded-lg border border-border p-3 dark:border-border-dark">
                    <Text variant="bodySm">{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Concerns */}
          {content.concerns && content.concerns.length > 0 ? (
            <View>
              <View className="mb-3 flex-row items-center gap-2">
                <AlertCircle size={16} color="#f59e0b" />
                <Text variant="bodyBold" className="text-[14px]">
                  Areas to Watch
                </Text>
              </View>
              <View className="gap-2">
                {content.concerns.map((c) => (
                  <View key={c} className="rounded-lg border border-border p-3 dark:border-border-dark">
                    <Text variant="bodySm">{c}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Actions */}
          <View>
            <View className="mb-3 flex-row items-center gap-2">
              <Lightbulb size={16} color="#1A9B8C" />
              <Text variant="bodyBold" className="text-[14px]">
                Recommended Next Steps
              </Text>
            </View>
            <View className="gap-3">
              {content.actions.map((a, i) => (
                <View key={a} className="flex-row items-start gap-3 rounded-xl border border-border p-4 dark:border-border-dark">
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 999,
                      backgroundColor: '#1A9B8C',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{i + 1}</Text>
                  </View>
                  <Text variant="bodySm" className="flex-1">
                    {a}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Tool link */}
          {content.toolLink ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={content.toolLink.label}
              onPress={() => content.toolLink && openClarityAction(content.toolLink.path)}
              className="min-h-[44px] flex-row items-center gap-3 rounded-xl border border-border p-4 dark:border-border-dark"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  backgroundColor: `${meta.hexColor}22`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={16} color={meta.hexColor} />
              </View>
              <Text variant="bodyMedium" className="flex-1 text-[14px]">
                {content.toolLink.label}
              </Text>
              <ChevronRight size={16} color={tc.inkSecondary} />
            </Pressable>
          ) : null}

          {/* Per-dimension consultation guidance */}
          <View
            className="rounded-xl border p-5"
            style={{ borderColor: `${consultCfg.color}55`, backgroundColor: `${consultCfg.color}12` }}
          >
            <Text variant="bodyBold" className="mb-1 text-[14px]" style={{ color: consultCfg.color }}>
              {consultCfg.title}
            </Text>
            <Text variant="bodySm" style={{ color: consultCfg.color }}>
              {consultCfg.body}
            </Text>
            {consult === 'professional' ? (
              <Text
                accessibilityRole="button"
                accessibilityLabel="Find a Provider"
                onPress={() => openClarityAction('/find')}
                style={{ marginTop: 8, color: consultCfg.color, fontWeight: '600', fontSize: 13 }}
              >
                Find a Provider ›
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
