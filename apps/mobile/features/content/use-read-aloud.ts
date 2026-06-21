// Full-article read-aloud controller (P21) — drives expo-speech through an ordered
// segment list with play / pause / resume / stop.
//
// We own the queue (one Speech.speak per segment, advancing on onDone) rather than
// leaning on expo-speech's internal queue, so pause/resume works the same on iOS and
// Android (Android has no native TTS pause): pause = stop + remember the index;
// resume = re-speak from that index. Speech is stopped on unmount so audio never
// outlives the reader.

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Speech from 'expo-speech';

export type ReadAloudStatus = 'idle' | 'playing' | 'paused';

export interface ReadAloud {
  readonly status: ReadAloudStatus;
  readonly hasContent: boolean;
  readonly play: () => void;
  readonly pause: () => void;
  readonly stop: () => void;
}

export function useReadAloud(segments: readonly string[]): ReadAloud {
  const [status, setStatus] = useState<ReadAloudStatus>('idle');

  // Refs so the onDone closure always sees current values (no stale captures).
  const segmentsRef = useRef<readonly string[]>(segments);
  const indexRef = useRef(0);
  const statusRef = useRef<ReadAloudStatus>('idle');

  segmentsRef.current = segments;
  const setRunState = useCallback((next: ReadAloudStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const speakFrom = useCallback(
    (i: number) => {
      const segs = segmentsRef.current;
      if (i >= segs.length) {
        indexRef.current = 0;
        setRunState('idle');
        return;
      }
      indexRef.current = i;
      Speech.speak(segs[i] as string, {
        onDone: () => {
          // Ignore the onDone that a pause/stop's Speech.stop() may trigger.
          if (statusRef.current !== 'playing') return;
          speakFrom(indexRef.current + 1);
        },
        onError: () => {
          indexRef.current = 0;
          setRunState('idle');
        },
      });
    },
    [setRunState],
  );

  const play = useCallback(() => {
    if (segmentsRef.current.length === 0) return;
    if (statusRef.current === 'playing') return;
    setRunState('playing');
    speakFrom(indexRef.current); // 0 from idle, or the paused spot on resume
  }, [setRunState, speakFrom]);

  const pause = useCallback(() => {
    if (statusRef.current !== 'playing') return;
    setRunState('paused');
    Speech.stop(); // resume re-speaks segments[indexRef.current]
  }, [setRunState]);

  const stop = useCallback(() => {
    indexRef.current = 0;
    setRunState('idle');
    Speech.stop();
  }, [setRunState]);

  // Stop audio if the reader unmounts mid-playback.
  useEffect(() => () => void Speech.stop(), []);

  return { status, hasContent: segments.length > 0, play, pause, stop };
}
