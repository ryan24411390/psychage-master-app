import { ClarityJournalStore } from '@psychage/shared/clarity-journal';
import { MomentStore, type Storage } from '@psychage/shared/engagement';
import { describe, expect, it } from 'vitest';

import { dailyRollupReader, type DailyEntry } from '@/lib/daily-rollup';
import {
  buildDailyRecap,
  type EnergyPoint,
  energyInsightLine,
  energySeries,
  presenceWindow,
  weeklyCheckInCount,
  weeklyRecapLine,
} from '@/features/insights/daily-recap';

// Pure recap aggregation + a round-trip of the EXISTING check-in (Moments) and energy
// (Clarity Journal) records through this read model. Vitest only — no RN, no network.

const TODAY = new Date(2026, 5, 17); // 2026-06-17, local
const entry = (date: string, state: 0 | 1 | 2 | 3 | 4 = 2): DailyEntry => ({
  id: date,
  date,
  state,
  low: state,
  high: state,
  count: 1,
});

function memStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get: (k) => m.get(k) ?? null,
    set: (k, v) => {
      m.set(k, v);
    },
    remove: (k) => {
      m.delete(k);
    },
  };
}

describe('presenceWindow', () => {
  it('returns the last 14 days oldest→newest with today flagged', () => {
    const out = presenceWindow([], TODAY);
    expect(out).toHaveLength(14);
    expect(out[0]?.date).toBe('2026-06-04');
    expect(out[13]?.date).toBe('2026-06-17');
    expect(out[13]?.isToday).toBe(true);
    expect(out.every((d) => d.present === false)).toBe(true);
  });

  it('flags only days that have a check-in (presence, not intensity)', () => {
    const out = presenceWindow([entry('2026-06-17'), entry('2026-06-15'), entry('2026-06-10')], TODAY);
    const present = out.filter((d) => d.present).map((d) => d.date);
    expect(present).toEqual(['2026-06-10', '2026-06-15', '2026-06-17']);
  });

  it('does not vary by the day state (no mood-intensity leak)', () => {
    const low = presenceWindow([entry('2026-06-17', 0)], TODAY);
    const high = presenceWindow([entry('2026-06-17', 4)], TODAY);
    expect(low).toEqual(high);
  });
});

describe('weeklyCheckInCount / weeklyRecapLine', () => {
  it('counts distinct check-in days within the last 7 days inclusive of today', () => {
    const checkins = [entry('2026-06-17'), entry('2026-06-15'), entry('2026-06-10')];
    expect(weeklyCheckInCount(checkins, TODAY)).toBe(2); // 06-10 falls outside the 7-day window
  });

  it('phrases the recap factually', () => {
    const checkins = [entry('2026-06-17'), entry('2026-06-15')];
    expect(weeklyRecapLine(checkins, TODAY)).toBe('You checked in 2 of 7 days this week.');
  });

  it('uses a gentle empty line when nothing was recorded this week', () => {
    expect(weeklyRecapLine([], TODAY)).toBe('No check-ins recorded this week yet.');
  });
});

describe('energySeries', () => {
  it('sorts oldest→newest and maps to trend points', () => {
    const energy: EnergyPoint[] = [
      { date: '2026-06-16', energy: 8 },
      { date: '2026-06-14', energy: 5 },
    ];
    expect(energySeries(energy)).toEqual([
      { x: '2026-06-14', y: 5 },
      { x: '2026-06-16', y: 8 },
    ]);
  });

  it('is empty when no energy is logged', () => {
    expect(energySeries([])).toEqual([]);
  });
});

describe('energyInsightLine', () => {
  it('invites entry when empty (no clinical claim)', () => {
    expect(energyInsightLine([])).toBe('No energy logged yet — it appears here once you add it.');
  });
  it('pluralizes the day count', () => {
    expect(energyInsightLine([{ date: '2026-06-16', energy: 6 }])).toBe('Energy logged on 1 day so far.');
    expect(
      energyInsightLine([
        { date: '2026-06-16', energy: 6 },
        { date: '2026-06-15', energy: 7 },
      ]),
    ).toBe('Energy logged on 2 days so far.');
  });
});

describe('buildDailyRecap', () => {
  it('assembles presence + recap + energy and reports data presence', () => {
    const recap = buildDailyRecap(
      { checkins: [entry('2026-06-17'), entry('2026-06-16')], energy: [{ date: '2026-06-16', energy: 7 }] },
      TODAY,
    );
    expect(recap.hasAnyData).toBe(true);
    expect(recap.weeklyRecap).toBe('You checked in 2 of 7 days this week.');
    expect(recap.energySeries).toEqual([{ x: '2026-06-16', y: 7 }]);
    expect(recap.presence.filter((d) => d.present).map((d) => d.date)).toEqual(['2026-06-16', '2026-06-17']);
  });

  it('hasAnyData is false for an empty model', () => {
    expect(buildDailyRecap({ checkins: [], energy: [] }, TODAY).hasAnyData).toBe(false);
  });
});

describe('round-trip: existing check-in (Moments) → dailyRollup → recap', () => {
  it('reads real Moment records through the unified model into presence', () => {
    let clock = new Date(2026, 5, 15, 12, 0, 0);
    let n = 0;
    const store = new MomentStore({ storage: memStorage(), now: () => clock, generateId: () => `m${n++}` });
    store.append({ labelPrimary: 'steady' });
    clock = new Date(2026, 5, 17, 12, 0, 0);
    store.append({ labelPrimary: 'calm' });

    const checkins = dailyRollupReader(store).getRecent(30);
    const recap = buildDailyRecap({ checkins, energy: [] }, TODAY);
    expect(recap.presence.filter((d) => d.present).map((d) => d.date)).toEqual(['2026-06-15', '2026-06-17']);
    expect(recap.weeklyRecap).toBe('You checked in 2 of 7 days this week.');
  });
});

describe('round-trip: clarity-journal energy persists + migrates without data loss (SR-13)', () => {
  it('reloads a versioned envelope from storage with energy intact', () => {
    const mem = memStorage();
    let clock = new Date(2026, 5, 15, 12, 0, 0);
    let n = 0;
    const writer = new ClarityJournalStore({ storage: mem, now: () => clock, generateId: () => `c${n++}` });
    writer.saveDailyCheckIn({ mood: 5, energy: 7, sleptLastNight: true, tags: [] });
    clock = new Date(2026, 5, 17, 12, 0, 0);
    writer.saveDailyCheckIn({ mood: 6, energy: 4, sleptLastNight: true, tags: [] });

    // The persisted envelope is versioned (Sacred Rule 13).
    const raw = JSON.parse(mem.get('mobile:clarity-journal') ?? '{}');
    expect(raw.version).toBe(1);
    expect(raw.dailyCheckIns).toHaveLength(2);

    // A fresh store over the SAME storage runs the load+migrate path; energy survives.
    const reloaded = new ClarityJournalStore({ storage: mem, now: () => clock, generateId: () => `c${n++}` });
    const energy = reloaded.getRecentDailyCheckIns(10).map((e) => ({ date: e.date as string, energy: e.energy }));
    expect(energy).toEqual([
      { date: '2026-06-17', energy: 4 },
      { date: '2026-06-15', energy: 7 },
    ]);
    // And it flows through the recap model as a trend (oldest→newest).
    expect(energySeries(energy)).toEqual([
      { x: '2026-06-15', y: 7 },
      { x: '2026-06-17', y: 4 },
    ]);
  });
});
