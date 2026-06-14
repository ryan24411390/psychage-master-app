import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AuthTextField } from '@/components/auth/AuthTextField';
import { Button } from '@/components/ui/Button';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { AUTH_COPY } from '@/features/auth/copy';
import {
  type EmailError,
  type PasswordError,
  validateEmail,
  validatePassword,
} from '@/features/auth/validate';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

// S34 — Email + password (rules/auth.md §3 V1 method). Calm, no magic-link/OTP.
// Validation: malformed input shows a plain inline line under the field, NEVER a
// shake (auth is calm). `formError` carries a service-layer line (offline / generic
// invalid-credentials — no account-existence leak). Router-agnostic: `onSubmit`
// fires only when both fields validate locally.

const EMAIL_LINE: Record<EmailError, string> = {
  empty: AUTH_COPY.emailEmptyLine,
  invalid: AUTH_COPY.emailInvalidLine,
};
const PASSWORD_LINE: Record<PasswordError, string> = {
  empty: AUTH_COPY.passwordEmptyLine,
  'too-short': AUTH_COPY.passwordShortLine,
};

type SignUpFormProps = {
  mode?: 'sign-up' | 'sign-in';
  /** A service-layer line (offline / credentials). Shown above the primary. */
  formError?: string;
  submitting?: boolean;
  onSubmit: (email: string, password: string) => void;
};

export function SignUpForm({
  mode = 'sign-up',
  formError,
  submitting = false,
  onSubmit,
}: SignUpFormProps) {
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
      <Animated.View
        entering={reduced ? undefined : FadeIn.duration(DURATION.base).easing(easingFn('out'))}
        className="flex-1 justify-center gap-6"
      >
        <Text variant="headingLg">{AUTH_COPY.signUpTitle}</Text>

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
            fieldAccessibilityHint={AUTH_COPY.passwordHint}
            value={password}
            onChangeText={setPassword}
            errorText={passwordError ? PASSWORD_LINE[passwordError] : undefined}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
          />
        </View>

        <View className="gap-2">
          {formError ? (
            <Text variant="bodySm" className="text-error dark:text-error-dark">
              {formError}
            </Text>
          ) : null}
          <Button variant="primary" disabled={submitting} onPress={handleSubmit}>
            {mode === 'sign-up' ? AUTH_COPY.signUpPrimary : AUTH_COPY.signInPrimary}
          </Button>
        </View>
      </Animated.View>
    </ScreenShell>
  );
}
