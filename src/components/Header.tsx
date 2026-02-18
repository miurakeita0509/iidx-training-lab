import { useInput } from '../contexts/InputContext';
import type { Side } from '../types';
import { useMetronome } from '../hooks/useMetronome';
import styles from './Header.module.css';

interface Props {
  side: Side;
  onSideChange: (s: Side) => void;
  metronomeActive: boolean;
  metronomeBpm: number;
  onMetronomeToggle: () => void;
  onMetronomeBpmChange: (bpm: number) => void;
}

export default function Header({
  side, onSideChange,
  metronomeActive, metronomeBpm, onMetronomeToggle, onMetronomeBpmChange,
}: Props) {
  const { connected, deviceName } = useInput();
  useMetronome(metronomeBpm, metronomeActive);

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>IIDX TRAINING LAB</h1>
      <div className={styles.controls}>
        <div className={styles.sideToggle}>
          <button
            className={`${styles.sideBtn} ${side === '1p' ? styles.sideActive : ''}`}
            onClick={() => onSideChange('1p')}
          >1P</button>
          <button
            className={`${styles.sideBtn} ${side === '2p' ? styles.sideActive : ''}`}
            onClick={() => onSideChange('2p')}
          >2P</button>
        </div>
        <div className={styles.metronome}>
          <button
            className={`${styles.metroBtn} ${metronomeActive ? styles.metroActive : ''}`}
            onClick={onMetronomeToggle}
            title="メトロノーム ON/OFF"
          >♩</button>
          <input
            type="number"
            className={styles.metroBpm}
            value={metronomeBpm}
            min={40}
            max={400}
            onChange={e => onMetronomeBpmChange(Number(e.target.value))}
          />
        </div>
        <div className={`${styles.status} ${connected ? styles.connected : ''}`}>
          <span className={styles.dot} />
          <span className={styles.statusText}>{connected ? deviceName : 'No Controller'}</span>
        </div>
      </div>
    </header>
  );
}
