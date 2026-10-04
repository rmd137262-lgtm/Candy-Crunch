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

const generate50Levels = (): Record<number, LevelConfig> => {
  const levels: Record<number, LevelConfig> = {};

  for (let i = 1; i <= 50; i++) {
    const isBoss = i % 10 === 0;
    const isHard = i % 5 === 0 && !isBoss;

    let targets: LevelTarget[] = [];
    let initialWood: [number, number][] = [];
    let initialJelly: [number, number][] = [];
    let initialBears: [number, number][] = [];

    // Progressive level variety
    if (i <= 5) {
      targets = [{ type: 'score', count: 1000 + i * 500 }];
    } else if (i <= 15) {
      const woodCount = Math.min(6 + (i - 5) * 2, 24);
      targets = [{ type: 'break_wood', count: woodCount }];
      for (let r = 2; r < 6; r++) {
        for (let c = 2; c < 6; c++) {
          if (initialWood.length < woodCount) initialWood.push([r, c]);
        }
      }
    } else if (i <= 30) {
      const jellyCount = Math.min(8 + (i - 15) * 2, 28);
      targets = [
        { type: 'clear_jelly', count: jellyCount },
        { type: 'break_wood', count: 12 }
      ];
      for (let r = 1; r < 7; r++) {
        for (let c = 1; c < 7; c++) {
          if (initialJelly.length < jellyCount) initialJelly.push([r, c]);
        }
      }
    } else {
      // 31 to 50: Complex targets like Soda Bears & Combo clearance
      const bearCount = 3 + Math.floor((i - 30) / 5);
      targets = [
        { type: 'rescue_bears', count: bearCount },
        { type: 'clear_jelly', count: 16 }
      ];
      for (let b = 0; b < bearCount; b++) {
        initialBears.push([3 + (b % 2), 3 + Math.floor(b / 2)]);
      }
    }

    levels[i] = {
      id: i,
      moves: isBoss ? 20 : isHard ? 24 : Math.max(18, 32 - Math.floor(i / 3)),
      targetScore: 2000 + i * 800,
      targets,
      boardShape: {
        rows: 8,
        cols: 8,
        blockedTiles: i > 20 ? [[0, 0], [0, 7], [7, 0], [7, 7]] : []
      },
      initialWood,
      initialJelly,
      initialBears
    };
  }

  return levels;
};

export const LEVELS_CONFIG = generate50Levels();
