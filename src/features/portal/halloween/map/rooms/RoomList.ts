import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import {
  Direction,
  MAP_OFFSET_X_RULES,
  MAP_OFFSET_Y_RULES,
  OUTER_WALL_THICKNESS,
  RoomType,
  TILE_SIZE,
} from "../../HalloweenConstants";
import { BaseRoom } from "./BaseRoom";
import {
  ROOM_INNER_HEIGHT,
  ROOM_INNER_WIDTH,
  ROOM_TOTAL_HEIGHT,
  ROOM_TOTAL_WIDTH,
  TILES,
} from "./RoomTileMap";
import { EnemyRoom } from "./types/EnemyRoom";
import { BossRoom } from "./types/BossRoom";
import { InitialRoom } from "./types/InitialRoom";
import { PuzzleRoom } from "./types/PuzzleRoom";
import { BlacksmithRoom } from "./types/BlacksmithRoom";
import { SkeletonRoom } from "./types/SkeletonRoom";
import { HalloweenScene } from "../../HalloweenScene";

export class RoomList {
  private scene: HalloweenScene;
  private player?: BumpkinContainer;
  private head: BaseRoom | null = null;
  private tail: BaseRoom | null = null;
  private length = 0;
  private mapRoomSize = { width: 0, height: 0 };

  constructor(scene: HalloweenScene, player?: BumpkinContainer) {
    this.scene = scene;
    this.player = player;
  }

  append(type: RoomType): void {
    let room: BaseRoom;
    if (type === "initial") {
      room = new InitialRoom({
        scene: this.scene,
        hasEntry: false,
        player: this.player,
      });
    } else if (type === "enemy") {
      room = new EnemyRoom({
        scene: this.scene,
        player: this.player,
      });
    } else if (type === "puzzle") {
      room = new PuzzleRoom({
        scene: this.scene,
        player: this.player,
      });
    } else if (type === "blacksmith") {
      room = new BlacksmithRoom({
        scene: this.scene,
        player: this.player,
      });
    } else if (type === "skeleton") {
      room = new SkeletonRoom({
        scene: this.scene,
        player: this.player,
      });
    } else if (type === "boss") {
      room = new BossRoom({
        scene: this.scene,
        hasExit: false,
        player: this.player,
      });
    } else {
      room = new BaseRoom({
        scene: this.scene,
        player: this.player,
      });
    }

    if (!this.head) {
      this.head = room;
      this.tail = room;
    } else {
      room.prev = this.tail;
      (this.tail as BaseRoom).next = room;
      this.tail = room;
    }
    room.id = this.length + 1;
    this.length++;
  }

  setupRooms() {
    this.iterateRooms((room) => room.createPaths());
    const initialMapOffsetMultiplier = this.getInitialMapOffsetMultiplier();
    this.iterateRooms((room) =>
      room.setupMapOffsetMultiplier(initialMapOffsetMultiplier),
    );
  }

  setupObjects(wallsLayer: Phaser.Tilemaps.TilemapLayer) {
    this.iterateRooms((room) => {
      if (room.type === "enemy") {
        (room as EnemyRoom).createObjects(wallsLayer);
      } else {
        room.createObjects();
      }
    });
  }

  concatenateRooms(): number[][] {
    if (!this.head) return [];

    let finalMatrix: number[][] = this.head.matrix;
    let current = this.head.next;
    let positionRoom = { x: 0, y: 0 };

    while (current) {
      const direction = current.prev?.exit as Direction;
      const nextPositionRoom = this.setPositionRoom(
        direction,
        positionRoom,
        true,
      );
      const posX = OUTER_WALL_THICKNESS + ROOM_TOTAL_WIDTH * nextPositionRoom.x;
      const posY =
        OUTER_WALL_THICKNESS + ROOM_TOTAL_HEIGHT * nextPositionRoom.y;
      if (finalMatrix?.[posY]?.[posX]) {
        finalMatrix = this.setMatrixRoom(
          finalMatrix,
          current.matrix,
          posX,
          posY,
        );
      } else {
        const formatedMatrix = this.formatMatrix(
          current,
          finalMatrix,
          direction,
          positionRoom,
        );
        finalMatrix = this.joinMatrices(finalMatrix, formatedMatrix, direction);
        this.updateMapRoomSize(direction);
      }
      positionRoom = this.setPositionRoom(direction, positionRoom);
      current = current.next;
    }

    this.setPlayerPosition();

    return finalMatrix;
  }

