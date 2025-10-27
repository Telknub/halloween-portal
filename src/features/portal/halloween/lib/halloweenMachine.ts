import { OFFLINE_FARM } from "features/game/lib/landData";
import { assign, createMachine, Interpreter, State } from "xstate";
import { CONFIG } from "lib/config";
import { decodeToken } from "features/auth/actions/login";
import {
  UNLIMITED_ATTEMPTS_SFL,
  BONE_CODEX,
  RELIC_CODEX,
  Tools,
  Bones,
  CodexData,
  Relics,
  GAME_LIVES,
  HalloweenNpcNames,
  FIRST_DIALOGUE_NPCS,
  FREE_DAILY_ATTEMPTS,
  RELIC_GOAL,
  TIME_SCORE_BASE,
} from "../HalloweenConstants";
import { GameState } from "features/game/types/game";
import { purchaseMinigameItem } from "features/game/events/minigames/purchaseMinigameItem";
import { startMinigameAttempt } from "features/game/events/minigames/startMinigameAttempt";
import { submitMinigameScore } from "features/game/events/minigames/submitMinigameScore";
import {
  achievementsUnlocked,
  submitScore,
  startAttempt,
} from "features/portal/lib/portalUtil";
import { getUrl, loadPortal } from "features/portal/actions/loadPortal";
import { getAttemptsLeft } from "./HalloweenUtils";
import { unlockMinigameAchievements } from "features/game/events/minigames/unlockMinigameAchievements";
import { HalloweenAchievementsName } from "../HalloweenAchievements";

const getJWT = () => {
  const code = new URLSearchParams(window.location.search).get("jwt");
  return code;
};

export interface Context {
  id: number;
  jwt: string | null;
  isJoystickActive: boolean;
  state: GameState | undefined;
  score: number;
  lastScore: number;
  selectedTool: Tools | null;
  tools: Tools[];
  boneCodex: Record<Bones, CodexData>;
  relicCodex: Record<Relics, CodexData>;
  lives: number;
  maxLives: number;
  statueEffects: Record<string, string>[];
  firstDialogueNPCs: Record<HalloweenNpcNames, boolean>;
  isTraining: boolean;
  startedAt: number;
  attemptsLeft: number;
}

type GainPointsEvent = {
  type: "GAIN_POINTS";
};

type UnlockAchievementsEvent = {
  type: "UNLOCKED_ACHIEVEMENTS";
  achievementNames: HalloweenAchievementsName[];
};

type SetJoystickActiveEvent = {
  type: "SET_JOYSTICK_ACTIVE";
  isJoystickActive: boolean;
};

type CollectToolEvent = {
  type: "COLLECT_TOOL";
  tool: Tools;
};

type SelectToolEvent = {
  type: "CHANGE_TOOL";
};

type CollectBoneEvent = {
  type: "COLLECT_BONE";
  boneName: Bones;
};

type CollectRelicEvent = {
  type: "COLLECT_RELIC";
  relicName: Relics;
};

type LoseLivesEvent = {
  type: "LOSE_LIVES";
  lives: number;
};

type RestoreLivesEvent = {
  type: "RESTORE_LIVES";
  lives: number;
};

type IncreaseMaxLivesEvent = {
  type: "INCREASE_MAX_LIVES";
  lives: number;
};

type CollectStatueEffectEvent = {
  type: "COLLECT_STATUE_EFFECT";
  statueName: string;
  effect: string;
};

type SetFirstDialogueNPCs = {
  type: "SET_FIRST_DIALOGUE_NPCS";
  npcName: HalloweenNpcNames;
};

type PurchaseRestockEvent = {
  type: "PURCHASED_RESTOCK";
  sfl: number;
};

export type PortalEvent =
  | SetJoystickActiveEvent
  | { type: "START" }
  | { type: "CLAIM" }
  | { type: "CANCEL_PURCHASE" }
  | { type: "PURCHASED_UNLIMITED" }
  | { type: "RETRY" }
  | { type: "CONTINUE" }
  | { type: "CONTINUE_TRAINING" }
  | { type: "END_GAME_EARLY" }
  | { type: "GAME_OVER" }
  | PurchaseRestockEvent
  | GainPointsEvent
  | CollectToolEvent
  | SelectToolEvent
  | CollectBoneEvent
  | CollectRelicEvent
  | LoseLivesEvent
  | RestoreLivesEvent
  | IncreaseMaxLivesEvent
  | CollectStatueEffectEvent
  | SetFirstDialogueNPCs
  | UnlockAchievementsEvent;

