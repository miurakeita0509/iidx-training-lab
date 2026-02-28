import { useState, useCallback, useRef, useEffect } from 'react';
import type { Side, LaneResult } from '../../types';
import type { Chart } from '../../data/charts';
import { ALL_CHARTS, getChartLanes } from '../../data/charts';
import PlayArea from '../PlayArea/PlayArea';
import type { PlayResult } from '../PlayArea/PlayArea';
import styles from './SongPlay.module.css';

interface Props {
  side: Side;
}

type Screen = 'select' | 'playing' | 'result';

export default function SongPlay({ side }: Props) {
  const [screen, setScreen] = useState<Screen>('select');
  const [selectedChart, setSelectedChart] = useState<Chart | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<PlayResult | null>(null);
  const [randomEnabled, setRandomEnabled] = useState(false);
  const [usedRandom, setUsedRandom] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chartEndedRef = useRef(false);
  const randomPermRef = useRef<number[]>([0, 1, 2, 3, 4, 5, 6]);

  function generatePerm() {
    const perm = [0, 1, 2, 3, 4, 5, 6];
    for (let i = perm.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    randomPermRef.current = perm;
  }

  // Clean up audio on unmount or screen change
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  function stopAudio() {
    if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }

  function handleSelectSong(chart: Chart) {
    setSelectedChart(chart);
    chartEndedRef.current = false;
    setUsedRandom(randomEnabled);
    if (randomEnabled) generatePerm();
    setRunning(true);
    setScreen('playing');

    // Start audio after PlayArea's 1000ms warmup
    const src = `${import.meta.env.BASE_URL}${chart.audioFile}`;
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    audioRef.current.src = src;
    audioRef.current.loop = false;
    audioRef.current.volume = 0.8;

    audioTimerRef.current = setTimeout(() => {
      audioRef.current?.play().catch(() => {});
    }, 1000);
  }

  function handleStop(res: PlayResult) {
    setRunning(false);
    stopAudio();
    setResult(res);
    setScreen('result');
  }

  function handleBackToSelect() {
    stopAudio();
    setRunning(false);
    setSelectedChart(null);
    setResult(null);
    chartEndedRef.current = false;
    setScreen('select');
  }

  const maxChartStep = selectedChart
    ? Math.max(...selectedChart.notes.map(n => n.step))
    : 0;

  const getLanes = useCallback((step: number): LaneResult => {
    if (!selectedChart) return { lanes: [] };

    // Auto-stop after chart ends (3 bars buffer = 48 steps)
    if (step > maxChartStep + 48 && !chartEndedRef.current) {
      chartEndedRef.current = true;
      setTimeout(() => setRunning(false), 800);
    }

    const raw = getChartLanes(selectedChart, step);
    if (!usedRandom) return raw;

    const perm = randomPermRef.current;
    return {
      ...raw,
      lanes: raw.lanes.map(l => (typeof l === 'number' ? perm[l] : l)),
    };
  }, [selectedChart, maxChartStep, usedRandom]);

  // ─── Song Select Screen ───────────────────────────────────────────────
  if (screen === 'select') {
    return (
      <div className={styles.selectScreen}>
        <div className={styles.selectHeader}>
          <span className={styles.selectTitle}>SONG SELECT</span>
          <span className={styles.selectSub}>{ALL_CHARTS.length} song{ALL_CHARTS.length !== 1 ? 's' : ''}</span>
          <button
            className={`${styles.randomBtn} ${randomEnabled ? styles.randomActive : ''}`}
            onClick={() => setRandomEnabled(v => !v)}
          >
            🔀 RANDOM
          </button>
        </div>
        <div className={styles.songList}>
          {ALL_CHARTS.map(chart => (
            <button
              key={chart.id}
              className={styles.songRow}
              onClick={() => handleSelectSong(chart)}
            >
              <span className={styles.songNote}>♪</span>
              <div className={styles.songInfo}>
                <span className={styles.songTitle}>{chart.title}</span>
                {chart.artist && <span className={styles.songArtist}>{chart.artist}</span>}
              </div>
              <div className={styles.songMeta}>
                <span className={styles.songBpm}>BPM {chart.bpm}</span>
                <span className={`${styles.diffBadge} ${styles[chart.difficulty.toLowerCase()]}`}>
                  {chart.difficulty}
                </span>
                <span className={styles.songLevel}>Lv.{chart.level}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── Playing Screen ───────────────────────────────────────────────────
  if (screen === 'playing' && selectedChart) {
    return (
      <div className={styles.playScreen}>
        <div className={styles.playHeader}>
          <span className={styles.playTitle}>{selectedChart.title}</span>
          <span className={`${styles.diffBadge} ${styles[selectedChart.difficulty.toLowerCase()]}`}>
            {selectedChart.difficulty}
          </span>
          <span className={styles.playLevel}>Lv.{selectedChart.level}</span>
          {usedRandom && <span className={styles.randomBadge}>🔀 RANDOM</span>}
          <button className={styles.abortBtn} onClick={() => {
            setRunning(false);
            stopAudio();
            setScreen('select');
          }}>✕ 中断</button>
        </div>
        <PlayArea
          running={running}
          bpm={selectedChart.bpm}
          hs={2}
          getLanes={getLanes}
          side={side}
          onStop={handleStop}
        />
      </div>
    );
  }

  // ─── Result Screen ────────────────────────────────────────────────────
  if (screen === 'result' && result && selectedChart) {
    const diffClass = selectedChart.difficulty.toLowerCase();
    return (
      <div className={styles.resultScreen}>
        <div className={styles.resultHeader}>
          <span className={styles.resultSongTitle}>{selectedChart.title}</span>
          <span className={`${styles.diffBadge} ${styles[diffClass]}`}>
            {selectedChart.difficulty}
          </span>
          <span className={styles.resultLevel}>Lv.{selectedChart.level}</span>
          {usedRandom && <span className={styles.randomBadge}>🔀 RANDOM</span>}
        </div>

        <div className={styles.scoreBox}>
          <div className={styles.scoreLabel}>SCORE</div>
          <div className={styles.scoreValue}>{result.score.toLocaleString()}</div>
        </div>

        <div className={styles.resultStats}>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>精度</span>
            <span className={styles.statValue}>{result.accuracy}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>MAX COMBO</span>
            <span className={styles.statValue}>{result.maxCombo}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>TOTAL NOTES</span>
            <span className={styles.statValue}>{result.totalNotes}</span>
          </div>
        </div>

        <div className={styles.judgmentGrid}>
          {(
            [
              ['P-GREAT', result.judgments.pgreat, '#ffd700'],
              ['GREAT',   result.judgments.great,   '#ffaa00'],
              ['GOOD',    result.judgments.good,     '#44cc44'],
              ['BAD',     result.judgments.bad,      '#cc4444'],
              ['POOR',    result.judgments.poor,     '#888888'],
            ] as [string, number, string][]
          ).map(([label, count, color]) => (
            <div key={label} className={styles.judgmentItem}>
              <span className={styles.judgmentLabel} style={{ color }}>{label}</span>
              <span className={styles.judgmentCount}>{count}</span>
            </div>
          ))}
        </div>

        <button className={styles.backBtn} onClick={handleBackToSelect}>
          ← 曲選択に戻る
        </button>
      </div>
    );
  }

  return null;
}