  private iterateRooms(callback: (room: BaseRoom) => void) {
    if (!this.head) return;

    let current = this.head;
    while (current) {
      callback(current);
      current = current.next as BaseRoom;
    }
  }

  private formatMatrix(
    room: BaseRoom,
    finalMatrix: number[][],
    direction: Direction,
    positionRoom: { x: number; y: number },
  ) {
    const matrix = JSON.parse(JSON.stringify(room.matrix));
    if (direction === "left" || direction === "right") {
      const topPaddingFactor = positionRoom.y;
      const bottomPaddingFactor = this.mapRoomSize.height - positionRoom.y;
      const topRowsToAdd = topPaddingFactor * ROOM_TOTAL_HEIGHT;
      const bottomRowsToAdd = bottomPaddingFactor * ROOM_TOTAL_HEIGHT;
      let topRows: number[][] = [];
      let bottomRows: number[][] = [];

      // Reusable assistants
      const isLeft = direction === "left";

      const setupRows = (rowsToAdd: number, offsetY = 0) => {
        const rows = this.createMatrix(matrix[0].length, rowsToAdd);
        const start = isLeft ? rows[0].length - OUTER_WALL_THICKNESS : 0;
        const end = isLeft ? rows[0].length : OUTER_WALL_THICKNESS;
        let finalMatrixX = isLeft
          ? 0
          : finalMatrix[0].length - OUTER_WALL_THICKNESS;
        for (let x = start; x < end; x++) {
          for (let y = 0; y < rowsToAdd; y++) {
            rows[y][x] = finalMatrix[y + offsetY][finalMatrixX];
          }
          finalMatrixX++;
        }
        return rows;
      };

      // Apply top corners
      if (topRowsToAdd) {
        topRows = setupRows(topRowsToAdd);
        if (isLeft) {
          matrix[0][matrix[0].length - 2] =
            topRows[topRows.length - 1][topRows[0].length - 2] === TILES.GROUND
              ? TILES.T_OUT
              : TILES.WALL;
          matrix[0][matrix[0].length - 3] =
            topRows[topRows.length - 1][topRows[0].length - 3] === TILES.GROUND
              ? TILES.T_OUT
              : TILES.BR_IN;
        } else {
          matrix[0][1] =
            topRows[topRows.length - 1][1] === TILES.GROUND
              ? TILES.T_OUT
              : TILES.WALL;
          matrix[0][2] =
            topRows[topRows.length - 1][2] === TILES.GROUND
              ? TILES.T_OUT
              : TILES.BL_IN;
        }
      }
      // Apply bottom corners
      if (bottomRowsToAdd) {
        const bottomOffsetY = topRowsToAdd + matrix.length;
        bottomRows = setupRows(bottomRowsToAdd, bottomOffsetY);
        if (isLeft) {
          matrix[matrix.length - 1][matrix[0].length - 2] =
            bottomRows[0][bottomRows[0].length - 2] === TILES.GROUND
              ? TILES.B_OUT
              : TILES.WALL;
          matrix[matrix.length - 1][matrix[0].length - 3] =
            bottomRows[0][bottomRows[0].length - 3] === TILES.GROUND
              ? TILES.B_OUT
              : TILES.TR_IN;
        } else {
          matrix[matrix.length - 1][1] =
            bottomRows[0][1] === TILES.GROUND ? TILES.B_OUT : TILES.WALL;
          matrix[matrix.length - 1][2] =
            bottomRows[0][2] === TILES.GROUND ? TILES.B_OUT : TILES.TL_IN;
        }
      }

      return [...topRows, ...matrix, ...bottomRows];
    } else if (direction === "top" || direction === "bottom") {
      const leftPaddingFactor = positionRoom.x;
      const rightPaddingFactor = this.mapRoomSize.width - positionRoom.x;
      const leftColumnsToAdd = leftPaddingFactor * ROOM_TOTAL_WIDTH;
      const rightColumnsToAdd = rightPaddingFactor * ROOM_TOTAL_WIDTH;
      let leftColumns: number[][];
      let rightColumns: number[][];

      // Helpers
      const isTop = direction === "top";

      const setupColumns = (columnsToAdd: number, offsetX = 0) => {
        const columns = this.createMatrix(columnsToAdd, matrix.length);
        const start = isTop ? columns.length - OUTER_WALL_THICKNESS : 0;
        const end = isTop ? columns.length : OUTER_WALL_THICKNESS;
        let finalMatrixY = isTop
          ? 0
          : finalMatrix.length - OUTER_WALL_THICKNESS;
        for (let y = start; y < end; y++) {
          for (let x = 0; x < columnsToAdd; x++) {
            columns[y][x] = finalMatrix[finalMatrixY][x + offsetX];
          }
          finalMatrixY++;
        }
        return columns;
      };

      if (leftColumnsToAdd) {
        leftColumns = setupColumns(leftColumnsToAdd);
        const col = leftColumns[0].length - 1;
        if (isTop) {
          matrix[matrix.length - 2][0] =
            leftColumns[leftColumns.length - 2][col] === TILES.GROUND
              ? TILES.L_OUT
              : TILES.WALL;
          matrix[matrix.length - 3][0] =
            leftColumns[leftColumns.length - 3][col] === TILES.GROUND
              ? TILES.L_OUT
              : TILES.BR_IN;
        } else {
          matrix[1][0] =
            leftColumns[1][col] === TILES.GROUND ? TILES.L_OUT : TILES.WALL;
          matrix[2][0] =
            leftColumns[2][col] === TILES.GROUND ? TILES.L_OUT : TILES.TR_IN;
        }
      }
      if (rightColumnsToAdd) {
        const rightOffsetX = leftColumnsToAdd + matrix[0].length;
        rightColumns = setupColumns(rightColumnsToAdd, rightOffsetX);
        if (isTop) {
          matrix[matrix.length - 2][matrix[0].length - 1] =
            rightColumns[matrix.length - 2][0] === TILES.GROUND
              ? TILES.R_OUT
              : TILES.WALL;
          matrix[matrix.length - 3][matrix[0].length - 1] =
            rightColumns[matrix.length - 3][0] === TILES.GROUND
              ? TILES.R_OUT
              : TILES.BL_IN;
        } else {
          matrix[1][matrix[0].length - 1] =
            rightColumns[1][0] === TILES.GROUND ? TILES.R_OUT : TILES.WALL;
          matrix[2][matrix[0].length - 1] =
            rightColumns[2][0] === TILES.GROUND ? TILES.R_OUT : TILES.TL_IN;
        }
      }

      return matrix.map((row: number[], i: number) => [
        ...(leftColumns?.[i] ?? []),
        ...row,
        ...(rightColumns?.[i] ?? []),
      ]);
    }
  }

