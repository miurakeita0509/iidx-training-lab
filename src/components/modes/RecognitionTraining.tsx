import { useState, useEffect, useRef, useCallback } from 'react';
import type { Lane } from '../../types';
import { generateRecogPattern, getShowTime, checkAnswer } from '../../logic/recognition';
import { useInput } from '../../contexts/InputContext';
import ControlGroup from '../ui/ControlGroup';
import StatBox from '../ui/StatBox';
import styles from './ModePanel.module.css';
import recogStyles from './RecognitionTraining.module.css';

export default function RecognitionTraining() {
  const { onKeyPress, onScratch } = useInput();
  const [level, setLevel] = useState(1);
  const [questionCount, setQuestionCount] = useState(20);
  const [running, setRunning] = useState(false);

  const [statusText, setStatusText] = useState('');
  const [statusColor, setStatusColor] = useState('#ffd700');
  const [timerWidth, setTimerWidth] = useState('0%');
  const [timerTransition, setTimerTransition] = useState('none');

  const [displayKeys, setDisplayKeys] = useState<{ lane: Lane; state: 'active' | 'hidden' | 'correct' | 'wrong' | 'idle' }[]>([]);
  const [stats, setStats] = useState({ correct: 0, wrong: 0, avgTime: '--', accuracy: '--' });

  const phaseRef = useRef<'idle' | 'show' | 'input' | 'feedback'>('idle');
  const currentRef = useRef<Lane[]>([]);
  const questionRef = useRef(0);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const timesRef = useRef<number[]>([]);
  const phaseStartRef = useRef(0);
  const inputBufferRef = useRef(new Set<Lane>());
  const inputTimeoutRef = useRef(0);
  const runningRef = useRef(false);

  const updateStats = useCallback(() => {
    const total = correctRef.current + wrongRef.current;
    const avgTime = timesRef.current.length > 0
      ? (timesRef.current.reduce((a, b) => a + b, 0) / timesRef.current.length).toFixed(0)
      : '--';
    const accuracy = total > 0 ? (correctRef.current / total * 100).toFixed(1) : '--';
    setStats({ correct: correctRef.current, wrong: wrongRef.current, avgTime, accuracy });
  }, []);

  const renderKeys = useCallback((pattern: Lane[], mode: 'show' | 'hidden' | 'feedback-correct' | 'feedback-wrong' | 'idle') => {
    const allLanes: Lane[] = ['scratch', 0, 1, 2, 3, 4, 5, 6];
    setDisplayKeys(allLanes.map(lane => {
      const isInPattern = pattern.includes(lane);
      let state: 'active' | 'hidden' | 'correct' | 'wrong' | 'idle';
      if (mode === 'show') state = isInPattern ? 'active' : 'idle';
      else if (mode === 'hidden') state = 'hidden';
      else if (mode === 'feedback-correct') state = isInPattern ? 'correct' : 'idle';
      else if (mode === 'feedback-wrong') state = isInPattern ? 'wrong' : 'idle';
      else state = 'idle';
      return { lane, state };
    }));
  }, []);

  const showFeedback = useCallback((correct: boolean) => {
    phaseRef.current = 'feedback';
    renderKeys(currentRef.current, correct ? 'feedback-correct' : 'feedback-wrong');
    setStatusText(correct ? '正解！' : '不正解...');
    setStatusColor(correct ? '#22cc44' : '#cc2222');
    setTimeout(() => {
      setStatusColor('#ffd700');
      if (runningRef.current) nextQuestion();
    }, 800);
  }, [renderKeys]);

  const doCheckAnswer = useCallback(() => {
    const input = Array.from(inputBufferRef.current).sort((a, b) => {
      if (a === 'scratch') return -1;
      if (b === 'scratch') return 1;
      return (a as number) - (b as number);
    }) as Lane[];
    inputBufferRef.current.clear();
    const reactionTime = performance.now() - phaseStartRef.current;
    const correct = checkAnswer(input, currentRef.current);

    if (correct) {
      correctRef.current++;
      timesRef.current.push(reactionTime);
    } else {
      wrongRef.current++;
    }
    updateStats();
    showFeedback(correct);
  }, [updateStats, showFeedback]);

  const nextQuestion = useCallback(() => {
    if (questionRef.current >= questionCount) {
      setRunning(false);
      return;
    }
    questionRef.current++;
    const pattern = generateRecogPattern(level);
    currentRef.current = pattern;
    phaseRef.current = 'show';
    phaseStartRef.current = performance.now();
    renderKeys(pattern, 'show');
    setStatusText(`問題 ${questionRef.current} / ${questionCount}`);

    const showTime = getShowTime(level);
    setTimerTransition(`width ${showTime}ms linear`);
    setTimerWidth('100%');
    setTimeout(() => {
      setTimerTransition('none');
      setTimerWidth('0%');
    }, 10);

    setTimeout(() => {
      if (!runningRef.current) return;
      phaseRef.current = 'input';
      phaseStartRef.current = performance.now();
      renderKeys(pattern, 'hidden');
      setStatusText('入力してください！');
    }, showTime);
  }, [level, questionCount, renderKeys]);

  // Handle input events
  useEffect(() => {
    if (!running) return;
    const unsubKey = onKeyPress((idx: number) => {
      if (phaseRef.current !== 'input') return;
      inputBufferRef.current.add(idx);
      clearTimeout(inputTimeoutRef.current);
      inputTimeoutRef.current = window.setTimeout(() => doCheckAnswer(), 200);
    });
    const unsubScratch = onScratch(() => {
      if (phaseRef.current !== 'input') return;
      inputBufferRef.current.add('scratch');
      clearTimeout(inputTimeoutRef.current);
      inputTimeoutRef.current = window.setTimeout(() => doCheckAnswer(), 200);
    });
    return () => { unsubKey(); unsubScratch(); };
  }, [running, onKeyPress, onScratch, doCheckAnswer]);

  // Start/stop
  useEffect(() => {
    runningRef.current = running;
    if (running) {
      questionRef.current = 0;
      correctRef.current = 0;
      wrongRef.current = 0;
      timesRef.current = [];
      updateStats();
      nextQuestion();
    } else {
      phaseRef.current = 'idle';
      setStatusText('');
      setTimerWidth('0%');
      setTimerTransition('none');
      renderKeys([], 'idle');
    }
  }, [running]);

  const keyLabels = (lane: Lane) => {
    if (lane === 'scratch') return 'S';
    return String((lane as number) + 1);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>認識力トレーニング</div>
      <div className={styles.panelControls}>
        <ControlGroup label="難易度">
          <select value={level} onChange={e => setLevel(Number(e.target.value))} disabled={running}>
            <option value={1}>Lv.1 - 単鍵</option>
            <option value={2}>Lv.2 - 2つ同時</option>
            <option value={3}>Lv.3 - 3つ同時</option>
            <option value={4}>Lv.4 - 皿含む</option>
            <option value={5}>Lv.5 - 高速</option>
          </select>
        </ControlGroup>
        <ControlGroup label={`問題数: ${questionCount}`}>
          <input
            type="range"
            min={5}
            max={100}
            step={5}
            value={questionCount}
            onChange={e => setQuestionCount(Number(e.target.value))}
            disabled={running}
          />
        </ControlGroup>
        <button
          className={`btn ${running ? 'btn-danger' : 'btn-primary'}`}
          onClick={() => setRunning(!running)}
        >
          {running ? 'STOP' : 'START'}
        </button>
      </div>
      <div className={recogStyles.timerBar}>
        <div className={recogStyles.timerFill} style={{ width: timerWidth, transition: timerTransition }} />
      </div>
      <div className={recogStyles.status} style={{ color: statusColor }}>{statusText}</div>
      <div className={recogStyles.display}>
        {displayKeys.map((k, i) => (
          <div
            key={i}
            className={`${recogStyles.recogKey} ${k.state === 'active' ? recogStyles.active : ''} ${k.state === 'correct' ? recogStyles.correct : ''} ${k.state === 'wrong' ? recogStyles.wrong : ''}`}
          >
            {k.state === 'hidden' ? '?' : (k.state === 'active' || k.state === 'correct' || k.state === 'wrong' ? keyLabels(k.lane) : '')}
          </div>
        ))}
      </div>
      <div className={styles.statsRow}>
        <StatBox value={stats.correct} label="正解" color="#22cc44" />
        <StatBox value={stats.wrong} label="不正解" color="#cc2222" />
        <StatBox value={stats.avgTime} label="平均反応時間 (ms)" />
        <StatBox value={stats.accuracy} label="正解率 (%)" />
      </div>
    </div>
  );
}
