import { HomeContainer } from '@/components/home/HomeContainer';
import { getCheckInStore } from '@/lib/check-in-store';

// S3 "Today" home. Thin route wrapper: binds the real (MMKV-backed) CheckInRecordStore
// to the stateful HomeContainer. The container + its model derivation are render-tested
// with an in-memory store double; this wiring is covered by typecheck + Vitest's store
// integration test. Importing the shared package at runtime keeps this file off the Jest
// path (Jest does not transform the workspace TS package — see check-in-store.ts).
export default function TodayScreen() {
  return <HomeContainer store={getCheckInStore()} />;
}
