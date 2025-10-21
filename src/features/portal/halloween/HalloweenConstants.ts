import { Equipped } from "features/game/types/bumpkin";
import { ITEM_DETAILS } from "features/game/types/images";
import { translate } from "lib/i18n/translate";
import {
  ROOM_INNER_HEIGHT,
  ROOM_INNER_WIDTH,
  TILES,
} from "./map/rooms/RoomTileMap";

import slidingPuzzleImg from "public/world/halloween/ForSlidingPuzzle.webp";
import femur from "public/world/bone1.png";
import mandible from "public/world/bone2.png";
import spine from "public/world/bone3.png";
import clavicles from "public/world/bone4.png";
import scapula from "public/world/bone5.png";
import envy from "public/world/relic1.png";
import gluttony from "public/world/relic2.png";
import greed from "public/world/relic3.png";
import lust from "public/world/relic4.png";
import pride from "public/world/relic5.png";
import sloth from "public/world/relic6.png";
import wrath from "public/world/relic7.png";
import deceit from "public/world/relic8.webp";

export type Tools = "sword" | "lamp" | "pickaxe";
export type ToolActions = "attack" | "mining" | "enableFire";
export type HalloweenNpcNames =
  | "initial_skeleton"
  | "final_skeleton"
  | "blacksmith"
  | "owl";
export type Bones = "femur" | "mandible" | "spine" | "clavicles" | "scapula";
export type statueEffects =
  | "speedBuff"
  | "speedDebuff"
  | "damageBuff"
  | "damageDebuff"
  | "criticalBuff"
  | "spawnEnemy";
export type Damages = Partial<Record<Enemies, number>> & { all: number };
export type Enemies =
  | "ghoul"
  | "ghost"
  | "mummy"
  | "golem"
  | "finalBoss"
  | "all";
export type Relics =
  | "envy"
  | "gluttony"
  | "greed"
  | "lust"
  | "pride"
  | "sloth"
  | "wrath"
  | "deceit";
export type AnimationKeys =
  | "walk"
  | "idle"
  | "carry"
  | "carryIdle"
  | "attack"
  | "mining"
  | "enableFire";
export type Direction = "top" | "bottom" | "left" | "right";
export type RoomType =
  | "initial"
  | "enemy"
  | "puzzle"
  | "boss"
  | "blacksmith"
  | "skeleton";

export interface CodexData {
  image: string;
  description?: string;
  isFound: boolean;
}

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

export const TOOL_ACTION_MAP: Partial<Record<Tools, ToolActions>> = {
  sword: "attack",
  lamp: "enableFire",
  pickaxe: "mining",
};

export const INITIAL_SKELETON_NPC_NAME: HalloweenNpcNames = "initial_skeleton";
export const FINAL_SKELETON_NPC_NAME: HalloweenNpcNames = "final_skeleton";
export const BLACKSMITH_NPC_NAME: HalloweenNpcNames = "blacksmith";
export const OWL_NPC_NAME: HalloweenNpcNames = "owl";
export const INITIAL_SKELETON_KEY = "initial_skeleton_flow_complete";
export const FINAL_SKELETON_KEY = "final_skeleton_flow_complete";
export const BLACKSMITH_KEY = "blacksmith_flow_complete";
export const SKELETON_INITIAL_ROOM_CONFIG = {
  top: {
    x: (TILE_SIZE * (ROOM_INNER_WIDTH - 2.5)) / 2,
    y: TILE_SIZE / 2,
    direction: "right",
  },
  bottom: {
    x: (TILE_SIZE * (ROOM_INNER_WIDTH - 2.5)) / 2,
    y: TILE_SIZE * (ROOM_INNER_HEIGHT - 0.2),
    direction: "right",
  },
  left: {
    x: TILE_SIZE / 4,
    y: (TILE_SIZE * (ROOM_INNER_HEIGHT - 2.2)) / 2,
    direction: "left",
  },
  right: {
    x: TILE_SIZE * (ROOM_INNER_WIDTH - 0.2),
    y: (TILE_SIZE * (ROOM_INNER_HEIGHT - 2.2)) / 2,
    direction: "right",
  },
};
export const SKELETON_FINAL_ROOM_CONFIG = {
  x: (ROOM_INNER_WIDTH * TILE_SIZE) / 2,
  y: (ROOM_INNER_HEIGHT * TILE_SIZE) / 2,
  direction: "right",
};
export const BLACKSMITH_CONFIG = {
  x: (ROOM_INNER_WIDTH * TILE_SIZE) / 2,
  y: (ROOM_INNER_HEIGHT * TILE_SIZE) / 2 + 5,
};
export const OWL_CONFIG = {
  x: (ROOM_INNER_WIDTH * TILE_SIZE) / 2,
  y: (ROOM_INNER_HEIGHT * TILE_SIZE) / 2,
};

