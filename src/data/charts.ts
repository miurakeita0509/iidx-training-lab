import type { Lane, LaneResult } from '../types';

export interface ChartNote {
  step: number;       // 0-indexed 16th note position from song start
  lanes: Lane[];
  chargeDuration?: number; // ms, for charge notes
}

export interface Chart {
  id: string;
  title: string;
  artist?: string;
  bpm: number;
  difficulty: 'BEGINNER' | 'NORMAL' | 'HYPER' | 'ANOTHER';
  level: number;       // 1-12
  audioFile: string;   // relative to BASE_URL
  notes: ChartNote[];
}

// Helper: push notes into array
function n(notes: ChartNote[], step: number, lanes: Lane[], chargeDuration?: number) {
  if (lanes.length === 0) return;
  notes.push({ step, lanes, chargeDuration });
}

// Helper: staircase ascending, starting at 'start' step, for 'count' 16th notes
function stairs(notes: ChartNote[], start: number, count: number, scratch = false) {
  for (let i = 0; i < count; i++) {
    const lanes: Lane[] = [i % 7];
    if (scratch && i % 16 === 0) lanes.push('scratch');
    n(notes, start + i, lanes);
  }
}

// Helper: staircase descending
function stairsDown(notes: ChartNote[], start: number, count: number, scratch = false) {
  for (let i = 0; i < count; i++) {
    const lanes: Lane[] = [6 - (i % 7)];
    if (scratch && i % 16 === 0) lanes.push('scratch');
    n(notes, start + i, lanes);
  }
}

// Helper: trill between two lanes
function trill(notes: ChartNote[], start: number, count: number, laneA: number, laneB: number) {
  for (let i = 0; i < count; i++) {
    n(notes, start + i, [i % 2 === 0 ? laneA : laneB]);
  }
}

// Helper: denim pattern [0,2,4,6,5,3,1]
function denim(notes: ChartNote[], start: number, count: number) {
  const seq = [0, 2, 4, 6, 5, 3, 1];
  for (let i = 0; i < count; i++) {
    n(notes, start + i, [seq[i % seq.length]]);
  }
}

// Helper: chord stream — pairs cycling
function chordStream(notes: ChartNote[], start: number, count: number, step = 2) {
  const patterns: Lane[][] = [
    [0, 3], [1, 4], [2, 5], [3, 6],
    [0, 2, 4], [1, 3, 5], [2, 4, 6], [0, 3, 5],
  ];
  let pIdx = 0;
  for (let i = 0; i < count; i += step) {
    n(notes, start + i, patterns[pIdx % patterns.length]);
    pIdx++;
  }
}

// Helper: scratch every N steps, key lane cycling
function scratchRun(notes: ChartNote[], start: number, count: number, scratchFreq: number) {
  for (let i = 0; i < count; i++) {
    const keyLane: Lane = i % 7;
    const lanes: Lane[] = [keyLane];
    if (i % scratchFreq === 0) lanes.push('scratch');
    n(notes, start + i, lanes);
  }
}

// Helper: sparse — single note every N steps, cycling lanes
function sparse(notes: ChartNote[], start: number, count: number, every: number) {
  for (let i = 0; i < count; i += every) {
    n(notes, start + i, [i % 7]);
  }
}

