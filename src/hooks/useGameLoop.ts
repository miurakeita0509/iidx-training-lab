import { useEffect, useRef } from 'react';

export function useGameLoop(callback: (now: number) => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    let id: number;
    const loop = () => {
      callbackRef.current(performance.now());
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);
}
