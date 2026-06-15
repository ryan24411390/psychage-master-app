import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AuthTextField } from '@/components/auth/AuthTextField';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { Button } from '@/components/ui/Button';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { AUTH_COPY } from '@/features/auth/copy';
import type { SocialProvider } from '@/features/auth';
import {
  type EmailError,
  type PasswordError,
  validateEmail,
  validatePassword,
} from '@/features/auth/validate';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

// Sign in — email + password. Returning users and web users logging into mobile with
// the same Supabase account (rules/auth.md §231). Mirrors the calm-form pattern: inline
// error lines, never a shake. Adds a show-password toggle + a "Forgot password?" link.
// No "remember me" — sessions persist by default (rules/auth.md §9).

const EMAIL_LINE: Record<EmailError, string> = {
  empty: AUTH_COPY.emailEmptyLine,
  invalid: AUTH_COPY.emailInvalidLine,
};
const PASSWORD_LINE: Record<PasswordError, string> = {
  empty: AUTH_COPY.passwordEmptyLine,
  'too-short': AUTH_COPY.passwordShortLine,
};

type SignInFormProps = {
  formError?: string;
  submitting?: boolean;
  onSubmit: (email: string, password: string) => void;
  onProvider: (provider: SocialProvider) => void;
  onForgotPassword: () => void;
};

export function SignInForm({
  formError,
  submitting = false,
  onSubmit,
  onProvider,
  onForgotPassword,
}: SignInFormProps) {
  const reduced = useReducedMotion();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<EmailError | null>(null);
  const [passwordError, setPasswordError] = useState<PasswordError | null>(null);

  const handleSubmit = () => {
    const e = validateEmail(email);
    const p = validatePassword(password);
    setEmailError(e);
    setPasswordError(p);
    if (e === null && p === null) onSubmit(email.trim(), password);
  };

  return (
    <ScreenShell>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center py-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={reduced ? undefined : FadeIn.duration(DURATION.base).easing(easingFn('out'))}
            className="gap-6"
          >
            <Text variant="headingLg">{AUTH_COPY.signInPrimary}</Text>

            <View className="gap-4">
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
              />
              <AuthTextField
                label={AUTH_COPY.passwordLabel}
                value={password}
                onChangeText={setPassword}
                errorText={passwordError ? PASSWORD_LINE[passwordError] : undefined}
                secureTextEntry
                secureToggle
                showLabel={AUTH_COPY.showPasswordLabel}
                hideLabel={AUTH_COPY.hidePasswordLabel}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
              />
              <Pressable
                accessibilityRole="button"
                hitSlop={6}
                onPress={onForgotPassword}
                className="self-end px-1 py-1"
              >
                <Text variant="bodySm" className="text-primary dark:text-primary-dark">
                  {AUTH_COPY.forgotLink}
                </Text>
              </Pressable>
            </View>

            <View className="gap-2">
              {formError ? (
                <Text variant="bodySm" className="text-error dark:text-error-dark">
                  {formError}
                </Text>
              ) : null}
              <Button variant="primary" disabled={submitting} onPress={handleSubmit}>
                {AUTH_COPY.signInPrimary}
              </Button>
            </View>

            <SocialAuthButtons onProvider={onProvider} disabled={submitting} />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}
