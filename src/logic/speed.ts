import type { SpeedStats } from '../types';

export function calcSpeedStats(taps: number[], totalCount: number): SpeedStats {
  const result: SpeedStats = {
    tapCount: totalCount,
    bpm: '--',
    avgInterval: '--',
    stdDev: '--',
    stability: '--',
  };

  if (taps.length < 2) return result;

  const recent = taps.slice(-17);
  const intervals: number[] = [];
  for (let i = 1; i < recent.length; i++) {
    intervals.push(recent[i] - recent[i - 1]);
  }
  const last16 = intervals.slice(-16);
  const avg = last16.reduce((a, b) => a + b, 0) / last16.length;
  const variance = last16.reduce((a, b) => a + (b - avg) ** 2, 0) / last16.length;
  const std = Math.sqrt(variance);
  const stability = Math.max(0, 100 - std * 2);

  result.bpm = (60000 / avg / 4).toFixed(1);
  result.avgInterval = avg.toFixed(1);
  result.stdDev = std.toFixed(1);
  result.stability = stability.toFixed(1);

  return result;
}
