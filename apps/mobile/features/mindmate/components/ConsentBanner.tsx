import { X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { SettingsToggleRow } from '@/components/settings/SettingsToggleRow';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/features/auth';
import { useThemeColors } from '@/lib/use-theme-colors';

import { MINDMATE_COPY } from '../copy';
import { useChatConsent } from '../persistence/use-chat-consent';

// In-chat opt-in to save conversations to the user's account (default OFF). This is
// the ONLY consent surface for MindMate persistence — flipping it on drives the live
// write gate (chat-store persistExchange reads the same store). Plain-language copy
// (SR-3): no diagnosis, explains what's saved and that it's optional. With the toggle
// OFF the conversation stays ephemeral, exactly as before this banner existed.
//
// P57: saving requires an account (chat-store self-no-ops when signed out). Turning
// the toggle ON while signed out gates to sign-in first via `onRequireSignIn` and
// does NOT set consent — once signed in (the user returns to MindMate) they can opt
// in. Turning it OFF is always allowed, with or without a session.
//
// `onDismiss` hides the banner for the session (the consent state persists either way
// — dismissing is not consenting). Toggling on/off does NOT auto-dismiss, so the user
// can flip it back without re-opening anything.
export function ConsentBanner({
  onDismiss,
  onRequireSignIn,
}: {
  onDismiss?: () => void;
  onRequireSignIn?: () => void;
}) {
  const { chatPersistConsent, setChatPersistConsent } = useChatConsent();
  const { session } = useAuth();
  const tc = useThemeColors();

  // Gate the ON transition behind a session; OFF is always permitted.
  const handleToggle = (next: boolean) => {
    if (next && !session) {
      onRequireSignIn?.();
      return;
    }
    setChatPersistConsent(next);
  };

  return (
    <View
      className="mx-4 my-2 gap-2 rounded-2xl border border-border/50 bg-surface p-4 dark:border-border-dark/50 dark:bg-surface-dark"
      testID="mindmate-consent-banner"
    >
      <View className="flex-row items-start gap-2">
        <Text
          variant="label"
          className="flex-1 text-text-primary dark:text-text-primary-dark"
        >
          {MINDMATE_COPY.consentTitle}
        </Text>
        {onDismiss ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            onPress={onDismiss}
            hitSlop={8}
            testID="mindmate-consent-dismiss"
          >
            <X size={18} color={tc.inkSecondary} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>
      <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
        {MINDMATE_COPY.consentBody}
      </Text>
      <SettingsToggleRow
        label={MINDMATE_COPY.consentToggleLabel}
        value={chatPersistConsent}
        onValueChange={handleToggle}
        testID="mindmate-consent-toggle"
      />
    </View>
  );
}
