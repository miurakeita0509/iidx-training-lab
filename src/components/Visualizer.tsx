import { useInput } from '../contexts/InputContext';
import type { Side } from '../types';
import styles from './Visualizer.module.css';

const KEY_COLORS: ('white' | 'blue')[] = ['white', 'blue', 'white', 'blue', 'white', 'blue', 'white'];

interface Props { side: Side; }

export default function Visualizer({ side }: Props) {
  const { getMergedInput, turntableAngle } = useInput();
  const input = getMergedInput();

  const turntable = (
    <div
      className={styles.turntable}
      style={{ transform: `rotate(${turntableAngle}deg)` }}
    >
      <div className={styles.marker} />
    </div>
  );

  const keys = (
    <div className={styles.keysViz}>
      {KEY_COLORS.map((color, i) => (
        <div
          key={i}
          className={`${styles.keyViz} ${styles[color]} ${input.keys[i] ? styles.pressed : ''}`}
        >
          {i + 1}
        </div>
      ))}
    </div>
  );

  const indicator = (
    <div className={styles.scratchIndicator}>
      {input.scratchActive ? (input.scratchDir > 0 ? '↑' : '↓') : '--'}
    </div>
  );

  return (
    <div className={styles.visualizer}>
      {side === '1p' ? (
        <>{turntable}{keys}{indicator}</>
      ) : (
        <>{indicator}{keys}{turntable}</>
      )}
    </div>
  );
}
