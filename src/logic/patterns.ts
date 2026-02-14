import type { PatternType, Lane } from '../types';

export function getPatternLanes(type: PatternType, step: number): Lane[] {
  switch (type) {
    case 'stairs': {
      const seq = [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
      return [seq[step % seq.length]];
    }
    case 'reverse-stairs': {
      const seq = [6, 5, 4, 3, 2, 1, 0, 1, 2, 3, 4, 5];
      return [seq[step % seq.length]];
    }
    case 'trill': {
      const pairs: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]];
      const pairIdx = Math.floor(step / 16) % pairs.length;
      return [pairs[pairIdx][step % 2]];
    }
    case 'chords': {
      const patterns = [[0, 3], [1, 4], [2, 5], [3, 6], [0, 2, 4], [1, 3, 5], [2, 4, 6], [0, 3, 5, 6]];
      return patterns[step % patterns.length];
    }
    case 'denim': {
      const seq = [0, 2, 4, 6, 5, 3, 1];
      return [seq[step % seq.length]];
    }
    case 'chord-stairs': {
      const pairs = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [4, 5], [3, 4], [2, 3], [1, 2]];
      return pairs[step % pairs.length];
    }
    case 'random': {
      const count = 1 + Math.floor(Math.random() * 3);
      const available = [0, 1, 2, 3, 4, 5, 6];
      const lanes: number[] = [];
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * available.length);
        lanes.push(available.splice(idx, 1)[0]);
      }
      return lanes;
    }
    case 'charge': {
      const seq = [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
      return [seq[step % seq.length]];
    }
    default:
      return [step % 7];
  }
}
