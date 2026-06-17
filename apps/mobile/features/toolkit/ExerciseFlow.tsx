import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useReducedMotion, DURATION, easingFn } from '@/lib/motion';

import { BodyScanGlyph } from './components/BodyScanGlyph';
import { BreathingForm } from './components/BreathingForm';
import { ExerciseChrome } from './components/ExerciseChrome';
import { ExercisePrompt } from './components/ExercisePrompt';
import { type Exercise, nextPromptIndex, type PromptExercise } from './exercises';

// Toolkit flow (Flow 14): S19 intro → S20 exercise (ONE template, 3 variants) → S21 end.
// Chrome-minimal throughout (no tab bar — pushed route; the Help-now pill stays). The
// breathing variant auto-paces; grounding + body scan are tap-to-advance. Exercise CONTENT
// is fixture (CT4); the geometry/motion/sequencing is the build.

export interface ExerciseFlowProps {
  readonly exercise: Exercise;
  readonly onExit: () => void;
  readonly onHelp: () => void;
}

export function ExerciseFlow({ exercise, onExit, onHelp }: ExerciseFlowProps) {
  const [step, setStep] = useState<'intro' | 'exercise' | 'end'>('intro');
  const reduced = useReducedMotion();

  const transitionProps = reduced
    ? {}
    : { entering: FadeIn.duration(DURATION.base).easing(easingFn('out')) };

  if (step === 'intro') {
    return (
      <ExerciseChrome onHelp={onHelp} onClose={onExit}>
        <Animated.View {...transitionProps} className="flex-1 justify-between">
          <View className="flex-1 justify-center gap-2 px-6">
            <Text
              variant="caption"
              className="uppercase tracking-widest text-text-secondary dark:text-text-secondary-dark"
            >
              {exercise.name}
            </Text>
            <Text variant="h1">{exercise.need}</Text>
          </View>
          <View className="px-6 pb-8">
            <Button variant="primary" className="w-full" onPress={() => setStep('exercise')}>
              Begin
            </Button>
          </View>
        </Animated.View>
      </ExerciseChrome>
    );
  }

  if (step === 'end') {
    return (
      <ExerciseChrome onHelp={onHelp}>
        <Animated.View
          {...transitionProps}
          className="flex-1 items-center justify-center gap-6 px-6"
        >
          <Text variant="h1">Done.</Text>
          <Button variant="secondary" onPress={onExit}>
            Close
          </Button>
        </Animated.View>
      </ExerciseChrome>
    );
  }

  return (
    <ExerciseChrome onHelp={onHelp} onClose={() => setStep('end')}>
      <Animated.View {...transitionProps} className="flex-1">
        {exercise.kind === 'breathing' ? (
          <BreathingForm exercise={exercise} reduced={reduced} />
        ) : (
          <PromptSequence exercise={exercise} onDone={() => setStep('end')} />
        )}
      </Animated.View>
    </ExerciseChrome>
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
