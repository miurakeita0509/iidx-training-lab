import { useState, useCallback } from 'react';
import type { ScratchType, Side, LaneResult, SongPreset } from '../../types';
import { VOCALOID_PRESETS } from '../../types';
import { getScratchLanes } from '../../logic/scratchPatterns';
import ControlGroup from '../ui/ControlGroup';
import PlayArea from '../PlayArea/PlayArea';
import styles from './ModePanel.module.css';

const SCRATCH_OPTIONS: { value: ScratchType; label: string }[] = [
  { value: 'scratch-only', label: '皿単体' },
  { value: 'scratch-keys', label: '皿+鍵盤' },
  { value: 'scratch-chords', label: '皿+同時押し' },
  { value: 'rapid-scratch', label: '連皿' },
  { value: 'bss', label: 'BSS風' },
];

interface Props {
  side: Side;
  metronomeActive: boolean;
  onBpmChange: (bpm: number) => void;
}

export default function ScratchPractice({ side, onBpmChange }: Props) {
  const [scratchType, setScratchType] = useState<ScratchType>('scratch-only');
  const [bpm, setBpm] = useState(140);
  const [hs, setHs] = useState(3.0);
  const [running, setRunning] = useState(false);

  const handleBpmChange = (v: number) => {
    setBpm(v);
    onBpmChange(v);
  };

  const applyPreset = (preset: SongPreset) => {
    handleBpmChange(preset.bpm);
    if (preset.scratchPattern) setScratchType(preset.scratchPattern as ScratchType);
  };

  const getLanes = useCallback((step: number): LaneResult => {
    return { lanes: getScratchLanes(scratchType, step) };
  }, [scratchType]);

  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>皿絡み練習</div>
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
            value={scratchType}
            onChange={e => setScratchType(e.target.value as ScratchType)}
            disabled={running}
          >
            {SCRATCH_OPTIONS.map(o => (
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
      <PlayArea running={running} bpm={bpm} hs={hs} getLanes={getLanes} side={side} />
    </div>
  );
}
