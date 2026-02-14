import { useInput } from '../contexts/InputContext';
import styles from './Header.module.css';

export default function Header() {
  const { connected, deviceName } = useInput();

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>IIDX TRAINING LAB</h1>
      <div className={`${styles.status} ${connected ? styles.connected : ''}`}>
        <span className={styles.dot} />
        <span>{connected ? deviceName : 'No Controller'}</span>
      </div>
    </header>
  );
}
