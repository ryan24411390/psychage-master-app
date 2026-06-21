import { act, renderHook } from '@testing-library/react-native';
import * as Speech from 'expo-speech';
import { useReadAloud } from '@/features/content/use-read-aloud';

jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn() }));

const speak = Speech.speak as unknown as jest.Mock;
const stop = Speech.stop as unknown as jest.Mock;

/** Fire the onDone of the most recent speak() call (simulates an utterance finishing). */
function finishCurrentUtterance() {
  const lastCall = speak.mock.calls.at(-1);
  act(() => lastCall?.[1]?.onDone?.());
}

describe('useReadAloud (P21)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('plays segments in order, advancing on each onDone, then returns to idle', () => {
    const { result } = renderHook(() => useReadAloud(['one', 'two']));

    act(() => result.current.play());
    expect(result.current.status).toBe('playing');
    expect(speak).toHaveBeenLastCalledWith('one', expect.any(Object));

    finishCurrentUtterance();
    expect(speak).toHaveBeenLastCalledWith('two', expect.any(Object));

    finishCurrentUtterance(); // past the last segment
    expect(result.current.status).toBe('idle');
  });

  it('pause stops speech and a stray onDone does not advance', () => {
    const { result } = renderHook(() => useReadAloud(['one', 'two']));
    act(() => result.current.play());

    act(() => result.current.pause());
    expect(result.current.status).toBe('paused');
    expect(stop).toHaveBeenCalled();

    const callsBefore = speak.mock.calls.length;
    finishCurrentUtterance(); // the stop()-triggered onDone must be ignored
    expect(speak.mock.calls.length).toBe(callsBefore);
  });

  it('resume re-speaks the current segment from the paused spot', () => {
    const { result } = renderHook(() => useReadAloud(['one', 'two']));
    act(() => result.current.play());
    act(() => result.current.pause());

    act(() => result.current.play());
    expect(result.current.status).toBe('playing');
    expect(speak).toHaveBeenLastCalledWith('one', expect.any(Object));
  });

  it('stop resets to idle and halts speech', () => {
    const { result } = renderHook(() => useReadAloud(['one', 'two']));
    act(() => result.current.play());

    act(() => result.current.stop());
    expect(result.current.status).toBe('idle');
    expect(stop).toHaveBeenCalled();
  });

  it('play is a no-op with no content', () => {
    const { result } = renderHook(() => useReadAloud([]));
    expect(result.current.hasContent).toBe(false);
    act(() => result.current.play());
    expect(speak).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });
});
