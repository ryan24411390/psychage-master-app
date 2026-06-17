import { momentsToDailyEntries } from './apps/mobile/lib/daily-rollup.ts';
import { buildTerrainDaysFromEntries } from './apps/mobile/lib/home-model.ts';

const moments = [
  { timestamp: new Date().toISOString(), valence: 4, labels: [], context: [] }
];
const entries = momentsToDailyEntries(moments as any);
console.log('Entries:', entries);
const terrain = buildTerrainDaysFromEntries(entries, new Date(), 14);
console.log('Terrain:', terrain.filter(t => t.value !== null));
