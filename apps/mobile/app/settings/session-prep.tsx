import { Stack } from 'expo-router';

import { SessionPrepView, type SessionPrepWindow } from '@/components/therapist/SessionPrepView';
import {
  buildSessionPrepHtml,
  buildSessionPrepSummary,
  enumerateDays,
  generateAndShare,
  THERAPIST_COPY,
} from '@/features/therapist';
import { expoPdfPrinter } from '@/features/therapist/pdf/expo-printer';
import { getMomentStore } from '@/lib/moment-store';

// "Prepare for your session" — a session-prep summary the person generates on demand
// before an appointment and shares THEMSELVES (system share sheet; Psychage never
// transmits — SR-4). Lives under the settings stack so it inherits the native header +
// back chevron. Thin route: reads the LOCAL moment store, aggregates, builds the PDF
// locally (expo-print), hands it to the platform sheet. No provider gate — the person's
// own record. `expoPdfPrinter` is imported directly (the barrel excludes the native
// printer so Vitest never pulls expo-print/expo-sharing).
export default function SessionPrepScreen() {
  const countForWindow = (window: SessionPrepWindow) => {
    const moments = getMomentStore().getRange(window.from, window.to);
    return { dayCount: enumerateDays(window.from, window.to).length, momentCount: moments.length };
  };

  const onGenerate = (fullName: string, window: SessionPrepWindow) => {
    const moments = getMomentStore().getRange(window.from, window.to);
    const summary = buildSessionPrepSummary(moments, window);
    const html = buildSessionPrepHtml({ fullName, summary });
    void generateAndShare(html, expoPdfPrinter);
  };

  return (
    <>
      <Stack.Screen options={{ title: THERAPIST_COPY.sessionPrep.screenTitle }} />
      <SessionPrepView countForWindow={countForWindow} onGenerate={onGenerate} />
    </>
  );
}