  private createMatrix(width: number, height: number, fill = TILES.GROUND) {
    return Array.from({ length: height }, () => Array(width).fill(fill));
  }

  private updateMapRoomSize(direction: Direction) {
    if (!direction) return;
    if (direction === "left" || direction === "right") this.mapRoomSize.width++;
    if (direction === "top" || direction === "bottom")
      this.mapRoomSize.height++;
  }

  private setPositionRoom(
    direction: Direction,
    positionRoom: { x: number; y: number },
    isNextPosition = false,
  ) {
    const position = { ...positionRoom };
    const positionXRules: Partial<Record<Direction, number>> = {
      left: -1,
      right: 1,
    };
    const positionYRules: Partial<Record<Direction, number>> = {
      top: -1,
      bottom: 1,
    };
    const x = position.x + (positionXRules[direction] || 0);
    const y = position.y + (positionYRules[direction] || 0);
    if (isNextPosition) {
      position.x = x;
      position.y = y;
    } else {
      position.x = x < 0 ? 0 : x;
      position.y = y < 0 ? 0 : y;
    }
    return position;
  }

  private getInitialMapOffsetMultiplier() {
    let current = this.head;
    const mapOffsetMultiplier = { x: 0, y: 0 };
    const maxMapOffsetMultiplier = { x: 0, y: 0 };

    while (current) {
      mapOffsetMultiplier.x +=
        MAP_OFFSET_X_RULES[current.exit as Direction] || 0;
      mapOffsetMultiplier.y +=
        MAP_OFFSET_Y_RULES[current.exit as Direction] || 0;
      maxMapOffsetMultiplier.x = Math.max(
        maxMapOffsetMultiplier.x,
        mapOffsetMultiplier.x,
      );
      maxMapOffsetMultiplier.y = Math.max(
        maxMapOffsetMultiplier.y,
        mapOffsetMultiplier.y,
      );
      current = current.next;
    }

    return {
      x: maxMapOffsetMultiplier.x < 0 ? 0 : maxMapOffsetMultiplier.x,
      y: maxMapOffsetMultiplier.y < 0 ? 0 : maxMapOffsetMultiplier.y,
    };
  }

