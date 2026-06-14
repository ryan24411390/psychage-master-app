// SSE codec for the MindMate stream. Ported from
// psychage-v2/src/lib/ai/streaming.ts — the SERVER is the encoder, this is the
// client decoder, so the framing (`data: {json}\n\n`) must match byte-for-byte.
//
// Adapted for the mobile client: the body comes from `expo/fetch` (Expo SDK 54),
// whose Response.body is a WHATWG `ReadableStream<Uint8Array>` — the same shape
// the web parser consumes. Pure + dependency-free, so it runs under Vitest
// (node env) with a hand-built ReadableStream.

import type { Citation, SafetyLevel } from './types';

export interface MetadataEvent {
  type: 'metadata';
  sessionId: string;
  conversationId?: string;
}

export interface SafetyEvent {
  type: 'safety';
  level: SafetyLevel;
}

export interface TokenEvent {
  type: 'token';
  content: string;
}

export interface CitationsEvent {
  type: 'citations';
  citations: { document_id: string; title: string; url_path: string }[];
}

export interface DoneEvent {
  type: 'done';
  responseTimeMs?: number;
  timeToFirstTokenMs?: number;
}

export interface StreamErrorEvent {
  type: 'error';
  message: string;
  code?: 'SAFETY_VIOLATION' | 'LLM_ERROR' | 'TIMEOUT' | 'RATE_LIMIT' | 'INTERNAL';
}

export type StreamEvent =
  | MetadataEvent
  | SafetyEvent
  | TokenEvent
  | CitationsEvent
  | DoneEvent
  | StreamErrorEvent;

/** Map a wire citation to our render shape. */
export function mapCitation(c: { document_id: string; title: string; url_path: string }): Citation {
  return { id: c.document_id, title: c.title, url: c.url_path };
}

/** Pull `data: {json}` lines out of one SSE record, yielding parsed events. */
function* parseRecord(record: string): Generator<StreamEvent> {
  for (const line of record.split('\n')) {
    if (!line.startsWith('data: ')) continue;
    const jsonStr = line.slice(6).trim();
    if (!jsonStr || jsonStr === '[DONE]') continue;
    try {
      yield JSON.parse(jsonStr) as StreamEvent;
    } catch {
      // Skip malformed JSON — never throw mid-stream.
    }
  }
}

/**
 * Decode a `ReadableStream<Uint8Array>` of SSE bytes into typed events. Records
 * are delimited by a blank line (`\n\n`); a trailing partial record is held in
 * the buffer until the next chunk completes it, then flushed at end-of-stream.
 */
export async function* parseSSEStream(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<StreamEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        yield* parseRecord(part);
      }
    }

    if (buffer.trim()) {
      yield* parseRecord(buffer);
    }
  } finally {
    reader.releaseLock();
  }
}
