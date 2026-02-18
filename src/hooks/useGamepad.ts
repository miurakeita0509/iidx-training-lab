import { useState, useRef, useCallback } from 'react';
import type { Mapping } from '../types';

export interface GamepadState {
  keys: boolean[];
  prevKeys: boolean[];
  scratchActive: boolean;
  scratchDir: number;
  scratchActiveTimer: number;
  _prevAxes: number[];
  lastScratchJudgeTime: number;
}

export function useGamepad(mapping: Mapping) {
  const [connected, setConnected] = useState(false);
  const [deviceName, setDeviceName] = useState('No Controller');
  const indexRef = useRef(-1);

  const gpState = useRef<GamepadState>({
    keys: Array(7).fill(false),
    prevKeys: Array(7).fill(false),
    scratchActive: false,
    scratchDir: 0,
    scratchActiveTimer: 0,
    _prevAxes: [],
    lastScratchJudgeTime: 0,
  });

  const mappingRef = useRef(mapping);
  mappingRef.current = mapping;

  const handleConnect = useCallback((e: GamepadEvent) => {
    indexRef.current = e.gamepad.index;
    setConnected(true);
    setDeviceName(e.gamepad.id.substring(0, 30));
  }, []);

  const handleDisconnect = useCallback(() => {
    indexRef.current = -1;
    setConnected(false);
    setDeviceName('No Controller');
  }, []);

  const poll = useCallback((
    onKeyPress: (idx: number) => void,
    onScratch: (dir: number) => void
  ) => {
    if (indexRef.current < 0) return null;
    const gp = navigator.getGamepads()[indexRef.current];
    if (!gp) return null;
    const m = mappingRef.current;
    const s = gpState.current;

    // Keys
    for (let i = 0; i < 7; i++) {
      const btnIdx = m.keys[i];
      const pressed = btnIdx < gp.buttons.length && gp.buttons[btnIdx].pressed;
      s.prevKeys[i] = s.keys[i];
      s.keys[i] = pressed;
      if (pressed && !s.prevKeys[i]) onKeyPress(i);
    }

    // Scratch detection
    let scratchDetected = false;
    let scratchDirection = 0;

    // Axis-based
    const threshold = m.scratchThreshold;
    for (let a = 0; a < gp.axes.length; a++) {
      const prev = s._prevAxes.length > a ? s._prevAxes[a] : gp.axes[a];
      const cur = gp.axes[a];
      const delta = cur - prev;
      let corrected = delta;
      if (Math.abs(delta) > 1) corrected = delta > 0 ? delta - 2 : delta + 2;
      if (Math.abs(corrected) > threshold) {
        scratchDetected = true;
        scratchDirection = corrected > 0 ? 1 : -1;
      }
    }
    s._prevAxes = Array.from(gp.axes);

    // Button-based
    if (!scratchDetected) {
      const mappedBtns = new Set(m.keys);
      if (m.scratchBtnUp >= 0 && m.scratchBtnUp < gp.buttons.length && gp.buttons[m.scratchBtnUp].pressed) {
        scratchDetected = true;
        scratchDirection = 1;
      }
      if (m.scratchBtnDown >= 0 && m.scratchBtnDown < gp.buttons.length && gp.buttons[m.scratchBtnDown].pressed) {
        scratchDetected = true;
        scratchDirection = -1;
      }
      if (!scratchDetected && m.scratchBtnUp < 0) {
        for (let b = 0; b < gp.buttons.length; b++) {
          if (mappedBtns.has(b)) continue;
          if (gp.buttons[b].pressed) {
            scratchDetected = true;
            scratchDirection = 1;
            break;
          }
        }
      }
    }

    if (scratchDetected) {
      // Rising-edge detection: only fire onScratch when scratch transitions from inactive to active.
      // This prevents BAD-hammering caused by repeated calls while the turntable is held/moving.
      if (!s.scratchActive) {
        onScratch(scratchDirection);
      }
      s.scratchActive = true;
      s.scratchDir = scratchDirection;
      s.scratchActiveTimer = 8; // ~133ms at 60fps before edge resets
    } else if (s.scratchActiveTimer > 0) {
      s.scratchActiveTimer--;
    } else {
      s.scratchActive = false;
      s.scratchDir = 0;
    }

    return gp;
  }, []);

  return { connected, deviceName, handleConnect, handleDisconnect, poll, gpState };
}
