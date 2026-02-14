import { useState } from 'react';
import type { Mode } from './types';
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

  return (
    <>
      <Header />
      <div className={styles.app}>
        <Sidebar mode={mode} onModeChange={setMode} />
        <div className={styles.content}>
          <Visualizer />
          {mode === 'pattern' && <PatternPractice />}
          {mode === 'scratch' && <ScratchPractice />}
          {mode === 'recognition' && <RecognitionTraining />}
          {mode === 'speed' && <TapSpeed />}
          {mode === 'settings' && <ControllerSettings />}
        </div>
      </div>
    </>
  );
}
