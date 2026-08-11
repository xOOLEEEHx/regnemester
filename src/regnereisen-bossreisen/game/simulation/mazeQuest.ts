import {
  MAZE_GATE_COUNT,
  createMazeGateDefinition,
  getMazeReward
} from '../content/mazeQuest';
import type { GameSettings } from '../content/settings';
import {
  answerMathQuestQuestion,
  createMathQuest,
  type MathQuestOptions,
  type MathQuestState
} from './mathQuest';

export type MazeDirection = 'up' | 'right' | 'down' | 'left';
export type MazeCell = { x: number; y: number; open: MazeDirection[] };
export type MazePhase = 'intro' | 'maze' | 'challenge' | 'gate-opened' | 'reward' | 'paid' | 'lost';
export type MazeQuestState = {
  phase: MazePhase;
  settings: GameSettings;
  size: number;
  cells: MazeCell[];
  player: number;
  visited: number[];
  steps: number;
  exit: number;
  gateCells: number[];
  openedGateIndices: number[];
  openedGates: number;
  activeGateIndex?: number;
  challenge?: MathQuestState;
  playerHp: number;
  maxPlayerHp: number;
  rewardValue: number;
  message: string;
};

const DIRS: readonly { name: MazeDirection; dx: number; dy: number; opposite: MazeDirection }[] = [
  { name: 'up', dx: 0, dy: -1, opposite: 'down' },
  { name: 'right', dx: 1, dy: 0, opposite: 'left' },
  { name: 'down', dx: 0, dy: 1, opposite: 'up' },
  { name: 'left', dx: -1, dy: 0, opposite: 'right' }
];

export function createMazeQuest(
  settings: GameSettings,
  options: MathQuestOptions = {}
): MazeQuestState {
  const size = 9;
  const { cells, exit, gateCells } = generateMaze(size);
  const hpProbe = createMathQuest(createMazeGateDefinition(0), settings, options);
  return {
    phase: 'intro', settings, size, cells, player: 0, visited: [0], steps: 0, exit, gateCells,
    openedGateIndices: [], openedGates: 0, playerHp: hpProbe.playerHp, maxPlayerHp: hpProbe.maxPlayerHp,
    rewardValue: getMazeReward(settings),
    message: 'Labyrintens vokter venter ved inngangen.'
  };
}

export function startMazeQuest(state: MazeQuestState): MazeQuestState {
  return state.phase === 'intro'
    ? { ...state, phase: 'maze', message: 'Gå inn i de skjulte sidegangene og let etter de fire seglene.' }
    : state;
}

export function moveInMaze(state: MazeQuestState, direction: MazeDirection): MazeQuestState {
  if (state.phase !== 'maze') return state;
  const cell = state.cells[state.player];
  if (!cell.open.includes(direction)) return { ...state, message: 'En høy hekk sperrer veien.' };
  const dir = DIRS.find((entry) => entry.name === direction)!;
  const next = (cell.y + dir.dy) * state.size + cell.x + dir.dx;
  const gateIndex = state.gateCells.indexOf(next);
  if (gateIndex >= 0 && !state.openedGateIndices.includes(gateIndex)) {
    const challenge = createMathQuest(createMazeGateDefinition(gateIndex), state.settings, {
      playerHp: state.playerHp, maxPlayerHp: state.maxPlayerHp
    });
    return { ...state, phase: 'challenge', activeGateIndex: gateIndex, challenge, message: challenge.stop.description };
  }
  if (next === state.exit && state.openedGates === MAZE_GATE_COUNT) {
    return {
      ...state,
      player: next,
      visited: addVisitedCell(state.visited, next),
      steps: state.steps + 1,
      phase: 'reward',
      message: 'Du fant utgangen og brøt alle fire seglene!'
    };
  }
  return {
    ...state,
    player: next,
    visited: addVisitedCell(state.visited, next),
    steps: state.steps + 1,
    message: next === state.exit
      ? 'Utgangen er forseglet til alle fire porter er åpnet.'
      : getExplorationMessage(state, next)
  };
}

export function answerMazeQuestion(state: MazeQuestState, answer: number): MazeQuestState {
  if (state.phase !== 'challenge' || !state.challenge) return state;
  const challenge = answerMathQuestQuestion(state.challenge, answer);
  if (challenge.status === 'lost') return { ...state, challenge, playerHp: 0, phase: 'lost', message: 'Du mistet alle hjertene. Labyrinten må startes på nytt.' };
  if (challenge.status === 'won') return { ...state, challenge, playerHp: challenge.playerHp, phase: 'gate-opened', message: challenge.stop.successText };
  return { ...state, challenge, playerHp: challenge.playerHp, message: challenge.message };
}

export function continueAfterGate(state: MazeQuestState): MazeQuestState {
  if (state.phase !== 'gate-opened' || state.activeGateIndex === undefined) return state;
  const gateIndex = state.activeGateIndex;
  const gate = state.gateCells[gateIndex];
  const openedGateIndices = [...state.openedGateIndices, gateIndex].sort((a, b) => a - b);
  const openedGates = openedGateIndices.length;
  return {
    ...state,
    phase: 'maze',
    player: gate,
    visited: addVisitedCell(state.visited, gate),
    steps: state.steps + 1,
    openedGateIndices,
    openedGates,
    activeGateIndex: undefined,
    challenge: undefined,
    message: openedGates === MAZE_GATE_COUNT
      ? 'Alle segl er brutt. Nå må du finne den skjulte utgangen!'
      : `${MAZE_GATE_COUNT - openedGates} skjulte segl gjenstår. Utforsk en ny sidegang.`
  };
}

