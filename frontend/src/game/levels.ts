export interface LevelTarget {
  type: 'score' | 'clear_jelly' | 'break_wood' | 'rescue_bears' | 'collect_color';
  count: number;
  current?: number;
  color?: string;
}

export interface LevelConfig {
  id: number;
  moves: number;
  targetScore: number;
  targets: LevelTarget[];
  boardShape: {
    rows: number;
    cols: number;
    blockedTiles?: [number, number][];
  };
  initialJelly?: [number, number][];
  initialWood?: [number, number][];
  initialBears?: [number, number][];
}

const makeCells = (
  count: number,
  blocked: Set<string>,
  occupied: Set<string> = new Set(),
): [number, number][] => {
  const cells: [number, number][] = [];
  const preferredOrder: [number, number][] = [];

  // Keep the first objectives around the centre and lower side of the board,
  // where they are easy to see in the level preview.
  for (let r = 4; r < 8; r++) for (let c = 4; c < 8; c++) preferredOrder.push([r, c]);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) preferredOrder.push([r, c]);

  for (const [r, c] of preferredOrder) {
    const key = `${r},${c}`;
    if (blocked.has(key) || occupied.has(key)) continue;
    cells.push([r, c]);
    occupied.add(key);
    if (cells.length >= count) break;
  }
  return cells;
};

const generate50Levels = (): Record<number, LevelConfig> => {
  const levels: Record<number, LevelConfig> = {};

  for (let id = 1; id <= 50; id++) {
    const isBoss = id % 10 === 0;
    const isHard = id % 5 === 0 && !isBoss;
    const blockedTiles: [number, number][] = id > 20
      ? [[0, 0], [0, 7], [7, 0], [7, 7]]
      : [];
    const blocked = new Set(blockedTiles.map(([r, c]) => `${r},${c}`));
    const occupied = new Set<string>();
    const initialWood: [number, number][] = [];
    const initialJelly: [number, number][] = [];
    const initialBears: [number, number][] = [];
    const targetScore = 1500 + (id - 1) * 350;
    const moves = id === 8 ? 25 : isBoss ? 20 : isHard ? 24 : Math.max(18, 30 - Math.floor(id / 2));
    let targets: LevelTarget[];

    if (id <= 5) {
      targets = [{ type: 'score', count: targetScore }];
    } else if (id <= 15) {
      const woodCount = id === 8 ? 16 : Math.min(24, 4 + (id - 5) * 4);
      const jellyCount = id === 8 ? 24 : Math.min(28, 6 + (id - 5) * 4);
      initialWood.push(...makeCells(woodCount, blocked, occupied));
      initialJelly.push(...makeCells(jellyCount, blocked, occupied));
      targets = [
        { type: 'break_wood', count: woodCount },
        { type: 'clear_jelly', count: jellyCount },
      ];
    } else if (id <= 30) {
      const woodCount = Math.min(24, 8 + (id - 16) * 2);
      const jellyCount = Math.min(32, 12 + (id - 16) * 2);
      initialWood.push(...makeCells(woodCount, blocked, occupied));
      initialJelly.push(...makeCells(jellyCount, blocked, occupied));
      targets = [
        { type: 'clear_jelly', count: jellyCount },
        { type: 'break_wood', count: woodCount },
      ];
    } else {
      const bearCount = 3 + Math.floor((id - 31) / 5);
      const jellyCount = Math.min(24, 12 + Math.floor((id - 31) / 2));
      initialJelly.push(...makeCells(jellyCount, blocked, occupied));
      const available = makeCells(64, blocked, occupied);
      initialBears.push(...available.slice(0, bearCount));
      targets = [
        { type: 'rescue_bears', count: bearCount },
        { type: 'clear_jelly', count: jellyCount },
      ];
    }

    levels[id] = {
      id,
      moves,
      targetScore,
      targets,
      boardShape: { rows: 8, cols: 8, blockedTiles },
      initialWood,
      initialJelly,
      initialBears,
    };
  }

  return levels;
};

export const LEVELS_CONFIG = generate50Levels();