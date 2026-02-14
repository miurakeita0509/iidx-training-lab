import styles from './StatBox.module.css';

interface Props {
  value: string | number;
  label: string;
  color?: string;
}

export default function StatBox({ value, label, color }: Props) {
  return (
    <div className={styles.statBox}>
      <div className={styles.val} style={color ? { color } : undefined}>{value}</div>
      <div className={styles.lbl}>{label}</div>
    </div>
  );
}
