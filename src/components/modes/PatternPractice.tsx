import { useState, useCallback } from 'react';
import type { PatternType } from '../../types';
import { getPatternLanes } from '../../logic/patterns';
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

export default function PatternPractice() {
  const [patternType, setPatternType] = useState<PatternType>('stairs');
  const [bpm, setBpm] = useState(150);
  const [hs, setHs] = useState(3.0);
  const [running, setRunning] = useState(false);

  const getLanes = useCallback((step: number) => {
    return getPatternLanes(patternType, step);
  }, [patternType]);

  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>配置パターン練習</div>
      <div className={styles.panelControls}>
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
