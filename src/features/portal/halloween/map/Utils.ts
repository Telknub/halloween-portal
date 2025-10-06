import { OUTER_WALL_THICKNESS } from "../HalloweenConstants";
import {
  basicRoom,
  contentCenterRoom,
  repeat,
  ROOM_INNER_HEIGHT,
  ROOM_INNER_WIDTH,
  ROOM_WALLS,
  smallRoom,
  TILES,
} from "./rooms/RoomTileMap";

export const createRandomRoom = (): number[][] => {
  const matrix = JSON.parse(JSON.stringify(basicRoom));
  const height = ROOM_INNER_HEIGHT - 2;
  const width = ROOM_INNER_WIDTH - 2;
  const offset = OUTER_WALL_THICKNESS + 1;
  const roomWalls = createRandomWalls(width, height, ROOM_WALLS);

  for (let y = 0; y < roomWalls.length; y++) {
    for (let x = 0; x < roomWalls[0].length; x++) {
      matrix[y + offset][x + offset] = roomWalls[y][x];
    }
  }

  return matrix;
};

export const createRandomWalls = (
  width: number,
  height: number,
  wallTypes: number[][][],
): number[][] => {
  const matrix: number[][] = Array.from({ length: height }, () =>
    Array(width).fill(TILES.GROUND),
  );

  function canPlaceWallAt(
    wall: number[][],
    startY: number,
    startX: number,
  ): boolean {
    const wallHeight = wall.length;
    const wallWidth = wall[0].length;

    if (startY + wallHeight > height || startX + wallWidth > width) {
      return false;
    }

    for (let y = -1; y <= wallHeight; y++) {
      for (let x = -1; x <= wallWidth; x++) {
        const checkY = startY + y;
        const checkX = startX + x;

        if (checkY >= 0 && checkY < height && checkX >= 0 && checkX < width) {
          if (matrix[checkY][checkX] !== TILES.GROUND) {
            return false;
          }
        }
      }
    }

    return true;
  }

  function placeWall(wall: number[][], startY: number, startX: number) {
    for (let y = 0; y < wall.length; y++) {
      for (let x = 0; x < wall[y].length; x++) {
        matrix[startY + y][startX + x] = wall[y][x];
      }
    }
  }

  let stuckCounter = 0;

  while (stuckCounter < 100) {
    const wall = wallTypes[Math.floor(Math.random() * wallTypes.length)];

    let placed = false;
    for (let tries = 0; tries < 50; tries++) {
      const startY = Math.floor(Math.random() * height);
      const startX = Math.floor(Math.random() * width);

      if (canPlaceWallAt(wall, startY, startX)) {
        placeWall(wall, startY, startX);
        placed = true;
        break;
      }
    }

    if (!placed) stuckCounter++;
    else stuckCounter = 0;
  }

  return matrix;
};

export const createCenterRoom = (): number[][] => {
  const matrix = JSON.parse(JSON.stringify(basicRoom));
  const offset = OUTER_WALL_THICKNESS - 1;

  for (let y = 0; y < contentCenterRoom.length; y++) {
    for (let x = 0; x < contentCenterRoom[0].length; x++) {
      matrix[y + offset][x + offset] = contentCenterRoom[y][x];
    }
  }

  return matrix;
};

export const createSmallRoom = (): number[][] => {
  const matrix = JSON.parse(JSON.stringify(basicRoom));
  const offsetX = OUTER_WALL_THICKNESS + 3;
  const offsetY = OUTER_WALL_THICKNESS + 2;

  for (let y = 0; y < smallRoom.length; y++) {
    for (let x = 0; x < smallRoom[0].length; x++) {
      matrix[y + offsetY][x + offsetX] = smallRoom[y][x];
    }
  }

  return matrix;
};
