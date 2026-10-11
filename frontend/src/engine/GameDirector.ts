export interface TargetItem {
  id: string;
  type: "crate" | "color" | "special";
  colorKey?: string;
  count: number;
  iconName?: string;
}
// Master Autonomous Candy Crush Engine & Game Director

export type SpecialType = "none" | "striped_h" | "striped_v" | "wrapped" | "color_bomb";

export interface CellData {
  color: string;
  special: SpecialType;
}

export interface UserProgress {
  coins: number;
  lives: number;
  maxLives: number;
  currentLevel: number;
  unlockedLevel: number;
  failStreak: number;
  inventory: { bomb: number; hand: number; energy: number };
}

export interface LevelConfig {
  level: number;
  moves: number;
  targetScore: number;
  crates: number[];
  targets: TargetItem[];
  theme: string;
  bgWallpaper: string;
  allowedColors: string[];
}

export class GameDirector {
  // 1. Crash-Proof Safe Execution Wrapper
  static safeRun<T>(fn: () => T, fallback: T, tag = "Operation"): T {
    try {
      return fn();
    } catch (err) {
      console.warn(`[GameDirector Auto-Heal] Suppressed error in ${tag}:`, err);
      return fallback;
    }
  }

  // 2. Dynamic Difficulty Adjustment (DDA / Lucky Board Engine)
  static getSmartSpawnColor(
    board: (string | CellData)[],
    col: number,
    failStreak: number,
    allowedColors: string[]
  ): string {
    // Agar player 2+ baar haar chuka hai (Lucky Board mode active)
    if (failStreak >= 2 && Math.random() < 0.45) {
      // Adjacent cells ka color dekh kar match favor karega
      const nearby: string[] = [];
      const left = col > 0 ? board[col - 1] : null;
      const right = col < 7 ? board[col + 1] : null;

      const getColor = (item: any) => (typeof item === "string" ? item : item?.color);
      if (left && getColor(left)) nearby.push(getColor(left));
      if (right && getColor(right)) nearby.push(getColor(right));

      if (nearby.length > 0) {
        return nearby[Math.floor(Math.random() * nearby.length)];
      }
    }
    // Normal balanced distribution
    return allowedColors[Math.floor(Math.random() * allowedColors.length)];
  }

  // 3. Special Candy Shape Recognizer (Striped, Wrapped, Color Bomb)
  static detectSpecialShape(matchIndices: number[], cols = 8): SpecialType {
    const len = matchIndices.length;
    if (len >= 5) {
      // 5-in-a-row = Color Bomb
      return "color_bomb";
    }
    if (len === 4) {
      // Check horizontal ya vertical
      const isHorizontal = Math.abs(matchIndices[1] - matchIndices[0]) === 1;
      return isHorizontal ? "striped_v" : "striped_h";
    }
    return "none";
  }

  // 4. Headless Simulation Bot (Level Playability Validator)
  static simulateLevelWinRate(cratesCount: number, moves: number): number {
    // Math-based simulation model of Candy Crush cascading
    const baseMovesNeeded = 14 + cratesCount * 0.9;
    const margin = moves - baseMovesNeeded;
    const winRate = Math.min(0.95, Math.max(0.18, 0.5 + margin * 0.04));
    return parseFloat(winRate.toFixed(2));
  }

  // 5. Procedural Level Generator with Retention Math
  static generateLevel(levelNum: number, failStreak = 0, rows = 9, cols = 8): LevelConfig {
    const palette = ["red", "blue", "green", "yellow", "purple", "orange"];
    const baseCount = levelNum > 12 ? 6 : 5;
    const allowedColors = palette.slice(0, baseCount);

    // Dynamic moves calculation
    let moves = Math.max(16, 32 - Math.floor(levelNum * 0.45));
    if (failStreak >= 3) moves += 5; // Pity system: bonus moves

    const crateCount = Math.min(3 + Math.floor(levelNum * 0.7), 22);
    const crateSet = new Set<number>();

    while (crateSet.size < crateCount) {
      const r = Math.floor(Math.random() * (rows - 2)) + 2;
      const c = Math.floor(Math.random() * cols);
      crateSet.add(r * cols + c);
    }

    const visuals = this.getLevelVisuals(levelNum);

    // Autonomous Multi-Target Builder (4-5 dynamic targets)
    const targets: TargetItem[] = [];
    
    // 1. Crates target
    if (crateSet.size > 0) {
      targets.push({ id: "crates", type: "crate", count: crateSet.size });
    }

    // 2. Candy collection targets (Level ke hisaab se color objectives)
    const targetColors = [...allowedColors].sort(() => 0.5 - Math.random()).slice(0, Math.min(3, 2 + Math.floor(levelNum / 5)));
    targetColors.forEach((color, idx) => {
      targets.push({
        id: `color_${color}`,
        type: "color",
        colorKey: color,
        count: Math.min(45, 12 + levelNum * 2 + idx * 4)
      });
    });

    // 3. Special booster target for higher levels
    if (levelNum >= 3) {
      targets.push({
        id: "color_bomb",
        type: "special",
        count: Math.min(4, 1 + Math.floor(levelNum / 10))
      });
    }

    return {
      level: levelNum,
      moves,
      targets,
      targetScore: levelNum * 1200 + crateCount * 220,
      crates: Array.from(crateSet),
      theme: visuals.theme,
      bgWallpaper: visuals.bgWallpaper,
      allowedColors,
    };
  }

