import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AuthTextField } from '@/components/auth/AuthTextField';
import { Terrain } from '@/components/terrain/Terrain';
import type { TerrainDay } from '@/components/terrain/terrain-geometry';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { THERAPIST_COPY } from '@/features/therapist/copy';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

// S41 — PDF preview + share. The name is EDITABLE (ratified — the provider files by
// it). The on-screen preview reuses the C0.3 Terrain; the actual PDF is generated
// locally from the same range data in the print stylesheet. Share hands the PDF to
// the platform sheet (PII-on-share flagged). Empty range → honest line; the PDF still
// lists no-entry days.
type PdfPreviewProps = {
  initialName: string;
  /** "Jun 8 – Jun 25 · 18 days, 14 entries" */
  summaryLine: string;
  terrainDays: readonly TerrainDay[];
  isEmpty: boolean;
  /** includeTools is the opt-in to append other tools' summaries (default off). */
  onShare: (fullName: string, includeTools: boolean) => void;
};

export function PdfPreview({
  initialName,
  summaryLine,
  terrainDays,
  isEmpty,
  onShare,
}: PdfPreviewProps) {
  const reduced = useReducedMotion();
  const [name, setName] = useState(initialName);
  const [includeTools, setIncludeTools] = useState(false);
  const [width, setWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  return (
    <ScreenShell>
      <Animated.View
        entering={reduced ? undefined : FadeIn.duration(DURATION.base).easing(easingFn('out'))}
        className="flex-1 gap-5 pt-6"
      >
        <AuthTextField
          label={THERAPIST_COPY.previewNameLabel}
          fieldAccessibilityHint={THERAPIST_COPY.previewNameHint}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
          {summaryLine}
        </Text>

        <Card onLayout={onLayout} className="p-3">
          {width > 0 ? <Terrain days={terrainDays} width={width - 24} /> : null}
        </Card>

        {isEmpty ? (
          <Text variant="bodySm" className="text-text-tertiary dark:text-text-tertiary-dark">
            {THERAPIST_COPY.emptyRangeLine}
          </Text>
        ) : null}

        {/* Opt-in: append other tools' summaries. Default OFF so the standard share
            stays check-ins-only, matching the consent the user already agreed to. */}
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: includeTools }}
          accessibilityLabel={THERAPIST_COPY.includeToolsLabel}
          onPress={() => setIncludeTools((v) => !v)}
          hitSlop={6}
          className="flex-row items-start gap-3"
          testID="therapist-include-tools"
        >
          <View
            className={`mt-0.5 h-6 w-6 items-center justify-center rounded-md border ${
              includeTools
                ? 'border-primary bg-primary dark:border-primary-dark dark:bg-primary-dark'
                : 'border-border dark:border-border-dark'
            }`}
          >
            {includeTools ? <Check size={16} color="#FFFFFF" strokeWidth={3} /> : null}
          </View>
          <View className="flex-1">
            <Text variant="bodyMedium" className="text-text-primary dark:text-text-primary-dark">
              {THERAPIST_COPY.includeToolsLabel}
            </Text>
            <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
              {THERAPIST_COPY.includeToolsHint}
            </Text>
          </View>
        </Pressable>

        <View className="mt-auto">
          <Button variant="primary" onPress={() => onShare(name.trim(), includeTools)}>
            {THERAPIST_COPY.sharePrimary}
          </Button>
        </View>
      </Animated.View>
    </ScreenShell>
  );
}
