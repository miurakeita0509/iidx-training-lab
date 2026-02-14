import type { ReactNode } from 'react';
import styles from './ControlGroup.module.css';

interface Props {
  label: string;
  children: ReactNode;
}

export default function ControlGroup({ label, children }: Props) {
  return (
    <div className={styles.controlGroup}>
      <label>{label}</label>
      {children}
    </div>
  );
}
