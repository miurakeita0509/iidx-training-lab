import { useState } from 'react';
import type { Mode, Side } from './types';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Visualizer from './components/Visualizer';
import PatternPractice from './components/modes/PatternPractice';
import ScratchPractice from './components/modes/ScratchPractice';
import RecognitionTraining from './components/modes/RecognitionTraining';
import TapSpeed from './components/modes/TapSpeed';
import ControllerSettings from './components/modes/ControllerSettings';
import styles from './App.module.css';

export default function App() {
  const [mode, setMode] = useState<Mode>('pattern');
  const [side, setSide] = useState<Side>('1p');
  const [metronomeActive, setMetronomeActive] = useState(false);
  const [metronomeBpm, setMetronomeBpm] = useState(150);

  return (
    <>
      <Header
        side={side}
        onSideChange={setSide}
        metronomeActive={metronomeActive}
        metronomeBpm={metronomeBpm}
        onMetronomeToggle={() => setMetronomeActive(v => !v)}
        onMetronomeBpmChange={setMetronomeBpm}
      />
      <div className={styles.app}>
        <Sidebar mode={mode} onModeChange={setMode} />
        <div className={styles.content}>
          <Visualizer side={side} />
          {mode === 'pattern' && (
            <PatternPractice
              side={side}
              metronomeActive={metronomeActive}
              onBpmChange={setMetronomeBpm}
            />
          )}
          {mode === 'scratch' && (
            <ScratchPractice
              side={side}
              metronomeActive={metronomeActive}
              onBpmChange={setMetronomeBpm}
            />
          )}
          {mode === 'recognition' && <RecognitionTraining />}
          {mode === 'speed' && <TapSpeed />}
          {mode === 'settings' && <ControllerSettings />}
        </div>
      </div>
    </>
  );
}