export const GROUND_DECORATION_CHANCE = 0.3;
export const WALL_DECORATION_CHANCE = 0.3;
export const DEFAULT_GROUND_DECORATION_CHANCE = 0.9;

export const BONE_CODEX: Record<Bones, CodexData> = {
  femur: { image: femur, isFound: false },
  mandible: { image: mandible, isFound: false },
  spine: { image: spine, isFound: false },
  clavicles: { image: clavicles, isFound: false },
  scapula: { image: scapula, isFound: false },
};
export const RELIC_CODEX: Record<Relics, CodexData> = {
  envy: {
    image: envy,
    description: translate("halloween.envyBuff"),
    isFound: false,
  },
  gluttony: {
    image: gluttony,
    description: translate("halloween.gluttonyBuff"),
    isFound: false,
  },
  greed: {
    image: greed,
    description: translate("halloween.greedBuff"),
    isFound: false,
  },
  lust: {
    image: lust,
    description: translate("halloween.lustBuff"),
    isFound: false,
  },
  pride: {
    image: pride,
    description: translate("halloween.prideBuff"),
    isFound: false,
  },
  sloth: {
    image: sloth,
    description: translate("halloween.slothBuff"),
    isFound: false,
  },
  wrath: {
    image: wrath,
    description: translate("halloween.wrathBuff"),
    isFound: false,
  },
  deceit: {
    image: deceit,
    description: translate("halloween.deceitBuff"),
    isFound: false,
  },
};
export const BONES = Object.keys(BONE_CODEX);
export const RELICS = Object.keys(RELIC_CODEX);

export const PLAYER_DAMAGE: Record<Tools, Damages> = {
  sword: {
    all: 5,
  },
  pickaxe: {
    all: 2,
    golem: 10,
  },
  lamp: {
    all: 3,
    mummy: 10,
  },
};
export const PLAYER_DAMAGE_TAKEN: Partial<Record<Enemies, number>> = {
  ghoul: 1,
  ghost: 1,
  mummy: 2,
  golem: 2,
  finalBoss: 3,
};

export const GAME_LIVES = 5;

export const GATE_CONFIG = {
  top: {
    x: (TILE_SIZE * ROOM_INNER_WIDTH) / 2,
    y: -TILE_SIZE * 1.5,
    direction: "horizontal",
  },
  bottom: {
    x: (TILE_SIZE * ROOM_INNER_WIDTH) / 2,
    y: TILE_SIZE * (ROOM_INNER_HEIGHT + 1.5),
    direction: "horizontal",
  },
  left: {
    x: -TILE_SIZE * 1.5,
    y: (TILE_SIZE * ROOM_INNER_HEIGHT) / 2,
    direction: "vertical",
  },
  right: {
    x: TILE_SIZE * (ROOM_INNER_WIDTH + 1.5),
    y: (TILE_SIZE * ROOM_INNER_HEIGHT) / 2,
    direction: "vertical",
  },
  blacksmith: {
    x: (TILE_SIZE * ROOM_INNER_WIDTH) / 2,
    y: (TILE_SIZE * ROOM_INNER_HEIGHT) / 2 + TILE_SIZE * 1.75,
    direction: "horizontal",
  },
};

