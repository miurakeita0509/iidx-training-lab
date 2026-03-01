import { useState, useCallback } from 'react';
import type { PatternType, Side, LaneResult, SongPreset } from '../../types';
import { VOCALOID_PRESETS } from '../../types';
import { getPatternLanes } from '../../logic/patterns';
import { calcNoteInterval } from '../../logic/judgment';
import ControlGroup from '../ui/ControlGroup';
import PlayArea from '../PlayArea/PlayArea';
import styles from './ModePanel.module.css';

const PATTERN_OPTIONS: { value: PatternType; label: string }[] = [
  { value: 'stairs', label: '階段' },
  { value: 'reverse-stairs', label: '逆階段' },
  { value: 'trill', label: 'トリル' },
  { value: 'chords', label: '同時押し' },
  { value: 'denim', label: 'デニム' },
  { value: 'chord-stairs', label: '同時押し階段' },
  { value: 'random', label: 'ランダム' },
  { value: 'charge', label: 'チャージノート' },
];

const KEY_LABELS = ['1鍵', '2鍵', '3鍵', '4鍵', '5鍵', '6鍵', '7鍵'];

interface Props {
  side: Side;
  metronomeActive: boolean;
  onBpmChange: (bpm: number) => void;
}

export default function PatternPractice({ side, onBpmChange }: Props) {
  const [patternType, setPatternType] = useState<PatternType>('stairs');
  const [bpm, setBpm] = useState(150);
  const [hs, setHs] = useState(3.0);
  const [running, setRunning] = useState(false);
  const [activeKeys, setActiveKeys] = useState<boolean[]>(Array(7).fill(true));

  const handleBpmChange = (v: number) => {
    setBpm(v);
    onBpmChange(v);
  };

  const applyPreset = (preset: SongPreset) => {
    handleBpmChange(preset.bpm);
    if (preset.pattern) setPatternType(preset.pattern);
  };

  const toggleKey = (i: number) => {
    setActiveKeys(prev => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  const getLanes = useCallback((step: number): LaneResult => {
    const allLanes = getPatternLanes(patternType, step);
    const filtered = allLanes.filter(
      lane => lane === 'scratch' || activeKeys[lane as number]
    );
    const lanes = filtered.length > 0 ? filtered : allLanes;
    if (patternType === 'charge') {
      return { lanes, chargeDuration: calcNoteInterval(bpm) * 2 };
    }
    return { lanes };
  }, [patternType, activeKeys, bpm]);

  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>配置パターン練習</div>
      <div className={styles.panelControls}>
        {/* ボカロプリセット */}
        <ControlGroup label="ボカロプリセット">
          <select
            onChange={e => {
              const preset = VOCALOID_PRESETS.find(p => p.name === e.target.value);
              if (preset) applyPreset(preset);
              e.target.value = '';
            }}
            disabled={running}
            defaultValue=""
          >
            <option value="" disabled>楽曲を選択...</option>
            {VOCALOID_PRESETS.map(p => (
              <option key={p.name} value={p.name}>
                {p.name}{p.nameEn ? ` (${p.nameEn})` : ''} — {p.bpm}BPM
              </option>
            ))}
          </select>
        </ControlGroup>
        <ControlGroup label="パターン">
          <select
            value={patternType}
            onChange={e => setPatternType(e.target.value as PatternType)}
            disabled={running}
          >
            {PATTERN_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </ControlGroup>
        <ControlGroup label={`BPM: ${bpm}`}>
          <input
            type="range" min={60} max={300} step={10} value={bpm}
            onChange={e => handleBpmChange(Number(e.target.value))}
            disabled={running}
          />
        </ControlGroup>
        <ControlGroup label={`HS: ${hs.toFixed(1)}`}>
          <input
            type="range" min={1} max={8} step={0.5} value={hs}
            onChange={e => setHs(Number(e.target.value))}
            disabled={running}
          />
        </ControlGroup>
        <button
          className={`btn ${running ? 'btn-danger' : 'btn-primary'}`}
          onClick={() => setRunning(!running)}
        >
          {running ? 'STOP' : 'START'}
        </button>
      </div>
      <div className={styles.playLayout}>
        <PlayArea running={running} bpm={bpm} hs={hs} getLanes={getLanes} side={side} />
        <div className={styles.playLayoutControls}>
          <div className={styles.keySelect}>
            <span className={styles.keySelectLabel}>使用鍵盤:</span>
            {KEY_LABELS.map((label, i) => (
              <button
                key={i}
                className={`${styles.keySelectBtn} ${activeKeys[i] ? styles.keySelectActive : ''}`}
                onClick={() => toggleKey(i)}
                disabled={running}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
