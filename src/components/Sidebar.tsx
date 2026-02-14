import type { Mode } from '../types';
import styles from './Sidebar.module.css';

interface Props {
  mode: Mode;
  onModeChange: (m: Mode) => void;
}

const MODES: { id: Mode; icon: string; ja: string; en: string }[] = [
  { id: 'pattern', icon: '\u266B', ja: '配置パターン練習', en: 'Pattern Practice' },
  { id: 'scratch', icon: '\u2672', ja: '皿絡み練習', en: 'Scratch Practice' },
  { id: 'recognition', icon: '\u2699', ja: '認識力トレーニング', en: 'Recognition' },
  { id: 'speed', icon: '\u26A1', ja: '打鍵速度・精度測定', en: 'Tap Speed' },
  { id: 'settings', icon: '\u2699', ja: 'コントローラー設定', en: 'Controller Settings' },
];

export default function Sidebar({ mode, onModeChange }: Props) {
  return (
    <nav className={styles.sidebar}>
      {MODES.map(m => (
        <button
          key={m.id}
          className={`${styles.modeBtn} ${mode === m.id ? styles.active : ''}`}
          onClick={() => onModeChange(m.id)}
        >
          <span className={styles.icon}>{m.icon}</span>
          <span className={styles.label}>
            <span>{m.ja}</span>
            <span>{m.en}</span>
          </span>
        </button>
      ))}
    </nav>
  );
}