export function getVisibleMazeCells(state: MazeQuestState, radius = 2): Set<number> {
  const visible = new Set<number>(state.visited);
  const distance = new Map<number, number>([[state.player, 0]]);
  const queue = [state.player];
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    const currentDistance = distance.get(current) ?? 0;
    visible.add(current);
    if (currentDistance >= radius) continue;
    const cell = state.cells[current];
    for (const direction of cell.open) {
      const dir = DIRS.find((entry) => entry.name === direction)!;
      const next = (cell.y + dir.dy) * state.size + cell.x + dir.dx;
      if (distance.has(next)) continue;
      distance.set(next, currentDistance + 1);
      queue.push(next);
    }
  }
  return visible;
}

export function markMazeRewardPaid(state: MazeQuestState): MazeQuestState {
  return state.phase === 'reward'
    ? { ...state, phase: 'paid', message: 'Belønningen er lagt i ryggsekken.' }
    : state;
}

function generateMaze(size: number): { cells: MazeCell[]; exit: number; gateCells: number[] } {
  const cells = Array.from({ length: size * size }, (_, i) => ({ x: i % size, y: Math.floor(i / size), open: [] as MazeDirection[] }));
  const visited = new Set<number>([0]);
  const stack = [0];
  while (stack.length) {
    const current = stack[stack.length - 1];
    const cell = cells[current];
    const choices = DIRS.map((dir) => ({ dir, x: cell.x + dir.dx, y: cell.y + dir.dy }))
      .filter(({ x, y }) => x >= 0 && y >= 0 && x < size && y < size && !visited.has(y * size + x));
    if (!choices.length) { stack.pop(); continue; }
    const pick = choices[Math.floor(Math.random() * choices.length)];
    const next = pick.y * size + pick.x;
    cell.open.push(pick.dir.name);
    cells[next].open.push(pick.dir.opposite);
    visited.add(next); stack.push(next);
  }
  const distanceFromStart = getMazeDistances(cells, size, 0);
  const exit = distanceFromStart.reduce(
    (farthest, distance, index) => distance > distanceFromStart[farthest] ? index : farthest,
    0
  );
  const gateCells = chooseHiddenGateCells(cells, size, exit, distanceFromStart);
  return { cells, exit, gateCells };
}

function chooseHiddenGateCells(
  cells: MazeCell[],
  size: number,
  exit: number,
  distanceFromStart: number[]
): number[] {
  const preferred = cells
    .map((cell, index) => ({ cell, index }))
    .filter(({ cell, index }) => cell.open.length === 1 && index !== 0 && index !== exit && distanceFromStart[index] >= size)
    .map(({ index }) => index);
  const fallback = cells
    .map((cell, index) => ({ cell, index }))
    .filter(({ cell, index }) => cell.open.length <= 2 && index !== 0 && index !== exit && !preferred.includes(index))
    .map(({ index }) => index);
  const pool = preferred.length >= MAZE_GATE_COUNT ? [...preferred] : [...preferred, ...fallback];
  const selected: number[] = [];
  const distanceMaps: number[][] = [];

  while (selected.length < MAZE_GATE_COUNT && pool.length > 0) {
    let bestPoolIndex = 0;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (let poolIndex = 0; poolIndex < pool.length; poolIndex += 1) {
      const candidate = pool[poolIndex];
      const separation = distanceMaps.length > 0
        ? Math.min(...distanceMaps.map((distances) => distances[candidate]))
        : distanceFromStart[candidate];
      const deadEndBonus = cells[candidate].open.length === 1 ? size * 1.5 : 0;
      const score = separation * 2.4 + distanceFromStart[candidate] * 0.22 + deadEndBonus + Math.random() * size;
      if (score > bestScore) {
        bestScore = score;
        bestPoolIndex = poolIndex;
      }
    }
    const [chosen] = pool.splice(bestPoolIndex, 1);
    selected.push(chosen);
    distanceMaps.push(getMazeDistances(cells, size, chosen));
  }

  return selected;
}

function getMazeDistances(cells: MazeCell[], size: number, start: number): number[] {
  const distances = Array<number>(cells.length).fill(Number.POSITIVE_INFINITY);
  distances[start] = 0;
  const queue = [start];
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    const cell = cells[current];
    for (const direction of cell.open) {
      const dir = DIRS.find((entry) => entry.name === direction)!;
      const next = (cell.y + dir.dy) * size + cell.x + dir.dx;
      if (Number.isFinite(distances[next])) continue;
      distances[next] = distances[current] + 1;
      queue.push(next);
    }
  }
  return distances;
}

function getExplorationMessage(state: MazeQuestState, player: number): string {
  const unopened = state.gateCells.filter((_, index) => !state.openedGateIndices.includes(index));
  if (unopened.length > 0) {
    const distances = getMazeDistances(state.cells, state.size, player);
    const nearestSeal = Math.min(...unopened.map((cell) => distances[cell]));
    if (nearestSeal <= 2) return 'Et kraftig blått lys pulserer bak hekken. Et segl er svært nær!';
    if (nearestSeal <= 5) return 'Vokterens runer gløder svakt. Du nærmer deg et skjult segl.';
  }
  if ((state.steps + 1) % 9 === 0) return 'Hekkene knaker rundt deg. Har du undersøkt alle sidegangene?';
  if (state.cells[player].open.length === 1) return 'En blindvei. Snu og prøv en annen gang.';
  return 'Du går dypere inn i den levende labyrinten.';
}

function addVisitedCell(visited: number[], cell: number): number[] {
  return visited.includes(cell) ? visited : [...visited, cell];
}
