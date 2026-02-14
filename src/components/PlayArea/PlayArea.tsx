import { useEffect, useRef, useState, useCallback } from 'react';
import type { Note, Lane, JudgmentType, JudgmentCounts } from '../../types';
import { JUDGMENT_COLORS, JUDGMENT_LABELS } from '../../types';
import { judgeHit, calcFallTime, calcNoteInterval, calcAccuracy } from '../../logic/judgment';
import { useInput } from '../../contexts/InputContext';
import { useGameLoop } from '../../hooks/useGameLoop';
import ResultOverlay from './ResultOverlay';
import styles from './PlayArea.module.css';

export interface PlayResult {
  judgments: JudgmentCounts;
  maxCombo: number;
  score: number;
  totalNotes: number;
  accuracy: string;
}

interface Props {
  running: boolean;
  bpm: number;
  hs: number;
  getLanes: (step: number) => Lane[];
  onStop: () => void;
}

const LANE_TYPES: ('scratch' | 'white' | 'blue')[] = ['scratch', 'white', 'blue', 'white', 'blue', 'white', 'blue', 'white'];

export default function PlayArea({ running, bpm, hs, getLanes, onStop }: Props) {
  const { onKeyPress, onScratch } = useInput();

  const lanesRef = useRef<HTMLDivElement>(null);
  const judgmentRef = useRef<HTMLDivElement>(null);
  const comboRef = useRef<HTMLDivElement>(null);

  const notesRef = useRef<Note[]>([]);
  const startTimeRef = useRef(0);
  const lastGenRef = useRef(0);
  const stepRef = useRef(0);
  const comboValRef = useRef(0);
  const maxComboRef = useRef(0);
  const scoreRef = useRef(0);
  const totalNotesRef = useRef(0);
  const judgmentsRef = useRef<JudgmentCounts>({ pgreat: 0, great: 0, good: 0, bad: 0, poor: 0 });
  const judgmentTimerRef = useRef(0);

  const [result, setResult] = useState<PlayResult | null>(null);

  const flashLane = useCallback((lane: Lane) => {
    if (!lanesRef.current) return;
    const sel = lane === 'scratch' ? '[data-lane="scratch"]' : `[data-lane="${lane}"]`;
    const el = lanesRef.current.querySelector(sel);
    if (!el) return;
    const flash = el.querySelector(`.${styles.laneFlash}`) as HTMLElement;
    if (!flash) return;
    flash.style.opacity = '1';
    setTimeout(() => { flash.style.opacity = '0'; }, 100);
  }, []);

  const showJudgment = useCallback((type: JudgmentType) => {
    if (!judgmentRef.current) return;
    judgmentRef.current.textContent = JUDGMENT_LABELS[type];
    judgmentRef.current.style.color = JUDGMENT_COLORS[type];
    judgmentRef.current.style.opacity = '1';
    clearTimeout(judgmentTimerRef.current);
    judgmentTimerRef.current = window.setTimeout(() => {
      if (judgmentRef.current) judgmentRef.current.style.opacity = '0';
    }, 300);
  }, []);

  const registerJudgment = useCallback((type: JudgmentType) => {
    judgmentsRef.current[type]++;
    showJudgment(type);

    if (type === 'bad' || type === 'poor') {
      comboValRef.current = 0;
      if (comboRef.current) comboRef.current.style.opacity = '0';
    } else {
      comboValRef.current++;
      if (comboValRef.current > maxComboRef.current) maxComboRef.current = comboValRef.current;
      if (comboRef.current) {
        comboRef.current.textContent = String(comboValRef.current);
        comboRef.current.style.opacity = '1';
      }
    }

    const scoreMul = type === 'pgreat' ? 2 : type === 'great' ? 1 : 0;
    scoreRef.current += scoreMul;
  }, [showJudgment]);

  // Handle key press events
  useEffect(() => {
    if (!running) return;
    return onKeyPress((idx: number) => {
      const result = judgeHit(idx, notesRef.current, performance.now());
      if (result) {
        if (result.note.el) result.note.el.remove();
        flashLane(idx);
        registerJudgment(result.judgment);
      }
    });
  }, [running, onKeyPress, flashLane, registerJudgment]);

  // Handle scratch events
  useEffect(() => {
    if (!running) return;
    return onScratch(() => {
      const result = judgeHit('scratch', notesRef.current, performance.now());
      if (result) {
        if (result.note.el) result.note.el.remove();
        flashLane('scratch');
        registerJudgment(result.judgment);
      }
    });
  }, [running, onScratch, flashLane, registerJudgment]);

  // Reset on start
  useEffect(() => {
    if (running) {
      notesRef.current = [];
      startTimeRef.current = performance.now();
      lastGenRef.current = 0;
      stepRef.current = 0;
      comboValRef.current = 0;
      maxComboRef.current = 0;
      scoreRef.current = 0;
      totalNotesRef.current = 0;
      judgmentsRef.current = { pgreat: 0, great: 0, good: 0, bad: 0, poor: 0 };
      setResult(null);
      // Clear existing notes
      if (lanesRef.current) {
        lanesRef.current.querySelectorAll(`.${styles.note}`).forEach(n => n.remove());
      }
      if (comboRef.current) comboRef.current.style.opacity = '0';
      if (judgmentRef.current) judgmentRef.current.style.opacity = '0';
    }
  }, [running]);

  // Show result when stopped
  useEffect(() => {
    if (!running && totalNotesRef.current > 0 && !result) {
      const j = judgmentsRef.current;
      setResult({
        judgments: { ...j },
        maxCombo: maxComboRef.current,
        score: scoreRef.current,
        totalNotes: totalNotesRef.current,
        accuracy: calcAccuracy(j.pgreat, j.great, totalNotesRef.current),
      });
    }
  }, [running, result]);

  // Game loop: generate notes + update positions
  useGameLoop((now: number) => {
    if (!running || !lanesRef.current) return;

    const fallTime = calcFallTime(bpm, hs);
    const interval = calcNoteInterval(bpm);
    const elapsed = now - startTimeRef.current;

    // Generate notes
    if (elapsed >= 1000 && now - lastGenRef.current >= interval) {
      lastGenRef.current = now;
      const hitTime = now + fallTime;
      const lanes = getLanes(stepRef.current);
      stepRef.current++;

      for (const lane of lanes) {
        const el = document.createElement('div');
        el.className = styles.note;
        if (lane === 'scratch') {
          el.classList.add(styles.scratchNote);
          const laneEl = lanesRef.current.querySelector('[data-lane="scratch"]');
          if (laneEl) laneEl.appendChild(el);
        } else {
          const isWhite = (lane as number) % 2 === 0;
          el.classList.add(isWhite ? styles.whiteNote : styles.blueNote);
          const laneEl = lanesRef.current.querySelector(`[data-lane="${lane}"]`);
          if (laneEl) laneEl.appendChild(el);
        }
        const note: Note = { lane, hitTime, judged: false, el };
        notesRef.current.push(note);
        totalNotesRef.current++;
      }
    }

    // Update note positions
    const playH = 500;
    const judgY = playH - 60;
    for (let i = notesRef.current.length - 1; i >= 0; i--) {
      const note = notesRef.current[i];
      if (note.judged) continue;
      const timeLeft = note.hitTime - now;
      const progress = 1 - timeLeft / fallTime;
      const y = progress * judgY;
      if (note.el) note.el.style.top = y + 'px';

      // POOR (missed)
      if (timeLeft < -150) {
        note.judged = true;
        if (note.el) note.el.remove();
        registerJudgment('poor');
        notesRef.current.splice(i, 1);
      }
    }
  });

  return (
    <div style={{ position: 'relative' }}>
      <div className={styles.playArea}>
        <div className={styles.lanesContainer} ref={lanesRef}>
          {LANE_TYPES.map((type, i) => (
            <div
              key={i}
              className={`${styles.lane} ${styles[type === 'scratch' ? 'scratchLane' : type === 'white' ? 'whiteLane' : 'blueLane']}`}
              data-lane={type === 'scratch' ? 'scratch' : i - 1}
            >
              <div className={styles.laneBg} />
              <div className={styles.laneFlash} />
            </div>
          ))}
        </div>
        <div className={styles.judgmentLine} />
        <div className={styles.judgmentDisplay} ref={judgmentRef} />
        <div className={styles.comboDisplay} ref={comboRef} />
        <div className={styles.playInfo}>BPM {bpm} | HS {hs.toFixed(1)}</div>
      </div>
      {result && (
        <ResultOverlay
          result={result}
          onClose={() => {
            setResult(null);
            if (lanesRef.current) {
              lanesRef.current.querySelectorAll(`.${styles.note}`).forEach(n => n.remove());
            }
          }}
        />
      )}
    </div>
  );
}
