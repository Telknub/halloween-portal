import { Bumpkin } from "../types/game";
import { BumpkinLevel } from "features/game/lib/level";
import { getLandLimit } from "../expansion/lib/expansionRequirements";

export const INITIAL_BUMPKIN_LEVEL = 1;

// Special case level 1 for testing expansions.
export const INITIAL_EXPANSIONS =
  INITIAL_BUMPKIN_LEVEL === 1
    ? 3
    : getLandLimit(INITIAL_BUMPKIN_LEVEL as BumpkinLevel);

export const TEST_BUMPKIN: Bumpkin = {
  id: 1,
  experience: 1000,
  tokenUri: "bla",
  equipped: {
    hair: "Pink Ponytail",
    shirt: "Sunflorian Armor",
    pants: "Sunflorian Pants",
    background: "Desert Background",
    necklace: "Green Amulet",
    body: "Beige Farmer Potion",
    shoes: "Sunflorian Sabatons",
    tool: "Sunflorian Sword",
    secondaryTool: "Paw Shield",
    hat: "Sunflorian Helmet",
    onesie: "Black Sheep Onesie",
    wings: "Bat Wings",
    coat: "Milk Apron",
  },
  // equipped: {
  //   background: "Desert Background",
  //   body: "Beige Farmer Potion",
  //   shirt: "Blue Farmer Shirt",
  //   pants: "Brown Suspenders",
  //   hair: "Basic Hair",
  //   shoes: "Black Farmer Boots",
  //   tool: "Farmer Pitchfork",

  //   // beard: "Santa Beard",
  //   // hat: "Deep Sea Helm",
  // },
  skills: {},
  achievements: {},
  activity: {
    "Reindeer Carrot Fed": 50,
    "Sunflower Planted": 5,
    "Tree Chopped": 5,
  },
};
