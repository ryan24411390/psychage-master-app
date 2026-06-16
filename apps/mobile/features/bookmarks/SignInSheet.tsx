/**
 * S-2 Sign-in bottom sheet (T-005). Shown when an anonymous user taps save.
 *
 * Explains that saving needs an account, routes to the shipped (auth) flow, and
 * lets the parent resume the original save on success (AC-5.3). Slide-up + scrim
 * dismiss; copy is content-neutral (SR-3). Reuses the Modal idiom from
 * features/directory/DirectoryFilters.
 */

import { BookmarkPlus } from 'lucide-react-native';
import { Modal, Pressable, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useThemeColors } from '@/lib/use-theme-colors';
import { BOOKMARKS_COPY } from './copy';

export interface SignInSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  /** Routes into the existing (auth) flow; the parent resumes the save on success. */
  readonly onSignIn: () => void;
}

export function SignInSheet({ visible, onClose, onSignIn }: SignInSheetProps) {
  const tc = useThemeColors();
  const c = BOOKMARKS_COPY.signin;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        {/* @design-purpose: scrim dimming the screen behind the sign-in sheet; tap to dismiss */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          className="absolute inset-0 bg-black/40"
        />
        <View className="rounded-t-2xl bg-background px-5 pb-8 pt-5 dark:bg-background-dark">
          <View className="items-center gap-3">
            <BookmarkPlus size={32} color={tc.primary} strokeWidth={1.75} />
            <Text variant="h2" className="text-center text-text-primary dark:text-text-primary-dark">
              {c.title}
            </Text>
            <Text variant="body" className="text-center text-text-secondary dark:text-text-secondary-dark">
              {c.body}
            </Text>
          </View>
          <View className="mt-6 gap-2">
            <Button variant="primary" onPress={onSignIn}>
              {c.cta}
            </Button>
            <Button variant="ghost" onPress={onClose}>
              {c.dismiss}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
