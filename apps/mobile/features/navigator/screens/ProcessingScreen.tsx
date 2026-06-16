import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/colors';
import { easingFn, useReducedMotion } from '@/lib/motion';
import { useThemeColors } from '@/lib/use-theme-colors';

import { NAVIGATOR_COPY } from '../copy';

// S — Processing (mobile port of web ProcessingScreen). Pure UX pacing: the engine runs
// in the container in ~1ms; this screen animates a progress ring + step carousel for
// ~2.25s, then calls onDone. Timing constants are VERBATIM from web.

export const PROCESSING_STEPS = [
  'Analyzing symptom patterns…',
  'Cross-referencing knowledge base…',
  'Evaluating severity markers…',
] as const;

export const STEP_INTERVAL_MS = 650;
export const FINAL_DELAY_MS = 300;

const SIZE = 112;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ProcessingScreenProps {
  readonly onDone: () => void;
}

export function ProcessingScreen({ onDone }: ProcessingScreenProps) {
  const reduced = useReducedMotion();
  const tc = useThemeColors();
  const [currentStep, setCurrentStep] = useState(0);
  const offset = useSharedValue(CIRCUMFERENCE);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const total = PROCESSING_STEPS.length;
    let step = 0;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    setCurrentStep(0);

    const setProgress = (s: number) => {
      const pct = (s + 1) / total;
      const target = CIRCUMFERENCE - pct * CIRCUMFERENCE;
      offset.value = reduced ? target : withTiming(target, { duration: 500, easing: easingFn('out') });
    };
    setProgress(0);

    const interval = setInterval(() => {
      step += 1;
      if (step < total) {
        setCurrentStep(step);
        setProgress(step);
      } else {
        clearInterval(interval);
        timeout = setTimeout(() => onDoneRef.current(), FINAL_DELAY_MS);
      }
    }, STEP_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [offset, reduced]);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));
  const progressPct = Math.round(((currentStep + 1) / PROCESSING_STEPS.length) * 100);

  return (
    <View className="flex-1 items-center justify-center gap-6 px-6">
      <View style={{ width: SIZE, height: SIZE }} className="items-center justify-center">
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={tc.inkTertiary}
            strokeWidth={STROKE}
            fill="none"
          />
          <AnimatedCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={colors.teal[500]}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            animatedProps={animatedProps}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <View className="absolute inset-0 items-center justify-center">
          <Text variant="headingLg">{progressPct}%</Text>
        </View>
      </View>

      {/* Step dots */}
      <View className="flex-row items-center gap-2.5">
        {PROCESSING_STEPS.map((label, i) => (
          <View
            key={label}
            className={`h-2 w-2 rounded-full ${
              i <= currentStep ? 'bg-teal-500' : 'bg-border dark:bg-border-dark'
            }`}
          />
        ))}
      </View>

      {/* Step text */}
      <Text variant="bodyMedium" accessibilityLiveRegion="polite" className="text-center">
        {PROCESSING_STEPS[currentStep]}
      </Text>

      <Text variant="bodySm" className="text-center text-text-secondary dark:text-text-secondary-dark">
        {NAVIGATOR_COPY.processingFootnote}
      </Text>
    </View>
  );
}
