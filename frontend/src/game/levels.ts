export type GoalProgress = {
  food: number;
  boosters: number;
  trapped: number;
};

export type LevelConfig = {
  id: number;
  name: string;
  moves: number;
  activeBirds: number;
  foodGoal?: { label: string; icon: string; target: number };
  boosterGoal?: { label: string; icon: string; target: number };
  trappedGoal?: { label: string; icon: string; target: number };
  trappedTiles: number;
};

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: "First Feasts",
    moves: 20,
    activeBirds: 4,
    foodGoal: { label: "Grains / Dana", icon: "🌾", target: 12 },
    trappedTiles: 0,
  },
  {
    id: 2,
    name: "Berry Garden",
    moves: 18,
    activeBirds: 5,
    foodGoal: { label: "Berries", icon: "🫐", target: 18 },
    trappedTiles: 0,
  },
  {
    id: 3,
    name: "Bagula Bomb",
    moves: 18,
    activeBirds: 6,
    boosterGoal: { label: "Make a Feather Bomb", icon: "🪶", target: 1 },
    trappedTiles: 0,
  },
  {
    id: 4,
    name: "Rescue the Flock",
    moves: 16,
    activeBirds: 6,
    foodGoal: { label: "Food Items", icon: "🌰", target: 25 },
    trappedGoal: { label: "Free Trapped Birds", icon: "🔓", target: 5 },
    trappedTiles: 6,
  },
  {
    id: 5,
    name: "Golden Nest",
    moves: 15,
    activeBirds: 6,
    foodGoal: { label: "Golden Seeds", icon: "🌻", target: 30 },
    boosterGoal: { label: "Super Boosters", icon: "⚡", target: 2 },
    trappedTiles: 4,
  },
  {
    id: 6,
    name: "Cage Breaker",
    moves: 15,
    activeBirds: 6,
    trappedGoal: { label: "Free Caged Birds", icon: "🔓", target: 8 },
    trappedTiles: 8,
  },
  {
    id: 7,
    name: "Sky Party",
    moves: 14,
    activeBirds: 6,
    foodGoal: { label: "Sweet Candies", icon: "🍬", target: 35 },
    boosterGoal: { label: "Feather Blasts", icon: "🪶", target: 3 },
    trappedTiles: 5,
  },
  {
    id: 8,
    name: "Stormy Flight",
    moves: 13,
    activeBirds: 6,
    foodGoal: { label: "Nectar Drops", icon: "🍯", target: 40 },
    trappedGoal: { label: "Save Allies", icon: "🔓", target: 10 },
    trappedTiles: 10,
  },
  {
    id: 9,
    name: "Rainbow Wings",
    moves: 12,
    activeBirds: 6,
    boosterGoal: { label: "Rainbow Combos", icon: "🌈", target: 4 },
    foodGoal: { label: "Magic Seeds", icon: "✨", target: 30 },
    trappedTiles: 6,
  },
  {
    id: 10,
    name: "Candy Crunch Champion",
    moves: 12,
    activeBirds: 6,
    foodGoal: { label: "Crunch Treats", icon: "👑", target: 50 },
    trappedGoal: { label: "Master Rescue", icon: "🔓", target: 12 },
    boosterGoal: { label: "Mega Blasts", icon: "💥", target: 5 },
    trappedTiles: 12,
  },
];

export const EMPTY_GOAL_PROGRESS: GoalProgress = {
  food: 0,
  boosters: 0,
  trapped: 0,
};

export function isLevelGoalComplete(level: LevelConfig, progress: GoalProgress) {
  return (
    (!level.foodGoal || progress.food >= level.foodGoal.target) &&
    (!level.boosterGoal || progress.boosters >= level.boosterGoal.target) &&
    (!level.trappedGoal || progress.trapped >= level.trappedGoal.target)
  );
}
