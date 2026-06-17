import { Activity, ArrowRight, Compass, Stethoscope } from 'lucide-react-native';
import { View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { useThemeColors } from '@/lib/use-theme-colors';

// "Recommended Next Steps" action cards — mobile port of web NextStepCards. Three
// tappable cards (track / professional / self-care) each with an icon, title, body,
// and an action label. onPress routes to the mobile destination.

export type NextStepType = 'track' | 'professional' | 'selfcare';

export interface NextStepItem {
  readonly id: string;
  readonly type: NextStepType;
  readonly title: string;
  readonly description: string;
  readonly actionText: string;
  readonly onPress: () => void;
}

const ICONS: Record<NextStepType, typeof Activity> = {
  track: Activity,
  professional: Stethoscope,
  selfcare: Compass,
};

export function NextStepCards({ steps }: { steps: readonly NextStepItem[] }) {
  const tc = useThemeColors();
  return (
    <View className="gap-3">
      {steps.map((step) => {
        const Icon = ICONS[step.type];
        return (
          <Card key={step.id} variant="elevated" onPress={step.onPress} className="gap-2 p-5">
            <View className="flex-row items-center gap-2.5">
              <Icon size={18} color={tc.primary} strokeWidth={2} />
              <Text variant="label">{step.title}</Text>
            </View>
            <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
              {step.description}
            </Text>
            <View className="mt-1 flex-row items-center gap-1.5">
              <Text variant="bodyLarge" className="text-primary dark:text-primary-dark">
                {step.actionText}
              </Text>
              <ArrowRight size={16} color={tc.primary} strokeWidth={2} />
            </View>
          </Card>
        );
      })}
    </View>
  );
}
