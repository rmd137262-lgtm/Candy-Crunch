import { LevelConfig, LevelTarget } from './levels';

export type CandyColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';
export type SpecialType = 'none' | 'striped_h' | 'striped_v' | 'wrapped' | 'disco';
export type BoosterType = 'hammer' | 'striped' | 'colorBomb' | 'extraMoves';
export type BoardCoord = [number, number];

export interface Tile {
  id: string;
  color: CandyColor;
  special: SpecialType;
  hasJelly: boolean;
  hasBear: boolean;
  woodHealth: number;
}

interface MatchGroup {
  cells: BoardCoord[];
  direction: 'horizontal' | 'vertical';
}

const coordKey = ([r, c]: BoardCoord) => `${r},${c}`;

export class MatchEngine {
  public grid: (Tile | null)[][] = [];
  public rows: number;
  public cols: number;
  public score = 0;
  public movesRemaining: number;
  public clearedJelly = 0;
  public brokenWood = 0;
  public rescuedBears = 0;
  public collectedColors: Partial<Record<CandyColor, number>> = {};

  private colors: CandyColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
  private tileId = 0;

  constructor(public config: LevelConfig) {
    this.rows = config.boardShape.rows;
    this.cols = config.boardShape.cols;
    this.movesRemaining = config.moves;
    this.initBoard();
  }

  public initBoard() {
    this.grid = [];
    this.score = 0;
    this.movesRemaining = this.config.moves;
    this.clearedJelly = 0;
    this.brokenWood = 0;
    this.rescuedBears = 0;
    this.collectedColors = {};
    this.tileId = 0;

    const isBlocked = (r: number, c: number) =>
      !!this.config.boardShape.blockedTiles?.some(([br, bc]) => br === r && bc === c);

    for (let r = 0; r < this.rows; r++) {
      const row: (Tile | null)[] = [];
      this.grid.push(row);
      for (let c = 0; c < this.cols; c++) {
        if (isBlocked(r, c)) {
          row.push(null);
          continue;
        }

        const tile = this.createTile(r, c, true);
        row.push(tile);
      }
    }
  }

  private createTile(r: number, c: number, avoidStartingMatch = false): Tile {
    let color = this.getRandomColor();
    if (avoidStartingMatch) {
      let attempts = 0;
      while (this.wouldCreateMatch(r, c, color) && attempts < this.colors.length * 2) {
        color = this.getRandomColor();
        attempts++;
      }
    }

    return {
      id: `tile_${this.config.id}_${r}_${c}_${this.tileId++}`,
      color,
      special: 'none',
      hasJelly: !!this.config.initialJelly?.some(([jr, jc]) => jr === r && jc === c),
      hasBear: !!this.config.initialBears?.some(([br, bc]) => br === r && bc === c),
      woodHealth: this.config.initialWood?.some(([wr, wc]) => wr === r && wc === c) ? 2 : 0,
    };
  }

  private wouldCreateMatch(r: number, c: number, color: CandyColor): boolean {
    const matchesInDirection = (dr: number, dc: number) => {
      let length = 1;
      for (const sign of [-1, 1]) {
        let nr = r + dr * sign;
        let nc = c + dc * sign;
        while (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
          const tile = this.grid[nr]?.[nc];
          if (!tile || tile.woodHealth > 0 || tile.color !== color) break;
          length++;
          nr += dr * sign;
          nc += dc * sign;
        }
      }
      return length >= 3;
    };
    return matchesInDirection(0, 1) || matchesInDirection(1, 0);
  }

  private getRandomColor(): CandyColor {
    return this.colors[Math.floor(Math.random() * this.colors.length)];
  }

  private getMatchGroups(): MatchGroup[] {
    const groups: MatchGroup[] = [];

    for (let r = 0; r < this.rows; r++) {
      let c = 0;
      while (c < this.cols) {
        const first = this.grid[r][c];
        if (!first || first.woodHealth > 0) {
          c++;
          continue;
        }
        const start = c;
        while (c < this.cols) {
          const tile = this.grid[r][c];
          if (!tile || tile.woodHealth > 0 || tile.color !== first.color) break;
          c++;
        }
        if (c - start >= 3) {
          groups.push({
            direction: 'horizontal',
            cells: Array.from({ length: c - start }, (_, i) => [r, start + i] as BoardCoord),
          });
        }
      }
    }

    for (let c = 0; c < this.cols; c++) {
      let r = 0;
      while (r < this.rows) {
        const first = this.grid[r][c];
        if (!first || first.woodHealth > 0) {
          r++;
          continue;
        }
        const start = r;
        while (r < this.rows) {
          const tile = this.grid[r][c];
          if (!tile || tile.woodHealth > 0 || tile.color !== first.color) break;
          r++;
        }
        if (r - start >= 3) {
          groups.push({
            direction: 'vertical',
            cells: Array.from({ length: r - start }, (_, i) => [start + i, c] as BoardCoord),
          });
        }
      }
    }

    return groups;
  }

