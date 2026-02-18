export type Mode = 'pattern' | 'scratch' | 'recognition' | 'speed' | 'settings';
export type Side = '1p' | '2p';

export type PatternType = 'stairs' | 'reverse-stairs' | 'trill' | 'chords' | 'denim' | 'chord-stairs' | 'random' | 'charge';

export type ScratchType = 'scratch-only' | 'scratch-keys' | 'scratch-chords' | 'rapid-scratch' | 'bss';

export type JudgmentType = 'pgreat' | 'great' | 'good' | 'bad' | 'poor';

export type Lane = number | 'scratch'; // 0-6 for keys, 'scratch' for turntable

export interface LaneResult {
  lanes: Lane[];
  chargeDuration?: number; // if set, notes are charge notes with this duration (ms)
}

export interface Note {
  lane: Lane;
  hitTime: number;
  judged: boolean;
  el: HTMLDivElement | null;
  duration?: number; // charge note hold duration in ms
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

export interface SongPreset {
  name: string;
  nameEn?: string;
  bpm: number;
  pattern?: PatternType;
  scratchPattern?: ScratchType;
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

// Famous vocaloid songs for IIDX-style practice, with BPM and recommended pattern
export const VOCALOID_PRESETS: SongPreset[] = [
  { name: '千本桜', nameEn: 'Senbonzakura', bpm: 156, pattern: 'stairs', scratchPattern: 'scratch-keys' },
  { name: 'メルト', nameEn: 'Melt', bpm: 188, pattern: 'stairs', scratchPattern: 'scratch-only' },
  { name: 'ワールドイズマイン', nameEn: 'World is Mine', bpm: 168, pattern: 'chords', scratchPattern: 'scratch-chords' },
  { name: 'マトリョシカ', nameEn: 'Matryoshka', bpm: 180, pattern: 'trill', scratchPattern: 'rapid-scratch' },
  { name: '初音ミクの消失', nameEn: 'Disappearance of Miku', bpm: 200, pattern: 'stairs', scratchPattern: 'rapid-scratch' },
  { name: 'ゴーストルール', nameEn: 'Ghost Rule', bpm: 140, pattern: 'chord-stairs', scratchPattern: 'bss' },
  { name: 'ロミオとシンデレラ', nameEn: 'Romeo & Cinderella', bpm: 170, pattern: 'chords', scratchPattern: 'scratch-chords' },
  { name: '炉心融解', nameEn: 'Roshinjukai', bpm: 180, pattern: 'denim', scratchPattern: 'rapid-scratch' },
  { name: '脳漿炸裂ガール', nameEn: 'Noushousakuretsu Girl', bpm: 200, pattern: 'trill', scratchPattern: 'rapid-scratch' },
  { name: 'エゴロック', nameEn: 'Egorock', bpm: 196, pattern: 'denim', scratchPattern: 'scratch-keys' },
  { name: 'Tell Your World', bpm: 145, pattern: 'chord-stairs', scratchPattern: 'scratch-chords' },
  { name: '砂の惑星', nameEn: 'Sand Planet', bpm: 175, pattern: 'random', scratchPattern: 'scratch-keys' },
  { name: 'ドーナツホール', nameEn: 'Donut Hole', bpm: 170, pattern: 'chords', scratchPattern: 'scratch-chords' },
  { name: 'アンハッピーリフレイン', nameEn: 'Unhappy Refrain', bpm: 185, pattern: 'stairs', scratchPattern: 'scratch-only' },
  { name: '深海少女', nameEn: 'Shinkai Shoujo', bpm: 140, pattern: 'trill', scratchPattern: 'bss' },
  { name: '天ノ弱', nameEn: 'Ten no Yowai', bpm: 175, pattern: 'chord-stairs', scratchPattern: 'bss' },
  { name: 'ブレス・ユア・ブレス', nameEn: 'Bless Your Breath', bpm: 180, pattern: 'stairs', scratchPattern: 'scratch-keys' },
  { name: '妄想感傷代償連盟', nameEn: 'Mousou Kanshou', bpm: 170, pattern: 'denim', scratchPattern: 'scratch-chords' },
];
