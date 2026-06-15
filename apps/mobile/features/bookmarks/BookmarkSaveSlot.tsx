/**
 * Reusable detail-screen mount point: SaveButton + SignInSheet + AC-5.3 resume.
 *
 * Composes T-004 (SaveButton) and T-005 (SignInSheet) so each detail surface
 * (T-007 article, T-008 provider, T-009 tool) mounts a single element. An
 * anonymous tap opens the sheet and arms a pending-save; on return from the
 * (auth) flow the uid query is refreshed on focus and the original save
 * auto-completes (AC-5.3). Save failure is non-blocking (no toast infra yet —
 * the optimistic path reverts; copy in BOOKMARKS_COPY.error.save awaits a toast).
 */

import { useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { trackBookmarkAdded } from './analytics';
import { useCurrentUserId } from './hooks';
import { SaveButton } from './SaveButton';
import { addBookmark } from './service';
import { SignInSheet } from './SignInSheet';
import type { ResourceType } from './types';

export interface BookmarkSaveSlotProps {
  readonly resourceType: ResourceType;
  readonly resourceId: string;
  readonly testID?: string;
}

export function BookmarkSaveSlot({ resourceType, resourceId, testID }: BookmarkSaveSlotProps) {
  const [sheetVisible, setSheetVisible] = useState(false);
  const pending = useRef(false);
  const qc = useQueryClient();
  const { data: userId } = useCurrentUserId();

  // On focus (e.g. returning from the (auth) flow), refresh the uid so a just-
  // completed sign-in is observed and the armed save can resume.
  useFocusEffect(
    useCallback(() => {
      if (pending.current) qc.invalidateQueries({ queryKey: ['auth', 'uid'] });
    }, [qc]),
  );

  // AC-5.3: once signed in with an armed intent, complete the original save once.
  useEffect(() => {
    if (!userId || !pending.current) return;
    pending.current = false;
    void addBookmark({ resource_type: resourceType, resource_id: resourceId })
      .then(() => {
        trackBookmarkAdded();
        qc.invalidateQueries({ queryKey: ['bookmarks', userId] });
      })
      .catch(() => {
        // Non-blocking: the user can tap save again now that they're signed in.
      });
  }, [userId, resourceType, resourceId, qc]);

  return (
    <>
      <SaveButton
        resourceType={resourceType}
        resourceId={resourceId}
        testID={testID}
        onRequestSignIn={() => {
          pending.current = true;
          setSheetVisible(true);
        }}
      />
      <SignInSheet
        visible={sheetVisible}
        onClose={() => {
          pending.current = false;
          setSheetVisible(false);
        }}
        onSignIn={() => {
          setSheetVisible(false);
          router.push('/(auth)/sign-up');
        }}
      />
    </>
  );
}
