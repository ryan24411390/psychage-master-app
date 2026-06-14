import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';

import { GlobalHeader } from '@/components/GlobalHeader';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import {
  defaultDeviceRegionHint,
  loadRegionOverride,
  resolveRegion,
} from '@/features/crisis/region';
import { AUTH_SIGN_IN_ROUTE } from '@/features/webview/auth-handshake';
import { storage } from '@/lib/adapters/storage';
import { colors } from '@/lib/colors';

import { MINDMATE_COPY } from '../copy';
import type { sendMessage } from '../mindmate-service';
import { useMindMateChat } from '../useMindMateChat';
import { ChatInput } from './ChatInput';
import { CrisisCard } from './CrisisCard';
import { MessageList } from './MessageList';

// S-MM MindMate screen. NATIVE chat (message list + composer), mascot-fronted.
// GlobalHeader carries the always-visible Help-now pill → the crisis surface is
// reachable throughout (SR-1). A CrisisCard also drops inline the instant a crisis
// is detected (client pre-check OR server verdict) and takes priority over the AI.
//
// Callback-driven (onRequestCrisis/onSignIn/onBack/sendImpl injectable) so the
// screen renders + tests without an expo-router or network context.

function resolveActiveRegion() {
  return resolveRegion({
    storedOverride: loadRegionOverride(storage),
    deviceHint: defaultDeviceRegionHint(),
  });
}

type MindMateViewProps = {
  region?: string;
  onRequestCrisis?: () => void;
  onSignIn?: () => void;
  onBack?: () => void;
  /** Injectable streaming impl for tests; defaults to the real service. */
  sendImpl?: typeof sendMessage;
};

export function MindMateView({
  region,
  onRequestCrisis = () => router.push('/crisis'),
  onSignIn = () => router.push(AUTH_SIGN_IN_ROUTE),
  onBack = () => router.back(),
  sendImpl,
}: MindMateViewProps) {
  const { messages, status, error, crisisActive, needsSignIn, send } = useMindMateChat({
    region: region ?? resolveActiveRegion(),
    onCrisis: onRequestCrisis,
    sendImpl,
  });

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <GlobalHeader />
      <View className="flex-row items-center px-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          hitSlop={8}
          testID="mindmate-back"
          className="min-h-[44px] flex-row items-center gap-1 px-2"
        >
          <ChevronLeft size={20} color={colors.charcoal[600]} strokeWidth={2} />
          <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
            Back
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <MessageList messages={messages} />

        {crisisActive ? <CrisisCard onGetSupport={onRequestCrisis} /> : null}

        {needsSignIn ? (
          <View
            className="mx-4 my-2 gap-3 rounded-2xl border border-border/50 bg-surface p-4 dark:border-border-dark/50 dark:bg-surface-dark"
            testID="mindmate-signin"
          >
            <Text variant="bodyBold" className="text-text-primary dark:text-text-primary-dark">
              {MINDMATE_COPY.signInTitle}
            </Text>
            <Text variant="bodySm" className="text-text-secondary dark:text-text-secondary-dark">
              {MINDMATE_COPY.signInBody}
            </Text>
            <Button onPress={onSignIn} testID="mindmate-signin-cta">
              {MINDMATE_COPY.signInCta}
            </Button>
          </View>
        ) : error && !needsSignIn ? (
          <Text
            variant="bodySm"
            className="px-4 py-2 text-center text-text-secondary dark:text-text-secondary-dark"
            testID="mindmate-error"
          >
            {error}
          </Text>
        ) : null}

        <ChatInput onSend={send} disabled={status === 'sending'} />
      </KeyboardAvoidingView>
    </View>
  );
}