  public checkMatches(): BoardCoord[] {
    const unique = new Map<string, BoardCoord>();
    this.getMatchGroups().forEach((group) => group.cells.forEach((coord) => unique.set(coordKey(coord), coord)));
    return Array.from(unique.values());
  }

  public hasCompletedObjectives(): boolean {
    return this.config.targets.every((target) => this.getTargetProgress(target) >= target.count);
  }

  public getTargetProgress(target: LevelTarget): number {
    switch (target.type) {
      case 'score':
        return this.score;
      case 'clear_jelly':
        return this.clearedJelly;
      case 'break_wood':
        return this.brokenWood;
      case 'rescue_bears':
        return this.rescuedBears;
      case 'collect_color':
        return target.color
          ? this.collectedColors[target.color as CandyColor] ?? 0
          : Object.values(this.collectedColors).reduce((total, count) => total + (count ?? 0), 0);
      default:
        return 0;
    }
  }

  public swap(r1: number, c1: number, r2: number, c2: number): boolean {
    const tile1 = this.grid[r1]?.[c1];
    const tile2 = this.grid[r2]?.[c2];
    const isAdjacent = Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
    if (!tile1 || !tile2 || !isAdjacent || tile1.woodHealth > 0 || tile2.woodHealth > 0) return false;

    this.grid[r1][c1] = tile2;
    this.grid[r2][c2] = tile1;

    const groups = this.getMatchGroups();
    const usesSpecial = tile1.special !== 'none' || tile2.special !== 'none';
    if (groups.length === 0 && !usesSpecial) {
      this.grid[r1][c1] = tile1;
      this.grid[r2][c2] = tile2;
      return false;
    }

    this.movesRemaining = Math.max(0, this.movesRemaining - 1);
    const clear = new Map<string, BoardCoord>();
    groups.forEach((group) => group.cells.forEach((coord) => clear.set(coordKey(coord), coord)));
    if (usesSpecial && clear.size === 0) {
      clear.set(coordKey([r1, c1]), [r1, c1]);
      clear.set(coordKey([r2, c2]), [r2, c2]);
    }

    let preserve: BoardCoord | undefined;
    if (!usesSpecial) {
      const specialGroup = groups
        .filter((group) => group.cells.length >= 4)
        .sort((a, b) => b.cells.length - a.cells.length)[0];
      if (specialGroup) {
        preserve = specialGroup.cells.find(([r, c]) => r === r2 && c === c2) ?? specialGroup.cells[1];
        const specialTile = this.grid[preserve[0]][preserve[1]];
        if (specialTile) {
          specialTile.special = specialGroup.cells.length >= 5
            ? 'disco'
            : specialGroup.direction === 'horizontal' ? 'striped_h' : 'striped_v';
        }
      }
    }

    this.clearAndCascade(Array.from(clear.values()), preserve);
    return true;
  }

  private getSpecialBlast(coord: BoardCoord, tile: Tile): BoardCoord[] {
    const [r, c] = coord;
    if (tile.special === 'striped_h') {
      return Array.from({ length: this.cols }, (_, col) => [r, col] as BoardCoord);
    }
    if (tile.special === 'striped_v') {
      return Array.from({ length: this.rows }, (_, row) => [row, c] as BoardCoord);
    }
    if (tile.special === 'wrapped') {
      const cells: BoardCoord[] = [];
      for (let row = Math.max(0, r - 1); row <= Math.min(this.rows - 1, r + 1); row++) {
        for (let col = Math.max(0, c - 1); col <= Math.min(this.cols - 1, c + 1); col++) {
          cells.push([row, col]);
        }
      }
      return cells;
    }
    if (tile.special === 'disco') {
      return this.grid.flatMap((row, rowIndex) =>
        row.flatMap((candidate, colIndex) =>
          candidate?.color === tile.color ? [[rowIndex, colIndex] as BoardCoord] : [],
        ),
      );
    }
    return [];
  }

