// Local id factory for the check-in RecordStore's IdFactory seam. A crypto UUID is
// overkill for device-local, low-volume check-in ids (≈one per day) and would add a
// dependency; this combines a base36 timestamp, an in-session counter, and a random
// suffix so ids stay unique even within the same millisecond. If global uniqueness
// is ever needed (sync — SR-4 gated/deferred), swap in expo-crypto's randomUUID.
let counter = 0;

export function generateId(): string {
  counter = (counter + 1) % 0xffffff;
  const time = Date.now().toString(36);
  const rand = Math.floor(Math.random() * 0xffffff).toString(36);
  return `cie_${time}_${counter.toString(36)}_${rand}`;
}
