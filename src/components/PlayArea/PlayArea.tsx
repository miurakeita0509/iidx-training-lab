import { useEffect, useRef, useState, useCallback } from 'react';
import type { Note, Lane, JudgmentType, JudgmentCounts, LaneResult, Side } from '../../types';
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
  getLanes: (step: number) => LaneResult;
  side: Side;
}

type LaneConfig = { type: 'scratch' | 'white' | 'blue'; dataLane: string };

function buildLaneConfig(side: Side): LaneConfig[] {
  const keys: LaneConfig[] = [
    { type: 'white', dataLane: '0' },
    { type: 'blue', dataLane: '1' },
    { type: 'white', dataLane: '2' },
    { type: 'blue', dataLane: '3' },
    { type: 'white', dataLane: '4' },
    { type: 'blue', dataLane: '5' },
    { type: 'white', dataLane: '6' },
  ];
  const scratch: LaneConfig = { type: 'scratch', dataLane: 'scratch' };
  return side === '1p' ? [scratch, ...keys] : [...keys, scratch];
}

export default function PlayArea({ running, bpm, hs, getLanes, side }: Props) {
  const { onKeyPress, onScratch } = useInput();

  const lanesRef = useRef<HTMLDivElement>(null);
  const playAreaRef = useRef<HTMLDivElement>(null);
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
  const laneConfig = buildLaneConfig(side);

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

  useEffect(() => {
    if (!running) return;
    return onKeyPress((idx: number) => {
      const res = judgeHit(idx, notesRef.current, performance.now());
      if (res) {
        if (res.note.el) res.note.el.remove();
        flashLane(idx);
        registerJudgment(res.judgment);
      }
    });
  }, [running, onKeyPress, flashLane, registerJudgment]);

  useEffect(() => {
    if (!running) return;
    return onScratch(() => {
      const res = judgeHit('scratch', notesRef.current, performance.now());
      if (res) {
        if (res.note.el) res.note.el.remove();
        flashLane('scratch');
        registerJudgment(res.judgment);
      }
    });
  }, [running, onScratch, flashLane, registerJudgment]);

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
      if (lanesRef.current) {
        lanesRef.current.querySelectorAll(`.${styles.note}`).forEach(n => n.remove());
      }
      if (comboRef.current) comboRef.current.style.opacity = '0';
      if (judgmentRef.current) judgmentRef.current.style.opacity = '0';
    }
  }, [running]);

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

  useGameLoop((now: number) => {
    if (!running || !lanesRef.current) return;

    const fallTime = calcFallTime(bpm, hs);
    const interval = calcNoteInterval(bpm);
    const elapsed = now - startTimeRef.current;
    const playH = playAreaRef.current?.clientHeight ?? 500;
    const judgY = playH - 60;

    if (elapsed >= 1000 && now - lastGenRef.current >= interval) {
      lastGenRef.current = now;
      const hitTime = now + fallTime;
      const { lanes, chargeDuration } = getLanes(stepRef.current);
      stepRef.current++;

      for (const lane of lanes) {
        const el = document.createElement('div');
        el.className = styles.note;

        // Charge note: taller element
        if (chargeDuration) {
          const noteH = Math.max(12, (chargeDuration / fallTime) * judgY);
          el.style.height = noteH + 'px';
          el.classList.add(styles.chargeNote);
        }

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
        const note: Note = { lane, hitTime, judged: false, el, duration: chargeDuration };
        notesRef.current.push(note);
        totalNotesRef.current++;
      }
    }

    for (let i = notesRef.current.length - 1; i >= 0; i--) {
      const note = notesRef.current[i];
      if (note.judged) continue;
      const timeLeft = note.hitTime - now;
      const progress = 1 - timeLeft / fallTime;
      const noteH = note.el ? note.el.offsetHeight : 12;
      // Anchor the bottom edge of the note at the judgment line position
      const y = progress * judgY - (noteH - 12);
      if (note.el) note.el.style.top = y + 'px';

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
      <div className={styles.playArea} ref={playAreaRef}>
        <div className={styles.lanesContainer} ref={lanesRef}>
          {laneConfig.map((cfg, i) => (
            <div
              key={i}
              className={`${styles.lane} ${styles[cfg.type === 'scratch' ? 'scratchLane' : cfg.type === 'white' ? 'whiteLane' : 'blueLane']}`}
              data-lane={cfg.dataLane}
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
