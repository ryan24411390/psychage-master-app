import { BookOpen, Compass, Home, MapPin } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useThemeColors } from '@/lib/use-theme-colors';

// First-run cross-tab tour — a one-time, dismissible introduction to the four tabs.
// Shown once after product onboarding (gated by the caller on lib/persistence/tour).
// Reduced-motion aware (Modal's own fade is the only motion; no custom animation).
// Never blocks crisis: it's a skippable overlay, not a gate, and the GlobalHeader's
// Help-now pill remains reachable the instant it's dismissed. Educational framing only.

interface Slide {
  readonly icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  readonly tab: string;
  readonly body: string;
}

// Slide copy is provisional pending Dr. Dobson (CLAUDE.md §7), consistent with copy.ts.
// The Today slide is aligned to the event-initiated Moments model (matching the Orient
// screen) — no "daily"/"check-in"/scheduled cadence (the daily check-in was retired, #138).
const SLIDES: readonly Slide[] = [
  { icon: Home, tab: 'Today', body: 'A calm home base — notice a moment whenever you want.' },
  { icon: BookOpen, tab: 'Learn', body: 'Plain-language guides on what you might be experiencing.' },
  { icon: Compass, tab: 'Compass', body: 'Tools to explore patterns over time, at your own pace.' },
  { icon: MapPin, tab: 'Find', body: 'Search for licensed providers near you, whenever you’re ready.' },
];

export interface FirstRunTourProps {
  /** Fired when the tour is finished or skipped — caller marks it seen + unmounts. */
  readonly onDone: () => void;
}

export function FirstRunTour({ onDone }: FirstRunTourProps) {
  const tc = useThemeColors();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  if (!slide) return null;
  const isLast = index === SLIDES.length - 1;
  const Icon = slide.icon;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onDone}>
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full max-w-[360px] rounded-2xl bg-surface p-6 shadow-base dark:bg-surface-dark">
          <View className="mb-4 h-12 w-12 items-center justify-center rounded-xl bg-surface-accent dark:bg-surface-accent-dark">
            <Icon size={24} color={tc.primary} strokeWidth={2} />
          </View>

          <Text variant="h1" className="text-text-primary dark:text-text-primary-dark">
            {slide.tab}
          </Text>
          <Text variant="body" className="mt-1 text-text-secondary dark:text-text-secondary-dark">
            {slide.body}
          </Text>

          {/* progress dots */}
          <View className="mt-5 flex-row gap-1.5">
            {SLIDES.map((s, i) => (
              <View
                key={s.tab}
                className={
                  i === index
                    ? 'h-1.5 w-5 rounded-full bg-primary dark:bg-primary-dark'
                    : 'h-1.5 w-1.5 rounded-full bg-border dark:bg-border-dark'
                }
              />
            ))}
          </View>

          <View className="mt-6 flex-row items-center justify-between">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Skip the tour"
              onPress={onDone}
              hitSlop={8}
              className="min-h-[44px] justify-center"
            >
              <Text variant="bodyLarge" className="text-text-secondary dark:text-text-secondary-dark">
                Skip
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isLast ? 'Finish the tour' : 'Next'}
              onPress={() => (isLast ? onDone() : setIndex((i) => i + 1))}
              className="min-h-[44px] items-center justify-center rounded-xl bg-primary px-6 dark:bg-primary-dark active:scale-[0.98]"
            >
              <Text variant="bodyLarge" className="text-white">
                {isLast ? 'Get started' : 'Next'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
