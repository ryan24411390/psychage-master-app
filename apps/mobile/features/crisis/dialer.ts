// Side-effecting dialer for the crisis surface. Offline-complete: dialing/messaging
// need no data and no webview — every action opens the platform dialer/messaging app
// directly via core `Linking` (no extra dependency). The pure intent builders
// (telUrl/smsUrl) live in `intents.ts` so they unit-test without the native layer.

import { Linking } from 'react-native';

export type Dial = (url: string) => void;

/** Default dialer — opens the intent in the platform handler. Swallows rejection
 *  (a missing handler must never crash the crisis surface). */
export const dial: Dial = (url) => {
  void Linking.openURL(url).catch(() => {});
};
