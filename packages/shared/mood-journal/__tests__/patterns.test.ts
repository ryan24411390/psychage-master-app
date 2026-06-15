// Mood Journal pattern aggregation — pure, deterministic. Frequency counting,
// timeline grouping, and the DESCRIPTIVE trigger↔check-in co-occurrence (counts
// only, no causal/score output — SR-1).

import { describe, expect, it } from 'vitest';

import { asLocalCalendarDate } from '../../check-in/dates';
import type { CheckInEntry, CheckInState } from '../../check-in/types';
import {
  emotionFrequency,
  timeline,
  triggerFrequency,
  triggerMoodCoOccurrence,
} from '../patterns';
import type { MomentEntry } from '../types';

const d = (s: string) => asLocalCalendarDate(s);

let seq = 0;
function moment(over: Partial<MomentEntry> = {}): MomentEntry {
  seq += 1;
  return {
    id: `m-${seq}`,
    date: d('2026-06-16'),
    createdAt: `2026-06-16T0${(seq % 9) + 1}:00:00.000Z`,
    emotions: ['Calm'],
    triggers: ['Work'],
    ...over,
  };
}

function checkIn(date: string, state: CheckInState): CheckInEntry {
  return { id: `c-${date}`, date: d(date), state };
}

describe('emotionFrequency / triggerFrequency', () => {
  it('counts moments containing each tag, most-noted first', () => {
    const moments = [
      moment({ emotions: ['Calm', 'Happy'], triggers: ['Work'] }),
      moment({ emotions: ['Calm'], triggers: ['Work', 'Sleep'] }),
      moment({ emotions: ['Sad'], triggers: ['Work'] }),
    ];
    expect(emotionFrequency(moments)).toEqual([
      { tag: 'Calm', count: 2 },
      { tag: 'Happy', count: 1 },
      { tag: 'Sad', count: 1 },
    ]);
    expect(triggerFrequency(moments)).toEqual([
      { tag: 'Work', count: 3 },
      { tag: 'Sleep', count: 1 },
    ]);
  });

  it('counts a tag once per moment even if duplicated within it', () => {
    expect(emotionFrequency([moment({ emotions: ['Calm', 'Calm'] })])).toEqual([{ tag: 'Calm', count: 1 }]);
  });

  it('breaks count ties by preset vocabulary order (Happy before Sad)', () => {
    const moments = [moment({ emotions: ['Sad'] }), moment({ emotions: ['Happy'] })];
    expect(emotionFrequency(moments).map((c) => c.tag)).toEqual(['Happy', 'Sad']);
  });

  it('returns [] for no moments', () => {
    expect(emotionFrequency([])).toEqual([]);
    expect(triggerFrequency([])).toEqual([]);
  });
});

describe('timeline', () => {
  it('groups by day, newest day first, newest-within-day first', () => {
    const moments = [
      moment({ id: 'a', date: d('2026-06-14'), createdAt: '2026-06-14T09:00:00.000Z' }),
      moment({ id: 'b', date: d('2026-06-16'), createdAt: '2026-06-16T08:00:00.000Z' }),
      moment({ id: 'c', date: d('2026-06-16'), createdAt: '2026-06-16T20:00:00.000Z' }),
    ];
    const groups = timeline(moments);
    expect(groups.map((g) => g.date)).toEqual(['2026-06-16', '2026-06-14']);
    expect(groups[0]?.moments.map((m) => m.id)).toEqual(['c', 'b']); // newest within day first
  });

  it('returns [] for no moments', () => {
    expect(timeline([])).toEqual([]);
  });
});

describe('triggerMoodCoOccurrence', () => {
  it('reports the descriptive state distribution per trigger on days it was noted', () => {
    const moments = [
      moment({ date: d('2026-06-14'), triggers: ['Work'] }),
      moment({ date: d('2026-06-15'), triggers: ['Work'] }),
      moment({ date: d('2026-06-16'), triggers: ['Sleep'] }),
    ];
    const checkIns = [checkIn('2026-06-14', 1), checkIn('2026-06-15', 1), checkIn('2026-06-16', 3)];
    const result = triggerMoodCoOccurrence(moments, checkIns);

    const work = result.find((r) => r.trigger === 'Work');
    expect(work?.daysNoted).toBe(2);
    expect(work?.stateCounts).toEqual({ 0: 0, 1: 2, 2: 0, 3: 0, 4: 0 });

    const sleep = result.find((r) => r.trigger === 'Sleep');
    expect(sleep?.daysNoted).toBe(1);
    expect(sleep?.stateCounts[3]).toBe(1);

    // most-co-occurring trigger first
    expect(result[0]?.trigger).toBe('Work');
  });

  it('counts a DAY once even when a trigger is noted in multiple moments that day', () => {
    const moments = [
      moment({ date: d('2026-06-16'), triggers: ['Work'] }),
      moment({ date: d('2026-06-16'), triggers: ['Work'] }),
    ];
    const result = triggerMoodCoOccurrence(moments, [checkIn('2026-06-16', 2)]);
    expect(result[0]?.daysNoted).toBe(1);
    expect(result[0]?.stateCounts[2]).toBe(1);
  });

  it('surfaces a trigger noted only on days without a check-in as daysNoted:0', () => {
    const moments = [moment({ date: d('2026-06-16'), triggers: ['News'] })];
    const result = triggerMoodCoOccurrence(moments, []); // no check-ins
    expect(result).toEqual([{ trigger: 'News', stateCounts: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 }, daysNoted: 0 }]);
  });

  it('returns [] for no moments', () => {
    expect(triggerMoodCoOccurrence([], [checkIn('2026-06-16', 2)])).toEqual([]);
  });
});
