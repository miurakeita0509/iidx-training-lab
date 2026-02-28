import { useState, useEffect, useRef } from 'react';
import { useInput } from '../../contexts/InputContext';
import { DEFAULT_MAPPING, JUDGMENT_OFFSET_KEY, JUDGMENT_OFFSET_MIN, JUDGMENT_OFFSET_MAX } from '../../types';
import { useGameLoop } from '../../hooks/useGameLoop';
import styles from './ModePanel.module.css';
import settingsStyles from './ControllerSettings.module.css';

type WaitTarget = number | 'scratchUp' | 'scratchDown' | null;

function getStoredOffset(): number {
  const stored = localStorage.getItem(JUDGMENT_OFFSET_KEY);
  if (stored === null) return 0;
  const val = parseInt(stored, 10);
  return isNaN(val) ? 0 : val;
}

export default function ControllerSettings() {
  const { mapping, setMapping, rawGamepad, connected } = useInput();
  const [waiting, setWaiting] = useState<WaitTarget>(null);
  const [rawText, setRawText] = useState('接続待ち...');
  const waitingRef = useRef<WaitTarget>(null);
  const [offset, setOffset] = useState(getStoredOffset);

  useEffect(() => { waitingRef.current = waiting; }, [waiting]);

  // Update raw monitor
  useGameLoop(() => {
    const gp = rawGamepad;
    if (!gp) {
      setRawText('接続待ち...');
      return;
    }

    // Check for button press during mapping wait
    if (waitingRef.current !== null) {
      for (let b = 0; b < gp.buttons.length; b++) {
        if (gp.buttons[b].pressed) {
          const target = waitingRef.current;
          const newMapping = { ...mapping, keys: [...mapping.keys] };
          if (target === 'scratchUp') newMapping.scratchBtnUp = b;
          else if (target === 'scratchDown') newMapping.scratchBtnDown = b;
          else if (typeof target === 'number') newMapping.keys[target] = b;
          setMapping(newMapping);
          setWaiting(null);
          break;
        }
      }
    }

    let text = `ID: ${gp.id}\nButtons: ${gp.buttons.length} | Axes: ${gp.axes.length}\n\n`;
    text += 'Buttons:\n';
    for (let i = 0; i < gp.buttons.length; i++) {
      const b = gp.buttons[i];
      text += `  [${i}] ${b.pressed ? '■' : '□'} val=${b.value.toFixed(2)}\n`;
    }
    text += '\nAxes:\n';
    for (let i = 0; i < gp.axes.length; i++) {
      text += `  [${i}] ${gp.axes[i].toFixed(4)}\n`;
    }
    setRawText(text);
  });

  const labels = ['1鍵', '2鍵', '3鍵', '4鍵', '5鍵', '6鍵', '7鍵'];

  const resetMapping = () => {
    setMapping({ ...DEFAULT_MAPPING });
    setWaiting(null);
  };

  const changeOffset = (delta: number) => {
    setOffset(prev => {
      const next = Math.max(JUDGMENT_OFFSET_MIN, Math.min(JUDGMENT_OFFSET_MAX, prev + delta));
      localStorage.setItem(JUDGMENT_OFFSET_KEY, String(next));
      return next;
    });
  };

  const resetOffset = () => {
    setOffset(0);
    localStorage.setItem(JUDGMENT_OFFSET_KEY, '0');
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>コントローラー設定</div>
      <div className={styles.panelControls}>
        <button className="btn btn-secondary" onClick={resetMapping}>デフォルトに戻す</button>
      </div>
      <h3 className={settingsStyles.sectionTitle}>
        ボタンマッピング（クリックして入力待ち → コントローラーのボタンを押して割り当て）
      </h3>
      <div className={settingsStyles.mappingGrid}>
        {labels.map((label, i) => (
          <div
            key={i}
            className={`${settingsStyles.mappingItem} ${waiting === i ? settingsStyles.waiting : ''}`}
            onClick={() => setWaiting(i)}
          >
            <div className={settingsStyles.mapLabel}>{label}</div>
            <div className={settingsStyles.mapValue}>
              {waiting === i ? '入力待ち...' : `btn ${mapping.keys[i]}`}
            </div>
          </div>
        ))}
        <div
          className={`${settingsStyles.mappingItem} ${waiting === 'scratchUp' ? settingsStyles.waiting : ''}`}
          onClick={() => setWaiting('scratchUp')}
        >
          <div className={settingsStyles.mapLabel}>皿↑ (ボタン)</div>
          <div className={settingsStyles.mapValue}>
            {waiting === 'scratchUp' ? '入力待ち...' : (mapping.scratchBtnUp >= 0 ? `btn ${mapping.scratchBtnUp}` : '未設定 (自動)')}
          </div>
        </div>
        <div
          className={`${settingsStyles.mappingItem} ${waiting === 'scratchDown' ? settingsStyles.waiting : ''}`}
          onClick={() => setWaiting('scratchDown')}
        >
          <div className={settingsStyles.mapLabel}>皿↓ (ボタン)</div>
          <div className={settingsStyles.mapValue}>
            {waiting === 'scratchDown' ? '入力待ち...' : (mapping.scratchBtnDown >= 0 ? `btn ${mapping.scratchBtnDown}` : '未設定 (自動)')}
          </div>
        </div>
        <div className={settingsStyles.mappingItem}>
          <div className={settingsStyles.mapLabel}>皿 (軸)</div>
          <div className={settingsStyles.mapValue}>axis {mapping.scratchAxis}</div>
        </div>
        <div className={settingsStyles.mappingItem}>
          <div className={settingsStyles.mapLabel}>皿閾値</div>
          <div className={settingsStyles.mapValue}>{mapping.scratchThreshold}</div>
        </div>
      </div>
      <h3 className={settingsStyles.sectionTitle}>判定タイミング調整</h3>
      <div className={settingsStyles.offsetSection}>
        <button className={settingsStyles.offsetBtn} onClick={() => changeOffset(-1)}>−</button>
        <span className={settingsStyles.offsetValue}>
          {offset >= 0 ? '+' : ''}{offset}ms
        </span>
        <button className={settingsStyles.offsetBtn} onClick={() => changeOffset(1)}>+</button>
        <button className={`btn btn-secondary ${settingsStyles.offsetReset}`} onClick={resetOffset}>RESET</button>
      </div>
      <div className={settingsStyles.offsetHint}>
        FAST が多い → + 方向 / SLOW が多い → − 方向
      </div>
      <h3 className={settingsStyles.sectionTitle}>RAW入力モニター</h3>
      <div className={settingsStyles.rawMonitor}>{rawText}</div>
    </div>
  );
}
