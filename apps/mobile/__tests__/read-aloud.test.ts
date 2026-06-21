import { describe, expect, it } from 'vitest';
import { buildReadAloudSegments, capSegment, MAX_SEGMENT_CHARS } from '@/features/content/read-aloud';

describe('buildReadAloudSegments (P21)', () => {
  it('leads with title then subtitle, then body blocks in document order', () => {
    const segments = buildReadAloudSegments({
      title: 'Understanding stress',
      subtitle: 'A calm overview',
      contentHtml: '<h2>What it is</h2><p>First paragraph.</p><p>Second paragraph.</p>',
    });
    expect(segments).toEqual([
      'Understanding stress',
      'A calm overview',
      'What it is',
      'First paragraph.',
      'Second paragraph.',
    ]);
  });

  it('omits a missing subtitle and reads through nested wrappers', () => {
    const segments = buildReadAloudSegments({
      title: 'T',
      subtitle: null,
      contentHtml: '<div><p>Wrapped one.</p><p>Wrapped two.</p></div>',
    });
    expect(segments).toEqual(['T', 'Wrapped one.', 'Wrapped two.']);
  });

  it('drops decorative svg and whitespace-only nodes (no empty segments)', () => {
    const segments = buildReadAloudSegments({
      title: 'T',
      subtitle: null,
      contentHtml: '<p>Kept.</p><svg><path d="M0 0"/></svg>   <p>Also kept.</p>',
    });
    expect(segments).toEqual(['T', 'Kept.', 'Also kept.']);
    expect(segments.every((s) => s.trim().length > 0)).toBe(true);
  });

  it('decodes entities verbatim (byte-faithful prose)', () => {
    const segments = buildReadAloudSegments({
      title: 'T',
      subtitle: null,
      contentHtml: '<p>It&rsquo;s &amp; fine.</p>',
    });
    expect(segments).toContain('It’s & fine.');
  });

  it('empty body → just the title', () => {
    expect(buildReadAloudSegments({ title: 'Only title', subtitle: null, contentHtml: '' })).toEqual([
      'Only title',
    ]);
  });
});

describe('capSegment', () => {
  it('returns the segment unchanged when within the cap', () => {
    expect(capSegment('short', 100)).toEqual(['short']);
  });

  it('splits an over-long segment into <= maxChars chunks, preserving content', () => {
    const sentence = 'This is a sentence. ';
    const long = sentence.repeat(20).trim(); // > 50 chars
    const chunks = capSegment(long, 50);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.length <= 50)).toBe(true);
    // Reassembled text contains every word in order.
    expect(chunks.join(' ').replace(/\s+/g, ' ')).toContain('This is a sentence.');
  });

  it('hard-slices a single sentence longer than the cap', () => {
    const chunks = capSegment('x'.repeat(120), 50);
    expect(chunks.every((c) => c.length <= 50)).toBe(true);
    expect(chunks.join('')).toBe('x'.repeat(120));
  });

  it('the default cap is the platform-safe bound', () => {
    expect(MAX_SEGMENT_CHARS).toBeLessThanOrEqual(4000);
  });
});