export const ROOM_ID_REQUIRED_RELICS: Partial<
  Record<number | RoomType, number>
> = {
  1: 0,
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  8: 7,
  blacksmith: 6,
};

export const ENVY_BUFF_DAMAGE = 3;
export const GLUTTONY_BUFF_PERCENTAGE = 0.25;
export const GREED_BUFF_RANGE = 0.3;
export const LUST_BUFF_LIVES = {
  lives: 2,
  maxLives: 1,
};
export const PRIDE_BUFF_PERCENTAGE = 0.2;
export const SLOTH_BUFF_LIVES = 1;
export const WRATH_BUFF_PERCENTAGE = 0.3;
export const DECEIT_BUFF_PERCENTAGE = 0.2;

export interface Decoration {
  name: string;
  hasCollider?: boolean;
  hasAnimation?: boolean;
  scale?: number;
  offsetX?: number;
  offsetY?: number;
}
export const DECORATION_BORDER_CHACE = 0.2;
export const DECORATION_BORDER_CONFIG: Record<number, Decoration[]> = {
  [TILES.T_IN]: [
    { name: "pile_of_bones", offsetY: 0.25 * TILE_SIZE },
    { name: "bookshelves2", scale: 2 },
    { name: "bookshelves3", scale: 2 },
    { name: "bookshelves4", scale: 2 },
    { name: "bookshelves7", scale: 2 },
    { name: "bookshelves8", scale: 2 },
    { name: "bookshelves9", scale: 2 },
  ],
  [TILES.TL_IN]: [
    { name: "bookshelves1", scale: 2 },
    { name: "bookshelves5", scale: 2 },
    { name: "bookshelves6", scale: 2 },
    { name: "bookshelves10", scale: 2 },
  ],
  [TILES.TR_IN]: [
    { name: "bookshelves1", scale: 2 },
    { name: "bookshelves5", scale: 2 },
    { name: "bookshelves6", scale: 2 },
    { name: "bookshelves10", scale: 2 },
  ],
  [TILES.L_IN]: [
    { name: "bookshelves1", scale: 2 },
    { name: "bookshelves5", scale: 2 },
    { name: "bookshelves6", scale: 2 },
    { name: "bookshelves10", scale: 2 },
  ],
  [TILES.R_IN]: [
    { name: "bookshelves1", scale: 2 },
    { name: "bookshelves5", scale: 2 },
    { name: "bookshelves6", scale: 2 },
    { name: "bookshelves10", scale: 2 },
  ],
};
export const AMOUNT_DECORATION_GROUND = 3;
export const DECORATION_GROUND_CONFIG: Decoration[] = [
  { name: "normal_pillar" },
  { name: "damaged_pillar" },
  { name: "broken_pillar" },
];
export const DECORATION_SKELETON_CONFIG: Decoration[] = [
  { name: "raveyard", hasAnimation: true },
  { name: "hauntedTomb", hasAnimation: true },
];
export const DECORATION_BOSS_CONFIG: Position[] = [
  { x: 1 * TILE_SIZE, y: 4 * TILE_SIZE },
  { x: 3 * TILE_SIZE, y: 5 * TILE_SIZE },
  { x: 1 * TILE_SIZE, y: 6 * TILE_SIZE },
  { x: 9 * TILE_SIZE, y: 4 * TILE_SIZE },
  { x: 7 * TILE_SIZE, y: 5 * TILE_SIZE },
  { x: 9 * TILE_SIZE, y: 6 * TILE_SIZE },
  { x: 5 * TILE_SIZE, y: 6 * TILE_SIZE },
];

