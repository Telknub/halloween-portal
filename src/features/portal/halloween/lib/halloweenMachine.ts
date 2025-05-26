import { createMachine, assign, interpret } from "xstate";
import { BlockBucks, GameState, InventoryItemName } from "features/game/types/game";
import { get } from "lodash";
import { SFL_MAX_MINED } from "features/game/lib/constants";
import {
  INITIAL_LAMPS_LIGHT_RADIUS,
  MAX_LAMPS_IN_MAP,
  SET_VISION_RANGE,
} from "../HalloweenConstants";

export type HalloweenState = {
  playerHealth: number; // Renomeado de 'lamps'
  maxPlayerHealth: number; // Nova variável
  score: number;
  // TODO - Add the game state of the individual player (health, inventory, current level, etc.)
  // It is helpful to follow the game state of the player in case they refresh the page
};

type Context = {
  state: GameState;
  sessionId?: string;
  portalId: string;
  halloween: HalloweenState;
  is and isZombieActive: boolean;
};

type State = {
  value:
  | "loading"
  | "playing"
  | "gameOver"
  | "initialising"
  | "error"
  | "levellingUp"
  | "notReady";
  context: Context;
};

type Event =
  | { type: "CONNECT" }
  | { type: "NO_FARM" }
  | { type: "REFRESH" }
  | { type: "PLAY" }
  | { type: "CONTINUE" }
  | { type: "GAME_OVER" }
  | { type: "RESET" }
  | { type: "SET_SESSION_ID"; sessionId: string }
  | { type: "SET_BUMPKIN"; bumpkin: any }
  | { type: "GAIN_POINTS" }
  | { type: "COLLECT_LAMP" } // Este evento ainda pode ser usado, mas agora para 'playerHealth'
  | { type: "DEAD_LAMP"; lamps: number } // Este evento ainda pode ser usado, mas agora para 'playerHealth'
  | { type: "PLAYER_TAKES_DAMAGE"; amount: number } // NOVO: Jogador recebe dano
  | { type: "PLAYER_HEALS"; amount: number } // NOVO: Jogador se cura
  | { type: "SET_READY" }
  | { type: "KICK" }
  | { type: "ADD_ITEM"; item: InventoryItemName; blockBucks?: BlockBucks }
  | { type: "SET_LIGHT_RADIUS"; lightRadius: number }
  | { type: "SET_LIGHT_PLAYER_RADIUS"; lightRadius: number }
  | { type: "SET_GHOST_SPAWN_TIME" }
  | { type: "SET_ZOMBIE_SPAWN_TIME" }
  | { type: "SET_MAX_GHOSTS" }
  | { type: "SET_MAX_ZOMBIES" }
  | { type: "SET_GHOSTS_SPAWNED" }
  | { type: "SET_ZOMBIES_SPAWNED" }
  | { type: "SET_SLOW_DOWN" }
  | { type: "SET_VISION_RANGE" }
  | { type: "SET_ACCUMULATED_SLOWDOWN" }
  | { type: "SET_PLAYER_LIGHT_RADIUS" }
  | { type: "SET_LAMP_USAGE_MULTIPLIER_INTERVAL" }
  | { type: "SET_MIN_ZOMBIES_PER_MIN" }
  | { type: "SET_MAX_ZOMBIES_PER_MIN" }
  | { type: "SET_MIN_GHOST_PER_MIN" }
  | { type: "SET_MAX_GHOST_PER_MIN" }
  | { type: "SET_DELAY_SPAWN_TIME" }
  | { type: "SET_UPDATE_INTERVAL" }
  | { type: "SET_ACCUMULATED_SLOWDOWN_DURATION" }
  | { type: "SET_LAST_SLOW_DOWN_TIME" }
  | { type: "SET_PORTAL_ID"; id: string }
  | { type: "SET_IS_JOYSTICK_ACTIVE"; isJoystickActive: boolean };

export type MachineInterpreter = ReturnType<typeof interpret<Context, any, Event>>;

