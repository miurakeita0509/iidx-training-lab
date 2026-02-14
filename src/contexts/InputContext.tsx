import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import type { Mapping } from '../types';
import { DEFAULT_MAPPING } from '../types';
import { useGamepad } from '../hooks/useGamepad';
import { useKeyboard } from '../hooks/useKeyboard';
import { useGameLoop } from '../hooks/useGameLoop';
import { mergeInputs, type MergedInput } from '../hooks/useInputMerge';

interface InputContextValue {
  connected: boolean;
  deviceName: string;
  mapping: Mapping;
  setMapping: (m: Mapping) => void;
  getMergedInput: () => MergedInput;
  onKeyPress: (handler: (idx: number) => void) => () => void;
  onScratch: (handler: (dir: number) => void) => () => void;
  turntableAngle: number;
  rawGamepad: Gamepad | null;
}

const InputCtx = createContext<InputContextValue>(null!);

export function useInput() {
  return useContext(InputCtx);
}

export function InputProvider({ children }: { children: ReactNode }) {
  const [mapping, setMapping] = useState<Mapping>({ ...DEFAULT_MAPPING });
  const { connected, deviceName, handleConnect, handleDisconnect, poll, gpState } = useGamepad(mapping);

  const keyPressHandlers = useRef<Set<(idx: number) => void>>(new Set());
  const scratchHandlers = useRef<Set<(dir: number) => void>>(new Set());

  const fireKeyPress = useCallback((idx: number) => {
    keyPressHandlers.current.forEach(h => h(idx));
  }, []);
  const fireScratch = useCallback((dir: number) => {
    scratchHandlers.current.forEach(h => h(dir));
  }, []);

  const { getState: getKbState } = useKeyboard(fireKeyPress, fireScratch);

  const turntableAngleRef = useRef(0);
  const [turntableAngle, setTurntableAngle] = useState(0);
  const rawGamepadRef = useRef<Gamepad | null>(null);

  // Gamepad connect/disconnect events
  useEffect(() => {
    window.addEventListener('gamepadconnected', handleConnect);
    window.addEventListener('gamepaddisconnected', handleDisconnect);
    return () => {
      window.removeEventListener('gamepadconnected', handleConnect);
      window.removeEventListener('gamepaddisconnected', handleDisconnect);
    };
  }, [handleConnect, handleDisconnect]);

  // Game loop: poll gamepad + update visualizer
  useGameLoop(() => {
    const gp = poll(fireKeyPress, fireScratch);
    rawGamepadRef.current = gp;
    const merged = mergeInputs(gpState.current, getKbState());
    if (merged.scratchActive) {
      turntableAngleRef.current += merged.scratchDir * 15;
      setTurntableAngle(turntableAngleRef.current);
    }
  });

  const getMergedInput = useCallback(() => {
    return mergeInputs(gpState.current, getKbState());
  }, [gpState, getKbState]);

  const onKeyPress = useCallback((handler: (idx: number) => void) => {
    keyPressHandlers.current.add(handler);
    return () => { keyPressHandlers.current.delete(handler); };
  }, []);

  const onScratch = useCallback((handler: (dir: number) => void) => {
    scratchHandlers.current.add(handler);
    return () => { scratchHandlers.current.delete(handler); };
  }, []);

  return (
    <InputCtx.Provider value={{
      connected,
      deviceName,
      mapping,
      setMapping,
      getMergedInput,
      onKeyPress,
      onScratch,
      turntableAngle,
      rawGamepad: rawGamepadRef.current,
    }}>
      {children}
    </InputCtx.Provider>
  );
}
