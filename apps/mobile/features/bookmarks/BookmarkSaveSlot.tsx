/**
 * Reusable detail-screen mount point: a single SaveButton.
 *
 * Each detail surface (T-007 article, T-008 provider, T-009 tool) mounts one
 * element. Local-first (P13): saving works fully signed-out and persists on the
 * device, so there is no sign-in sheet, no pending-save, and no auth-resume — the
 * tap toggles the save immediately. Kept as a thin wrapper so call sites stay
 * unchanged.
 */

import { SaveButton } from './SaveButton';
import type { ResourceType } from './types';

export interface BookmarkSaveSlotProps {
  readonly resourceType: ResourceType;
  readonly resourceId: string;
  readonly testID?: string;
}

export function BookmarkSaveSlot({ resourceType, resourceId, testID }: BookmarkSaveSlotProps) {
  return <SaveButton resourceType={resourceType} resourceId={resourceId} testID={testID} />;
}
