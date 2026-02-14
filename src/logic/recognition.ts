import type { Lane } from '../types';

export function generateRecogPattern(level: number): Lane[] {
  let count: number;
  switch (level) {
    case 1: count = 1; break;
    case 2: count = 2; break;
    case 3: count = 3; break;
    case 4: count = 3 + Math.floor(Math.random() * 2); break;
    case 5: count = 3 + Math.floor(Math.random() * 2); break;
    default: count = 1;
  }

  const available = [0, 1, 2, 3, 4, 5, 6];
  const keys: Lane[] = [];
  for (let i = 0; i < count && available.length > 0; i++) {
    const idx = Math.floor(Math.random() * available.length);
    keys.push(available.splice(idx, 1)[0]);
  }

  if (level === 4 && Math.random() > 0.3) {
    keys.push('scratch');
  }

  return keys.sort((a, b) => {
    if (a === 'scratch') return -1;
    if (b === 'scratch') return 1;
    return (a as number) - (b as number);
  });
}

export function getShowTime(level: number): number {
  return level === 5 ? 300 : 1500;
}

export function checkAnswer(input: Lane[], expected: Lane[]): boolean {
  return JSON.stringify(input) === JSON.stringify(expected);
}
