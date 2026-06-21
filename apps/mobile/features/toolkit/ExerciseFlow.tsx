import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { ToolScreen } from '@/components/ui/ToolScreen';
import { useHaptics } from '@/lib/haptic-context';
import { useReducedMotion, DURATION, easingFn } from '@/lib/motion';

import { BodyScanGlyph } from './components/BodyScanGlyph';
import { BreathingForm } from './components/BreathingForm';
import { ExercisePrompt } from './components/ExercisePrompt';
import {
  DEFAULT_PACE,
  END_NOTE,
  type Exercise,
  nextPromptIndex,
  PACES,
  type PromptExercise,
  resolvePace,
} from './exercises';

// Toolkit flow (Flow 14): S19 intro → S20 exercise (ONE template, 3 variants) → S21 end.
// Chrome-minimal throughout (no tab bar — pushed route; the Help-now pill stays). The
// breathing variant paces on a selectable in/hold/out tempo; grounding + body scan are
// tap-to-advance. Exercise CONTENT is fixture (CT4); the geometry/motion/sequencing is the
// build. The wind-down step (S21) offers to keep going or close cleanly.

export interface ExerciseFlowProps {
  readonly exercise: Exercise;
  readonly onExit: () => void;
}

export function ExerciseFlow({ exercise, onExit }: ExerciseFlowProps) {
  const [step, setStep] = useState<'intro' | 'exercise' | 'end'>('intro');
  const [paceId, setPaceId] = useState(DEFAULT_PACE.id);
  const reduced = useReducedMotion();
  const { fireHaptic } = useHaptics();

  const isBreathing = exercise.kind === 'breathing';
  const selectedPace = resolvePace(paceId);

  // Exit feedback: a gentle completion haptic each time the wind-down screen lands.
  useEffect(() => {
    if (step === 'end') fireHaptic('complete');
  }, [step, fireHaptic]);

  const transitionProps = reduced
    ? {}
    : { entering: FadeIn.duration(DURATION.base).easing(easingFn('out')) };

  if (step === 'intro') {
    return (
      <ToolScreen scroll="none" onBack={onExit}>
        <Animated.View {...transitionProps} className="flex-1 justify-between">
          <View className="flex-1 justify-center gap-2 px-6">
            <Text
              variant="caption"
              className="uppercase tracking-widest text-text-secondary dark:text-text-secondary-dark"
            >
              {exercise.name}
            </Text>
            <Text variant="h1">{exercise.need}</Text>
            {isBreathing ? <PaceChips selectedId={paceId} onSelect={setPaceId} /> : null}
          </View>
          <View className="px-6 pb-8">
            <Button variant="primary" className="w-full" onPress={() => setStep('exercise')}>
              Begin
            </Button>
          </View>
        </Animated.View>
      </ToolScreen>
    );
  }

  if (step === 'end') {
    return (
      <ToolScreen scroll="none">
        <Animated.View
          {...transitionProps}
          className="flex-1 items-center justify-center gap-8 px-6"
        >
          <View className="items-center gap-2">
            <Text variant="h1">Done.</Text>
            <Text className="text-center text-base text-text-secondary dark:text-text-secondary-dark">
              {END_NOTE}
            </Text>
          </View>
          <View className="w-full gap-3">
            {isBreathing ? (
              <Button variant="primary" className="w-full" onPress={() => setStep('exercise')}>
                Keep breathing
              </Button>
            ) : null}
            <Button variant="secondary" className="w-full" onPress={onExit}>
              Close
            </Button>
          </View>
        </Animated.View>
      </ToolScreen>
    );
  }

  return (
    <ToolScreen scroll="none" onBack={() => setStep('end')} backLabel="Finish">
      <Animated.View {...transitionProps} className="flex-1">
        {exercise.kind === 'breathing' ? (
          <BreathingForm exercise={exercise} pacing={selectedPace.pacing} reduced={reduced} />
        ) : (
          <PromptSequence exercise={exercise} onDone={() => setStep('end')} />
        )}
      </Animated.View>
    </ToolScreen>
  );
}

// Intro pace selector (breathing only). No chip primitive exists; built from the same
// AnimatedPressable + Text leaves the rest of the app uses. Selected = teal fill with the
// AA-safe label treatment from Button's primary variant.
function PaceChips({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <View className="mt-4 flex-row flex-wrap gap-2">
      {PACES.map((p) => {
        const selected = p.id === selectedId;
        return (
          <AnimatedPressable
            key={p.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={p.label}
            onPress={() => onSelect(p.id)}
            haptic="tab"
            scaleTo={0.96}
            className={`min-h-[44px] items-center justify-center rounded-full border px-4 py-2 ${
              selected
                ? 'border-primary bg-primary dark:border-primary-dark dark:bg-primary-dark'
                : 'border-border dark:border-border-dark'
            }`}
          >
            <Text
              variant="label"
              className={
                selected
                  ? 'text-white dark:text-charcoal-950'
                  : 'text-text-secondary dark:text-text-secondary-dark'
              }
            >
              {p.label}
            </Text>
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

function PromptSequence({ exercise, onDone }: { exercise: PromptExercise; onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const total = exercise.prompts.length;
  const stepData = exercise.prompts[index];
  if (!stepData) return null;

  const advance = () => {
    const next = nextPromptIndex(index, total);
    if (next === null) onDone();
    else setIndex(next);
  };

  const glyph =
    exercise.kind === 'body_scan' ? (
      <BodyScanGlyph progress={total > 1 ? index / (total - 1) : 1} />
    ) : undefined;

  return (
    <ExercisePrompt label={stepData.label} text={stepData.text} glyph={glyph} onAdvance={advance} />
  );
}
