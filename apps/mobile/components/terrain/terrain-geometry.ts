import type { DailyState } from '@/lib/daily-rollup';

import { terrainTokens } from '@/lib/a1-tokens';
import { DAILY_STATE_LABELS as STATE_LABELS } from '@/lib/daily-rollup';

// Pure port of the v5 renderTerrain() math, parameterized for row COUNT + WIDTH
// (the order's two parameters; height is fixed to v5's proportions). React-free
// so the positioning + gap-breaking logic is unit-testable under Vitest.
//
// v5 source (verbatim, ~/Downloads/psychage-v5.html lines 678-707):
//   var W=318, TOP=10, BOT=56, BASE=60, LBL=78;
//   function yFor(v){ return BOT - (v/4)*(BOT-TOP); }
//   function xFor(i){ return (i+0.5)/7*W; }
//   ...seg/flush polyline over consecutive numeric entries...
//
// Deviations from v5, governed by the terrain token group (per the order — "map
// literal constants to the terrain token group"):
//  • dot HEIGHTS use terrain.fillByState (12/32/52/74/95), NOT v5's linear v/4.
//  • vertical px (TOP/BOT/BASE/LBL) become fractions of a fixed row height.
//  • no-entry dots sit at the BASELINE via TERRAIN_BASELINE_Y — derived from
//    terrain.geometry.baselineFraction (0.95), the single canonical y source that
//    the baseline line and noteTick lane also key off. terrain.noEntryDot.atFraction
//    now reads 0.95 too (corrected from a copy-pasted 0.5; see the token fix), so the
//    token and the render agree on "baseline"; the code keeps reading baselineFraction
//    because that is what the no-entry dot must sit ON.

export type TerrainValue = DailyState | null | 'today';

export type TerrainDay = {
  /** Visual column label, e.g. "Tu". */
  readonly label: string;
  /** Full day name for VoiceOver, e.g. "Tuesday"; defaults to `label`. */
  readonly fullLabel?: string;
  readonly value: TerrainValue;
};

export type TerrainPoint = { readonly x: number; readonly y: number };

// Chart proportions — the dot area ("row height" the token fractions measure
// against) plus a label band below, summing to v5's 86-unit canvas.
export const TERRAIN_ROW_H = 64;
export const TERRAIN_LABEL_BAND = 22;
export const TERRAIN_HEIGHT = TERRAIN_ROW_H + TERRAIN_LABEL_BAND; // 86

export const TERRAIN_BASELINE_Y = terrainTokens.geometry.baselineFraction * TERRAIN_ROW_H; // 60.8
export const TERRAIN_MIDLINE_Y = terrainTokens.geometry.midlineFraction * TERRAIN_ROW_H; // 32
export const TERRAIN_LABEL_Y = TERRAIN_ROW_H + terrainTokens.label.lineHeight; // 78

// Top inset = the largest dot radius, so the tallest fill (state 4, 95%) clears
// the top edge without clipping (lands ≈ v5's TOP=10).
const TOP_INSET = terrainTokens.todayDot.radius; // 8

export function xFor(index: number, count: number, width: number): number {
  return ((index + 0.5) / count) * width;
}

/** Entry dot center y for a state, from its proportional fill (higher = up). */
export function entryDotY(state: DailyState): number {
  const fill = terrainTokens.fillByState[state] / 100;
  return TERRAIN_BASELINE_Y - fill * (TERRAIN_BASELINE_Y - TOP_INSET);
}

/**
 * Polyline point-runs for the connecting line — built like v5's seg/flush: a run
 * accumulates consecutive numeric entries and is emitted only when it has >1
 * point; any gap (no-entry or today) breaks it, so the line never bridges a gap.
 */
export function connectingSegments(
  days: readonly TerrainDay[],
  width: number,
): TerrainPoint[][] {
  const count = days.length;
  const segments: TerrainPoint[][] = [];
  let run: TerrainPoint[] = [];
  const flush = () => {
    if (run.length > 1) segments.push(run);
    run = [];
  };
  days.forEach((day, i) => {
    if (typeof day.value === 'number') {
      run.push({ x: xFor(i, count, width), y: entryDotY(day.value) });
    } else {
      flush();
    }
  });
  flush();
  return segments;
}

/** Tonally-flat VoiceOver label for a day. */
export function dayA11yLabel(day: TerrainDay): string {
  const full = day.fullLabel ?? day.label;
  if (day.value === 'today') return 'Today: not yet.';
  if (day.value === null) return `${full}: no entry.`;
  return `${full}: ${STATE_LABELS[day.value]}.`;
}
