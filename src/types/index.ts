export type Mode = 'pattern' | 'scratch' | 'recognition' | 'speed' | 'settings';

export type PatternType = 'stairs' | 'reverse-stairs' | 'trill' | 'chords' | 'denim' | 'chord-stairs' | 'random' | 'charge';

export type ScratchType = 'scratch-only' | 'scratch-keys' | 'scratch-chords' | 'rapid-scratch' | 'bss';

export type JudgmentType = 'pgreat' | 'great' | 'good' | 'bad' | 'poor';

export type Lane = number | 'scratch'; // 0-6 for keys, 'scratch' for turntable

export interface Note {
  lane: Lane;
  hitTime: number;
  judged: boolean;
  el: HTMLDivElement | null;
}

export interface JudgmentCounts {
  pgreat: number;
  great: number;
  good: number;
  bad: number;
  poor: number;
}

export interface PlayConfig {
  type: string;
  bpm: number;
  hs: number;
}

export interface Mapping {
  keys: number[];
  scratchMode: 'axis' | 'buttons';
  scratchAxis: number;
  scratchThreshold: number;
  scratchBtnUp: number;
  scratchBtnDown: number;
}

export interface InputState {
  keys: boolean[];
  prevKeys: boolean[];
  scratchActive: boolean;
  scratchDir: number;
}

export interface SpeedStats {
  tapCount: number;
  bpm: string;
  avgInterval: string;
  stdDev: string;
  stability: string;
}

export interface RecogLevel {
  value: number;
  label: string;
  count: number;
  showTime: number;
}

export const DEFAULT_MAPPING: Mapping = {
  keys: [0, 1, 2, 3, 4, 5, 6],
  scratchMode: 'axis',
  scratchAxis: 0,
  scratchThreshold: 0.002,
  scratchBtnUp: -1,
  scratchBtnDown: -1,
};

export const JUDGMENT_WINDOWS = {
  pgreat: 20,
  great: 50,
  good: 100,
  bad: 150,
} as const;

export const JUDGMENT_COLORS: Record<JudgmentType, string> = {
  pgreat: '#ffd700',
  great: '#ffaa00',
  good: '#44cc44',
  bad: '#cc4444',
  poor: '#888888',
};

export const JUDGMENT_LABELS: Record<JudgmentType, string> = {
  pgreat: 'P-GREAT',
  great: 'GREAT',
  good: 'GOOD',
  bad: 'BAD',
  poor: 'POOR',
};

export const KB_MAP: Record<string, number> = {
  KeyS: 0,
  KeyD: 1,
  KeyF: 2,
  Space: 3,
  KeyJ: 4,
  KeyK: 5,
  KeyL: 6,
};
