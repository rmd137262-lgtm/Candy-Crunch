export interface PlayerState {
  currentLevel: number;
  highestUnlockedLevel: number;
  coins: number;
  lives: number;
  stars: Record<number, number>; // levelId -> stars (1-3)
  boosters: {
    hammer: number;
    striped: number;
    colorBomb: number;
    extraMoves: number;
  };
}

const STORAGE_KEY = 'candy_crunch_player_data_v1';

const defaultState: PlayerState = {
  currentLevel: 1,
  highestUnlockedLevel: 1,
  coins: 100,
  lives: 5,
  stars: {},
  boosters: {
    hammer: 3,
    striped: 3,
    colorBomb: 2,
    extraMoves: 2
  }
};

export class GameStateManager {
  private state: PlayerState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): PlayerState {
    try {
      const data = typeof window !== 'undefined' ? window.localStorage?.getItem(STORAGE_KEY) : null;
      if (data) {
        const saved = JSON.parse(data) as Partial<PlayerState>;
        return {
          ...defaultState,
          ...saved,
          highestUnlockedLevel: Math.max(1, Math.min(50, saved.highestUnlockedLevel ?? 1)),
          stars: { ...defaultState.stars, ...(saved.stars ?? {}) },
          boosters: { ...defaultState.boosters, ...(saved.boosters ?? {}) },
        };
      }
    } catch (e) {
      console.warn('Storage read error:', e);
    }
    return { ...defaultState };
  }

  public saveState() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      }
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }

  public getState(): PlayerState {
    return this.state;
  }

  public completeLevel(levelId: number, starsEarned: number) {
    this.state.stars[levelId] = Math.max(this.state.stars[levelId] || 0, starsEarned);
    if (levelId >= this.state.highestUnlockedLevel && levelId < 50) {
      this.state.highestUnlockedLevel = levelId + 1;
    }
    this.state.currentLevel = Math.min(50, levelId + 1);
    this.state.coins += 25 * starsEarned;
    this.saveState();
  }

  public loseLife() {
    this.state.lives = Math.max(0, this.state.lives - 1);
    this.saveState();
  }

  public buyItem(costCoins: number, itemType: keyof PlayerState['boosters'] | 'lives', count: number = 1): boolean {
    if (this.state.coins >= costCoins) {
      this.state.coins -= costCoins;
      if (itemType === 'lives') {
        this.state.lives = Math.min(5, this.state.lives + count);
      } else {
        this.state.boosters[itemType] += count;
      }
      this.saveState();
      return true;
    }
    return false;
  }

  public useBooster(type: keyof PlayerState['boosters']): boolean {
    if (this.state.boosters[type] > 0) {
      this.state.boosters[type] -= 1;
      this.saveState();
      return true;
    }
    return false;
  }
}

export const gameState = new GameStateManager();
