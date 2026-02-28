import type { Note, JudgmentType, FastSlow, Lane } from '../types';
import { JUDGMENT_WINDOWS } from '../types';

export interface JudgeResult {
  note: Note;
  judgment: JudgmentType;
  fastSlow: FastSlow;
}

export function judgeHit(
  lane: Lane,
  notes: Note[],
  now: number,
  offset: number = 0
): JudgeResult | null {
  const adjustedNow = now + offset;

  let best: Note | null = null;
  let bestDiff = Infinity;

  for (const note of notes) {
    if (note.judged || note.lane !== lane) continue;
    const diff = Math.abs(adjustedNow - note.hitTime);
    if (diff < JUDGMENT_WINDOWS.bad && diff < bestDiff) {
      bestDiff = diff;
      best = note;
    }
  }

  if (!best) return null;

  best.judged = true;

  let judgment: JudgmentType;
  if (bestDiff <= JUDGMENT_WINDOWS.pgreat) judgment = 'pgreat';
  else if (bestDiff <= JUDGMENT_WINDOWS.great) judgment = 'great';
  else if (bestDiff <= JUDGMENT_WINDOWS.good) judgment = 'good';
  else judgment = 'bad';

  // FAST/SLOW: null for P-GREAT
  let fastSlow: FastSlow = null;
  if (judgment !== 'pgreat') {
    fastSlow = adjustedNow < best.hitTime ? 'fast' : 'slow';
  }

  return { note: best, judgment, fastSlow };
}

export function calcFallTime(bpm: number, hs: number): number {
  return 2000 / (bpm / 150 * hs);
}

export function calcNoteInterval(bpm: number): number {
  return 60000 / bpm / 4;
}

export function calcAccuracy(pgreat: number, great: number, total: number): string {
  if (total === 0) return '0.00';
  return ((pgreat * 2 + great) / (total * 2) * 100).toFixed(2);
}
