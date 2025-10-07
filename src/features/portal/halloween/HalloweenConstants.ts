import { Equipped } from "features/game/types/bumpkin";
import { ITEM_DETAILS } from "features/game/types/images";
import { translate } from "lib/i18n/translate";
import { ROOM_INNER_HEIGHT, ROOM_INNER_WIDTH } from "./map/rooms/RoomTileMap";
import slidingPuzzleImg from "public/world/halloween/ForSlidingPuzzle.webp";

export type Direction = "top" | "bottom" | "left" | "right";
export type RoomType =
  | "initial"
  | "enemy"
  | "puzzle"
  | "boss"
  | "blacksmith"
  | "skeleton";

export const OPPOSITE_DIRECTIONS: Record<Direction, Direction> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

export const TILE_SIZE = 32;
export const MAP_OFFSET = TILE_SIZE * 3;
export const MAP_OFFSET_X_RULES: Partial<Record<Direction, number>> = {
  left: 1,
  right: -1,
};
export const MAP_OFFSET_Y_RULES: Partial<Record<Direction, number>> = {
  top: 1,
  bottom: -1,
};

export const OUTER_WALL_THICKNESS = 3;

export const BLACKSMITH_CONFIGURATION = {
  x: (ROOM_INNER_WIDTH * TILE_SIZE) / 2,
  y: (ROOM_INNER_HEIGHT * TILE_SIZE) / 2 + 5,
};

export const LAMPS_CONFIGURATION: { x: number; y: number }[] = [
  { x: 290, y: 120 },
  { x: 510, y: 120 },
  { x: 615, y: 200 },
  // { x: 610, y: 425 },
  { x: 480, y: 560 },
  { x: 110, y: 410 },
  // { x: 385, y: 315 },
  { x: 800, y: 110 },
  { x: 856, y: 418 },
  // { x: 1270, y: 354 },
  { x: 1468, y: 124 },
  { x: 1116, y: 134 },
  // { x: 385, y: 315 },
  { x: 1440, y: 600 },
  { x: 200, y: 965 },
  // { x: 572, y: 1106 },
  { x: 908, y: 908 },
  // { x: 1490, y: 900 },
  { x: 900, y: 1340 },
  { x: 1308, y: 1144 },
];

export const MAX_LAMPS_IN_MAP = 50;

export const INITIAL_LAMPS_LIGHT_RADIUS = 0.3;
export const JOYSTICK_LIGHT_RADIUS = 0.08;
export const MIN_PLAYER_LIGHT_RADIUS = 0.1;
export const MAX_PLAYER_LIGHT_RADIUS = 0.7;
export const MAX_PLAYER_LAMPS = 10;
export const STEP_PLAYER_LIGHT_RADIUS =
  (MAX_PLAYER_LIGHT_RADIUS - MIN_PLAYER_LIGHT_RADIUS) / MAX_PLAYER_LAMPS;

export const DURATION_GAME_OVER_WITHOUT_LAMPS_SECONDS = 10; // 10 seconds
export const DURATION_LAMP_SECONDS = 20; // 20 seconds
export const LAMP_USAGE_MULTIPLIER_INTERVAL = 45 * 1000; // 1 minute each multiplier
export const MAX_LAMP_USAGE_MULTIPLIER = 5;

export const LAMP_SPAWN_BASE_INTERVAL = 3 * 1000; // 1 seconds
export const LAMP_SPAWN_INCREASE_PERCENTAGE = 0.01;

export const UNLIMITED_ATTEMPTS_SFL = 3;
export const RESTOCK_ATTEMPTS_SFL = 1;
export const DAILY_ATTEMPTS = 5;
export const RESTOCK_ATTEMPTS = 5;

// Enemies
export const LAST_SPAWN_TIME_GHOST = 0;
export const LAST_SPAWN_TIME_ZOMBIE = 0;
export const DELAY_SPAWN_TIME = 20000; // 10 seconds dalay spawn time of the enemies in the beginning
export const UPDATE_INTERVAL = 45000; // 90 seconds time reset spawn count
export const MIN_GHOST_PER_MIN = 0; // Minimum number of ghost enemies spawned
export const MAX_GHOST_PER_MIN = 20; // Maximum ghost enemies to spawn
export const MIN_ZOMBIE_PER_MIN = 0; // Minimun number of zombie enemies spawned
export const MAX_ZOMBIE_PER_MIN = 10; // Maximum zombie enemies to spawn
export const SET_SLOW_DOWN = 0.5; // Reduce player's velocity to 50%
export const SET_SLOW_DOWN_DURATION = 5000; // Slow down for 5 seconds (5000 milliseconds)
export const ACCUMULATED_SLOWDOWN = 0; // Track total accumulated slowdown time
export const SET_VISION_RANGE = 200; // Set the vision zombies
export const AMOUNT_ENEMIES = 5;

export const ITEM_BUMPKIN = {
  x: 0,
  y: -12,
};

export const RESOURCES_TABLE: {
  [key: number]: {
    item: string;
    description: string;
  };
} = {
  0: {
    item: ITEM_DETAILS["Lamp Front"].image,
    description: translate("halloween.torchDescription"),
  },
};

export const ENEMIES_TABLE: {
  [key: number]: {
    item: string;
    description: string;
  };
} = {
  0: {
    item: ITEM_DETAILS["Ghost"].image,
    description: translate("halloween.ghostEnemyDescription"),
  },
  1: {
    item: ITEM_DETAILS["Zombie"].image,
    description: translate("halloween.zombieEnemyDescription"),
  },
};

export const SIGNS_TABLE: {
  [key: number]: {
    item: string;
    description: string;
  };
} = {
  0: {
    item: ITEM_DETAILS["Wear Sign"].image,
    description: translate("halloween.wearSignDescription"),
  },
};

export const HALLOWEEN_NPC_WEARABLES: Equipped = {
  body: "Light Brown Farmer Potion",
  hair: "White Long Hair",
  hat: "Luna's Hat",
  dress: "Witching Wardrobe",
  tool: "Witch's Broom",
  background: "Cemetery Background",
  shoes: "Brown Boots",
};

// Mini_game
export const SUDOKU_COMPLEXITY = 4;
export const SLIDING_PUZZLE_MOVESTOSOLVE = 4;
export const SLIDING_PUZZLE_IMG = slidingPuzzleImg;
export const VICTORY_TEXT = {
  Sudoku: "You got it!",
  SlidinpPuzzle: "Puzzle Solved!",
};
