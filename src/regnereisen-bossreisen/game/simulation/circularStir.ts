const TAU = Math.PI * 2;

export type CircularStirState = {
  centerX: number;
  centerY: number;
  minRadius: number;
  maxRadius: number;
  accumulatedAngle: number;
  lastAngle?: number;
  direction?: 1 | -1;
};

export type CircularStirUpdate = {
  state: CircularStirState;
  progress: number;
  completed: boolean;
  accepted: boolean;
};

export function createCircularStirState(
  centerX: number,
  centerY: number,
  minRadius: number,
  maxRadius: number
): CircularStirState {
  return {
    centerX,
    centerY,
    minRadius,
    maxRadius,
    accumulatedAngle: 0
  };
}

export function resetCircularStirState(state: CircularStirState): CircularStirState {
  return {
    ...state,
    accumulatedAngle: 0,
    lastAngle: undefined,
    direction: undefined
  };
}

export function updateCircularStirState(
  state: CircularStirState,
  pointerX: number,
  pointerY: number
): CircularStirUpdate {
  const dx = pointerX - state.centerX;
  const dy = pointerY - state.centerY;
  const radius = Math.hypot(dx, dy);
  if (radius < state.minRadius || radius > state.maxRadius) {
    return {
      state: { ...state, lastAngle: undefined },
      progress: Math.min(1, state.accumulatedAngle / TAU),
      completed: false,
      accepted: false
    };
  }

  const angle = Math.atan2(dy, dx);
  if (state.lastAngle === undefined) {
    return {
      state: { ...state, lastAngle: angle },
      progress: Math.min(1, state.accumulatedAngle / TAU),
      completed: false,
      accepted: true
    };
  }

  let delta = angle - state.lastAngle;
  if (delta > Math.PI) delta -= TAU;
  if (delta < -Math.PI) delta += TAU;

  // Pointer jumps are not stirring. Ignoring them keeps a fast click or a
  // dropped frame from completing the interaction accidentally.
  if (Math.abs(delta) > Math.PI / 2) {
    return {
      state: { ...state, lastAngle: angle },
      progress: Math.min(1, state.accumulatedAngle / TAU),
      completed: false,
      accepted: false
    };
  }

  const direction = state.direction ?? (Math.abs(delta) > 0.015 ? (delta > 0 ? 1 : -1) : undefined);
  const followsDirection = direction === undefined || Math.sign(delta) === direction;
  const accumulatedAngle = followsDirection
    ? state.accumulatedAngle + Math.abs(delta)
    : Math.max(0, state.accumulatedAngle - Math.abs(delta) * 0.45);
  const next = {
    ...state,
    lastAngle: angle,
    direction,
    accumulatedAngle
  };
  const progress = Math.min(1, accumulatedAngle / TAU);

  return {
    state: next,
    progress,
    completed: accumulatedAngle >= TAU,
    accepted: true
  };
}
