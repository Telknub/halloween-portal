import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import {
  Direction,
  MAP_OFFSET,
  MAP_OFFSET_X_RULES,
  MAP_OFFSET_Y_RULES,
  OPPOSITE_DIRECTIONS,
  OUTER_WALL_THICKNESS,
  RoomType,
  TILE_SIZE,
} from "../../HalloweenConstants";
import {
  basicRoom,
  ROOM_INNER_HEIGHT,
  ROOM_INNER_WIDTH,
  ROOM_TOTAL_HEIGHT,
  ROOM_TOTAL_WIDTH,
  TILES,
} from "./RoomTileMap";
import { BaseScene } from "features/world/scenes/BaseScene";

interface Props {
  scene: BaseScene;
  hasEntry?: boolean;
  hasExit?: boolean;
  matrix?: number[][];
  type?: RoomType;
  player?: BumpkinContainer;
}

interface CreateRandomPathProps {
  entry?: Direction | null;
  excludedSide?: Direction[];
}

export class BaseRoom {
  protected hasEntry: boolean;
  protected hasExit: boolean;
  protected type: RoomType;
  protected scene: BaseScene;
  player?: BumpkinContainer;
  id!: number;
  matrix: number[][];
  entry: Direction | null = null;
  exit: Direction | null = null;
  next: BaseRoom | null = null;
  prev: BaseRoom | null = null;
  mapOffsetMultiplier = { x: 0, y: 0 };
  relativePosition = { x: 0, y: 0 };

  constructor({
    scene,
    hasEntry = true,
    hasExit = true,
    matrix = basicRoom,
    type = "initial",
    player,
  }: Props) {
    this.matrix = JSON.parse(JSON.stringify(matrix));
    this.scene = scene;
    this.hasEntry = hasEntry;
    this.hasExit = hasExit;
    this.type = type;
    this.player = player;
  }

  createObjects(): void {
    throw new Error("Method 'createObjects' must be implemented by subclass");
  }

  createPaths() {
    if (this.hasEntry) {
      const prevExit = (this.prev as BaseRoom)?.exit as Direction;
      this.entry = this.createRandomPath({
        entry: OPPOSITE_DIRECTIONS[prevExit],
      }) as Direction;
    }
    if (this.hasExit)
      this.exit = this.createRandomPath({
        excludedSide: this.getExcludedSides,
      });
  }

  setupMapOffsetMultiplier(offsetMultiplier: { x: number; y: number }) {
    if (this.prev && this.entry) {
      const prevOffset = { ...(this.prev as BaseRoom).mapOffsetMultiplier };
      prevOffset.x += MAP_OFFSET_X_RULES[this.entry as Direction] || 0;
      prevOffset.y += MAP_OFFSET_Y_RULES[this.entry as Direction] || 0;
      this.mapOffsetMultiplier = prevOffset;
    } else {
      this.mapOffsetMultiplier = offsetMultiplier;
    }

    console.log(`Room ${this.id}:`, this.mapOffsetMultiplier);
  }

  get getOffset() {
    const offsetX =
      this.mapOffsetMultiplier.x * (ROOM_TOTAL_WIDTH * TILE_SIZE) + MAP_OFFSET;
    const offsetY =
      this.mapOffsetMultiplier.y * (ROOM_TOTAL_HEIGHT * TILE_SIZE) + MAP_OFFSET;

    return { x: offsetX, y: offsetY };
  }

  getRelativePosition(x: number, y: number) {
    return {
      x: x + this.getOffset.x,
      y: y + this.getOffset.y,
    };
  }

  protected get getContentMatrix(): number[][] {
    const submatrix: number[][] = [];

    for (let i = 0; i < ROOM_INNER_HEIGHT; i++) {
      const row = this.matrix[OUTER_WALL_THICKNESS + i]?.slice(
        OUTER_WALL_THICKNESS,
        OUTER_WALL_THICKNESS + ROOM_INNER_WIDTH,
      );
      if (row) submatrix.push(row);
    }

    return submatrix;
  }

  private get getPrevPositions() {
    const prevPositions: { x: number; y: number }[] = [];
    let prevRoom = this.prev;
    while (prevRoom) {
      prevPositions.push(prevRoom.relativePosition);
      prevRoom = prevRoom.prev;
    }
    return prevPositions;
  }

  private get getExcludedSides(): Direction[] {
    const excluded: Direction[] = [];
    const prevPositions = this.getPrevPositions;
    const sides = {
      top: { x: this.relativePosition.x, y: this.relativePosition.y - 1 },
      bottom: { x: this.relativePosition.x, y: this.relativePosition.y + 1 },
      left: { x: this.relativePosition.x - 1, y: this.relativePosition.y },
      right: { x: this.relativePosition.x + 1, y: this.relativePosition.y },
    };
    for (const [side, pos] of Object.entries(sides) as [
      Direction,
      { x: number; y: number },
    ][]) {
      if (prevPositions.some((prev) => prev.x === pos.x && prev.y === pos.y)) {
        excluded.push(side);
      }
    }
    return excluded;
  }

