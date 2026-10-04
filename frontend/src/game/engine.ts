import { soundManager } from './soundManager';
import { LevelConfig } from './levels';

export type CandyColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';
export type SpecialType = 'none' | 'striped_h' | 'striped_v' | 'wrapped' | 'disco';

export interface Tile {
  id: string;
  color: CandyColor;
  special: SpecialType;
  hasJelly: boolean;
  woodHealth: number; // 0 = no wood, 1 = cracked, 2 = solid
}

export class MatchEngine {
  public grid: (Tile | null)[][] = [];
  public rows = 8;
  public cols = 8;
  public score = 0;
  public movesRemaining = 25;
  private colors: CandyColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

  constructor(public config: LevelConfig) {
    this.rows = config.boardShape.rows;
    this.cols = config.boardShape.cols;
    this.movesRemaining = config.moves;
    this.initBoard();
  }

  public initBoard() {
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      const row: (Tile | null)[] = [];
      for (let c = 0; c < this.cols; c++) {
        const isBlocked = this.config.boardShape.blockedTiles?.some(([br, bc]) => br === r && bc === c);
        if (isBlocked) {
          row.push(null);
          continue;
        }

        const hasJelly = !!this.config.initialJelly?.some(([jr, jc]) => jr === r && jc === c);
        const hasWood = !!this.config.initialWood?.some(([wr, wc]) => wr === r && wc === c);

        row.push({
          id: `tile_${r}_${c}_${Math.random()}`,
          color: this.getRandomColor(),
          special: 'none',
          hasJelly,
          woodHealth: hasWood ? 2 : 0
        });
      }
      this.grid.push(row);
    }
  }

  private getRandomColor(): CandyColor {
    return this.colors[Math.floor(Math.random() * this.colors.length)];
  }

  public swap(r1: number, c1: number, r2: number, c2: number): boolean {
    const tile1 = this.grid[r1]?.[c1];
    const tile2 = this.grid[r2]?.[c2];
    if (!tile1 || !tile2 || tile1.woodHealth > 0 || tile2.woodHealth > 0) return false;

    // Swap tiles
    this.grid[r1][c1] = tile2;
    this.grid[r2][c2] = tile1;

    const matches = this.checkMatches();
    if (matches.length > 0) {
      this.movesRemaining--;
      soundManager.playPop();
      this.resolveMatches(matches);
      return true;
    } else {
      // Revert swap if no match
      this.grid[r1][c1] = tile1;
      this.grid[r2][c2] = tile2;
      return false;
    }
  }

  public checkMatches(): [number, number][] {
    const matchedCoords: Set<string> = new Set();

    // Check rows
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols - 2; c++) {
        const t1 = this.grid[r][c];
        const t2 = this.grid[r][c + 1];
        const t3 = this.grid[r][c + 2];
        if (t1 && t2 && t3 && t1.color === t2.color && t2.color === t3.color) {
          matchedCoords.add(`${r},${c}`);
          matchedCoords.add(`${r},${c + 1}`);
          matchedCoords.add(`${r},${c + 2}`);
        }
      }
    }

    // Check columns
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows - 2; r++) {
        const t1 = this.grid[r][c];
        const t2 = this.grid[r + 1][c];
        const t3 = this.grid[r + 2][c];
        if (t1 && t2 && t3 && t1.color === t2.color && t2.color === t3.color) {
          matchedCoords.add(`${r},${c}`);
          matchedCoords.add(`${r + 1},${c}`);
          matchedCoords.add(`${r + 2},${c}`);
        }
      }
    }

    return Array.from(matchedCoords).map((coord) => {
      const [r, c] = coord.split(',').map(Number);
      return [r, c];
    });
  }

  public resolveMatches(matches: [number, number][]) {
    let triggeredBlast = false;

    matches.forEach(([r, c]) => {
      const tile = this.grid[r][c];
      if (tile) {
        if (tile.special !== 'none') {
          triggeredBlast = true;
        }
        if (tile.hasJelly) tile.hasJelly = false;
        this.grid[r][c] = null;
        this.score += 60;
      }
    });

    if (triggeredBlast || matches.length >= 4) {
      soundManager.playBlast();
    }

    this.dropAndRefill();
  }

  public dropAndRefill() {
    for (let c = 0; c < this.cols; c++) {
      let emptyRow = this.rows - 1;
      for (let r = this.rows - 1; r >= 0; r--) {
        if (this.grid[r][c] !== null) {
          const tile = this.grid[r][c];
          this.grid[r][c] = null;
          this.grid[emptyRow][c] = tile;
          emptyRow--;
        }
      }
      for (let r = emptyRow; r >= 0; r--) {
        this.grid[r][c] = {
          id: `tile_${r}_${c}_${Math.random()}`,
          color: this.getRandomColor(),
          special: 'none',
          hasJelly: false,
          woodHealth: 0
        };
      }
    }
  }
}
