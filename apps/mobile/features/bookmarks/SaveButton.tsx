/**
 * S-1 Save control (T-004). 44pt circular toggle attached to detail-screen chrome.
 *
 * Saved = filled Bookmark (primary); unsaved = outline BookmarkPlus (secondary).
 * Save = spring-pop scale + medium haptic (the feature's one signature moment);
 * unsave = light haptic. Anonymous tap → onRequestSignIn (parent shows S-2).
 * Reduce-Motion → instant fill; Reduce-Haptics handled inside useHaptics.
 */

import { Bookmark, BookmarkPlus } from 'lucide-react-native';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useHaptics } from '@/lib/haptic-context';
import { DURATION, easingFn, useReducedMotion } from '@/lib/motion';
import { useThemeColors } from '@/lib/use-theme-colors';
import { BOOKMARKS_COPY } from './copy';
import { useBookmarkedIds, useCurrentUserId, useToggleBookmark } from './hooks';
import type { ResourceType } from './types';

const SAVE_LABEL: Record<ResourceType, string> = {
  article: BOOKMARKS_COPY.save.article,
  video: BOOKMARKS_COPY.save.article,
  provider: BOOKMARKS_COPY.save.provider,
  tool: BOOKMARKS_COPY.save.tool,
};

export interface SaveButtonProps {
  readonly resourceType: ResourceType;
  readonly resourceId: string;
  /** Called when an anonymous user taps save — parent presents the sign-in sheet (S-2). */
  readonly onRequestSignIn?: () => void;
  readonly testID?: string;
}

export function SaveButton({ resourceType, resourceId, onRequestSignIn, testID }: SaveButtonProps) {
  const tc = useThemeColors();
  const reduced = useReducedMotion();
  const { fireHaptic } = useHaptics();
  const { data: userId } = useCurrentUserId();
  const { data: savedIds } = useBookmarkedIds(resourceType);
  const toggle = useToggleBookmark();

  const isSaved = savedIds?.has(resourceId) ?? false;
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const onPress = () => {
    if (!userId) {
      onRequestSignIn?.();
      return;
    }
    if (isSaved) {
      fireHaptic('affirm');
    } else {
      fireHaptic('confirm');
      if (!reduced) {
        scale.value = withSequence(
          withTiming(1.15, { duration: DURATION.swift, easing: easingFn('out') }),
          withTiming(1, { duration: DURATION.base, easing: easingFn('out') }),
        );
      }
    }
    toggle.mutate({ ref: { resource_type: resourceType, resource_id: resourceId }, wasSaved: isSaved });
  };

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected: isSaved }}
      accessibilityLabel={isSaved ? BOOKMARKS_COPY.saved.aria : SAVE_LABEL[resourceType]}
      onPress={onPress}
      hitSlop={8}
      className="h-11 w-11 items-center justify-center rounded-full"
    >
      <Animated.View style={animatedStyle}>
        {isSaved ? (
          <Bookmark size={22} color={tc.primary} fill={tc.primary} strokeWidth={1.75} />
        ) : (
          <BookmarkPlus size={22} color={tc.inkSecondary} strokeWidth={1.75} />
        )}
      </Animated.View>
    </Pressable>
  );
}
