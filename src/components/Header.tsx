import { useRef } from 'react';
import { useInput } from '../contexts/InputContext';
import type { Side } from '../types';
import { useMetronome } from '../hooks/useMetronome';
import { useBGMPlayer } from '../hooks/useBGMPlayer';
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
  const bgm = useBGMPlayer();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) bgm.loadFile(file);
  }

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
        <div className={styles.bgm}>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            className={styles.bgmBtn}
            onClick={() => fileInputRef.current?.click()}
            title="BGMファイルを選択"
          >📂</button>
          <button
            className={`${styles.bgmBtn} ${styles.bgmPreset}`}
            onClick={() => bgm.loadUrl(`${import.meta.env.BASE_URL}bgm/Chromatic Rush.mp3`, 'Chromatic Rush')}
            title="Chromatic Rush を再生"
          >♪</button>
          {bgm.fileName && (
            <>
              <span className={styles.bgmName}>
                {bgm.fileName.length > 16 ? bgm.fileName.slice(0, 16) + '…' : bgm.fileName}
              </span>
              <button className={styles.bgmBtn} onClick={bgm.toggle} title="再生/一時停止">
                {bgm.isPlaying ? '⏸' : '▶'}
              </button>
              <input
                type="range"
                className={styles.bgmVolume}
                min={0} max={1} step={0.05}
                value={bgm.volume}
                onChange={e => bgm.setVolume(Number(e.target.value))}
                title="音量"
              />
            </>
          )}
        </div>
        <div className={`${styles.status} ${connected ? styles.connected : ''}`}>
          <span className={styles.dot} />
          <span className={styles.statusText}>{connected ? deviceName : 'No Controller'}</span>
        </div>
      </div>
    </header>
  );
}