  private setRelativePosition(direction: Direction) {
    if (!this.next) return;
    this.next.relativePosition = { ...this.relativePosition };
    const rulesX: Partial<Record<Direction, number>> = {
      left: -1,
      right: 1,
    };
    const rulesY: Partial<Record<Direction, number>> = {
      top: -1,
      bottom: 1,
    };
    this.next.relativePosition.x += rulesX[direction] ?? 0;
    this.next.relativePosition.y += rulesY[direction] ?? 0;
  }

  private createRandomPath({ entry, excludedSide }: CreateRandomPathProps) {
    // Define possible entrance locations (top, right, bottom, left)
    const sides = ["top", "right", "bottom", "left"] as const;
    const availableSides = excludedSide?.length
      ? sides.filter((side) => !excludedSide.includes(side))
      : sides;
    const randomSide =
      entry ??
      availableSides[Math.floor(Math.random() * availableSides.length)];
    // if (this.id === 1) randomSide = !entry ? "left" : randomSide;
    // if (this.id === 2) randomSide = !entry ? "top" : randomSide;
    // if (this.id === 3) randomSide = !entry ? "top" : randomSide;
    // if (this.id === 4) randomSide = !entry ? "right" : randomSide;
    // if (this.id === 5) randomSide = !entry ? "right" : randomSide;
    // if (this.id === 6) randomSide = !entry ? "right" : randomSide;
    // if (this.id === 7) randomSide = !entry ? "top" : randomSide;

    this.setRelativePosition(randomSide);

    const width = this.matrix[0].length;
    const height = this.matrix.length;

    // Calculate entrance positions
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);

    // Create entrance (3 tiles wide, extend until hitting existing ground)
    switch (randomSide) {
      case "top": {
        const start = 0;
        const end = OUTER_WALL_THICKNESS - 1;
        for (let y = start; y <= end; y++) {
          if (this.matrix[y][centerX - 1] === TILES.GROUND) break;
          this.matrix[y][centerX - 1] =
            y === start ? TILES.TR_OUT : y === end ? TILES.BR_OUT : TILES.R_OUT;
          this.matrix[y][centerX] = TILES.GROUND;
          this.matrix[y][centerX + 1] =
            y === start ? TILES.TL_OUT : y === end ? TILES.BL_OUT : TILES.L_OUT;
        }
        break;
      }
      case "bottom": {
        const start = height - 1;
        const end = height - OUTER_WALL_THICKNESS;
        for (let y = start; y >= end; y--) {
          if (this.matrix[y][centerX - 1] === TILES.GROUND) break;
          this.matrix[y][centerX - 1] =
            y === start ? TILES.BR_OUT : y === end ? TILES.TR_OUT : TILES.R_OUT;
          this.matrix[y][centerX] = TILES.GROUND;
          this.matrix[y][centerX + 1] =
            y === start ? TILES.BL_OUT : y === end ? TILES.TL_OUT : TILES.L_OUT;
        }
        break;
      }
      case "left": {
        const start = 0;
        const end = OUTER_WALL_THICKNESS - 1;
        for (let x = start; x <= end; x++) {
          if (this.matrix[centerY - 1][x] === TILES.GROUND) break;
          this.matrix[centerY - 1][x] =
            x === start
              ? TILES.BL_OUT
              : this.type === "puzzle" || this.type === "skeleton"
                ? TILES.B_OUT
                : x === end
                  ? TILES.BR_OUT
                  : TILES.B_OUT;
          this.matrix[centerY][x] = TILES.GROUND;
          this.matrix[centerY + 1][x] =
            x === start
              ? TILES.TL_OUT
              : this.type === "puzzle" || this.type === "skeleton"
                ? TILES.T_OUT
                : x === end
                  ? TILES.TR_OUT
                  : TILES.T_OUT;
        }
        break;
      }
      case "right": {
        const start = width - 1;
        const end = width - OUTER_WALL_THICKNESS;
        for (let x = start; x >= end; x--) {
          if (this.matrix[centerY - 1][x] === TILES.GROUND) break;
          this.matrix[centerY - 1][x] =
            x === start
              ? TILES.BR_OUT
              : this.type === "puzzle" || this.type === "skeleton"
                ? TILES.B_OUT
                : x === end
                  ? TILES.BL_OUT
                  : TILES.B_OUT;
          this.matrix[centerY][x] = TILES.GROUND;
          this.matrix[centerY + 1][x] =
            x === start
              ? TILES.TR_OUT
              : this.type === "puzzle" || this.type === "skeleton"
                ? TILES.T_OUT
                : x === end
                  ? TILES.TL_OUT
                  : TILES.T_OUT;
        }
        break;
      }
    }

    return randomSide;
  }
}
