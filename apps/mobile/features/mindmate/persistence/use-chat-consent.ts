import { useSyncExternalStore } from 'react';

import {
  type ChatConsentState,
  getChatConsentSnapshot,
  setChatPersistConsent,
  subscribeChatConsent,
} from './chat-consent';

// Reactive read+write of the MindMate conversation-persistence consent for the
// in-chat banner. Reads through useSyncExternalStore so flipping the toggle re-
// renders the banner immediately; the setter persists and notifies the write gate
// (chat-store persistExchange reads the same store synchronously via
// getChatPersistConsent).
export interface UseChatConsent extends ChatConsentState {
  setChatPersistConsent: (on: boolean) => void;
}

export function useChatConsent(): UseChatConsent {
  const state = useSyncExternalStore(
    subscribeChatConsent,
    getChatConsentSnapshot,
    getChatConsentSnapshot,
  );
  return { ...state, setChatPersistConsent };
}
