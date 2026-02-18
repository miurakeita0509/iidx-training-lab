import { useEffect, useRef } from 'react';

export function useMetronome(bpm: number, active: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const activeRef = useRef(false);
  const timerRef = useRef(0);

  useEffect(() => {
    activeRef.current = active;
    if (!active) {
      clearTimeout(timerRef.current);
      return;
    }

    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }

    const ctx = ctxRef.current;
    const interval = 60000 / bpm;

    const tick = () => {
      if (!activeRef.current) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.04);
      timerRef.current = window.setTimeout(tick, interval);
    };

    tick();
    return () => {
      clearTimeout(timerRef.current);
    };
  }, [bpm, active]);
}
