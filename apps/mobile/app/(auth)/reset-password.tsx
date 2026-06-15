import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { CheckCircle2, TimerOff } from 'lucide-react-native';

import { AuthTextField } from '@/components/auth/AuthTextField';
import { AuthStatePanel } from '@/components/auth/AuthStatePanel';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { Button } from '@/components/ui/Button';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Text } from '@/components/ui/Text';
import { AUTH_COPY, useAuth } from '@/features/auth';
import {
  type ConfirmError,
  type PasswordError,
  passwordStrength,
  validatePassword,
  validatePasswordConfirmation,
} from '@/features/auth/validate';
import { useThemeColors } from '@/lib/use-theme-colors';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';

// Reset password — reached via the recovery deep-link, which establishes a
// PASSWORD_RECOVERY session and routes here with ?status=ready (or ?status=expired when
// the token exchange failed). With a live recovery session, updatePassword sets the new
// password. Opened without a valid token → the calm "link expired" state.
const PASSWORD_LINE: Record<PasswordError, string> = {
  empty: AUTH_COPY.passwordEmptyLine,
  'too-short': AUTH_COPY.passwordShortLine,
};
const CONFIRM_LINE: Record<ConfirmError, string> = {
  empty: AUTH_COPY.confirmEmptyLine,
  mismatch: AUTH_COPY.confirmMismatchLine,
};

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { service } = useAuth();
  const reduced = useReducedMotion();
  const colors = useThemeColors();
  const { status } = useLocalSearchParams<{ status?: string }>();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordError, setPasswordError] = useState<PasswordError | null>(null);
  const [confirmError, setConfirmError] = useState<ConfirmError | null>(null);
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const strength = passwordStrength(password);

  const handleSubmit = async () => {
    const p = validatePassword(password);
    const c = validatePasswordConfirmation(password, confirm);
    setPasswordError(p);
    setConfirmError(c);
    if (p !== null || c !== null) return;

    setSubmitting(true);
    setFormError(undefined);
    const result = await service.updatePassword(password);
    setSubmitting(false);
    if (result.ok) {
      setDone(true);
      return;
    }
    if (result.error === 'weak-password') {
      setFormError(AUTH_COPY.resetWeakLine);
      return;
    }
    setFormError(result.error === 'offline' ? AUTH_COPY.offlineLine : AUTH_COPY.authErrorBody);
  };

  // The recovery token was missing/expired — no session to update against.
  if (status === 'expired') {
    return (
      <AuthStatePanel
        icon={<TimerOff size={40} color={colors.inkSecondary} strokeWidth={1.75} />}
        title={AUTH_COPY.resetExpiredTitle}
        body={AUTH_COPY.resetExpiredBody}
        primary={{
          label: AUTH_COPY.resetExpiredPrimary,
          onPress: () => router.replace('/forgot-password'),
        }}
      />
    );
  }

  if (done) {
    return (
      <AuthStatePanel
        icon={<CheckCircle2 size={40} color={colors.primary} strokeWidth={1.75} />}
        title={AUTH_COPY.resetDoneTitle}
        body={AUTH_COPY.resetDoneBody}
        primary={{ label: AUTH_COPY.resetDonePrimary, onPress: () => router.replace('/sign-in') }}
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
            <Text variant="headingLg">{AUTH_COPY.resetTitle}</Text>
            <Text variant="body" className="text-text-secondary dark:text-text-secondary-dark">
              {AUTH_COPY.resetBody}
            </Text>
          </View>

          <View className="gap-4">
            <View className="gap-2">
              <AuthTextField
                label={AUTH_COPY.passwordLabel}
                fieldAccessibilityHint={AUTH_COPY.passwordHint}
                value={password}
                onChangeText={setPassword}
                errorText={passwordError ? PASSWORD_LINE[passwordError] : undefined}
                secureTextEntry
                secureToggle
                showLabel={AUTH_COPY.showPasswordLabel}
                hideLabel={AUTH_COPY.hidePasswordLabel}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
              />
              <PasswordStrengthMeter strength={strength} />
            </View>
            <AuthTextField
              label={AUTH_COPY.confirmLabel}
              fieldAccessibilityHint={AUTH_COPY.confirmHint}
              value={confirm}
              onChangeText={setConfirm}
              errorText={confirmError ? CONFIRM_LINE[confirmError] : undefined}
              secureTextEntry
              secureToggle
              showLabel={AUTH_COPY.showPasswordLabel}
              hideLabel={AUTH_COPY.hidePasswordLabel}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
            />
          </View>

          <View className="gap-2">
            {formError ? (
              <Text variant="bodySm" className="text-error dark:text-error-dark">
                {formError}
              </Text>
            ) : null}
            <Button variant="primary" disabled={submitting} onPress={handleSubmit}>
              {AUTH_COPY.resetPrimary}
            </Button>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}
