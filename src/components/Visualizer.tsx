import { useInput } from '../contexts/InputContext';
import styles from './Visualizer.module.css';

const KEY_COLORS: ('white' | 'blue')[] = ['white', 'blue', 'white', 'blue', 'white', 'blue', 'white'];

export default function Visualizer() {
  const { getMergedInput, turntableAngle } = useInput();
  const input = getMergedInput();

  return (
    <div className={styles.visualizer}>
      <div
        className={styles.turntable}
        style={{ transform: `rotate(${turntableAngle}deg)` }}
      >
        <div className={styles.marker} />
      </div>
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
      <div className={styles.scratchIndicator}>
        {input.scratchActive ? (input.scratchDir > 0 ? '↑' : '↓') : '--'}
      </div>
    </div>
  );
}
