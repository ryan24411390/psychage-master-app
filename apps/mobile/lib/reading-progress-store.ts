import { storage } from '@/lib/adapters/storage';

export interface ReadState {
  progress: number; // progress 0..1
  lastAt: number;
  // Optional display metadata captured from the real reader so the Today
  // "Pick up where you left off" rail can render real titles without a refetch.
  // Optional + tolerant-parse keeps this backward-compatible with rows written
  // before these fields existed (CLAUDE.md §13 — additive, no migration needed).
  title?: string;
  readTime?: number; // minutes
}

export type ReadMeta = Pick<ReadState, 'title' | 'readTime'>;

const STORAGE_KEY = 'psychage:reads';

function getStoredData(): Record<string, ReadState> {
  const raw = storage.get(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  return {};
}

export const readingProgressStore = {
  setProgress(id: string, progress: number, meta?: ReadMeta): void {
    const data = getStoredData();
    const prev = data[id];
    data[id] = {
      progress,
      lastAt: Date.now(),
      // Preserve prior metadata when this write doesn't carry it.
      title: meta?.title ?? prev?.title,
      readTime: meta?.readTime ?? prev?.readTime,
    };
    storage.set(STORAGE_KEY, JSON.stringify(data));
  },

  getInProgressReads() {
    const reads = getStoredData();
    return Object.entries(reads)
      .filter(([, r]) => r.progress > 0.02 && r.progress < 0.98)
      .sort((a, b) => b[1].lastAt - a[1].lastAt)
      .map(([id, r]) => ({ id, ...r }));
  },
};