  private clearAndCascade(initialCells: BoardCoord[], preserve?: BoardCoord) {
    let pending = initialCells;
    for (let cascade = 0; cascade < 12 && pending.length > 0; cascade++) {
      const keys = new Map<string, BoardCoord>();
      pending.forEach((coord) => keys.set(coordKey(coord), coord));
      const preservedKey = preserve ? coordKey(preserve) : undefined;
      const expanded = [...keys.values()];
      const processedSpecials = new Set<string>();

      for (let i = 0; i < expanded.length; i++) {
        const coord = expanded[i];
        const key = coordKey(coord);
        if (key === preservedKey || processedSpecials.has(key)) continue;
        const tile = this.grid[coord[0]]?.[coord[1]];
        if (!tile || tile.special === 'none') continue;
        processedSpecials.add(key);
        tile.special = 'none';
        this.getSpecialBlast(coord, tile).forEach((blastCell) => {
          const blastKey = coordKey(blastCell);
          if (!keys.has(blastKey)) {
            keys.set(blastKey, blastCell);
            expanded.push(blastCell);
          }
        });
      }

      const affected = Array.from(keys.values()).filter((coord) => coordKey(coord) !== preservedKey);
      const removed: BoardCoord[] = [];
      const directlyDamagedWood = new Set<string>();

      affected.forEach(([r, c]) => {
        const tile = this.grid[r]?.[c];
        if (!tile) return;
        if (tile.woodHealth > 0) {
          directlyDamagedWood.add(coordKey([r, c]));
          return;
        }
        if (tile.hasJelly) this.clearedJelly++;
        if (tile.hasBear) this.rescuedBears++;
        this.collectedColors[tile.color] = (this.collectedColors[tile.color] ?? 0) + 1;
        this.grid[r][c] = null;
        removed.push([r, c]);
      });

      directlyDamagedWood.forEach((key) => {
        const [r, c] = key.split(',').map(Number);
        this.damageWood(r, c);
      });
      const adjacentWood = new Set<string>();
      removed.forEach(([r, c]) => {
        [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(([nr, nc]) => {
          if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
            const tile = this.grid[nr][nc];
            if (tile && tile.woodHealth > 0) adjacentWood.add(coordKey([nr, nc]));
          }
        });
      });
      adjacentWood.forEach((key) => {
        const [r, c] = key.split(',').map(Number);
        this.damageWood(r, c);
      });

      this.score += removed.length * 60;
      this.dropAndRefill();
      pending = this.checkMatches();
    }
  }

  private damageWood(r: number, c: number) {
    const tile = this.grid[r]?.[c];
    if (!tile || tile.woodHealth <= 0) return;
    tile.woodHealth--;
    if (tile.woodHealth === 0) this.brokenWood++;
  }

  public applyBooster(type: BoosterType, r: number, c: number): boolean {
    if (type === 'extraMoves') {
      this.movesRemaining += 5;
      return true;
    }

    const tile = this.grid[r]?.[c];
    if (!tile) return false;

    if (type === 'hammer') {
      if (tile.woodHealth > 0) {
        this.damageWood(r, c);
      } else {
        this.clearAndCascade([[r, c]]);
      }
      return true;
    }

    const cells: BoardCoord[] = type === 'striped'
      ? Array.from({ length: this.cols }, (_, col) => [r, col])
      : this.grid.flatMap((row, rowIndex) =>
          row.flatMap((candidate, colIndex) =>
            candidate?.color === tile.color ? [[rowIndex, colIndex] as BoardCoord] : [],
          ),
        );
    this.clearAndCascade(cells);
    return true;
  }

  public grantSpecial(type: Exclude<SpecialType, 'none'>): boolean {
    const available = this.grid.flatMap((row, r) =>
      row.flatMap((tile, c) => tile && tile.woodHealth === 0 ? [[r, c] as BoardCoord] : []),
    );
    if (available.length === 0) return false;
    const [r, c] = available[Math.floor(Math.random() * available.length)];
    const tile = this.grid[r][c];
    if (!tile) return false;
    tile.special = type;
    return true;
  }

  private dropAndRefill() {
    for (let c = 0; c < this.cols; c++) {
      let r = this.rows - 1;
      while (r >= 0) {
        if (this.grid[r][c] === null) {
          r--;
          continue;
        }

        let segmentTop = r;
        while (segmentTop > 0 && this.grid[segmentTop - 1][c] !== null) segmentTop--;
        const existing: Tile[] = [];
        for (let row = segmentTop; row <= r; row++) {
          const tile = this.grid[row][c];
          if (tile) existing.push(tile);
        }

        const writeTop = r - existing.length + 1;
        for (let row = segmentTop; row <= r; row++) this.grid[row][c] = null;
        existing.forEach((tile, index) => {
          this.grid[writeTop + index][c] = tile;
        });
        for (let row = segmentTop; row < writeTop; row++) {
          this.grid[row][c] = this.createTile(row, c);
        }
        r = segmentTop - 1;
      }
    }
  }
}