export type PortalState = {
  value:
    | "initialising"
    | "error"
    | "ready"
    | "unauthorised"
    | "loading"
    | "introduction"
    | "playing"
    | "gameOver"
    | "winner"
    | "loser"
    | "complete"
    | "starting"
    | "noAttempts";
  context: Context;
};

export type MachineInterpreter = Interpreter<
  Context,
  any,
  PortalEvent,
  PortalState
>;

export type PortalMachineState = State<Context, PortalEvent, PortalState>;

const resetGameTransition = {
  RETRY: {
    target: "starting",
    actions: assign({
      score: () => 0,
      selectedTool: () => null,
      tools: () => [],
      boneCodex: () => structuredClone(BONE_CODEX),
      relicCodex: () => structuredClone(RELIC_CODEX),
      lives: () => GAME_LIVES,
      maxLives: () => GAME_LIVES,
      statueEffects: () => [],
      firstDialogueNPCs: () => structuredClone(FIRST_DIALOGUE_NPCS),
      startedAt: () => 0,
    }) as any,
  },
};

export const portalMachine = createMachine<Context, PortalEvent, PortalState>({
  id: "portalMachine",
  initial: "initialising",
  context: {
    id: 0,
    jwt: getJWT(),

    isJoystickActive: false,

    state: CONFIG.API_URL ? undefined : OFFLINE_FARM,

    score: 0,
    lastScore: 0,
    attemptsLeft: 0,
    startedAt: 0,
    isTraining: false,

    // Halloween
    selectedTool: null,
    tools: [],
    boneCodex: structuredClone(BONE_CODEX),
    relicCodex: structuredClone(RELIC_CODEX),
    lives: GAME_LIVES,
    maxLives: GAME_LIVES,
    statueEffects: [],
    firstDialogueNPCs: structuredClone(FIRST_DIALOGUE_NPCS),
  },
  on: {
    SET_JOYSTICK_ACTIVE: {
      actions: assign({
        isJoystickActive: (_: Context, event: SetJoystickActiveEvent) => {
          return event.isJoystickActive;
        },
      }),
    },
    UNLOCKED_ACHIEVEMENTS: {
      actions: assign({
        state: (context: Context, event: UnlockAchievementsEvent) => {
          achievementsUnlocked({ achievementNames: event.achievementNames });
          return unlockMinigameAchievements({
            state: context.state as GameState,
            action: {
              type: "minigame.achievementsUnlocked",
              id: "halloween",
              achievementNames: event.achievementNames,
            },
          });
        },
      }),
    },
  },
  states: {
    initialising: {
      always: [
        {
          target: "unauthorised",
          // TODO: Also validate token
          cond: (context) => !!CONFIG.API_URL && !context.jwt,
        },
        {
          target: "loading",
        },
      ],
    },
    loading: {
      id: "loading",
      invoke: {
        src: async (context) => {
          if (!getUrl()) {
            return { game: OFFLINE_FARM, attemptsLeft: FREE_DAILY_ATTEMPTS };
          }

          const { farmId } = decodeToken(context.jwt as string);

          // Load the game data
          const { game } = await loadPortal({
            portalId: CONFIG.PORTAL_APP,
            token: context.jwt as string,
          });

          const minigame = game.minigames.games["halloween"];
          const attemptsLeft = getAttemptsLeft(minigame, farmId);

          return { game, farmId, attemptsLeft };
        },
        onDone: [
          {
            target: "introduction",
            actions: assign({
              state: (_: Context, event) => event.data.game,
              id: (_: Context, event) => event.data.farmId,
              attemptsLeft: (_: Context, event) => event.data.attemptsLeft,
            }),
          },
        ],
        onError: {
          target: "error",
        },
      },
    },

    noAttempts: {
      on: {
        CANCEL_PURCHASE: {
          target: "introduction",
        },
        PURCHASED_RESTOCK: {
          target: "introduction",
          actions: assign({
            state: (context: Context, event: PurchaseRestockEvent) =>
              purchaseMinigameItem({
                state: context.state as GameState,
                action: {
                  id: "halloween",
                  sfl: event.sfl,
                  type: "minigame.itemPurchased",
                  items: {},
                },
              }),
          }),
        },
        PURCHASED_UNLIMITED: {
          target: "introduction",
          actions: assign({
            state: (context: Context) =>
              purchaseMinigameItem({
                state: context.state as GameState,
                action: {
                  id: "halloween",
                  sfl: UNLIMITED_ATTEMPTS_SFL,
                  type: "minigame.itemPurchased",
                  items: {},
                },
              }),
          }),
        },
      },
    },

    starting: {
      always: [
        {
          target: "noAttempts",
          cond: (context) => {
            if (context.isTraining) return false;
            const farmId = !getUrl()
              ? 0
              : decodeToken(context.jwt as string).farmId;
            const minigame = context.state?.minigames.games["halloween"];
            const attemptsLeft = getAttemptsLeft(minigame, farmId);
            return attemptsLeft <= 0;
          },
        },
        {
          target: "ready",
        },
      ],
    },

    introduction: {
      on: {
        CONTINUE: {
          target: "starting",
          actions: assign({
            isTraining: false,
            state: (context: Context) => context.state,
          }),
        },
        CONTINUE_TRAINING: {
          target: "starting",
          actions: assign({
            isTraining: true,
            state: (context: Context) => context.state,
          }),
        },
      },
    },

    ready: {
      on: {
        START: {
          target: "playing",
          actions: assign({
            startedAt: () => Date.now(),
            score: 0,
            selectedTool: null,
            tools: [],
            boneCodex: structuredClone(BONE_CODEX),
            relicCodex: structuredClone(RELIC_CODEX),
            lives: GAME_LIVES,
            maxLives: GAME_LIVES,
            statueEffects: [],
            firstDialogueNPCs: structuredClone(FIRST_DIALOGUE_NPCS),
            state: (context: Context) => {
              if (context.isTraining) return context.state;
              startAttempt();
              return startMinigameAttempt({
                state: context.state as GameState,
                action: {
                  type: "minigame.attemptStarted",
                  id: "halloween",
                },
              });
            },
            attemptsLeft: (context: Context) => {
              if (context.isTraining) return context.attemptsLeft;
              return context.attemptsLeft - 1;
            },
          }),
        },
      },
    },

    playing: {
      on: {
        GAIN_POINTS: {
          actions: assign({
            score: (context: Context) => {
              return context.score + 1;
            },
          }),
        },
        LOSE_LIVES: {
          actions: assign({
            lives: (context: Context, event: LoseLivesEvent) => {
              const lives = Math.max(context.lives - event.lives, 0);
              return lives;
            },
          }),
        },
        RESTORE_LIVES: {
          actions: assign({
            lives: (context: Context, event: RestoreLivesEvent) => {
              const lives = Math.min(
                context.lives + event.lives,
                context.maxLives,
              );
              return lives;
            },
          }),
        },
        INCREASE_MAX_LIVES: {
          actions: assign({
            maxLives: (context: Context, event: IncreaseMaxLivesEvent) => {
              return context.maxLives + event.lives;
            },
          }),
        },
        COLLECT_TOOL: {
          actions: assign((context: Context, event: CollectToolEvent) => {
            const alreadyCollected = context.tools.some(
              (tool) => tool === event.tool,
            );
            return {
              tools: alreadyCollected
                ? context.tools
                : [...context.tools, event.tool],
              selectedTool: event.tool,
            };
          }),
        },
        CHANGE_TOOL: {
          actions: assign({
            selectedTool: (context: Context) => {
              const { tools, selectedTool } = context;
              if (!tools.length) return null;

              const currentIndex = tools.indexOf(selectedTool as Tools);
              const nextIndex = (currentIndex + 1) % tools.length;
              return tools[nextIndex];
            },
          }),
        },
        COLLECT_BONE: {
          actions: assign({
            boneCodex: (context: Context, event: CollectBoneEvent) => ({
              ...context.boneCodex,
              [event.boneName]: {
                ...context.boneCodex[event.boneName],
                isFound: true,
              },
            }),
          }),
        },
        COLLECT_RELIC: {
          actions: assign({
            relicCodex: (context: Context, event: CollectRelicEvent) => {
              return {
                ...context.relicCodex,
                [event.relicName]: {
                  ...context.relicCodex[event.relicName],
                  isFound: true,
                },
              };
            },
          }),
        },
        COLLECT_STATUE_EFFECT: {
          actions: assign({
            statueEffects: (
              context: Context,
              event: CollectStatueEffectEvent,
            ) => {
              return [
                ...context.statueEffects,
                { statueName: event.statueName, effect: event.effect },
              ];
            },
          }),
        },
        SET_FIRST_DIALOGUE_NPCS: {
          actions: assign({
            firstDialogueNPCs: (
              context: Context,
              event: SetFirstDialogueNPCs,
            ) => {
              return {
                ...context.firstDialogueNPCs,
                [event.npcName]: true,
              };
            },
          }),
        },
        END_GAME_EARLY: {
          actions: assign({
            startedAt: () => 0,
            lastScore: (context: Context) => {
              if (context.isTraining) return context.lastScore;
              let millisecondsPassed = 0;
              if (context.score === RELIC_GOAL) {
                const milliseconds = !context.startedAt
                  ? 0
                  : Math.max(Date.now() - context.startedAt, 0);
                millisecondsPassed = TIME_SCORE_BASE - milliseconds;
              }
              return Math.max(0, millisecondsPassed);
            },
            state: (context: Context) => {
              if (context.isTraining) return context.state;

              let millisecondsPassed = 0;
              if (context.score === RELIC_GOAL) {
                const milliseconds = !context.startedAt
                  ? 0
                  : Math.max(Date.now() - context.startedAt, 0);
                millisecondsPassed = TIME_SCORE_BASE - milliseconds;
              }

              const value = Math.max(0, millisecondsPassed);

              submitScore({ score: Math.round(value) });
              return submitMinigameScore({
                state: context.state as GameState,
                action: {
                  type: "minigame.scoreSubmitted",
                  score: Math.round(value),
                  id: "halloween",
                },
              });
            },
          }),
          target: "gameOver",
        },
        GAME_OVER: {
          target: "gameOver",
          actions: assign({
            lastScore: (context: Context) => {
              if (context.isTraining) return context.lastScore;
              let millisecondsPassed = 0;
              if (context.score === RELIC_GOAL) {
                const milliseconds = !context.startedAt
                  ? 0
                  : Math.max(Date.now() - context.startedAt, 0);
                millisecondsPassed = TIME_SCORE_BASE - milliseconds;
              }
              return Math.max(0, millisecondsPassed);
            },
            state: (context: Context) => {
              if (context.isTraining) return context.state;

              let millisecondsPassed = 0;
              if (context.score === RELIC_GOAL) {
                const milliseconds = !context.startedAt
                  ? 0
                  : Math.max(Date.now() - context.startedAt, 0);
                millisecondsPassed = TIME_SCORE_BASE - milliseconds;
              }

              const value = Math.max(0, millisecondsPassed);

              submitScore({ score: Math.round(value) });
              return submitMinigameScore({
                state: context.state as GameState,
                action: {
                  type: "minigame.scoreSubmitted",
                  score: Math.round(value),
                  id: "halloween",
                },
              });
            },
          }),
        },
      },
    },

    gameOver: {
      always: [
        {
          target: "introduction",
          cond: (context) => {
            return context.isTraining;
          },
        },
        {
          // they have already completed the mission before
          target: "complete",
          cond: () => {
            // const dateKey = new Date().toISOString().slice(0, 10);

            // const minigame = context.state?.minigames.games["halloween"];
            // const history = minigame?.history ?? {};

            // return !!history[dateKey]?.prizeClaimedAt;
            return false;
          },
        },
        {
          target: "winner",
          cond: (context) => {
            const prize = context.state?.minigames.prizes["halloween"];
            if (!prize) {
              return false;
            }

            return context.score >= prize.score;
          },
        },
        {
          target: "loser",
        },
      ],
    },

    winner: {
      on: resetGameTransition,
    },

    loser: {
      on: resetGameTransition,
    },

    complete: {
      on: resetGameTransition,
    },

    error: {
      on: {
        RETRY: {
          target: "initialising",
        },
      },
    },

    unauthorised: {},
  },
});
