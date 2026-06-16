import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  ChevronDown,
  Compass,
  Info,
  Phone,
  Shield,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useThemeColors } from '@/lib/use-theme-colors';

import { getPhaseProtocol } from '../phase-protocols';
import type { PhaseAction, Urgency } from '../phase-protocols';
import { TIER_DESCRIPTIONS } from '../results-content';
import { getTierHexColor } from '../scoring';
import type { ScoreTier } from '../types';
import { openClarityAction } from './open-action';

// PhaseNextSteps — protocol-backed next steps for the composite tier. Faithful RN port
// of the web PhaseNextSteps: urgency header band, numbered recommended steps, primary +
// supporting actions, collapsible "what to avoid", a What's working / Watch for pair, and
// a collapsible protocol-source attribution.

const URGENCY_ICONS: Record<Urgency, LucideIcon> = {
  urgent: AlertTriangle,
  soon: Phone,
  'this-month': Calendar,
  maintain: Compass,
  protect: Shield,
};

export interface PhaseNextStepsProps {
  readonly tier: ScoreTier;
}

export function PhaseNextSteps({ tier }: PhaseNextStepsProps) {
  const tc = useThemeColors();
  const protocol = getPhaseProtocol(tier);
  const tierDesc = TIER_DESCRIPTIONS[tier];
  const hex = getTierHexColor(tier);
  const UrgencyIcon = URGENCY_ICONS[protocol.urgency];

  const [showWhy, setShowWhy] = useState(false);
  const [showDonts, setShowDonts] = useState(false);

  const ActionButton = ({ action, primary }: { action: PhaseAction; primary: boolean }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action.label}
      onPress={() => openClarityAction(action.href)}
      style={({ pressed }) => ({
        opacity: pressed ? 0.85 : 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minHeight: 44,
        borderRadius: 12,
        paddingHorizontal: 20,
        backgroundColor: primary ? hex : tc.inkTertiary,
      })}
    >
      <Text style={{ color: primary ? '#fff' : tc.ink, fontWeight: '600', fontSize: 14 }}>
        {action.label}
      </Text>
      <ArrowRight size={14} color={primary ? '#fff' : tc.ink} />
    </Pressable>
  );

  return (
    <View
      accessibilityRole="summary"
      className="overflow-hidden rounded-2xl border border-border dark:border-border-dark"
    >
      {/* Header band */}
      <View
        className="border-b border-border p-5 dark:border-border-dark"
        style={{ backgroundColor: `${hex}1A`, flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: hex,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <UrgencyIcon size={20} color="#fff" />
        </View>
        <View className="min-w-0 flex-1">
          <View className="mb-1 flex-row flex-wrap items-center gap-2">
            <View style={{ backgroundColor: hex, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
                {protocol.urgencyLabel}
              </Text>
            </View>
            <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
              Next Steps
            </Text>
          </View>
          <Text variant="heading">{protocol.title}</Text>
          <Text variant="bodySm" className="mt-1 text-text-secondary dark:text-text-secondary-dark">
            {protocol.subtitle}
          </Text>
        </View>
      </View>

      {/* Body */}
      <View className="gap-6 p-5">
        <View className="gap-3">
          <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
            Recommended actions
          </Text>
          {protocol.recommendedSteps.map((step, i) => (
            <View key={step} className="flex-row items-start gap-3">
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  backgroundColor: hex,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{i + 1}</Text>
              </View>
              <Text variant="body" className="flex-1 text-[14px]">
                {step}
              </Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View className="flex-row flex-wrap gap-3">
          <ActionButton action={protocol.primaryAction} primary />
          {protocol.supportingActions.map((a) => (
            <ActionButton key={a.href + a.label} action={a} primary={false} />
          ))}
        </View>

        {/* What to avoid (collapsible) */}
        {protocol.whatNotToDo && protocol.whatNotToDo.length > 0 ? (
          <View className="rounded-xl border border-border dark:border-border-dark">
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: showDonts }}
              onPress={() => setShowDonts((v) => !v)}
              className="min-h-[44px] flex-row items-center justify-between px-4"
            >
              <Text variant="bodyBold" className="text-[14px]">
                What to avoid right now
              </Text>
              <ChevronDown
                size={16}
                color={tc.inkSecondary}
                style={{ transform: [{ rotate: showDonts ? '180deg' : '0deg' }] }}
              />
            </Pressable>
            {showDonts ? (
              <View className="gap-2 px-4 pb-4">
                {protocol.whatNotToDo.map((d) => (
                  <Text key={d} variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
                    • {d}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* What's working / Watch for */}
        <View className="gap-4">
          <View className="rounded-xl border border-border p-4 dark:border-border-dark">
            <Text variant="caption" style={{ color: '#10b981' }} className="mb-1.5">
              What's working
            </Text>
            <Text variant="bodySm">{tierDesc.whatsWorking}</Text>
          </View>
          <View className="rounded-xl border border-border p-4 dark:border-border-dark">
            <Text variant="caption" style={{ color: '#f59e0b' }} className="mb-1.5">
              Watch for
            </Text>
            <Text variant="bodySm">{tierDesc.watchFor}</Text>
          </View>
        </View>

        {/* Why these recommendations (collapsible) */}
        <View>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showWhy }}
            onPress={() => setShowWhy((v) => !v)}
            hitSlop={6}
            className="min-h-[44px] flex-row items-center gap-1.5"
          >
            <Info size={13} color={tc.inkSecondary} />
            <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
              Why these recommendations
            </Text>
            <ChevronDown
              size={13}
              color={tc.inkSecondary}
              style={{ transform: [{ rotate: showWhy ? '180deg' : '0deg' }] }}
            />
          </Pressable>
          {showWhy ? (
            <View className="mt-3 gap-2 rounded-xl border border-border p-4 dark:border-border-dark">
              <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
                Source
              </Text>
              <Text variant="bodyBold" className="text-[14px]">
                {protocol.protocolSource}
              </Text>
              <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
                {protocol.protocolSummary}
              </Text>
              <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
                {tierDesc.professionalGuidance}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