export const halloweenMachine = createMachine<Context, Event, State>({
  id: "halloweenMachine",
  initial: "loading",
  context: {
    state: {} as GameState,
    portalId: "0",
    halloween: {
      playerHealth: 5, // Valor inicial de saúde
      maxPlayerHealth: 5, // Valor máximo de saúde
      score: 0,
    },
    is and isZombieActive: false,
  },
  states: {
    loading: {
      on: {
        CONNECT: "initialising",
        NO_FARM: "notReady",
        REFRESH: "loading",
      },
    },
    initialising: {
      invoke: {
        src: async () => {
          const state: GameState = get(
            window,
            `___SFL_LITE_INTERFACE___.state`,
          );

          return { state };
        },
        onDone: {
          target: "playing",
          actions: assign((context, event) => ({
            state: event.data.state,
          })),
        },
        onError: "error",
      },
    },
    playing: {
      on: {
        // Renomear COLLECT_LAMP para um nome mais genérico se não for mais coletar "lamps"
        // Ou adaptar a lógica para aumentar a saúde/pontos.
        // Por enquanto, vamos manter e fazer com que aumente a saúde.
        COLLECT_LAMP: {
          actions: assign((context) => ({
            halloween: {
              ...context.halloween,
              // Não aumentamos playerHealth aqui diretamente, mas sim pontos.
              // A cura virá de PLAYER_HEALS ou itens.
              score: context.halloween.score + 1,
            },
          })),
        },
        // Mudar DEAD_LAMP para PLAYER_TAKES_DAMAGE
        DEAD_LAMP: {
          actions: assign((context, event) => ({
            halloween: {
              ...context.halloween,
              playerHealth: Math.max(0, context.halloween.playerHealth - event.lamps),
            },
          })),
        },
        // NOVO: Evento para jogador receber dano
        PLAYER_TAKES_DAMAGE: {
          actions: assign((context, event) => ({
            halloween: {
              ...context.halloween,
              playerHealth: Math.max(0, context.halloween.playerHealth - event.amount),
            },
          })),
        },
        // NOVO: Evento para jogador se curar
        PLAYER_HEALS: {
          actions: assign((context, event) => ({
            halloween: {
              ...context.halloween,
              playerHealth: Math.min(context.halloween.maxPlayerHealth, context.halloween.playerHealth + event.amount),
            },
          })),
        },
        GAIN_POINTS: {
          actions: assign((context) => ({
            halloween: {
              ...context.halloween,
              score: context.halloween.score + 1,
            },
          })),
        },
        GAME_OVER: "gameOver",
        SET_PLAYER_LIGHT_RADIUS: {
          actions: assign((context, event) => ({
            state: {
              ...context.state,
              minigames: {
                ...context.state.minigames,
                halloween: {
                  ...context.state.minigames?.halloween,
                  playerLightRadius: (event as any).lightRadius,
                },
              },
            },
          })),
        },
        SET_GHOST_SPAWN_TIME: {
          actions: assign((context) => ({
            state: {
              ...context.state,
              minigames: {
                ...context.state.minigames,
                halloween: {
                  ...context.state.minigames?.halloween,
                  lastSpawnedGhost: Date.now(),
                },
              },
            },
          })),
        },
        SET_ZOMBIE_SPAWN_TIME: {
          actions: assign((context) => ({
            state: {
              ...context.state,
              minigames: {
                ...context.state.minigames,
                halloween: {
                  ...context.state.minigames?.halloween,
                  lastSpawnedZombie: Date.now(),
                },
              },
            },
          })),
        },
        SET_MAX_GHOSTS: {
          actions: assign((context, event) => ({
            state: {
              ...context.state,
              minigames: {
                ...context.state.minigames,
                halloween: {
                  ...context.state.minigames?.halloween,
                  maxGhosts: (event as any).maxGhosts,
                },
              },
            },
          })),
        },
        SET_MAX_ZOMBIES: {
          actions: assign((context, event) => ({
            state: {
              ...context.state,
              minigames: {
                ...context.state.minigames,
                halloween: {
                  ...context.state.minigames?.halloween,
                  maxZombies: (event as any).maxZombies,
                },
              },
            },
          })),
        },
        SET_GHOSTS_SPAWNED: {
          actions: assign((context, event) => ({
            state: {
              ...context.state,
              minigames: {
                ...context.state.minigames,
                halloween: {
                  ...context.state.minigames?.halloween,
                  ghostsSpawned: (event as any).ghostsSpawned,
                },
              },
            },
          })),
        },
        SET_ZOMBIES_SPAWNED: {
          actions: assign((context, event) => ({
            state: {
              ...context.state,
              minigames: {
                ...context.state.minigames,
                halloween: {
                  ...context.state.minigames?.halloween,
                  zombiesSpawned: (event as any).zombiesSpawned,
                },
              },
            },
          })),
        },
        SET_SLOW_DOWN: {
          actions: assign((context) => ({
            state: {
              ...context.state,
              minigames: {
                ...context.state.minigames,
                halloween: {
                  ...context.state.minigames?.halloween,
                  slowdowns: (
                    context.state.minigames?.halloween?.slowdowns || 0
                  ) + 1,
                },
              },
            },
          })),
        },
        SET_VISION_RANGE: {
          actions: assign((context) => ({
            state: {
              ...context.state,
              minigames: {
                ...context.state.minigames,
                halloween: {
                  ...context.state.minigames?.halloween,
                  visionRange: INITIAL_LAMPS_LIGHT_RADIUS,
                },
              },
            },
          })),
        },
        SET_LAMP_USAGE_MULTIPLIER_INTERVAL: {
          actions: assign((context) => ({
            state: {
              ...context.state,
              minigames: {
                ...context.state.minigames,
                halloween: {
                  ...context.state.minigames?.halloween,
                  lampUsageMultiplierInterval: Date.now(),
                },
              },
            },
          })),
        },
        SET_MIN_ZOMBIES_PER_MIN: {
          actions: assign((context, event) => ({
            state: {
              ...context.state,
              minigames: {
                ...context.state.minigames,
                halloween: {
                  ...context.state.minigames?.halloween,
                  minZombiesPerMin: (event as any).minZombiesPerMin,
                },
              },
            },
          })),
        },
        SET_MAX_ZOMBIES_PER_MIN: {
          actions: assign((context, event) => ({
            state: {
              ...context.state,
              minigames: {
                ...context.state.minigames,
                halloween: {
                  ...context.state.minigames?.halloween,
                  maxZombiesPerMin: (event as any).maxZombiesPerMin,
                },
              },
            },
          })),
        },
        SET_MIN_GHOST_PER_MIN: {
          actions: assign((context, event) => ({
            state: {
              ...context.state,
              minigames: {
                ...context.state.minigames,
                halloween: {
                  ...context.state.minigames?.halloween,
                  minGhostsPerMin: (event as any).minGhostsPerMin,
                },
              },
            },
          })),
        },
        SET_MAX_GHOST_PER_MIN: {
          actions: assign((context, event) => ({
            state: {
              ...context.state,
              minigames: {
                ...context.state.minigames,
                halloween: {
                  ...context.state.minigames?.halloween,
                  maxGhostsPerMin: (event as any).maxGhostsPerMin,
                },
              },
            },
          })),
        },
        SET_DELAY_SPAWN_TIME: {
          actions: assign((context) => ({
            state: {
              ...context.state,
              minigames: {
                ...context.state.minigames,
                halloween: {
                  ...context.state.minigames?.halloween,
                  delaySpawnTime: Date.now(),
                },
              },
            },
          })),
        },
        SET_UPDATE_INTERVAL: {
          actions: assign((context) => ({
            state: {
              ...context.state,
              minigames: {
                ...context.state.minigames,
                halloween: {
                  ...context.state.minigames?.halloween,
                  updateInterval: Date.now(),
                },
              },
            },
          })),
        },
        SET_ACCUMULATED_SLOWDOWN_DURATION: {
          actions: assign((context) => ({
            state: {
              ...context.state,
              minigames: {
                ...context.state.minigames,
                halloween: {
                  ...context.state.minigames?.halloween,
                  accumulatedSlowdownDuration: Date.now(),
                },
              },
            },
          })),
        },
        SET_LAST_SLOW_DOWN_TIME: {
          actions: assign((context) => ({
            state: {
              ...context.state,
              minigames: {
                ...context.state.minigames,
                halloween: {
                  ...context.state.minigames?.halloween,
                  lastSlowDownTime: Date.now(),
                },
              },
            },
          })),
        },
        SET_PORTAL_ID: {
          actions: assign((context, event) => ({
            portalId: (event as any).id,
          })),
        },
        SET_IS_JOYSTICK_ACTIVE: {
          actions: assign((context, event) => ({
            isJoystickActive: (event as any).isJoystickActive,
          })),
        },
      },
      always: {
        // Transição para gameOver se a saúde do jogador for 0 ou menos
        target: "gameOver",
        cond: (context) => context.halloween.playerHealth <= 0,
      },
    },
    gameOver: {
      on: {
        PLAY: "playing",
      },
    },
    notReady: {
      on: {
        PLAY: "initialising",
      },
    },
    error: {
      on: {
        REFRESH: "loading",
      },
    },
  },
});