// Build Chromatic Rush HYPER chart (180 BPM, 80 bars = 1280 steps, Lv.5)
// Characteristics: mostly 8th notes, simple single-key patterns, sparse scratch
function buildHyperChart(): ChartNote[] {
  const notes: ChartNote[] = [];

  // ── Intro (bars 1-4, steps 0-63): Quarter notes only — warm up ──
  sparse(notes, 0, 64, 4);

  // ── Section A (bars 5-8, steps 64-127): 8th note ascending stairs ──
  for (let i = 0; i < 64; i += 2) {
    n(notes, 64 + i, [Math.floor(i / 2) % 7]);
  }

  // ── Section B (bars 9-12, steps 128-191): 8th note descending + scratch every 2 bars ──
  for (let i = 0; i < 64; i += 2) {
    const lanes: Lane[] = [6 - (Math.floor(i / 2) % 7)];
    if (i % 32 === 0) lanes.push('scratch');
    n(notes, 128 + i, lanes);
  }

  // ── Section C (bars 13-14, steps 192-223): Short 16th burst (stairs) ──
  stairs(notes, 192, 16);
  sparse(notes, 208, 16, 2); // back to 8th

  // ── Break (bars 15-16, steps 224-255): Quarter notes, just scratch ──
  for (let i = 0; i < 32; i += 8) {
    n(notes, 224 + i, ['scratch']);
  }

  // ── Section D (bars 17-22, steps 256-351): 8th notes cycling, simple ──
  for (let i = 0; i < 96; i += 2) {
    n(notes, 256 + i, [Math.floor(i / 2) % 7]);
  }

  // ── Section E (bars 23-26, steps 352-415): Trill 8th notes 0↔1 ──
  for (let i = 0; i < 64; i += 2) {
    n(notes, 352 + i, [i % 4 === 0 ? 0 : 1]);
  }

  // ── Section F (bars 27-30, steps 416-479): Simple 2-note chords, 8th notes ──
  const easyChords: Lane[][] = [[0, 3], [1, 4], [2, 5], [3, 6]];
  for (let i = 0; i < 64; i += 2) {
    n(notes, 416 + i, easyChords[Math.floor(i / 2) % easyChords.length]);
  }

  // ── Break 2 (bars 31-32, steps 480-511): Rest / scratch only ──
  n(notes, 480, ['scratch']);
  n(notes, 496, ['scratch']);

  // ── Section G (bars 33-40, steps 512-639): 8th note stairs + scratch every 4 bars ──
  for (let i = 0; i < 128; i += 2) {
    const lanes: Lane[] = [Math.floor(i / 2) % 7];
    if (i % 64 === 0) lanes.push('scratch');
    n(notes, 512 + i, lanes);
  }

  // ── Section H (bars 41-44, steps 640-703): Short 16th runs (8 steps) between rests ──
  stairs(notes, 640, 8);
  sparse(notes, 648, 8, 4);
  stairsDown(notes, 656, 8);
  sparse(notes, 664, 8, 4);
  stairs(notes, 672, 8);
  sparse(notes, 680, 8, 4);
  stairsDown(notes, 688, 8);
  sparse(notes, 696, 8, 4);

  // ── Section I (bars 45-52, steps 704-831): Climax — 8th stairs + occasional chord ──
  for (let i = 0; i < 128; i += 2) {
    const lane = Math.floor(i / 2) % 7;
    if (i % 16 === 14) {
      // chord accent at phrase end
      n(notes, 704 + i, [lane, (lane + 3) % 7]);
    } else {
      n(notes, 704 + i, [lane]);
    }
  }

  // ── Section J (bars 53-56, steps 832-895): 16th stairs — peak difficulty ──
  stairs(notes, 832, 32);
  stairsDown(notes, 864, 32);

  // ── Break 3 (bars 57-60, steps 896-959): Rest with scratch accents ──
  for (let i = 0; i < 64; i += 16) {
    n(notes, 896 + i, ['scratch']);
  }

  // ── Outro (bars 61-80, steps 960-1279): Gradual fade ──
  // 960-1023: 8th notes
  for (let i = 0; i < 64; i += 2) {
    n(notes, 960 + i, [Math.floor(i / 2) % 7]);
  }
  // 1024-1087: Quarter notes
  sparse(notes, 1024, 64, 4);
  // 1088-1151: Quarter notes + scratch
  for (let i = 0; i < 64; i += 8) {
    n(notes, 1088 + i, ['scratch']);
    n(notes, 1092 + i, [(i % 7) as Lane]);
  }
  // 1152-1279: Very sparse ending
  sparse(notes, 1152, 128, 8);

  return notes;
}

