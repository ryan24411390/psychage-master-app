import { describe, expect, it } from 'vitest';

import { resolveItemRoute } from '@/features/toolkits/ref-routing';
import type { ToolkitItem, ToolkitItemKind } from '@/features/toolkits/types';

function item(kind: ToolkitItemKind, ref_id: string): ToolkitItem {
  return { id: 'x', toolkit_id: 't', kind, ref_id, label: 'L', sort_order: 0 };
}

describe('resolveItemRoute', () => {
  it('maps known tool slugs to their mobile routes', () => {
    expect(resolveItemRoute(item('tool', 'tool:mood-journal'))).toBe('/tools/mood-journal');
    expect(resolveItemRoute(item('tool', 'tool:symptom-navigator'))).toBe('/navigator');
    expect(resolveItemRoute(item('tool', 'tool:clarity-score'))).toBe('/tools/clarity');
    expect(resolveItemRoute(item('tool', 'tool:crisis'))).toBe('/crisis');
  });

  it('returns null for unbuilt tools (coming soon)', () => {
    expect(resolveItemRoute(item('tool', 'tool:steady'))).toBeNull();
    expect(resolveItemRoute(item('tool', 'tool:being-there'))).toBeNull();
  });

  it('maps articles to the reader by trailing slug', () => {
    expect(resolveItemRoute(item('article', 'article:anxiety-stress/understanding-anxiety'))).toBe(
      '/article/understanding-anxiety',
    );
    expect(resolveItemRoute(item('article', 'article:plain-slug'))).toBe('/article/plain-slug');
  });

  it('returns null for term and strategy (surfaces not built on mobile)', () => {
    expect(resolveItemRoute(item('term', 'term:rumination'))).toBeNull();
    expect(resolveItemRoute(item('strategy', 'strategy:grounding'))).toBeNull();
  });

  it('returns null for malformed refs', () => {
    expect(resolveItemRoute(item('tool', 'no-colon'))).toBeNull();
    expect(resolveItemRoute(item('tool', 'tool:'))).toBeNull();
  });
});
