import { useCallback, useRef, useState } from 'react';

import { MindMateUnavailableError, SafetyReplacementError } from './errors';
import { sendMessage as defaultSendMessage } from './mindmate-service';
import type { ChatMessage, ChatTurnMeta } from './types';

// In-memory conversation controller (SR-privacy: messages live ONLY here — never
// written to MMKV/secure-store, never sent to Sentry/analytics; they vanish on
// unmount). State is plain React (Zustand/TanStack Query are not in the V1 deps).

let seq = 0;
const nextId = () => `mm-${++seq}`;

export type ChatStatus = 'idle' | 'sending' | 'error';

type SendFn = typeof defaultSendMessage;

export interface UseMindMateChatOptions {
  /** Region code forwarded to the backend so crisis resources match locale. */
  region?: string;
  /** Fired the instant a crisis is detected (client pre-check OR server verdict). */
  onCrisis?: () => void;
  /** Injectable for tests; defaults to the real streaming service. */
  sendImpl?: SendFn;
}

export interface UseMindMateChat {
  messages: ChatMessage[];
  status: ChatStatus;
  /** Calm, user-facing error copy (never a raw error/stack). */
  error: string | null;
  /** True once a crisis has been surfaced this session — keeps the crisis card up. */
  crisisActive: boolean;
  /** True when the last attempt failed because no session exists → show sign-in. */
  needsSignIn: boolean;
  send: (text: string) => Promise<void>;
}

function toApi(messages: ChatMessage[]): { role: 'user' | 'assistant'; content: string }[] {
  return messages
    .filter((m) => m.content.trim().length > 0)
    .map((m) => ({ role: m.role, content: m.content }));
}

export function useMindMateChat(options: UseMindMateChatOptions = {}): UseMindMateChat {
  const { region, onCrisis, sendImpl = defaultSendMessage } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [crisisActive, setCrisisActive] = useState(false);
  const [needsSignIn, setNeedsSignIn] = useState(false);

  const sessionId = useRef<string | undefined>(undefined);

  const triggerCrisis = useCallback(() => {
    setCrisisActive(true);
    onCrisis?.();
  }, [onCrisis]);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || status === 'sending') return;
      setError(null);
      setNeedsSignIn(false);

      const userMsg: ChatMessage = { id: nextId(), role: 'user', content: text };

      // Client crisis pre-check (SR-2) — instant, offline, takes priority over the
      // AI reply: we surface crisis and do NOT call the backend for this turn.
      // Done via dynamic import so the keyword set isn't part of the hot path bundle
      // until the first send.
      const { precheckCrisis } = await import('./safety/crisis-keywords');
      if (precheckCrisis(text)) {
        setMessages((prev) => [...prev, userMsg]);
        triggerCrisis();
        return;
      }

      const apiMessages = [...toApi(messages), { role: 'user' as const, content: text }];
      const assistantId = nextId();
      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: assistantId, role: 'assistant', content: '', isStreaming: true },
      ]);
      setStatus('sending');

      const onMeta = (meta: ChatTurnMeta) => {
        sessionId.current = meta.sessionId || sessionId.current;
        if (meta.isCrisis) {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, isCrisis: true } : m)),
          );
          triggerCrisis();
        }
        if (meta.citations.length > 0) {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, citations: meta.citations } : m)),
          );
        }
      };

      try {
        for await (const chunk of sendImpl(
          { messages: apiMessages, sessionId: sessionId.current, region },
          onMeta,
        )) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + chunk } : m,
            ),
          );
        }
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, isStreaming: false } : m)),
        );
        setStatus('idle');
      } catch (err) {
        if (err instanceof SafetyReplacementError) {
          // SR-3: server replaced the output — REPLACE the partial text, don't append.
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: err.message, isStreaming: false } : m,
            ),
          );
          setStatus('idle');
          return;
        }

        // Drop the empty assistant placeholder; show calm error copy.
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        setStatus('error');
        if (err instanceof MindMateUnavailableError && err.code === 'NO_SESSION') {
          setNeedsSignIn(true);
        }
        setError(
          err instanceof MindMateUnavailableError
            ? err.message
            : 'Something went wrong. Please try again.',
        );
      }
    },
    [messages, region, status, sendImpl, triggerCrisis],
  );

  return { messages, status, error, crisisActive, needsSignIn, send };
}
