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
  };
}

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    moves: 25,
    targets: [
      {
        type: 'collect_color',
        count: 20,
        color: 'blue',
      },
    ],
    boardShape: {
      rows: 8,
      cols: 8,
    },
  },
];

export const getLevel = (levelId: number): LevelConfig => {
  return LEVELS.find((l) => l.id === levelId) || LEVELS[0];
};
