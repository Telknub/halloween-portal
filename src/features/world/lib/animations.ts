import { CONFIG } from "lib/config";
import { BumpkinParts, tokenUriBuilder } from "lib/utils/tokenUriBuilder";

export enum ANIMATION {
  attack = "attack",
  axe = "axe",
  carry = "carry",
  carry_idle = "carry-idle",
  carry_none = "carry-none",
  carry_none_idle = "carry-none-idle",
  casting = "casting",
  caught = "caught",
  death = "death",
  dig = "dig",
  doing = "doing",
  drilling = "drilling",
  hammering = "hammering",
  hurt = "hurt",
  idle = "idle",
  idle_small = "idle-small",
  jump = "jump",
  mining = "mining",
  reeling = "reeling",
  roll = "roll",
  run = "run",
  swimming = "swimming",
  waiting = "waiting",
  walking = "walking",
  walking_small = "walking-small",
  watering = "watering",
}

export const getAnimationUrl = (
  bumpkinParts: BumpkinParts,
  animation: keyof typeof ANIMATION,
) => {
  return `${CONFIG.ANIMATION_URL}/animate/0_v1_${tokenUriBuilder(bumpkinParts)}/${ANIMATION[animation]}`;
};