  // 6. Visual Theme Orchestrator
  static getLevelVisuals(levelNum: number): { theme: string; bgWallpaper: string } {
    const themes = ["candyland", "chocolate_valley", "neon_sugar", "royal_confection"];
    const themeIdx = Math.floor((levelNum - 1) / 5) % themes.length;
    return {
      theme: themes[themeIdx],
      bgWallpaper: `theme_bg_${themes[themeIdx]}`,
    };
  }

  // 7. Deadlock Auto-Detection
  static hasValidMove(board: any[], crates: number[], rows = 9, cols = 8): boolean {
    const isCrate = (idx: number) => crates.includes(idx);
    const getColor = (item: any) => (typeof item === "string" ? item : item?.color);

    const checkMatch = (b: any[], i1: number, i2: number): boolean => {
      const copy = [...b];
      const temp = copy[i1];
      copy[i1] = copy[i2];
      copy[i2] = temp;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols - 2; c++) {
          const i = r * cols + c;
          const c1 = getColor(copy[i]);
          if (c1 && c1 === getColor(copy[i + 1]) && c1 === getColor(copy[i + 2])) return true;
        }
      }
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows - 2; r++) {
          const i = r * cols + c;
          const c1 = getColor(copy[i]);
          if (c1 && c1 === getColor(copy[i + cols]) && c1 === getColor(copy[i + cols * 2])) return true;
        }
      }
      return false;
    };

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        if (isCrate(idx) || !board[idx]) continue;

        if (c < cols - 1 && !isCrate(idx + 1) && board[idx + 1]) {
          if (checkMatch(board, idx, idx + 1)) return true;
        }
        if (r < rows - 1 && !isCrate(idx + cols) && board[idx + cols]) {
          if (checkMatch(board, idx, idx + cols)) return true;
        }
      }
    }
    return false;
  }

  // 8. Progress & Economy Self-Healing
  static sanitizeProgress(data: any): UserProgress {
    const defaultState: UserProgress = {
      coins: 100,
      lives: 5,
      maxLives: 5,
      currentLevel: 1,
      unlockedLevel: 1,
      failStreak: 0,
      inventory: { bomb: 2, hand: 3, energy: 5 },
    };

    if (!data || typeof data !== "object") return defaultState;

    return {
      coins: typeof data.coins === "number" && !isNaN(data.coins) ? Math.max(0, data.coins) : defaultState.coins,
      lives: typeof data.lives === "number" && !isNaN(data.lives) ? Math.max(0, Math.min(5, data.lives)) : defaultState.lives,
      maxLives: 5,
      currentLevel: typeof data.currentLevel === "number" ? Math.max(1, data.currentLevel) : 1,
      unlockedLevel: typeof data.unlockedLevel === "number" ? Math.max(1, data.unlockedLevel) : 1,
      failStreak: typeof data.failStreak === "number" ? Math.max(0, data.failStreak) : 0,
      inventory: {
        bomb: data.inventory?.bomb ?? 2,
        hand: data.inventory?.hand ?? 3,
        energy: data.inventory?.energy ?? 5,
      },
    };
  }

  // 9. Board Cleaner (Prevents null/blank cell freeze)
  static sanitizeBoard(board: any[], defaultCandies: string[]): any[] {
    return board.map((item) => {
      if (!item || item === "" || item === "empty") {
        return defaultCandies[Math.floor(Math.random() * defaultCandies.length)];
      }
      return item;
    });
  }
}