// Build Chromatic Rush ANOTHER chart (180 BPM, 80 bars = 1280 steps, Lv.10)
// Characteristics: 3-note chords, scratch every 2 steps, no rests in main sections
function buildAnotherChart(): ChartNote[] {
  const notes: ChartNote[] = [];

  // ── Intro (bars 1-1, steps 0-15): Quarter note chords ──
  for (let i = 0; i < 16; i += 4) {
    n(notes, i, [i % 7, (i + 3) % 7]);
  }

  // ── Section A (bars 2-5, steps 16-79): Chord stairs — 2 notes every step ──
  for (let i = 0; i < 64; i++) {
    n(notes, 16 + i, [i % 7, (i + 2) % 7]);
  }

  // ── Section B (bars 6-9, steps 80-143): Scratch + key every step ──
  for (let i = 0; i < 64; i++) {
    const lanes: Lane[] = [i % 7];
    if (i % 2 === 0) lanes.push('scratch');
    n(notes, 80 + i, lanes);
  }

  // ── Section C (bars 10-13, steps 144-207): 3-note chord stream every step ──
  const triChords: Lane[][] = [
    [0, 2, 4], [1, 3, 5], [2, 4, 6], [0, 3, 6],
    [1, 4, 6], [0, 2, 5], [1, 3, 6], [0, 4, 6],
  ];
  for (let i = 0; i < 64; i++) {
    n(notes, 144 + i, triChords[i % triChords.length]);
  }

  // ── Section D (bars 14-15, steps 208-239): Double trill + scratch accent ──
  for (let i = 0; i < 32; i++) {
    const lA = i % 2 === 0 ? 0 : 1;  // left trill: 0↔1
    const lB = i % 2 === 0 ? 5 : 6;  // right trill: 5↔6
    const lanes: Lane[] = [lA, lB];
    if (i % 8 === 0) lanes.push('scratch');
    n(notes, 208 + i, lanes);
  }

  // ── Break (bar 16, steps 240-255): 8th note chords ──
  for (let i = 0; i < 16; i += 2) {
    n(notes, 240 + i, ['scratch', (i % 7) as Lane]);
  }

  // ── Section E (bars 17-22, steps 256-351): Dense chord stairs + scratch ──
  for (let i = 0; i < 96; i++) {
    const base = i % 7;
    const lanes: Lane[] = [base, (base + 3) % 7];
    if (i % 4 === 0) lanes.push('scratch');
    n(notes, 256 + i, lanes);
  }

  // ── Section F (bars 23-26, steps 352-415): Max density — scratch + chord every step ──
  for (let i = 0; i < 64; i++) {
    const lanes: Lane[] = [i % 7, (i + 2) % 7, 'scratch'];
    n(notes, 352 + i, lanes);
  }

  // ── Section G (bars 27-30, steps 416-479): Interleaved denim + chord ──
  const denimSeq = [0, 2, 4, 6, 5, 3, 1];
  for (let i = 0; i < 64; i++) {
    const d = denimSeq[i % denimSeq.length];
    const chord: Lane[] = i % 4 === 0 ? [d, (d + 3) % 7, 'scratch'] : [d, (d + 2) % 7];
    n(notes, 416 + i, chord);
  }

  // ── Section H (bars 31-36, steps 480-575): 3-chord every step + scratch every 2 ──
  for (let i = 0; i < 96; i++) {
    const lanes: Lane[] = triChords[i % triChords.length].slice();
    if (i % 2 === 0) lanes.push('scratch');
    n(notes, 480 + i, lanes);
  }

  // ── Section I (bars 37-40, steps 576-639): Chord descending with scratch ──
  for (let i = 0; i < 64; i++) {
    const base = 6 - (i % 7);
    const lanes: Lane[] = [base, (base + 2) % 7];
    if (i % 2 === 0) lanes.push('scratch');
    n(notes, 576 + i, lanes);
  }

  // ── Break 2 (bars 41-44, steps 640-703): Trill pairs + scatter ──
  trill(notes, 640, 32, 0, 6);  // extreme trill
  chordStream(notes, 672, 32, 2);

  // ── Section J (bars 45-48, steps 704-767): Dense scratch run ──
  for (let i = 0; i < 64; i++) {
    const lanes: Lane[] = [i % 7, 'scratch'];
    n(notes, 704 + i, lanes);
  }

  // ── FINAL CLIMAX (bars 49-68, steps 768-1087) ──
  // 768-831: Chord stairs + scratch every 4
  for (let i = 0; i < 64; i++) {
    const lanes: Lane[] = [i % 7, (i + 2) % 7];
    if (i % 4 === 0) lanes.push('scratch');
    n(notes, 768 + i, lanes);
  }
  // 832-895: Triple chords + scratch every 2
  for (let i = 0; i < 64; i++) {
    const lanes: Lane[] = [...triChords[i % triChords.length]];
    if (i % 2 === 0) lanes.push('scratch');
    n(notes, 832 + i, lanes);
  }
  // 896-959: BOSS section — scratch + 2 notes every step
  for (let i = 0; i < 64; i++) {
    n(notes, 896 + i, [i % 7, (i + 4) % 7, 'scratch']);
  }
  // 960-1023: Final wave — alternating 3-chord and 2-chord+scratch
  for (let i = 0; i < 64; i++) {
    if (i % 2 === 0) {
      n(notes, 960 + i, triChords[i % triChords.length]);
    } else {
      n(notes, 960 + i, [(i % 7) as Lane, 'scratch']);
    }
  }
  // 1024-1087: Fade climax
  for (let i = 0; i < 64; i++) {
    const lanes: Lane[] = [i % 7, (i + 3) % 7];
    if (i % 4 === 0) lanes.push('scratch');
    n(notes, 1024 + i, lanes);
  }

  // ── Outro (bars 69-80, steps 1088-1279): Thinning out ──
  for (let i = 0; i < 64; i++) {
    n(notes, 1088 + i, [i % 7, (i + 2) % 7]); // 2-note stairs
  }
  sparse(notes, 1152, 64, 2);    // 8th notes
  for (let i = 0; i < 32; i += 4) {
    n(notes, 1216 + i, ['scratch', (i % 7) as Lane]);
  }

  return notes;
}

export const CHROMATIC_RUSH_HYPER: Chart = {
  id: 'chromatic-rush-hyper',
  title: 'Chromatic Rush',
  artist: 'Suno AI',
  bpm: 180,
  difficulty: 'HYPER',
  level: 5,
  audioFile: 'bgm/Chromatic Rush.mp3',
  notes: buildHyperChart(),
};

export const CHROMATIC_RUSH_ANOTHER: Chart = {
  id: 'chromatic-rush-another',
  title: 'Chromatic Rush',
  artist: 'Suno AI',
  bpm: 180,
  difficulty: 'ANOTHER',
  level: 10,
  audioFile: 'bgm/Chromatic Rush.mp3',
  notes: buildAnotherChart(),
};

export const ALL_CHARTS: Chart[] = [CHROMATIC_RUSH_HYPER, CHROMATIC_RUSH_ANOTHER];

// Get LaneResult for a given step from chart data
export function getChartLanes(chart: Chart, step: number): LaneResult {
  const note = chart.notes.find(n => n.step === step);
  if (!note) return { lanes: [] };
  return { lanes: note.lanes, chargeDuration: note.chargeDuration };
}

export const MAX_STEP = Math.max(...CHROMATIC_RUSH_HYPER.notes.map(n => n.step));
