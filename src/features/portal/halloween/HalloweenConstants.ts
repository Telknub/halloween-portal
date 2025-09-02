import { Equipped } from "features/game/types/bumpkin";
import { ITEM_DETAILS } from "features/game/types/images";
import { translate } from "lib/i18n/translate";

export const LAMPS_CONFIGURATION: { x: number; y: number }[] = [];

export const MAX_LAMPS_IN_MAP = 50;
export const INITIAL_LAMPS_LIGHT_RADIUS = 0.3;
export const JOYSTICK_LIGHT_RADIUS = 0.08;
export const MIN_PLAYER_LIGHT_RADIUS = 0.4;
export const MAX_PLAYER_LIGHT_RADIUS = 0.7;
export const MAX_PLAYER_LAMPS = 10;
export const STEP_PLAYER_LIGHT_RADIUS =
  (MAX_PLAYER_LIGHT_RADIUS - MIN_PLAYER_LIGHT_RADIUS) / MAX_PLAYER_LAMPS;

export const DURATION_GAME_OVER_WITHOUT_LAMPS_SECONDS = 10;
export const DURATION_LAMP_SECONDS = 20;
export const LAMP_USAGE_MULTIPLIER_INTERVAL = 45 * 1000;
export const MAX_LAMP_USAGE_MULTIPLIER = 5;

export const LAMP_SPAWN_BASE_INTERVAL = 3 * 1000;
export const LAMP_SPAWN_INCREASE_PERCENTAGE = 0.01;

export const UNLIMITED_ATTEMPTS_SFL = 3;
export const RESTOCK_ATTEMPTS_SFL = 1;
export const DAILY_ATTEMPTS = 5;
export const RESTOCK_ATTEMPTS = 5;

export const LAST_SPAWN_TIME_GHOST = 0;
export const LAST_SPAWN_TIME_ZOMBIE = 0;
export const DELAY_SPAWN_TIME = 5000;
export const UPDATE_INTERVAL = 45000;
export const MAX_GHOST_PER_MIN = 3;
export const MAX_ZOMBIE_PER_MIN = 2;
export const SET_SLOW_DOWN = 0.5;
export const SET_SLOW_DOWN_DURATION = 5000;
export const ACCUMULATED_SLOWDOWN = 0;
export const SET_VISION_RANGE = 200;

export const ITEM_BUMPKIN = { x: 0, y: -12 };

export const PROC_GEN_MAP_WIDTH = 40;
export const PROC_GEN_MAP_HEIGHT = 40;
export const ROOM_MIN_SIZE = 6;
export const ROOM_MAX_SIZE = 10;
export const MAX_ROOMS = 8; 

export const TILE_MAPPING = {
  FLOOR: 4,
};

export const PLAYER_MAX_HEALTH = 3;

// CONSTANTES RESTAURADAS
export const RESOURCES_TABLE: { [key: number]: { item: string; description: string; } } = {
  0: { item: ITEM_DETAILS["Lamp Front"].image, description: translate("halloween.torchDescription") },
};

export const ENEMIES_TABLE: { [key: number]: { item: string; description: string; } } = {
  0: { item: ITEM_DETAILS["Ghost"].image, description: translate("halloween.ghostEnemyDescription") },
  1: { item: ITEM_DETAILS["Zombie"].image, description: translate("halloween.zombieEnemyDescription") },
};

export const SIGNS_TABLE: { [key: number]: { item: string; description: string; } } = {
  0: { item: ITEM_DETAILS["Wear Sign"].image, description: translate("halloween.wearSignDescription") },
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