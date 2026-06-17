import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';

import { CT4_RELATIONSHIP } from '../copy';
import { getTopInterventions } from '../interventions';
import type { ComputedRelationshipResult } from '../scoring';
import {
  DOMAIN_META,
  type DetectedPattern,
  type PatternSeverity,
  type RelationshipDomain,
  SUB_DIMENSION_META,
} from '../types';
import { DomainBar } from './DomainBar';
import { RadarChart } from './RadarChart';
import { SafetyAlert, SafetyBanner } from './SafetyAlert';
import { ScoreRing } from './ScoreRing';

export interface ResultsViewProps {
  readonly result: ComputedRelationshipResult;
  readonly saved: boolean;
  readonly onSave: () => void;
  readonly onRetake: () => void;
  readonly onViewHistory: () => void;
  readonly onCrisis: () => void;
}

const ALL_DOMAINS: RelationshipDomain[] = ['partner', 'family', 'friends', 'community'];

const SEVERITY_DOT: Record<PatternSeverity, string> = {
  concern: 'bg-crisis',
  warning: 'bg-warning dark:bg-warning-dark',
  info: 'bg-primary dark:bg-primary-dark',
};

function PatternCard({ pattern }: { pattern: DetectedPattern }) {
  return (
    <Card>
      <View className="mb-1.5 flex-row items-center gap-2">
        <View className={`h-2 w-2 rounded-full ${SEVERITY_DOT[pattern.severity]}`} />
        <Text variant="bodyLarge" className="flex-1 text-[15px]">
          {pattern.title}
        </Text>
      </View>
      <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark leading-5">
        {pattern.description}
      </Text>
      <Text variant="caption" className="mt-2 text-text-tertiary dark:text-text-tertiary-dark leading-4">
        {pattern.scienceNote}
      </Text>
    </Card>
  );
}

export function ResultsView({ result, saved, onSave, onRetake, onViewHistory, onCrisis }: ResultsViewProps) {
  const t = CT4_RELATIONSHIP.results;
  const safetyTriggered = result.dvAlert.triggered || result.isolationAlert.triggered;
  const [alertVisible, setAlertVisible] = useState(safetyTriggered);

  const domains = ALL_DOMAINS.filter((d) => !(result.skipPartner && d === 'partner'));
  const radarPoints = domains.map((d) => ({ label: DOMAIN_META[d].shortName, score: result.domainScores[d] }));
  const interventions = getTopInterventions(result.patterns, 4);
  const blueprintParas = result.blueprint.split('\n\n').filter(Boolean);

  return (
    <View className="flex-1">
      <SafetyAlert visible={alertVisible} onDismiss={() => setAlertVisible(false)} onCrisis={onCrisis} />

      <ScrollView
        className="flex-1 px-4"
        contentContainerClassName="gap-6 pb-12 pt-2"
        showsVerticalScrollIndicator={false}
      >
        {safetyTriggered ? <SafetyBanner onCrisis={onCrisis} /> : null}

        {/* Overall */}
        <View className="items-center gap-3 pt-2">
          <Text
            variant="caption"
            className="uppercase tracking-wider text-text-tertiary dark:text-text-tertiary-dark font-sans-medium"
          >
            {t.overallHeading}
          </Text>
          <ScoreRing score={result.compositeScore} />
          <Text
            variant="bodyLarge"
            className="px-6 text-center text-text-secondary dark:text-text-secondary-dark"
          >
            {result.tierLabel}
          </Text>
        </View>

        {/* Radar */}
        <View className="items-center">
          <RadarChart points={radarPoints} />
        </View>

        {/* By area */}
        <View className="gap-3">
          <Text variant="h2" className="text-lg" accessibilityRole="header">
            {t.areasHeading}
          </Text>
          {domains.map((d) => {
            const subScores = result.subDimensionScores[d] as Record<string, number>;
            const subMetas = SUB_DIMENSION_META.filter((m) => m.domain === d);
            return (
              <Card key={d} className="gap-3">
                <DomainBar label={DOMAIN_META[d].name} score={result.domainScores[d]} />
                <View className="gap-1.5 pl-1">
                  {subMetas.map((m) => (
                    <View key={m.key} className="flex-row items-center justify-between">
                      <Text variant="caption" className="flex-1 text-text-secondary dark:text-text-secondary-dark">
                        {m.name}
                      </Text>
                      <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
                        {subScores[m.key]}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>
            );
          })}
        </View>

        {/* Blueprint */}
        <View className="gap-2">
          <Text variant="h2" className="text-lg" accessibilityRole="header">
            {t.blueprintHeading}
          </Text>
          {blueprintParas.map((para) => (
            <Text
              key={para}
              variant="body"
              className="text-text-secondary dark:text-text-secondary-dark leading-6"
            >
              {para}
            </Text>
          ))}
        </View>

        {/* Patterns */}
        {result.patterns.length > 0 ? (
          <View className="gap-3">
            <Text variant="h2" className="text-lg" accessibilityRole="header">
              {t.patternsHeading}
            </Text>
            {result.patterns.map((p) => (
              <PatternCard key={p.key} pattern={p} />
            ))}
          </View>
        ) : null}

        {/* Next steps */}
        {interventions.length > 0 ? (
          <View className="gap-3">
            <Text variant="h2" className="text-lg" accessibilityRole="header">
              {t.stepsHeading}
            </Text>
            {interventions.map((iv) => (
              <Card key={iv.id} className="gap-2">
                <Text variant="bodyLarge" className="text-[15px]">
                  {iv.title}
                </Text>
                <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark leading-5">
                  {iv.description}
                </Text>
                <Text variant="caption" className="text-text-tertiary dark:text-text-tertiary-dark">
                  {`${iv.difficulty} · ${iv.timeEstimate}`}
                </Text>
              </Card>
            ))}
          </View>
        ) : null}

        {/* Actions */}
        <View className="gap-2.5 pt-2">
          <Button variant="primary" onPress={onSave} disabled={saved} className="w-full">
            {saved ? t.saved : t.save}
          </Button>
          <View className="flex-row gap-2.5">
            <Button variant="secondary" onPress={onViewHistory} className="flex-1">
              {t.viewHistory}
            </Button>
            <Button variant="ghost" onPress={onRetake} className="flex-1">
              {t.retake}
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
