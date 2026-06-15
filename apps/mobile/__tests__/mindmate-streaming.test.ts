import { describe, expect, it } from 'vitest';

import { parseSSEStream, type StreamEvent } from '@/features/mindmate/streaming';

// Build a ReadableStream<Uint8Array> from raw string chunks (node 18+ globals).
function streamFrom(chunks: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  let i = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (i < chunks.length) controller.enqueue(enc.encode(chunks[i++]));
      else controller.close();
    },
  });
}

async function collect(stream: ReadableStream<Uint8Array>): Promise<StreamEvent[]> {
  const out: StreamEvent[] = [];
  for await (const ev of parseSSEStream(stream)) out.push(ev);
  return out;
}

const sse = (e: unknown) => `data: ${JSON.stringify(e)}\n\n`;

describe('parseSSEStream (SSE decoder)', () => {
  it('decodes a full token stream in order', async () => {
    const events = await collect(
      streamFrom([
        sse({ type: 'metadata', sessionId: 's1' }),
        sse({ type: 'safety', level: 'SAFE' }),
        sse({ type: 'token', content: 'Hello ' }),
        sse({ type: 'token', content: 'there' }),
        sse({ type: 'done', responseTimeMs: 12 }),
      ]),
    );
    expect(events.map((e) => e.type)).toEqual(['metadata', 'safety', 'token', 'token', 'done']);
    const text = events
      .filter((e): e is Extract<StreamEvent, { type: 'token' }> => e.type === 'token')
      .map((e) => e.content)
      .join('');
    expect(text).toBe('Hello there');
  });

  it('reassembles a record split across chunk boundaries', async () => {
    const events = await collect(
      streamFrom(['data: {"type":"to', 'ken","content":"Hi"}\n\n', sse({ type: 'done' })]),
    );
    expect(events).toEqual([
      { type: 'token', content: 'Hi' },
      { type: 'done' },
    ]);
  });

  it('skips malformed JSON and the [DONE] sentinel without throwing', async () => {
    const events = await collect(
      streamFrom([
        'data: not-json\n\n',
        'data: [DONE]\n\n',
        sse({ type: 'token', content: 'ok' }),
      ]),
    );
    expect(events).toEqual([{ type: 'token', content: 'ok' }]);
  });
});
