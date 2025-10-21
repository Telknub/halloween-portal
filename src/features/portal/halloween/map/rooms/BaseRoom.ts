import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import {
  Direction,
  GATE_CONFIG,
  MAP_OFFSET,
  MAP_OFFSET_X_RULES,
  MAP_OFFSET_Y_RULES,
  OPPOSITE_DIRECTIONS,
  OUTER_WALL_THICKNESS,
  RoomType,
  TILE_SIZE,
  Position,
  DECORATION_BORDER_CHACE,
  DECORATION_BORDER_CONFIG,
  AMOUNT_DECORATION_GROUND,
} from "../../HalloweenConstants";
import {
  basicRoom,
  ROOM_INNER_HEIGHT,
  ROOM_INNER_WIDTH,
  ROOM_TOTAL_HEIGHT,
  ROOM_TOTAL_WIDTH,
  smallRoom,
  TILES,
} from "./RoomTileMap";
import { HalloweenScene } from "../../HalloweenScene";
import { StatueContainer } from "../../containers/StatueContainer";
import { BoneContainer } from "../../containers/BoneContainer";
import { LampContainer } from "../../containers/LampContainer";
import { PickaxeContainer } from "../../containers/PickaxeContainer";
import { RelicContainer } from "../../containers/RelicContainer";
import { GateContainer } from "../../containers/GateContainer";
import { DecorationContainer } from "../../containers/DecorationContainer";
import { HoleContainer } from "../../containers/HoleContainer";

interface Props {
  scene: HalloweenScene;
  hasEntry?: boolean;
  hasExit?: boolean;
  matrix?: number[][];
  type?: RoomType;
  player?: BumpkinContainer;
}

interface CreateRandomPathProps {
  entry?: Direction | null;
  excludedSides?: Direction[];
}

export class BaseRoom {
  protected hasEntry: boolean;
  protected hasExit: boolean;
  protected scene: HalloweenScene;
  type: RoomType;
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

  getmapOffsetMultiplierX() {
    return this.mapOffsetMultiplier.x;
  }

