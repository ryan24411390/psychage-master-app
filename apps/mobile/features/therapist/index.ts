// Therapist feature — logic surface. className-bearing JSX lives under
// components/therapist (Tailwind's content scan covers components/, not features/).
//
// NOTE: pdf/expo-printer (which imports expo-print/expo-sharing native modules) is
// intentionally NOT re-exported here — it must not be pulled into Vitest via the
// barrel. Routes import it directly from '@/features/therapist/pdf/expo-printer'.

export { THERAPIST_COPY } from './copy';
export { ProviderProvider, useProvider, type Provider } from './use-provider';
export {
  buildSessionPrepHtml,
  buildTherapistPdfHtml,
  enumerateDays,
  summarizeRange,
  windowForDays,
  type RangeSummary,
  type SessionPrepPdfInput,
  type TherapistPdfInput,
} from './pdf/build-html';
export {
  buildUnifiedExportHtml,
  UNIFIED_EXPORT_VERSION,
  type UnifiedExportInput,
} from './pdf/build-unified-html';
export {
  buildSessionPrepSummary,
  type SessionPrepSummary,
} from './session-prep/summary';
export { generateAndShare, type PdfPrinter } from './pdf/printer';
