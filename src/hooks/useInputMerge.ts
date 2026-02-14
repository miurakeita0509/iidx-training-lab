import type { GamepadState } from './useGamepad';
import type { KeyboardState } from './useKeyboard';

export interface MergedInput {
  keys: boolean[];
  scratchActive: boolean;
  scratchDir: number;
}

export function mergeInputs(
  gpState: GamepadState,
  kbState: KeyboardState
): MergedInput {
  const keys = Array(7).fill(false);
  for (let i = 0; i < 7; i++) {
    keys[i] = gpState.keys[i] || kbState.keys[i];
  }

  const scratchActive = gpState.scratchActive || kbState.scratchUp || kbState.scratchDown;
  let scratchDir = gpState.scratchDir;
  if (kbState.scratchUp) scratchDir = 1;
  if (kbState.scratchDown) scratchDir = -1;

  return { keys, scratchActive, scratchDir };
}
