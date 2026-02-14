import { useState, useCallback } from 'react';
import type { ScratchType } from '../../types';
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

export default function ScratchPractice() {
  const [scratchType, setScratchType] = useState<ScratchType>('scratch-only');
  const [bpm, setBpm] = useState(140);
  const [hs, setHs] = useState(3.0);
  const [running, setRunning] = useState(false);

  const getLanes = useCallback((step: number) => {
    return getScratchLanes(scratchType, step);
  }, [scratchType]);

  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>皿絡み練習</div>
      <div className={styles.panelControls}>
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
            type="range"
            min={60}
            max={300}
            step={10}
            value={bpm}
            onChange={e => setBpm(Number(e.target.value))}
            disabled={running}
          />
        </ControlGroup>
        <ControlGroup label={`HS: ${hs.toFixed(1)}`}>
          <input
            type="range"
            min={1}
            max={8}
            step={0.5}
            value={hs}
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
      <PlayArea
        running={running}
        bpm={bpm}
        hs={hs}
        getLanes={getLanes}
        onStop={() => setRunning(false)}
      />
    </div>
  );
}
