// MindMate error taxonomy (mobile). Mirrors psychage-v2/src/features/chat/services/errors.ts
// so the consumer can branch the same way the web does.

/**
 * The endpoint (or the pre-flight) is unreachable / unusable: no signed-in
 * session, a non-JSON platform failure (cold start, proxy HTML), or a hard
 * network error. The UI shows a calm "try again" / "sign in" state — never a
 * raw error, never a stack.
 */
export class MindMateUnavailableError extends Error {
  /** Coarse reason so the UI can branch (e.g. NO_SESSION → show sign-in). */
  readonly code?: 'NO_SESSION' | 'PLATFORM' | 'NO_BODY';

  constructor(
    message: string,
    options?: { code?: 'NO_SESSION' | 'PLATFORM' | 'NO_BODY'; cause?: unknown },
  ) {
    super(message);
    this.name = 'MindMateUnavailableError';
    this.code = options?.code;
    if (options?.cause !== undefined) {
      // `cause` is standard but typed loosely across runtimes.
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}

/**
 * The server's output-safety filter REPLACED the reply (SR-3 no-diagnosis et al).
 * The consumer must replace the accumulated assistant text with this message,
 * not append to it — the partial tokens before the violation are discarded.
 */
export class SafetyReplacementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SafetyReplacementError';
  }
}