  private setPlayerPosition() {
    if (!this.head) return [];

    const centerPositionX = (ROOM_INNER_WIDTH * TILE_SIZE) / 2;
    const centerPositionY =
      (ROOM_INNER_HEIGHT * TILE_SIZE) / 2 - TILE_SIZE * 0.8;

    this.player?.setPosition(
      centerPositionX + this.head.getOffset.x,
      centerPositionY + this.head.getOffset.y,
    );
  }

  private getValueCorner(a: number, b: number) {
    const rules: Record<string, number> = {
      [`${TILES.L_IN}-${TILES.B_IN}`]: TILES.BL_IN,
      [`${TILES.R_IN}-${TILES.B_IN}`]: TILES.BR_IN,
      [`${TILES.L_IN}-${TILES.T_IN}`]: TILES.TL_IN,
      [`${TILES.R_IN}-${TILES.T_IN}`]: TILES.TR_IN,
    };
    const key = [a, b].sort((a, b) => a - b).join("-");
    return rules?.[key];
  }

  private setMatrixRoom(
    finalMatrix: number[][],
    matrix: number[][],
    posX: number,
    posY: number,
  ) {
    const initialX = posX - OUTER_WALL_THICKNESS;
    const initialY = posY - OUTER_WALL_THICKNESS;
    const innerCorners = [TILES.TR_IN, TILES.TL_IN, TILES.BR_IN, TILES.BL_IN];
    const outerCorners = [
      TILES.TR_OUT,
      TILES.TL_OUT,
      TILES.BR_OUT,
      TILES.BL_OUT,
    ];
    for (let y = 0; y < matrix.length; y++) {
      for (let x = 0; x < matrix[0].length; x++) {
        const valueFinalMatrix = finalMatrix[y + initialY][x + initialX];
        const valueMatrix = matrix[y][x];
        const valueCorner = this.getValueCorner(valueFinalMatrix, valueMatrix);
        if (
          valueFinalMatrix === TILES.GROUND ||
          Object.values(innerCorners).includes(valueMatrix) ||
          Object.values(outerCorners).includes(valueFinalMatrix) ||
          valueMatrix === TILES.WALL
        )
          finalMatrix[y + initialY][x + initialX] = valueMatrix;

        if (valueCorner) {
          finalMatrix[y + initialY][x + initialX] = valueCorner;
        }
      }
    }
    return finalMatrix;
  }

  private joinMatrices(
    matrix1: number[][],
    matrix2: number[][],
    direction: Direction,
  ): number[][] {
    if (!direction) return matrix1;
    switch (direction) {
      case "top": {
        // Remove first rows
        const trimmedMatrix1 = matrix1.slice(
          OUTER_WALL_THICKNESS - 1,
          matrix1.length,
        );
        // Remove last row
        const trimmedMatrix2 = matrix2.slice(0, -1);
        return [...trimmedMatrix2, ...trimmedMatrix1];
      }
      case "bottom": {
        // Remove last rows
        const trimmedMatrix1 = matrix1.slice(
          0,
          -1 * (OUTER_WALL_THICKNESS - 1),
        );
        // Remove first row
        const trimmedMatrix2 = matrix2.slice(1, matrix2.length);
        return [...trimmedMatrix1, ...trimmedMatrix2];
      }
      case "left": {
        // Remove first columns from matrix1
        const trimmedMatrix1 = matrix1.map((row) =>
          row.slice(OUTER_WALL_THICKNESS - 1, row.length),
        );
        // Remove last column from matrix2
        const trimmedMatrix2 = matrix2.map((row) => row.slice(0, -1));
        return trimmedMatrix1.map((row, i) => [...trimmedMatrix2[i], ...row]);
      }
      case "right": {
        // Remove last columns from matrix1
        const trimmedMatrix1 = matrix1.map((row) =>
          row.slice(0, -1 * (OUTER_WALL_THICKNESS - 1)),
        );
        // Remove first column from matrix2
        const trimmedMatrix2 = matrix2.map((row) => row.slice(1, row.length));
        return trimmedMatrix1.map((row, i) => [...row, ...trimmedMatrix2[i]]);
      }
    }
  }
}
