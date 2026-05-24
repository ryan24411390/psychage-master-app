// Analytics adapter — no-op stub.
//
// Sacred Rule #4: Symptom Navigator state — and any symptom payload — never
// leaves the device. `TrackProps` is structurally limited to primitives so a
// caller cannot accidentally pass a NormalizedSymptom / UserSymptomInput /
// symptom array through this surface; the obvious foot-gun (`props: { items:
// userSymptoms }`) fails to typecheck. Free-text leakage at the *value* level
// is still possible by construction, so callers must continue to surface only
// aggregate counts / event names — never a symptom_id or symptom text.
//
// Active surface is a no-op. A real vendor (PostHog vs Amplitude — open
// decision per PROJECT_CONTEXT §10) lands when that decision closes.

export type TrackProps = Record<string, string | number | boolean>;

export interface TrackEvent {
  readonly name: string;
  readonly props?: TrackProps;
}

export interface Analytics {
  track(event: TrackEvent): void;
}

export const analytics: Analytics = {
  track(_event) {
    // no-op
  },
};