  createPaths() {
    if (this.hasEntry) {
      const prevExit = (this.prev as BaseRoom)?.exit as Direction;
      this.entry = this.createRandomPath({
        entry: OPPOSITE_DIRECTIONS[prevExit],
      }) as Direction;
    }
    if (this.hasExit) {
      const excludedSides = this.getExcludedSides;
      this.exit = this.createRandomPath({
        excludedSides,
      });
    }
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

  private getAdjacentPositions({ x, y }: { x: number; y: number }) {
    return {
      top: { x, y: y - 1 },
      bottom: { x, y: y + 1 },
      left: { x: x - 1, y },
      right: { x: x + 1, y },
    } as const;
  }

  private excludeSides(currentPosition: { x: number; y: number }): Direction[] {
    const prevPositions = this.getPrevPositions;
    const adjacent = this.getAdjacentPositions(currentPosition);

    const excluded = (
      Object.entries(adjacent) as [Direction, { x: number; y: number }][]
    )
      .filter(([_, pos]) =>
        prevPositions.some((prev) => prev.x === pos.x && prev.y === pos.y),
      )
      .map(([side]) => side);

    if (this.type === "skeleton") excluded.push("bottom");

    return excluded;
  }

  private get getExcludedSides(): Direction[] {
    const sides: Direction[] = ["top", "right", "bottom", "left"];
    const adjacent = this.getAdjacentPositions(this.relativePosition);
    const excluded = new Set(this.excludeSides(this.relativePosition));

    for (const side of sides) {
      if (excluded.has(side)) continue;

      const nextExcluded = this.next?.excludeSides(adjacent[side]) ?? [];
      const allSidesExcluded =
        nextExcluded.length === sides.length &&
        sides.every((s) => nextExcluded.includes(s));

      if (allSidesExcluded) excluded.add(side);
    }

    return [...excluded];
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

  protected spawnObjectRandomly(
    addContainer: (x: number, y: number) => void,
    excludeSmallRoom = false,
  ) {
    let isGround = false;

    while (!isGround) {
      const width = this.getContentMatrix[0].length;
      const height = this.getContentMatrix.length;
      const tileX = Math.floor(Math.random() * (width - 2)) + 1;
      const tileY = Math.floor(Math.random() * (height - 2)) + 1;
      const posX = tileX * TILE_SIZE;
      const posY = tileY * TILE_SIZE;
      const { x, y } = this.getRelativePosition(posX, posY);
      const isInsideSmallRoom =
        tileX >= 3 &&
        tileX <= 3 + smallRoom[0].length &&
        tileY >= 2 &&
        tileY <= 2 + smallRoom.length;

      if (
        this.getContentMatrix[tileY][tileX] === TILES.GROUND &&
        !this.scene.objectsWithCollider.some(
          (pos) => pos.x === x && pos.y === y,
        ) &&
        (!excludeSmallRoom || !isInsideSmallRoom)
      ) {
        addContainer(x, y);
        isGround = true;
      }
    }
  }

  protected createStatues(x: number, y: number) {
    new StatueContainer({
      x,
      y,
      id: this.id,
      scene: this.scene,
      player: this.player,
    });
  }

  protected createBones(x: number, y: number) {
    new BoneContainer({
      x,
      y,
      scene: this.scene,
      player: this.player,
    });
  }

  protected createPickaxe(x: number, y: number) {
    new PickaxeContainer({
      x,
      y,
      scene: this.scene,
      player: this.player,
    });
  }

  protected createLamp(x: number, y: number) {
    new LampContainer({
      x,
      y,
      id: this.id,
      scene: this.scene,
      player: this.player,
    });
  }

  protected createRelic(x: number, y: number, isCentered = false) {
    new RelicContainer({
      x,
      y,
      scene: this.scene,
      isCentered,
      player: this.player,
    });
  }

  protected createHole(x: number, y: number, maxScale = 1, isCentered = false) {
    new HoleContainer({
      x,
      y,
      scene: this.scene,
      id: this.id,
      maxScale,
      isCentered,
      player: this.player,
    });
  }

  protected createGate(roomName?: RoomType) {
    const gate = roomName ?? (this.id === 8 ? this.entry : this.exit);
    const { x, y } = this.getRelativePosition(
      GATE_CONFIG[gate as Direction].x,
      GATE_CONFIG[gate as Direction].y,
    );
    return new GateContainer({
      x,
      y,
      scene: this.scene,
      id: this.id,
      direction: GATE_CONFIG[gate as Direction].direction,
      roomName: roomName,
      player: this.player,
    });
  }

  private createDecoration(x: number, y: number, tile: number) {
    const tileOffsets: Record<number, { x: number; y: number }> = {
      [TILES.TL_IN]: { x: 0.5, y: 0 },
      [TILES.L_IN]: { x: 0.5, y: 0 },
    };

    const offset = tileOffsets?.[tile] ?? { x: 0, y: 0 };

    const { x: posX, y: posY } = this.getRelativePosition(
      (x + offset.x) * TILE_SIZE,
      (y + offset.y) * TILE_SIZE,
    );

    new DecorationContainer({
      x: posX,
      y: posY,
      scene: this.scene,
      tile,
      player: this.player,
    });
  }

  protected createDecorationBorderRandomly(excludeSmallRoom = false) {
    const offset = OUTER_WALL_THICKNESS;
    for (let y = -1; y <= this.getContentMatrix.length; y++) {
      for (let x = -1; x <= this.getContentMatrix[0].length; x++) {
        const tile = this.matrix[y + offset][x + offset];
        if (!(tile in DECORATION_BORDER_CONFIG)) continue;
        const isInsideSmallRoom =
          x >= 3 &&
          x <= 3 + smallRoom[0].length &&
          y >= 2 &&
          y <= 2 + smallRoom.length;
        if (
          Math.random() < DECORATION_BORDER_CHACE &&
          (!excludeSmallRoom || !isInsideSmallRoom)
        ) {
          this.createDecoration(x, y, tile);
        }
      }
    }
  }

  protected createDecorationGroundRandomly(excludeSmallRoom = false) {
    for (let i = 0; i < AMOUNT_DECORATION_GROUND; i++) {
      this.spawnObjectRandomly((x, y) => {
        new DecorationContainer({
          x,
          y,
          scene: this.scene,
          player: this.player,
        });
      }, excludeSmallRoom);
    }
  }

  protected createDecorationRandomly({
    hasDecorationBorder = true,
    hasDecorationGround = false,
    excludeSmallRoom = false,
  } = {}) {
    hasDecorationBorder &&
      this.createDecorationBorderRandomly(excludeSmallRoom);
    hasDecorationGround &&
      this.createDecorationGroundRandomly(excludeSmallRoom);
  }

  private createRandomPath({ entry, excludedSides }: CreateRandomPathProps) {
    // Define possible entrance locations (top, right, bottom, left)
    const sides = ["top", "right", "bottom", "left"] as const;
    const availableSides = excludedSides?.length
      ? sides.filter((side) => !excludedSides.includes(side))
      : sides;
    const randomSide =
      entry ??
      availableSides[Math.floor(Math.random() * availableSides.length)];
    // if (this.id === 1) randomSide = !entry ? "top" : randomSide;
    // if (this.id === 2) randomSide = !entry ? "top" : randomSide;
    // if (this.id === 3) randomSide = !entry ? "left" : randomSide;
    // if (this.id === 4) randomSide = !entry ? "left" : randomSide;
    // if (this.id === 5) randomSide = !entry ? "bottom" : randomSide;
    // if (this.id === 6) randomSide = !entry ? "right" : randomSide;
    // if (this.id === 7) randomSide = !entry ? "right" : randomSide;

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
