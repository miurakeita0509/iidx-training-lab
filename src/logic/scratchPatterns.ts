import type { Lane } from '../types';

export function getScratchLanes(type: string, step: number): Lane[] {
  switch (type) {
    case 'scratch-only':
      return ['scratch'];
    case 'scratch-keys':
      if (step % 2 === 0) return ['scratch'];
      return [Math.floor(Math.random() * 3)];
    case 'scratch-chords': {
      if (step % 2 === 0) return ['scratch'];
      const count = 2 + Math.floor(Math.random() * 3);
      const avail = [0, 1, 2, 3, 4, 5, 6];
      const lanes: number[] = [];
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * avail.length);
        lanes.push(avail.splice(idx, 1)[0]);
      }
      return lanes;
    }
    case 'rapid-scratch':
      if (step % 4 === 3) return [Math.floor(Math.random() * 7)];
      return ['scratch'];
    case 'bss':
      if (step % 8 < 5) return ['scratch'];
      return [Math.floor(Math.random() * 3)];
    default:
      return ['scratch'];
  }
}
