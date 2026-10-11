export interface LevelTarget {
  type: 'collect_color';
  count: number;
  color: string;
}

export interface LevelConfig {
  id: number;
  moves: number;
  targets: LevelTarget[];
  boardShape: {
    rows: number;
    cols: number;
    blockedTiles?: [number, number][];
  };
}

export const LEVELS_CONFIG: Record<number, LevelConfig> = {
  1: {
    id: 1,
    moves: 24,
    targets: [{ type: 'collect_color', count: 18, color: 'blue' }],
    boardShape: {
      rows: 9,
      cols: 7,
    },
  },
  2: {
    id: 2,
    moves: 22,
    targets: [{ type: 'collect_color', count: 20, color: 'red' }],
    boardShape: {
      rows: 8,
      cols: 8,
    },
  },
  3: {
    id: 3,
    moves: 24,
    targets: [{ type: 'collect_color', count: 22, color: 'green' }],
    boardShape: {
      rows: 8,
      cols: 7,
    },
  },
  4: {
    id: 4,
    moves: 25,
    targets: [{ type: 'collect_color', count: 25, color: 'orange' }],
    boardShape: {
      rows: 9,
      cols: 7,
    },
  },
  5: {
    id: 5,
    moves: 26,
    targets: [
      { type: 'collect_color', count: 20, color: 'blue' },
      { type: 'collect_color', count: 15, color: 'red' }
    ],
    boardShape: {
      rows: 9,
      cols: 7,
      blockedTiles: [
        [5, 0], [5, 1], [5, 2], [5, 3], [5, 4], [5, 5], [5, 6]
      ],
    },
  },
  6: {
    id: 6,
    moves: 25,
    targets: [
      { type: 'collect_color', count: 22, color: 'green' },
      { type: 'collect_color', count: 18, color: 'orange' }
    ],
    boardShape: {
      rows: 9,
      cols: 8,
      blockedTiles: [
        [0, 2], [0, 3], [0, 4], [0, 5],
        [1, 2], [1, 3], [1, 4], [1, 5],
        [2, 2], [2, 3], [2, 4], [2, 5],
        [3, 2], [3, 3], [3, 4], [3, 5],
        [5, 2], [5, 3], [5, 4], [5, 5],
        [6, 2], [6, 3], [6, 4], [6, 5],
        [7, 2], [7, 3], [7, 4], [7, 5],
        [8, 2], [8, 3], [8, 4], [8, 5]
      ],
    },
  },
  7: {
    id: 7,
    moves: 23,
    targets: [{ type: 'collect_color', count: 25, color: 'blue' }],
    boardShape: {
      rows: 8,
      cols: 8,
      blockedTiles: [
        [2, 2], [2, 3], [2, 4], [2, 5],
        [3, 2], [3, 3], [3, 4], [3, 5],
        [4, 2], [4, 3], [4, 4], [4, 5],
        [5, 2], [5, 3], [5, 4], [5, 5]
      ],
    },
  },
  8: {
    id: 8,
    moves: 25,
    targets: [
      { type: 'collect_color', count: 20, color: 'red' },
      { type: 'collect_color', count: 20, color: 'green' }
    ],
    boardShape: {
      rows: 9,
      cols: 8,
      blockedTiles: [
        [0, 0],
        [0, 1], [1, 1],
        [0, 2], [1, 2], [2, 2],
        [0, 3], [1, 3], [2, 3], [3, 3],
        [0, 4], [1, 4], [2, 4], [3, 4], [4, 4],
        [0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [5, 5],
        [0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 6],
        [0, 7], [1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7], [7, 7]
      ],
    },
  },
  9: {
    id: 9,
    moves: 26,
    targets: [
      { type: 'collect_color', count: 24, color: 'orange' },
      { type: 'collect_color', count: 24, color: 'blue' }
    ],
    boardShape: {
      rows: 9,
      cols: 8,
      blockedTiles: [
        [0, 0], [0, 1], [0, 6], [0, 7],
        [1, 0], [1, 1], [1, 6], [1, 7],
        [2, 0], [2, 7],
        [3, 0], [3, 7],
        [7, 0], [7, 7],
        [8, 0], [8, 1], [8, 6], [8, 7]
      ],
    },
  },
  10: {
    id: 10,
    moves: 28,
    targets: [
      { type: 'collect_color', count: 20, color: 'blue' },
      { type: 'collect_color', count: 20, color: 'red' },
      { type: 'collect_color', count: 15, color: 'green' }
    ],
    boardShape: {
      rows: 8,
      cols: 8,
      blockedTiles: [
        [0, 0], [0, 1], [1, 0],
        [0, 6], [0, 7], [1, 7],
        [6, 0], [7, 0], [7, 1],
        [6, 7], [7, 6], [7, 7]
      ],
    },
  },
};

export const LEVELS = Object.values(LEVELS_CONFIG);

export const getLevel = (levelId: number): LevelConfig => {
  return LEVELS_CONFIG[levelId] ?? LEVELS_CONFIG[1];
};