export const STATUE_SPEED_BUFF_PERCENTAGE = 0.25;
export const STATUE_SPEED_DEBUFF_PERCENTAGE = -0.25;
export const STATUE_DAMAGE_BUFF = 3;
export const STATUE_DAMAGE_DEBUFF = -3;
export const STATUE_CRITICAL_BUFF_PERCENTAGE = 0.2;
export const STATUE_EFFECTS: Record<statueEffects, string> = {
  speedBuff: translate("halloween.speedBuff"),
  speedDebuff: translate("halloween.speedDebuff"),
  damageBuff: translate("halloween.damageBuff"),
  damageDebuff: translate("halloween.damageDebuff"),
  criticalBuff: translate("halloween.criticalBuff"),
  spawnEnemy: "",
};

export const HOLE_CONFIG: Position = {
  x: (TILE_SIZE * ROOM_INNER_WIDTH) / 2,
  y: (TILE_SIZE * ROOM_INNER_HEIGHT) / 2,
};

// export const LAMPS_CONFIGURATION: { x: number; y: number }[] = [
//   { x: 290, y: 120 },
//   { x: 510, y: 120 },
//   { x: 615, y: 200 },
//   // { x: 610, y: 425 },
//   { x: 480, y: 560 },
//   { x: 110, y: 410 },
//   // { x: 385, y: 315 },
//   { x: 800, y: 110 },
//   { x: 856, y: 418 },
//   // { x: 1270, y: 354 },
//   { x: 1468, y: 124 },
//   { x: 1116, y: 134 },
//   // { x: 385, y: 315 },
//   { x: 1440, y: 600 },
//   { x: 200, y: 965 },
//   // { x: 572, y: 1106 },
//   { x: 908, y: 908 },
//   // { x: 1490, y: 900 },
//   { x: 900, y: 1340 },
//   { x: 1308, y: 1144 },
// ];

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
  y: -14,
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

// Enemy statistics
export const BOSS_STATS = {
  health: 10,
  damage: 10,
  attackRemove: 1000,
  config: {
    x: (ROOM_INNER_WIDTH * TILE_SIZE) / 2,
    y: TILE_SIZE,
  },
};

export const MUMMY_STATS = {
  health: 10,
  damage: 10,
  attackDelay: 1000,
  config: {
    x: (ROOM_INNER_WIDTH * TILE_SIZE) / 2,
    y: (ROOM_INNER_HEIGHT * TILE_SIZE) / 2,
  },
};

export const GOLEM_STATS = {
  health: 5,
  damage: 5,
  config: {
    x: (ROOM_INNER_WIDTH * TILE_SIZE) / 2,
    y: (ROOM_INNER_HEIGHT * TILE_SIZE) / 2,
  },
};

// Enemies Configuration
export interface Position {
  x: number;
  y: number;
  direction?: "horizontal" | "vertical";
}

export const ENEMY_STATS = {
  health: 2,
  damage: 10,
  attackDelay: 1000,
};
export const BOSS_ENEMY_SPAWN_Y_DISTANCE = 200;

const limitX = 230;
const stop_position = [
  40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 110, 130, 150,
];
const randomPosition = Math.floor(Math.random() * stop_position.length);
const position_1 = stop_position[randomPosition];
const position_2 = limitX - position_1;

export const BASICROOM_X_GUIDE: number[] = [380, 830, 1280, 1725, 2170, 2630];
export const ACTIVATE_FLAMETHROWER = {
  position_1,
  position_2,
  position_3: position_1 + position_2,
};

// Puzzle mini_game
export const SLIDING_PUZZLE_MOVESTOSOLVE = 4;
export const SLIDING_PUZZLE_IMG = slidingPuzzleImg;
export const SUDOKU_COMPLEXITY = 4;
export const VICTORY_TEXT = {
  Sudoku: "You got it!",
  SlidinpPuzzle: "Puzzle Solved!",
};
