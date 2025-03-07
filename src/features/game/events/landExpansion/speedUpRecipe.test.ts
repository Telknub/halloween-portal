// 1: Less than 1 minute
// 2: Less than 5 minutes
// 3: Less than 10 minutes
// 4: Less than 30 minutes
// 5: Less than 1 hr
// 8: Less than 2 hrs
// 10: Less than 4 hrs
// 12: Less than 6 hrs
// 12: Less than 12 hrs
// 14: Less than 24 hrs
// 16: Less than 36 hrs
// 20: Less than 48 hrs

import { INITIAL_FARM } from "features/game/lib/constants";
import { speedUpRecipe } from "./speedUpRecipe";
import Decimal from "decimal.js-light";
import { BAKERY_COOKABLES } from "features/game/types/consumables";

describe("instantCook", () => {
  it("requires item is cooking", () => {
    expect(() =>
      speedUpRecipe({
        action: {
          buildingId: "123",
          buildingName: "Fire Pit",
          type: "recipe.spedUp",
        },
        state: {
          ...INITIAL_FARM,
          buildings: {
            "Fire Pit": [
              {
                id: "123",
                coordinates: { x: 0, y: 0 },
                createdAt: 0,
                readyAt: 0,
              },
            ],
          },
        },
      }),
    ).toThrow("Nothing is cooking");
  });
  it("requires item is not ready", () => {
    expect(() =>
      speedUpRecipe({
        action: {
          buildingId: "123",
          buildingName: "Fire Pit",
          type: "recipe.spedUp",
        },
        state: {
          ...INITIAL_FARM,
          buildings: {
            "Fire Pit": [
              {
                id: "123",
                coordinates: { x: 0, y: 0 },
                createdAt: 0,
                readyAt: 0,
                crafting: {
                  name: "Mashed Potato",
                  readyAt: 0,
                  amount: 1,
                },
              },
            ],
          },
        },
      }),
    ).toThrow("Already cooked");
  });
  it("requires player has the gems", () => {
    expect(() =>
      speedUpRecipe({
        action: {
          buildingId: "123",
          buildingName: "Fire Pit",
          type: "recipe.spedUp",
        },
        state: {
          ...INITIAL_FARM,
          inventory: { Gem: new Decimal(0) },
          buildings: {
            "Fire Pit": [
              {
                id: "123",
                coordinates: { x: 0, y: 0 },
                createdAt: 0,
                readyAt: 0,
                crafting: {
                  name: "Mashed Potato",
                  readyAt: Date.now() + 30000,
                  amount: 1,
                },
              },
            ],
          },
        },
      }),
    ).toThrow("Insufficient gems");
  });

  it("charges gems for a mashed potato", () => {
    const state = speedUpRecipe({
      action: {
        buildingId: "123",
        buildingName: "Fire Pit",
        type: "recipe.spedUp",
      },
      state: {
        ...INITIAL_FARM,
        inventory: { Gem: new Decimal(100) },
        buildings: {
          "Fire Pit": [
            {
              id: "123",
              coordinates: { x: 0, y: 0 },
              createdAt: 0,
              readyAt: 0,
              crafting: {
                name: "Mashed Potato",
                readyAt: Date.now() + 30000,
                amount: 1,
              },
            },
          ],
        },
      },
    });

    expect(state.inventory.Gem).toEqual(new Decimal(99));
  });

  it("charges gems for a radish cake", () => {
    const now = Date.now();
    const state = speedUpRecipe({
      action: {
        buildingId: "123",
        buildingName: "Fire Pit",
        type: "recipe.spedUp",
      },
      state: {
        ...INITIAL_FARM,
        inventory: { Gem: new Decimal(100) },
        buildings: {
          "Fire Pit": [
            {
              id: "123",
              coordinates: { x: 0, y: 0 },
              createdAt: 0,
              readyAt: 0,
              crafting: {
                name: "Radish Cake",
                readyAt:
                  now + BAKERY_COOKABLES["Radish Cake"].cookingSeconds * 1000,
                amount: 1,
              },
            },
          ],
        },
      },
    });

    expect(state.inventory.Gem).toEqual(new Decimal(84));
  });
  it("charges half the gems for a half finished radish cake", () => {
    const now = Date.now();
    const state = speedUpRecipe({
      action: {
        buildingId: "123",
        buildingName: "Fire Pit",
        type: "recipe.spedUp",
      },
      state: {
        ...INITIAL_FARM,
        inventory: { Gem: new Decimal(100) },
        buildings: {
          "Fire Pit": [
            {
              id: "123",
              coordinates: { x: 0, y: 0 },
              createdAt: 0,
              readyAt: 0,
              crafting: {
                name: "Radish Cake",
                readyAt:
                  now +
                  (BAKERY_COOKABLES["Radish Cake"].cookingSeconds / 2) * 1000,
                amount: 1,
              },
            },
          ],
        },
      },
    });

    expect(state.inventory.Gem).toEqual(new Decimal(86));
  });
  it("gives the player the food", () => {
    const now = Date.now();
    const state = speedUpRecipe({
      action: {
        buildingId: "123",
        buildingName: "Fire Pit",
        type: "recipe.spedUp",
      },
      state: {
        ...INITIAL_FARM,
        inventory: { Gem: new Decimal(100) },
        buildings: {
          "Fire Pit": [
            {
              id: "123",
              coordinates: { x: 0, y: 0 },
              createdAt: 0,
              readyAt: 0,
              crafting: {
                name: "Mashed Potato",
                readyAt: now + 30000,
                amount: 1,
              },
            },
          ],
        },
        createdAt: now,
      },
    });

    expect(state.inventory["Mashed Potato"]).toEqual(new Decimal(1));
    expect(state.buildings["Fire Pit"]?.[0].crafting).toBeUndefined();
  });
});
