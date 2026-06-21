import { router, Stack } from 'expo-router';

import {
  buildSleepPdfHtml,
  type SleepPdfInput,
} from '@/features/sleep-architect/export/build-sleep-html';
import { SleepArchitectView } from '@/features/sleep-architect/SleepArchitectView';
import { generateAndShare } from '@/features/therapist';
import { expoPdfPrinter } from '@/features/therapist/pdf/expo-printer';

// S29 Sleep Architect — NATIVE. Replaces the former WebView wrapper around
// /m/sleep-architect (the 'sleep-architect' surface is retired). Pushed full-screen
// OUTSIDE the tabs → chrome-minimal (no tab bar, no GlobalHeader); the view carries
// its own crisis pill (SR-2) and back affordance. LOCAL-ONLY (SR-4).
//
// P59 export: the route owns the native PDF egress (build the HTML locally, hand it to
// the OS share sheet). `expoPdfPrinter` is imported directly — the therapist barrel
// excludes it so Vitest never pulls expo-print into a component render test.
export default function SleepRoute() {
  const onExport = (input: SleepPdfInput) => {
    const html = buildSleepPdfHtml(input);
    void generateAndShare(html, expoPdfPrinter);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SleepArchitectView onClose={() => router.back()} onExport={onExport} />
    </>
  );
}
