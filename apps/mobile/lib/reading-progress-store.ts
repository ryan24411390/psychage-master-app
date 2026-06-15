import { storage } from '@/lib/adapters/storage';

export interface ReadState { 
  progress: number; // progress 0..1
  lastAt: number;
} 

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
  setProgress(id: string, progress: number): void {
    const data = getStoredData();
    data[id] = { progress, lastAt: Date.now() };
    storage.set(STORAGE_KEY, JSON.stringify(data));
  },
  
  getInProgressReads() {
    const reads = getStoredData();
    return Object.entries(reads)
      .filter(([, r]) => r.progress > 0.02 && r.progress < 0.98)
      .sort((a, b) => b[1].lastAt - a[1].lastAt)
      .map(([id, r]) => ({ id, ...r }));
  }
};
