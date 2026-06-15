import { storage } from '@/lib/adapters/storage';

export type ToolId = 'toolkit' | 'navigator' | 'mindmate' | 'clarity' | 'breathing';

export interface Tool {
  id: ToolId;
  name: string;
  title: string;
  route: string;
  reEngage?: boolean;        // eligible to be surfaced when dormant
  thresholdDays?: number;    // how long counts as "a long time"
}

export const TOOLS: Record<ToolId, Tool> = {
  toolkit:   { id: 'toolkit',   name: 'Toolkit',           title: 'Steady yourself right now', route: '/tool/toolkit' },
  navigator: { id: 'navigator', name: 'Symptom Navigator', title: 'Make sense of what you feel', route: '/tool/navigator', reEngage: true, thresholdDays: 21 },
  mindmate:  { id: 'mindmate',  name: 'MindMate',          title: 'Talk it through', route: '/tool/mindmate' },
  clarity:   { id: 'clarity',   name: 'Clarity Score',     title: 'Understand how you’re doing', route: '/tool/clarity', reEngage: true, thresholdDays: 14 },
  breathing: { id: 'breathing', name: 'Breathing',         title: 'One minute to settle', route: '/tool/breathing' },
};

const STORAGE_KEY = 'psychage:tool_usage';

interface ToolUsageData {
  installedAt: number;
  usage: Partial<Record<ToolId, number>>;
}

function getStoredData(): ToolUsageData {
  const raw = storage.get(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  const newData: ToolUsageData = { installedAt: Date.now(), usage: {} };
  storage.set(STORAGE_KEY, JSON.stringify(newData));
  return newData;
}

export const toolUsageStore = {
  recordUse(id: ToolId): void {
    const data = getStoredData();
    data.usage[id] = Date.now();
    storage.set(STORAGE_KEY, JSON.stringify(data));
  },
  
  getUsage(): ToolUsageData {
    return getStoredData();
  }
};
