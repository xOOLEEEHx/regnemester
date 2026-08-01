const TAU = Math.PI * 2;
const REQUIRED_STIR_ANGLE = TAU * 0.86;
const DIRECTION_THRESHOLD = 0.008;

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

export function pauseCircularStirState(state: CircularStirState): CircularStirState {
  return {
    ...state,
    lastAngle: undefined
  };
}

export function reframeCircularStirState(
  state: CircularStirState,
  centerX: number,
  centerY: number,
  minRadius: number,
  maxRadius: number
): CircularStirState {
  return {
    ...state,
    centerX,
    centerY,
    minRadius,
    maxRadius,
    lastAngle: undefined
  };
}

export function getCircularStirProgress(state: CircularStirState): number {
  return Math.min(1, state.accumulatedAngle / REQUIRED_STIR_ANGLE);
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
      progress: getCircularStirProgress(state),
      completed: false,
      accepted: false
    };
  }

  const angle = Math.atan2(dy, dx);
  if (state.lastAngle === undefined) {
    return {
      state: { ...state, lastAngle: angle },
      progress: getCircularStirProgress(state),
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
      progress: getCircularStirProgress(state),
      completed: false,
      accepted: false
    };
  }

  const direction = state.direction
    ?? (Math.abs(delta) > DIRECTION_THRESHOLD ? (delta > 0 ? 1 : -1) : undefined);
  const followsDirection = direction === undefined || Math.sign(delta) === direction;
  const accumulatedAngle = followsDirection
    ? state.accumulatedAngle + Math.abs(delta)
    : state.accumulatedAngle;
  const next = {
    ...state,
    lastAngle: angle,
    direction,
    accumulatedAngle
  };
  const progress = Math.min(1, accumulatedAngle / REQUIRED_STIR_ANGLE);

  return {
    state: next,
    progress,
    completed: accumulatedAngle >= REQUIRED_STIR_ANGLE,
    accepted: true
  };
}
