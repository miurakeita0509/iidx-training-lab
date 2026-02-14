import type { PlayResult } from './PlayArea';
import { JUDGMENT_COLORS } from '../../types';
import StatBox from '../ui/StatBox';
import styles from './ResultOverlay.module.css';

interface Props {
  result: PlayResult;
  onClose: () => void;
}

export default function ResultOverlay({ result, onClose }: Props) {
  const { judgments: j, maxCombo, score, accuracy } = result;

  return (
    <div className={styles.overlay}>
      <h2 className={styles.title}>RESULT</h2>
      <div className={styles.stats}>
        <StatBox value={j.pgreat} label="P-GREAT" color={JUDGMENT_COLORS.pgreat} />
        <StatBox value={j.great} label="GREAT" color={JUDGMENT_COLORS.great} />
        <StatBox value={j.good} label="GOOD" color={JUDGMENT_COLORS.good} />
        <StatBox value={j.bad} label="BAD" color={JUDGMENT_COLORS.bad} />
        <StatBox value={j.poor} label="POOR" color={JUDGMENT_COLORS.poor} />
        <StatBox value={maxCombo} label="MAX COMBO" />
        <StatBox value={score} label="SCORE" />
        <StatBox value={`${accuracy}%`} label="ACCURACY" />
      </div>
      <button className="btn btn-primary" onClick={onClose}>CLOSE</button>
    </div>
  );
}
