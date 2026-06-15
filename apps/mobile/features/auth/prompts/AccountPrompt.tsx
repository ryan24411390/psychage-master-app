import { ConfirmSheet } from '@/components/auth/ConfirmSheet';
import { AUTH_COPY } from '@/features/auth/copy';

// Just-in-time account prompt (rules/auth.md §2). One discriminated component covers the
// V1 triggers (a single sheet grammar, copy keyed by `kind`) rather than a near-duplicate
// file per trigger. Presentational only — gating (anonymous-only, one-per-session) and
// navigation live in use-account-prompt.ts. Skippable, never blocking (§2 hard rule):
// "Skip for now" always dismisses without taking the action away.

export type PromptKind = 'streak-save' | 'therapist-link';

const COPY: Record<PromptKind, { title: string; body: string; primary: string; skip: string }> = {
  'streak-save': {
    title: AUTH_COPY.streakSaveTitle,
    body: AUTH_COPY.streakSaveBody,
    primary: AUTH_COPY.streakSavePrimary,
    skip: AUTH_COPY.streakSaveSkip,
  },
  'therapist-link': {
    title: AUTH_COPY.therapistLinkTitle,
    body: AUTH_COPY.therapistLinkBody,
    primary: AUTH_COPY.therapistLinkPrimary,
    skip: AUTH_COPY.therapistLinkSkip,
  },
};

type AccountPromptProps = {
  kind: PromptKind;
  onAccept: () => void;
  onDismiss: () => void;
};

export function AccountPrompt({ kind, onAccept, onDismiss }: AccountPromptProps) {
  const copy = COPY[kind];
  return (
    <ConfirmSheet
      title={copy.title}
      body={copy.body}
      confirmLabel={copy.primary}
      cancelLabel={copy.skip}
      onConfirm={onAccept}
      onCancel={onDismiss}
    />
  );
}
