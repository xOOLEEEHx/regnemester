export type LightForestPoint = {
  x: number;
  y: number;
};

export type LightForestStageLayout = {
  width: number;
  height: number;
  topSafeHeight: number;
  bottomSafeHeight: number;
  branchHub: LightForestPoint;
  spiritStart: LightForestPoint;
  gates: LightForestPoint[];
};

export type LightForestNetworkLayout = {
  width: number;
  height: number;
  topSafeHeight: number;
  bottomSafeHeight: number;
  board: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  heart: LightForestPoint;
  trees: LightForestPoint[];
  answerMotes: LightForestPoint[];
  routes: LightForestPoint[][];
  junctions: LightForestPoint[][];
};

const GATE_X_RATIOS = [0.13, 0.37, 0.63, 0.87] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function createLightForestStageLayout(
  width: number,
  height: number,
  renderScale: number
): LightForestStageLayout {
  const safeScale = Math.max(0.65, renderScale);
  const topSafeHeight = clamp(height * 0.13, 84 * safeScale, 128 * safeScale);
  const bottomSafeHeight = clamp(height * 0.15, 96 * safeScale, 142 * safeScale);
  const playableHeight = Math.max(300 * safeScale, height - topSafeHeight - bottomSafeHeight);
  const gateY = topSafeHeight + playableHeight * 0.2;
  const spiritY = height - bottomSafeHeight - Math.max(36 * safeScale, playableHeight * 0.045);
  const branchHubY = spiritY - playableHeight * 0.25;

  return {
    width,
    height,
    topSafeHeight,
    bottomSafeHeight,
    branchHub: { x: width * 0.5, y: branchHubY },
    spiritStart: { x: width * 0.5, y: spiritY },
    gates: GATE_X_RATIOS.map((ratio) => ({ x: width * ratio, y: gateY }))
  };
}

export function sampleLightForestLane(
  layout: LightForestStageLayout,
  laneIndex: number,
  segments = 32
): LightForestPoint[] {
  const gate = layout.gates[Math.max(0, Math.min(layout.gates.length - 1, laneIndex))];
  const start = layout.spiritStart;
  const hub = layout.branchHub;
  const safeSegments = Math.max(4, Math.floor(segments));
  const points: LightForestPoint[] = [];

  for (let index = 0; index <= safeSegments; index += 1) {
    const t = index / safeSegments;
    if (t <= 0.28) {
      const localT = t / 0.28;
      const eased = localT * localT * (3 - 2 * localT);
      points.push({
        x: start.x + (hub.x - start.x) * eased,
        y: start.y + (hub.y - start.y) * eased
      });
      continue;
    }

    const localT = (t - 0.28) / 0.72;
    const inverse = 1 - localT;
    const controlOne = {
      x: hub.x + (gate.x - hub.x) * 0.24,
      y: hub.y - (hub.y - gate.y) * 0.12
    };
    const controlTwo = {
      x: gate.x,
      y: gate.y + (hub.y - gate.y) * 0.46
    };
    points.push({
      x: inverse ** 3 * hub.x
        + 3 * inverse ** 2 * localT * controlOne.x
        + 3 * inverse * localT ** 2 * controlTwo.x
        + localT ** 3 * gate.x,
      y: inverse ** 3 * hub.y
        + 3 * inverse ** 2 * localT * controlOne.y
        + 3 * inverse * localT ** 2 * controlTwo.y
        + localT ** 3 * gate.y
    });
  }

  points[0] = { ...start };
  points[points.length - 1] = { ...gate };
  return points;
}

const NETWORK_IMAGE_ASPECT = 1536 / 936;
const TREE_RATIOS = [
  { x: 0.301, y: 0.252 },
  { x: 0.731, y: 0.254 },
  { x: 0.885, y: 0.624 },
  { x: 0.5, y: 0.621 },
  { x: 0.17, y: 0.624 }
] as const;
const JUNCTION_RATIOS = [
  [0.34, 0.68],
  [0.34, 0.68],
  [0.29, 0.52, 0.75],
  [0.57],
  [0.29, 0.52, 0.75]
] as const;

function cubicPoint(
  start: LightForestPoint,
  controlOne: LightForestPoint,
  controlTwo: LightForestPoint,
  end: LightForestPoint,
  t: number
): LightForestPoint {
  const inverse = 1 - t;
  return {
    x: inverse ** 3 * start.x
      + 3 * inverse ** 2 * t * controlOne.x
      + 3 * inverse * t ** 2 * controlTwo.x
      + t ** 3 * end.x,
    y: inverse ** 3 * start.y
      + 3 * inverse ** 2 * t * controlOne.y
      + 3 * inverse * t ** 2 * controlTwo.y
      + t ** 3 * end.y
  };
}

export function createLightForestNetworkLayout(
  width: number,
  height: number,
  renderScale: number
): LightForestNetworkLayout {
  const safeScale = Math.max(0.65, renderScale);
  const topSafeHeight = clamp(height * 0.13, 82 * safeScale, 126 * safeScale);
  const bottomSafeHeight = clamp(height * 0.13, 84 * safeScale, 122 * safeScale);
  const availableWidth = Math.max(520 * safeScale, width - 20 * safeScale);
  const availableHeight = Math.max(320 * safeScale, height - topSafeHeight - bottomSafeHeight);
  const boardWidth = Math.min(availableWidth, availableHeight * NETWORK_IMAGE_ASPECT);
  const boardHeight = boardWidth / NETWORK_IMAGE_ASPECT;
  const board = {
    x: (width - boardWidth) / 2,
    y: topSafeHeight + (availableHeight - boardHeight) / 2,
    width: boardWidth,
    height: boardHeight
  };
  const toBoardPoint = (x: number, y: number): LightForestPoint => ({
    x: board.x + board.width * x,
    y: board.y + board.height * y
  });
  const heart = toBoardPoint(0.5, 0.459);
  const trees = TREE_RATIOS.map((point) => toBoardPoint(point.x, point.y));
  const routes = trees.map((tree, index) => {
    const side = index === 0 || index === 4 ? -1 : index === 1 || index === 2 ? 1 : 0;
    const controlOne = {
      x: heart.x + (tree.x - heart.x) * 0.3 + side * board.width * 0.015,
      y: heart.y + (tree.y - heart.y) * 0.16
    };
    const controlTwo = {
      x: heart.x + (tree.x - heart.x) * 0.72 - side * board.width * 0.018,
      y: heart.y + (tree.y - heart.y) * 0.78
    };
    return Array.from({ length: 49 }, (_, pointIndex) => (
      cubicPoint(heart, controlOne, controlTwo, tree, pointIndex / 48)
    ));
  });
  const junctions = routes.map((route, index) => (
    JUNCTION_RATIOS[index].map((ratio) => (
      route[Math.round((route.length - 1) * ratio)]
    ))
  ));
  const answerRadiusX = Math.min(board.width * 0.09, 112 * safeScale);
  const answerRadiusY = Math.min(board.height * 0.105, 76 * safeScale);

  return {
    width,
    height,
    topSafeHeight,
    bottomSafeHeight,
    board,
    heart,
    trees,
    answerMotes: [
      { x: heart.x - answerRadiusX, y: heart.y - answerRadiusY },
      { x: heart.x + answerRadiusX, y: heart.y - answerRadiusY },
      { x: heart.x - answerRadiusX, y: heart.y + answerRadiusY },
      { x: heart.x + answerRadiusX, y: heart.y + answerRadiusY }
    ],
    routes,
    junctions
  };
}
