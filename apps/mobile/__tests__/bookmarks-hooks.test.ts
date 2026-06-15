import { describe, expect, it } from 'vitest';
import { toggleIds } from '@/features/bookmarks/hooks';

/**
 * The optimistic add/remove math + revert-safety. The hook's onMutate applies
 * toggleIds to the cached id-set and onError restores the prior set, so the
 * transform must never mutate its input (or revert would restore a flipped set).
 */
describe('toggleIds — optimistic transform (T-002)', () => {
  it('adds the id when it was not saved', () => {
    expect(toggleIds(new Set(['a']), 'b', false)).toEqual(new Set(['a', 'b']));
  });

  it('removes the id when it was saved', () => {
    expect(toggleIds(new Set(['a', 'b']), 'b', true)).toEqual(new Set(['a']));
  });

  it('does not mutate the input set (so onError can restore the original)', () => {
    const prev = new Set(['a']);
    toggleIds(prev, 'b', false);
    expect(prev).toEqual(new Set(['a']));
  });

  it('add then toggle-back yields the original set', () => {
    const prev = new Set(['a']);
    const added = toggleIds(prev, 'b', false);
    expect(toggleIds(added, 'b', true)).toEqual(prev);
  });
});
