import { useState, useEffect, useRef, useCallback } from 'react';
import { useInput } from '../../contexts/InputContext';
import { calcSpeedStats } from '../../logic/speed';
import type { SpeedStats } from '../../types';
import ControlGroup from '../ui/ControlGroup';
import StatBox from '../ui/StatBox';
import styles from './ModePanel.module.css';
import tapStyles from './TapSpeed.module.css';

export default function TapSpeed() {
  const { onKeyPress, onScratch } = useInput();
  const [target, setTarget] = useState('all');
  const [running, setRunning] = useState(false);
  const [tapText, setTapText] = useState('対象キーを押してください');
  const [stats, setStats] = useState<SpeedStats>({
    tapCount: 0,
    bpm: '--',
    avgInterval: '--',
    stdDev: '--',
    stability: '--',
  });

  const tapsRef = useRef<number[]>([]);
  const countRef = useRef(0);
  const targetRef = useRef(target);

  useEffect(() => { targetRef.current = target; }, [target]);

  const handleTap = useCallback(() => {
    const now = performance.now();
    countRef.current++;
    tapsRef.current.push(now);
    if (tapsRef.current.length > 64) tapsRef.current.shift();
    setTapText(`TAP! (${countRef.current})`);
    setStats(calcSpeedStats(tapsRef.current, countRef.current));
  }, []);

  useEffect(() => {
    if (!running) return;
    const unsubKey = onKeyPress((idx: number) => {
      const t = targetRef.current;
      if (t === 'scratch') return;
      if (t !== 'all' && parseInt(t) !== idx) return;
      handleTap();
    });
    const unsubScratch = onScratch(() => {
      const t = targetRef.current;
      if (t !== 'all' && t !== 'scratch') return;
      handleTap();
    });
    return () => { unsubKey(); unsubScratch(); };
  }, [running, onKeyPress, onScratch, handleTap]);

  const toggle = () => {
    if (running) {
      setRunning(false);
      setTapText('対象キーを押してください');
    } else {
      tapsRef.current = [];
      countRef.current = 0;
      setRunning(true);
      setTapText('入力待ち...');
      setStats({ tapCount: 0, bpm: '--', avgInterval: '--', stdDev: '--', stability: '--' });
    }
  };

  const reset = () => {
    tapsRef.current = [];
    countRef.current = 0;
    setStats({ tapCount: 0, bpm: '--', avgInterval: '--', stdDev: '--', stability: '--' });
    setTapText(running ? '入力待ち...' : '対象キーを押してください');
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>打鍵速度・精度測定</div>
      <div className={styles.panelControls}>
        <ControlGroup label="対象キー">
          <select value={target} onChange={e => setTarget(e.target.value)} disabled={running}>
            <option value="all">すべてのキー</option>
            <option value="scratch">皿のみ</option>
            <option value="0">1鍵</option>
            <option value="1">2鍵</option>
            <option value="2">3鍵</option>
            <option value="3">4鍵</option>
            <option value="4">5鍵</option>
            <option value="5">6鍵</option>
            <option value="6">7鍵</option>
          </select>
        </ControlGroup>
        <button className={`btn ${running ? 'btn-danger' : 'btn-primary'}`} onClick={toggle}>
          {running ? 'STOP' : 'START'}
        </button>
        <button className="btn btn-secondary" onClick={reset}>RESET</button>
      </div>
      <div className={`${tapStyles.targetArea} ${running ? tapStyles.listening : ''}`}>
        {tapText}
      </div>
      <div className={styles.statsRow}>
        <StatBox value={stats.tapCount} label="TAP COUNT" />
        <StatBox value={stats.bpm} label="BPM (16分)" />
        <StatBox value={stats.avgInterval} label="平均間隔 (ms)" />
        <StatBox value={stats.stdDev} label="標準偏差 (ms)" />
        <StatBox value={stats.stability} label="安定度 (%)" />
      </div>
    </div>
  );
}
