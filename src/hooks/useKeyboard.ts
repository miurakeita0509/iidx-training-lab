import { useEffect, useRef, useCallback } from 'react';
import { KB_MAP } from '../types';

export interface KeyboardState {
  keys: boolean[];
  scratchUp: boolean;
  scratchDown: boolean;
}

export function useKeyboard(
  onKeyPress: (keyIdx: number) => void,
  onScratch: (dir: number) => void
) {
  const stateRef = useRef<KeyboardState>({
    keys: Array(7).fill(false),
    scratchUp: false,
    scratchDown: false,
  });

  const onKeyPressRef = useRef(onKeyPress);
  const onScratchRef = useRef(onScratch);
  onKeyPressRef.current = onKeyPress;
  onScratchRef.current = onScratch;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code in KB_MAP) {
        e.preventDefault();
        const idx = KB_MAP[e.code];
        stateRef.current.keys[idx] = true;
        onKeyPressRef.current(idx);
      }
      if (e.key === 'Shift') {
        e.preventDefault();
        stateRef.current.scratchUp = true;
        onScratchRef.current(1);
      }
      if (e.key === 'Control') {
        e.preventDefault();
        stateRef.current.scratchDown = true;
        onScratchRef.current(-1);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code in KB_MAP) {
        e.preventDefault();
        stateRef.current.keys[KB_MAP[e.code]] = false;
      }
      if (e.key === 'Shift') {
        e.preventDefault();
        stateRef.current.scratchUp = false;
      }
      if (e.key === 'Control') {
        e.preventDefault();
        stateRef.current.scratchDown = false;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const getState = useCallback(() => stateRef.current, []);
  return { getState };
}
