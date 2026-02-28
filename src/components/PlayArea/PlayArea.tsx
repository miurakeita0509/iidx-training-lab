import { useEffect, useRef, useState, useCallback } from 'react';
import type { Note, Lane, JudgmentType, FastSlow, JudgmentCounts, LaneResult, Side } from '../../types';
import { JUDGMENT_COLORS, JUDGMENT_LABELS, JUDGMENT_WINDOWS, FAST_SLOW_COLORS, JUDGMENT_OFFSET_KEY } from '../../types';
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
  onStop?: (result: PlayResult) => void; // if provided, result overlay is skipped
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

function getJudgmentOffset(): number {
  const stored = localStorage.getItem(JUDGMENT_OFFSET_KEY);
  if (stored === null) return 0;
  const val = parseInt(stored, 10);
  return isNaN(val) ? 0 : val;
}

export default function PlayArea({ running, bpm, hs, getLanes, side, onStop }: Props) {
  const { onKeyPress, onScratch } = useInput();

  const lanesRef = useRef<HTMLDivElement>(null);
  const playAreaRef = useRef<HTMLDivElement>(null);
  const judgmentRef = useRef<HTMLDivElement>(null);
  const fastSlowRef = useRef<HTMLDivElement>(null);
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
  const offsetRef = useRef(0);
  const pendingScratchTimeRef = useRef(0); // timestamp of last scratch that didn't hit a note

  const [result, setResult] = useState<PlayResult | null>(null);
  const laneConfig = buildLaneConfig(side);

  // Read offset from localStorage on start
  useEffect(() => {
    if (running) {
      offsetRef.current = getJudgmentOffset();
    }
  }, [running]);

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

  const showJudgment = useCallback((type: JudgmentType, fastSlow: FastSlow) => {
    if (!judgmentRef.current) return;
    judgmentRef.current.textContent = JUDGMENT_LABELS[type];
    judgmentRef.current.style.color = JUDGMENT_COLORS[type];
    judgmentRef.current.style.opacity = '1';

    // FAST/SLOW display
    if (fastSlowRef.current) {
      if (fastSlow) {
        fastSlowRef.current.textContent = fastSlow.toUpperCase();
        fastSlowRef.current.style.color = FAST_SLOW_COLORS[fastSlow];
        fastSlowRef.current.style.opacity = '1';
      } else {
        fastSlowRef.current.style.opacity = '0';
      }
    }

    clearTimeout(judgmentTimerRef.current);
    judgmentTimerRef.current = window.setTimeout(() => {
      if (judgmentRef.current) judgmentRef.current.style.opacity = '0';
      if (fastSlowRef.current) fastSlowRef.current.style.opacity = '0';
    }, 300);
  }, []);

  const registerJudgment = useCallback((type: JudgmentType, fastSlow: FastSlow = null) => {
    judgmentsRef.current[type]++;
    showJudgment(type, fastSlow);

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
      const res = judgeHit(idx, notesRef.current, performance.now(), offsetRef.current);
      if (res) {
        if (res.note.el) res.note.el.remove();
        flashLane(idx);
        registerJudgment(res.judgment, res.fastSlow);
      }
    });
  }, [running, onKeyPress, flashLane, registerJudgment]);

  useEffect(() => {
    if (!running) return;
    return onScratch(() => {
      const now = performance.now();
      const res = judgeHit('scratch', notesRef.current, now, offsetRef.current);
      if (res) {
        if (res.note.el) res.note.el.remove();
        flashLane('scratch');
        registerJudgment(res.judgment, res.fastSlow);
        pendingScratchTimeRef.current = 0; // consumed
      } else {
        // No scratch note in range yet — save timestamp so the game loop
        // can retroactively judge when a note enters the window.
        pendingScratchTimeRef.current = now;
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
      if (fastSlowRef.current) fastSlowRef.current.style.opacity = '0';
      pendingScratchTimeRef.current = 0;
    }
  }, [running]);

  useEffect(() => {
    if (!running && totalNotesRef.current > 0 && !result) {
      const j = judgmentsRef.current;
      const r: PlayResult = {
        judgments: { ...j },
        maxCombo: maxComboRef.current,
        score: scoreRef.current,
        totalNotes: totalNotesRef.current,
        accuracy: calcAccuracy(j.pgreat, j.great, totalNotesRef.current),
      };
      if (onStop) {
        onStop(r); // delegate result display to parent
      } else {
        setResult(r);
      }
    }
  }, [running, result, onStop]);

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

      if (timeLeft < -JUDGMENT_WINDOWS.bad) {
        note.judged = true;
        if (note.el) note.el.remove();
        registerJudgment('poor');
        notesRef.current.splice(i, 1);
      }
    }

    // Deferred scratch judgment: if the user scratched slightly early (before the note
    // entered the BAD window), we saved the timestamp. Now check if any scratch note
    // has entered the window since that pending scratch — if so, judge it.
    // This consumes the pending scratch (1 motion = 1 note, matching real IIDX).
    if (pendingScratchTimeRef.current > 0) {
      const scratchAge = now - pendingScratchTimeRef.current;
      if (scratchAge <= JUDGMENT_WINDOWS.bad) {
        const res = judgeHit('scratch', notesRef.current, pendingScratchTimeRef.current, offsetRef.current);
        if (res) {
          if (res.note.el) res.note.el.remove();
          flashLane('scratch');
          registerJudgment(res.judgment, res.fastSlow);
          pendingScratchTimeRef.current = 0;
        }
      } else {
        // Too old — discard
        pendingScratchTimeRef.current = 0;
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
        <div className={styles.fastSlowDisplay} ref={fastSlowRef} />
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
