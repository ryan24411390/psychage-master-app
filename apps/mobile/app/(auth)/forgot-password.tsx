import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { MailCheck } from 'lucide-react-native';

import { AuthTextField } from '@/components/auth/AuthTextField';
import { AuthStatePanel } from '@/components/auth/AuthStatePanel';
import { Button } from '@/components/ui/Button';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { AUTH_COPY, useAuth } from '@/features/auth';
import { type EmailError, validateEmail } from '@/features/auth/validate';
import { useThemeColors } from '@/lib/use-theme-colors';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

// Forgot password (rules/auth.md §3/§9). Sends a reset email, then shows an anti-
// enumeration confirmation: the SAME "check your email" message regardless of whether
// the address has an account — never reveals account existence (Procedure-B checklist #3).
const EMAIL_LINE: Record<EmailError, string> = {
  empty: AUTH_COPY.emailEmptyLine,
  invalid: AUTH_COPY.emailInvalidLine,
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { service } = useAuth();
  const reduced = useReducedMotion();
  const colors = useThemeColors();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<EmailError | null>(null);
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const handleSubmit = async () => {
    const e = validateEmail(email);
    setEmailError(e);
    if (e !== null) return;
    const target = email.trim();
    setSubmitting(true);
    setFormError(undefined);
    const result = await service.requestPasswordReset(target);
    setSubmitting(false);
    if (result.ok) {
      setSentTo(target);
      return;
    }
    // Only a transport failure surfaces — never "no such account".
    setFormError(AUTH_COPY.offlineLine);
  };

  if (sentTo !== null) {
    return (
      <AuthStatePanel
        icon={<MailCheck size={40} color={colors.primary} strokeWidth={1.75} />}
        title={AUTH_COPY.forgotSentTitle}
        body={AUTH_COPY.forgotSentBody(sentTo)}
        primary={{ label: AUTH_COPY.forgotBackToSignIn, onPress: () => router.replace('/sign-in') }}
      />
    );
  }

  return (
    <ScreenShell>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <Animated.View
          entering={reduced ? undefined : FadeIn.duration(DURATION.base).easing(easingFn('out'))}
          className="flex-1 justify-center gap-6"
        >
          <View className="gap-3">
            <Text variant="h1">{AUTH_COPY.forgotTitle}</Text>
            <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
              {AUTH_COPY.forgotBody}
            </Text>
          </View>

          <AuthTextField
            label={AUTH_COPY.emailLabel}
            fieldAccessibilityHint={AUTH_COPY.emailHint}
            value={email}
            onChangeText={setEmail}
            errorText={emailError ? EMAIL_LINE[emailError] : undefined}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={handleSubmit}
          />

          <View className="gap-2">
            {formError ? (
              <Text variant="caption" className="text-error dark:text-error-dark">
                {formError}
              </Text>
            ) : null}
            <Button variant="primary" disabled={submitting} onPress={handleSubmit}>
              {AUTH_COPY.forgotPrimary}
            </Button>
            <Pressable
              accessibilityRole="button"
              hitSlop={6}
              onPress={() => router.back()}
              className="items-center py-2"
            >
              <Text variant="caption" className="text-text-secondary dark:text-text-secondary-dark">
                {AUTH_COPY.forgotBackToSignIn}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}
