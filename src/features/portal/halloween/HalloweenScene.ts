import tilesetConfig from "assets/map/halloween-tileset.json";
import { SceneId } from "features/world/mmoMachine";
import { BaseScene, WALKING_SPEED } from "features/world/scenes/BaseScene";
import { MachineInterpreter } from "./lib/halloweenMachine";
import { VisibilityPolygon } from "./lib/visibilityPolygon";
import {
  TOOL_ACTION_MAP,
  Tools,
  AnimationKeys,
  ToolActions,
  BONES,
  RELICS,
  Relics,
  ENVY_BUFF_DAMAGE,
  GLUTTONY_BUFF_PERCENTAGE,
  GREED_BUFF_RANGE,
  LUST_BUFF_LIVES,
  PRIDE_BUFF_PERCENTAGE,
  WRATH_BUFF_PERCENTAGE,
  DECEIT_BUFF_PERCENTAGE,
} from "./HalloweenConstants";
import { EventObject } from "xstate";
import { isTouchDevice } from "features/world/lib/device";
import { Map } from "./map/Map";
import { EventBus } from "./lib/EventBus";
import { ITEM_IDS } from "features/game/types/bumpkin";
// import { EnemyRoom } from "./map/rooms/types/EnemyRoom";

// export const NPCS: NPCBumpkin[] = [
//   {
//     x: 380,
//     y: 400,
//     // View NPCModals.tsx for implementation of pop up modal
//     npc: "portaller",
//   },
// ];

interface Coordinates {
  x: number;
  y: number;
}

export class HalloweenScene extends BaseScene {
  private mask?: Phaser.Display.Masks.GeometryMask;
  private lightedItems!: (
    | Phaser.GameObjects.Container
    | { x: number; y: number }
  )[];
  private polygons!: [number, number][][];
  private polygonShapes!: Phaser.Geom.Polygon[];
  private playerPosition!: Coordinates;
  private lightGraphics?: Phaser.GameObjects.Graphics;
  private visibilityPolygon!: VisibilityPolygon;
  private lampSpawnTime!: number;
  private numLampsInMap!: number;
  private deathDate!: Date | null;
  private amountLamps!: number;
  private ghost_enemies!: Phaser.Physics.Arcade.Sprite[];
  private zombie_enemies!: Phaser.Physics.Arcade.Sprite[];
  private lastSpawnTimeGhost!: number;
  private lastSpawnTimeZombie!: number;
  private dalaySpawnTime!: number; // 10 seconds dalay spawn time of the enemies in the beginning
  private updateInterval!: number; // 90 seconds time reset spawn count
  private minGhostPerMin!: number; // Minimum number of ghost enemies spawned
  private maxGhostPerMin!: number; // Maximum ghost enemies to spawn
  private minZombiePerMin!: number; // Minimun number of zombie enemies spawned
  private maxZombiePerMin!: number; // Maximum zombie enemies to spawn
  private SetSlowDown!: number; // Reduce player's velocity to 50%
  private setSlowdownDuration!: number; // Slow down for 5 seconds (5000 milliseconds)
  private accumulatedSlowdown!: number; // Track total accumulated slowdown time
  private slowdownTimeout: any;
  private setVisionRange!: number; // Set the vision zombies
  private lastAttempt!: number;
  private gameOverNoMove!: number;
  private gameOverNoMoveTime!: number;
  private isGameOver = false;
  private updateCallbacks!: { key: string; fn: () => void }[];
  objectsWithCollider!: { x: number; y: number }[];
  bones!: string[];
  relics!: string[];
  // private enemyRoom!: EnemyRoom;

  sceneId: SceneId = "halloween";
  private backgroundMusic!: Phaser.Sound.BaseSound;
  private zombieSound!: Phaser.Sound.BaseSound;
  private ghostSound!: Phaser.Sound.BaseSound;
  private zombieDeathSound!: Phaser.Sound.BaseSound;
  private ghostDeathSound!: Phaser.Sound.BaseSound;
  private shadows!: Phaser.Sound.BaseSound | null;
  private tension!: Phaser.Sound.BaseSound | null;

  constructor() {
    super({
      name: "halloween",
      map: {
        imageKey: "halloween-tileset",
        defaultTilesetConfig: tilesetConfig,
      },
      audio: { fx: { walk_key: "wood_footstep" } },
    });
    // this.setDefaultStates();
  }

  private get isGameReady() {
    return this.portalService?.state.matches("ready") === true;
  }

  private get isGamePlaying() {
    return this.portalService?.state.matches("playing") === true;
  }

  public get portalService() {
    return this.registry.get("portalService") as MachineInterpreter | undefined;
  }

  addToUpdate(key: string, fn: () => void) {
    this.updateCallbacks.push({ key, fn });
  }

  removeFromUpdate(key: string) {
    this.updateCallbacks = this.updateCallbacks.filter((cb) => cb.key !== key);
  }

  preload() {
    super.preload();

    // this.load.audio("ghostSound", "/world/ghost-sound.wav");
    // this.load.audio("zombieSound", "/world/zombie-sound.wav");
    // this.load.audio("ghostDeathSound", "/world/ghost-death.wav");
    // this.load.audio("shadows", "/world/shadows.mp3");
    // this.load.audio("tension", "/world/tension.mp3");

    // this.load.spritesheet("ghost_enemy_1", "world/ghost_enemy_1.png", {
    //   frameWidth: 22,
    //   frameHeight: 23,
    // });

    // this.load.spritesheet("ghost_enemy_2", "world/ghost_enemy_2.png", {
    //   frameWidth: 22,
    //   frameHeight: 23,
    // });

    // this.load.spritesheet("poof_1", "world/poof_1.webp", {
    //   frameWidth: 36,
    //   frameHeight: 36,
    // });

    // this.load.spritesheet("zombie_enemy_1", "world/zombie_enemy_1.png", {
    //   frameWidth: 15.875,
    //   frameHeight: 17,
    // });

    // this.load.spritesheet("zombie_enemy_2", "world/zombie_enemy_2.png", {
    //   frameWidth: 15.875,
    //   frameHeight: 17,
    // });

    // this.load.spritesheet("zombie_death", "world/zombie_death.png", {
    //   frameWidth: 96,
    //   frameHeight: 21,
    // });

    // Halloween 2025 ----------------------------------------------
    //Music
    // Background
    this.load.audio("backgroundMusic", "/world/halloween/background-music.mp3");

    // Tools
    this.load.audio("lamp", "/world/halloween/burn.mp3");
    this.load.audio("pickaxe", "/world/halloween/pickaxe.wav");
    this.load.audio("sword", "/world/halloween/sword.wav");

    // Collect
    this.load.audio("collect", "/world/halloween/collect.mp3");
    this.load.audio("hurt", "/world/halloween/lose.wav");
    this.load.audio("deathPlayer", "/world/halloween/death.wav");

    // Mini-boss, ghoul, ghost
    this.load.audio("ghost_attack", "/world/halloween/ghost_attack.mp3");
    this.load.audio("ghoul_attack", "/world/halloween/ghoul_attack.mp3");
    this.load.audio("smash", "/world/halloween/smash.mp3");
    this.load.audio("mummy", "/world/halloween/mummy.mp3");
    this.load.audio("golem", "/world/halloween/golem.wav");
    this.load.audio("death", "/world/halloween/death.mp3");

    // Final Boss
    this.load.audio("boss_spawn", "/world/halloween/boss_spawn.mp3");
    this.load.audio("boss_walk", "/world/halloween/boss_walk.mp3");
    this.load.audio("flamethrower", "/world/halloween/flamethrower.wav");

    // Blacksmith
    this.load.spritesheet("blacksmith", "world/blacksmith.webp", {
      frameWidth: 45,
      frameHeight: 58,
    });

    // Statues
    this.load.image("statue1", "world/statue1_idle.webp");
    this.load.image("statue2", "world/statue2_idle.webp");
    this.load.image("statue3", "world/statue3_idle.webp");
    this.load.image("statue4", "world/statue4_idle.webp");

    this.load.spritesheet("statue1_hit", "world/statue1_hit.webp", {
      frameWidth: 17,
      frameHeight: 30,
    });
    this.load.spritesheet("statue2_hit", "world/statue2_hit.webp", {
      frameWidth: 17,
      frameHeight: 33,
    });
    this.load.spritesheet("statue3_hit", "world/statue3_hit.webp", {
      frameWidth: 17,
      frameHeight: 32,
    });
    this.load.spritesheet("statue4_hit", "world/statue4_hit.webp", {
      frameWidth: 17,
      frameHeight: 33,
    });

    this.load.spritesheet("statue1_break", "world/statue1_break.webp", {
      frameWidth: 17,
      frameHeight: 30,
    });
    this.load.spritesheet("statue2_break", "world/statue2_break.webp", {
      frameWidth: 17,
      frameHeight: 33,
    });
    this.load.spritesheet("statue3_break", "world/statue3_break.webp", {
      frameWidth: 17,
      frameHeight: 32,
    });
    this.load.spritesheet("statue4_break", "world/statue4_break.webp", {
      frameWidth: 17,
      frameHeight: 33,
    });

    // Relics
    this.load.image("envy", "world/relic1.png");
    this.load.image("gluttony", "world/relic2.png");
    this.load.image("greed", "world/relic3.png");
    this.load.image("lust", "world/relic4.png");
    this.load.image("pride", "world/relic5.png");
    this.load.image("sloth", "world/relic6.png");
    this.load.image("wrath", "world/relic7.png");
    this.load.image("deceit", "world/relic8.webp");

    // Bones
    this.load.image("femur", "world/bone1.png");
    this.load.image("mandible", "world/bone2.png");
    this.load.image("spine", "world/bone3.png");
    this.load.image("clavicles", "world/bone4.png");
    this.load.image("scapula", "world/bone5.png");

    // Skeleton
    this.load.spritesheet("skeleton", "world/skeleton.webp", {
      frameWidth: 15,
      frameHeight: 21,
    });

    // Tools
    this.load.image("pickaxe", "world/pickaxe_icon.png");
    this.load.spritesheet("lamp", "world/lamp.png", {
      frameWidth: 14,
      frameHeight: 20,
    });

    // Enemies
    // Final boss
    this.load.spritesheet(
      "dungeonBoss_walk",
      "world/halloween/DungeonBoss_Idle.webp",
      {
        frameWidth: 160,
        frameHeight: 160,
      },
    );
    this.load.spritesheet(
      "dungeonBoss_attack",
      "world/halloween/DungeonBoss_Attack.webp",
      {
        frameWidth: 160,
        frameHeight: 160,
      },
    );
    this.load.spritesheet(
      "dungeonBoss_defeat",
      "world/halloween/DungeonBoss_Defeat.webp",
      {
        frameWidth: 160,
        frameHeight: 160,
      },
    );
    this.load.spritesheet("dungeonBoss_fire", "world/halloween/fireAtt.png", {
      frameWidth: 32,
      frameHeight: 91,
    });
    this.load.spritesheet("fire", "world/halloween/fire.webp", {
      frameWidth: 10,
      frameHeight: 15,
    });

    // Doors
    // Green door
    this.load.image(
      "gate_horizontal_close",
      "world/gate_horizontal_close.webp",
    );
    this.load.spritesheet(
      "gate_horizontal_close_animation",
      "world/gate_horizontal_close_animation.webp",
      {
        frameWidth: 96,
        frameHeight: 32,
      },
    );
    this.load.image("gate_horizontal_open", "world/gate_horizontal_open.webp");
    this.load.spritesheet(
      "gate_horizontal_open_animation",
      "world/gate_horizontal_open_animation.webp",
      {
        frameWidth: 96,
        frameHeight: 32,
      },
    );
    this.load.image("gate_vertical_close", "world/gate_vertical_close.webp");
    this.load.spritesheet(
      "gate_vertical_close_animation",
      "world/gate_vertical_close_animation.webp",
      {
        frameWidth: 32,
        frameHeight: 96,
      },
    );
    this.load.image("gate_vertical_open", "world/gate_vertical_open.webp");
    this.load.spritesheet(
      "gate_vertical_open_animation",
      "world/gate_vertical_open_animation.webp",
      {
        frameWidth: 32,
        frameHeight: 96,
      },
    );

    // Red door
    this.load.image(
      "red_gate_horizontal_close",
      "world/red_gate_horizontal_close.webp",
    );
    this.load.spritesheet(
      "red_gate_horizontal_close_animation",
      "world/red_gate_horizontal_close_animation.webp",
      {
        frameWidth: 96,
        frameHeight: 32,
      },
    );
    this.load.image(
      "red_gate_horizontal_open",
      "world/red_gate_horizontal_open.webp",
    );
    this.load.spritesheet(
      "red_gate_horizontal_open_animation",
      "world/red_gate_horizontal_open_animation.webp",
      {
        frameWidth: 96,
        frameHeight: 32,
      },
    );
    this.load.image(
      "red_gate_vertical_close",
      "world/red_gate_vertical_close.webp",
    );
    this.load.spritesheet(
      "red_gate_vertical_close_animation",
      "world/red_gate_vertical_close_animation.webp",
      {
        frameWidth: 32,
        frameHeight: 96,
      },
    );
    this.load.image(
      "red_gate_vertical_open",
      "world/red_gate_vertical_open.webp",
    );
    this.load.spritesheet(
      "red_gate_vertical_open_animation",
      "world/red_gate_vertical_open_animation.webp",
      {
        frameWidth: 32,
        frameHeight: 96,
      },
    );

    // Decorations
    this.load.image(
      "pile_of_bones",
      "world/halloween/decorations/pile_of_bones.png",
    );
    this.load.image(
      "bookshelves1",
      "world/halloween/decorations/bookshelves1.png",
    );
    this.load.image(
      "bookshelves2",
      "world/halloween/decorations/bookshelves2.png",
    );
    this.load.image(
      "bookshelves3",
      "world/halloween/decorations/bookshelves3.png",
    );
    this.load.image(
      "bookshelves4",
      "world/halloween/decorations/bookshelves4.png",
    );
    this.load.image(
      "bookshelves5",
      "world/halloween/decorations/bookshelves5.png",
    );
    this.load.image(
      "bookshelves6",
      "world/halloween/decorations/bookshelves6.png",
    );
    this.load.image(
      "bookshelves7",
      "world/halloween/decorations/bookshelves7.png",
    );
    this.load.image(
      "bookshelves8",
      "world/halloween/decorations/bookshelves8.png",
    );
    this.load.image(
      "bookshelves9",
      "world/halloween/decorations/bookshelves9.png",
    );
    this.load.image(
      "bookshelves10",
      "world/halloween/decorations/bookshelves10.png",
    );
    this.load.image(
      "normal_pillar",
      "world/halloween/decorations/normal_pillar.png",
    );
    this.load.image(
      "damaged_pillar",
      "world/halloween/decorations/damaged_pillar.png",
    );
    this.load.image(
      "broken_pillar",
      "world/halloween/decorations/broken_pillar.png",
    );
    this.load.spritesheet(
      "raveyard",
      "world/halloween/decorations/raveyard.webp",
      {
        frameWidth: 21,
        frameHeight: 26,
      },
    );
    this.load.spritesheet(
      "hauntedTomb",
      "world/halloween/decorations/hauntedTomb.webp",
      {
        frameWidth: 21,
        frameHeight: 30,
      },
    );
    this.load.image(
      "banner_red_front",
      "world/halloween/decorations/banner_red_front.png",
    );
    this.load.image(
      "banner_red_right",
      "world/halloween/decorations/banner_red_right.png",
    );
    this.load.image(
      "banner_red_left",
      "world/halloween/decorations/banner_red_left.png",
    );
    this.load.image(
      "banner_grey_front",
      "world/halloween/decorations/banner_grey_front.png",
    );
    this.load.image(
      "banner_grey_right",
      "world/halloween/decorations/banner_grey_right.png",
    );
    this.load.image(
      "banner_grey_left",
      "world/halloween/decorations/banner_grey_left.png",
    );
    this.load.image(
      "banner_darkgrey_front",
      "world/halloween/decorations/banner_darkgrey_front.png",
    );
    this.load.image(
      "banner_darkgrey_right",
      "world/halloween/decorations/banner_darkgrey_right.png",
    );
    this.load.image(
      "banner_darkgrey_left",
      "world/halloween/decorations/banner_darkgrey_left.png",
    );
    this.load.image(
      "ancient_artifact1",
      "world/halloween/decorations/ancient_artifact1.png",
    );
    this.load.image(
      "ancient_artifact2",
      "world/halloween/decorations/ancient_artifact2.png",
    );
    this.load.image(
      "ancient_artifact3",
      "world/halloween/decorations/ancient_artifact3.png",
    );
    this.load.image(
      "barrel_normal",
      "world/halloween/decorations/barrel-normal.png",
    );
    this.load.image(
      "barrel_broken",
      "world/halloween/decorations/barrel-broken.png",
    );

    // Mummy
    this.load.spritesheet(
      "dungeonMummy_idle",
      "world/halloween/dungeonMummy_idle.webp",
      {
        frameWidth: 64,
        frameHeight: 64,
      },
    );
    this.load.spritesheet(
      "dungeonMummy_walk",
      "world/halloween/dungeonMummy_walk.webp",
      {
        frameWidth: 64,
        frameHeight: 64,
      },
    );
    this.load.spritesheet(
      "dungeonMummy_attack",
      "world/halloween/dungeonMummy_attack.webp",
      {
        frameWidth: 64,
        frameHeight: 64,
      },
    );
    this.load.spritesheet(
      "dungeonMummy_defeat",
      "world/halloween/dungeonMummy_defeat.webp",
      {
        frameWidth: 64,
        frameHeight: 64,
      },
    );
    this.load.spritesheet(
      "dungeonMummy_smash",
      "world/halloween/dungeonMummy_smash.webp",
      {
        frameWidth: 64,
        frameHeight: 64,
      },
    );

    // Golem
    this.load.spritesheet(
      "dungeonGolem_idle",
      "world/halloween/dungeonGolem_idle.webp",
      {
        frameWidth: 64,
        frameHeight: 64,
      },
    );
    this.load.spritesheet(
      "dungeonGolem_walk",
      "world/halloween/dungeonGolem_walk.webp",
      {
        frameWidth: 64,
        frameHeight: 64,
      },
    );
    this.load.spritesheet(
      "dungeonGolem_attack",
      "world/halloween/dungeonGolem_attack.webp",
      {
        frameWidth: 64,
        frameHeight: 64,
      },
    );
    this.load.spritesheet(
      "dungeonGolem_defeat",
      "world/halloween/dungeonGolem_defeat.webp",
      {
        frameWidth: 64,
        frameHeight: 64,
      },
    );
    this.load.spritesheet(
      "dungeonGolem_smash",
      "world/halloween/dungeonGolem_smash.webp",
      {
        frameWidth: 64,
        frameHeight: 64,
      },
    );

    // Ghoul
    this.load.spritesheet("ghoul_idle", "world/halloween/ghoul_idle.webp", {
      frameWidth: 30,
      frameHeight: 32,
    });
    this.load.spritesheet("ghoul_walk", "world/halloween/ghoul_walk.webp", {
      frameWidth: 30,
      frameHeight: 32,
    });
    this.load.spritesheet("ghoul_attack", "world/halloween/ghoul_attack.webp", {
      frameWidth: 30,
      frameHeight: 32,
    });
    this.load.spritesheet("ghoul_defeat", "world/halloween/ghoul_defeat.webp", {
      frameWidth: 30,
      frameHeight: 32,
    });

    // Ghost
    this.load.spritesheet("ghost_walk", "world/halloween/ghost_walk.webp", {
      frameWidth: 37,
      frameHeight: 40,
    });
    this.load.spritesheet("ghost_idle", "world/halloween/ghost_idle.webp", {
      frameWidth: 37,
      frameHeight: 40,
    });
    this.load.spritesheet("ghost_attack", "world/halloween/ghost_attack.webp", {
      frameWidth: 37,
      frameHeight: 40,
    });
    this.load.spritesheet("ghost_defeat", "world/halloween/ghost_defeat.webp", {
      frameWidth: 37,
      frameHeight: 40,
    });

    // Hole
    this.load.spritesheet("hole", "world/hole.png", {
      frameWidth: 74,
      frameHeight: 42,
    });

    // Puzzle NPC
    this.load.spritesheet("owl", "world/owl.png", {
      frameWidth: 65,
      frameHeight: 71,
    });

    // Aura
    this.load.spritesheet(
      `${ITEM_IDS["Halloween Aura"]}-bumpkin-aura-front-sheet`,
      "world/halloween_aura_front.webp",
      {
        frameWidth: 20,
        frameHeight: 19,
      },
    );
    this.load.spritesheet(
      `${ITEM_IDS["Halloween Aura"]}-bumpkin-aura-back-sheet`,
      "world/halloween_aura_back.webp",
      {
        frameWidth: 20,
        frameHeight: 19,
      },
    );
  }

  // init(data: any) {
  //   if (data) {
  //     console.log(data.score);
  //     console.log(data.level);
  //   }
  // }

  async create() {
    super.create();
    EventBus.removeAllListeners();
    this.initialiseProperties();
    this.initializeControls();
    this.initialiseEvents();
    this.initialiseFontFamily();

    new Map({
      scene: this,
      player: this.currentPlayer,
    });

    this.backgroundMusic = this.sound.add("backgroundMusic", {
      loop: true,
      volume: 0.5,
    });
    this.backgroundMusic.play();

    // this.enemyRoom = new EnemyRoom({
    //   scene: this,
    //   player: this.currentPlayer,
    // });

    // this.enemyRoom.createObjects();

    // setTimeout(() => {
    //   this.scene.restart({
    //     score: 2000,
    //     level: 3,
    //   });
    // }, 5000);

    // this.initShaders();

    // this.ghostSound = this.sound.add("ghostSound", {
    //   loop: true,
    //   volume: 0.0,
    // });
    // this.ghostSound.play();
    // this.zombieSound = this.sound.add("zombieSound", {
    //   loop: true,
    //   volume: 0.0,
    // });
    // this.zombieSound.play();

    // this.AnimationEnemy_2();  // Create zombie animations

    // this.physics.world.drawDebug = true;

    // Important to first save the player and then the lamps
    // this.currentPlayer && (this.lightedItems[0] = this.currentPlayer);
    // this.lightedItems[1] = { x: -500, y: -500 };
    // this.createMask();
    // this.createWalls();
    // this.createAllLamps();

    // this.velocity = 0;
  }

  update() {
    if (!this.currentPlayer) return;
    if (!this.portalService) return;

    // this.enemyRoom.update()

    if (this.portalService.state.context.lives <= 0) {
      // this.endGame();
    } else {
      // if (this.portalService?.state.context.isJoystickActive) {
      //   this.setJoystickPosition();
      // }
      // this.adjustShaders();

      // Shadows
      // const { x: currentX = 0, y: currentY = 0 } = this.currentPlayer ?? {};
      // if (
      //   this.playerPosition.x !== currentX ||
      //   this.playerPosition.y !== currentY
      // ) {
      //   this.renderAllLights();
      //   this.playerPosition = { x: currentX, y: currentY };
      // }

      if (this.isGamePlaying) {
        for (const cb of this.updateCallbacks) {
          cb.fn();
        }
        // this.updateAmountLamps();
        // this.enemy_1();
        // this.faceDirectionEnemy_1();
        // this.enemy_2();
        // this.checkZombiesInsideWalls();
        // this.faceDirectionEnemy_2();
        // this.portalService?.send("GAIN_POINTS");
        // if (!this.isMoving) {
        //   this.gameOverNoMove += 1;
        //   if (this.gameOverNoMove > 1000) {
        //     this.portalService?.send("GAME_OVER");
        //   }
        //   if (this.gameOverNoMove > 500) {
        //     this.currentPlayer.addLabel("Move!");
        //   }
        // } else {
        //   this.gameOverNoMove = 0;
        // }
        // if (this.portalService?.state.context.lamps === 0) {
        //   this.playWarningSound();
        // }
        // if (
        //   (this.portalService as MachineInterpreter)?.state.context.lamps > 0
        // ) {
        //   this.stopWarningSound();
        // }
      } else {
        // this.velocity = 0;
      }

      this.loadBumpkinAnimations();

      // this.setLampSpawnTime();
      // this.handleZombieSound();
      // this.handleGhostSound();

      if (this.isGameReady) {
        this.portalService?.send("START");
        this.lastAttempt = this.time.now;
        this.velocity = WALKING_SPEED;
      }
    }

    // this.currentPlayer.updateLightRadius();

    super.update();
  }

  private initialiseProperties() {
    this.updateCallbacks = [];
    this.objectsWithCollider = [];
    this.bones = structuredClone(BONES);
    this.relics = structuredClone(RELICS);
  }

  private initializeControls() {
    if (isTouchDevice()) {
      // const leftButton = this.add
      //   .image(leftButtonX, buttonY, "left_button")
      //   .setAlpha(0.8)
      //   .setInteractive()
      //   .setDepth(1000)
      //   .on("pointerdown", () => {
      //     if (!this.mobileKeys.left) {
      //       this.mobileKeys.left = true;
      //       this.portalService?.send("CHANGE_TOOL");
      //       leftButton.setTexture("left_button_pressed");

      //       this.scene.time.delayedCall(200, () => {
      //         this.mobileKeys.left = false;
      //         leftButton.setTexture("left_button");
      //       });
      //     }
      //   });

      this.portalService?.send("SET_JOYSTICK_ACTIVE", {
        isJoystickActive: true,
      });
    }
  }

  private initialiseEvents() {
    EventBus.on("apply-relic-buff", (name: Relics) => {
      this.applyRelicBuff(name);
    });
    EventBus.on("get-aura", () => this.applyAura());

    // reload scene when player hit retry
    const onRetry = (event: EventObject) => {
      if (event.type === "RETRY") {
        this.isCameraFading = true;
        this.cameras.main.fadeOut(500);
        // this.reset();
        this.scene.restart();
        this.cameras.main.on(
          "camerafadeoutcomplete",
          () => {
            this.cameras.main.fadeIn(500);
            this.velocity = WALKING_SPEED;
            this.isCameraFading = false;
          },
          this,
        );
      }
    };
    this.portalService?.onEvent(onRetry);
  }

  private initialiseFontFamily() {
    this.add
      .text(0, 0, ".", {
        fontFamily: "Teeny",
        fontSize: "1px",
        color: "#000000",
      })
      .setAlpha(0);
  }

  private applyAura() {
    const now = new Date();
    this.currentPlayer?.changeClothing({
      ...this.currentPlayer?.clothing,
      aura: "Halloween Aura",
      updatedAt: now.getTime(),
    });
    this.currentPlayer?.showAura();
  }

  applyRelicBuff(name: Relics) {
    const effectAction = {
      envy: () => this.applyEnvyBuff(),
      gluttony: () => this.applyGluttonyBuff(),
      greed: () => this.applyGreedBuff(),
      lust: () => this.applyLustBuff(),
      pride: () => this.applyPrideBuff(),
      sloth: () => this.applySlothBuff(),
      wrath: () => this.applyWrathBuff(),
      deceit: () => this.applyDeceitBuff(),
    };
    this.portalService?.send("COLLECT_RELIC", { relicName: name });
    effectAction[name]();
  }

  applyEnvyBuff() {
    const currentSwordDamage =
      this.currentPlayer?.getDamage("sword", "all") ?? 0;
    const newDamage =
      currentSwordDamage + ENVY_BUFF_DAMAGE >= 1
        ? currentSwordDamage + ENVY_BUFF_DAMAGE
        : 1;
    this.currentPlayer?.setDamage("sword", newDamage);
  }

  applyGluttonyBuff() {
    this.velocity *= 1 + GLUTTONY_BUFF_PERCENTAGE;
  }

  applyGreedBuff() {
    this.currentPlayer?.setFireRadius(GREED_BUFF_RANGE);
  }

  applyLustBuff() {
    this.portalService?.send("INCREASE_MAX_LIVES", {
      lives: LUST_BUFF_LIVES.maxLives,
    });
    this.portalService?.send("RESTORE_LIVES", { lives: LUST_BUFF_LIVES.lives });
  }

  applyPrideBuff() {
    if (!this.currentPlayer) return;

    const { doubleDamageChance = 0 } = this.currentPlayer;
    const prideBonus = PRIDE_BUFF_PERCENTAGE;

    const doubleDamageChange = doubleDamageChance
      ? prideBonus
      : doubleDamageChance * (1 + prideBonus);

    this.currentPlayer.setDoubleDamageChance(doubleDamageChange);
  }

  applySlothBuff() {
    this.currentPlayer?.setCanHealWithGates(true);
  }

  applyWrathBuff() {
    this.currentPlayer?.setFrameRateAttack(WRATH_BUFF_PERCENTAGE);
  }

  applyDeceitBuff() {
    this.currentPlayer?.setDodgeAttackChance(DECEIT_BUFF_PERCENTAGE);
  }

  // // Enemy_1 (ghost_enemy)
  // enemy_1() {
  //   // Delay the spawning of enemies by 10 seconds at the start
  //   const currentTime = this.time.now;

  //   if (currentTime - this.lastAttempt > this.dalaySpawnTime) {
  //     // Reset spawn count after a minute
  //     if (currentTime - this.lastSpawnTimeGhost > this.updateInterval) {
  //       // console.log(
  //       //   `Enemy count has been reset. Total enemies spawned: ${this.minGhostPerMin}`,
  //       // );
  //       this.minGhostPerMin = 0;
  //       this.lastSpawnTimeGhost = currentTime;
  //     }

  //     // Spawn enemies up to the maximum limit
  //     while (this.minGhostPerMin < this.maxGhostPerMin) {
  //       const ghost_enemy =
  //         this.createEnemy_1() as Phaser.Physics.Arcade.Sprite;

  //       if (this.currentPlayer) {
  //         this.physics.add.collider(ghost_enemy, this.currentPlayer, () =>
  //           this.handleCollision(ghost_enemy),
  //         );
  //       }
  //       this.minGhostPerMin++;
  //     }
  //   }
  // }

  // createEnemy_1() {
  //   if (!this.currentPlayer) return;
  //   let x: number, y: number;
  //   let isNotInside = true;
  //   const size = 1000;
  //   const offsetMap = 20;
  //   do {
  //     x = Phaser.Math.Between(
  //       Math.floor(this.currentPlayer.x - size),
  //       Math.floor(this.currentPlayer.x + size),
  //     );
  //     y = Phaser.Math.Between(
  //       Math.floor(this.currentPlayer.y - size),
  //       Math.floor(this.currentPlayer.y + size),
  //     );
  //     if (
  //       x > offsetMap &&
  //       y > offsetMap &&
  //       x < this.map.width * this.map.tileWidth - offsetMap &&
  //       y < this.map.height * this.map.tileHeight - offsetMap
  //     ) {
  //       isNotInside = false;
  //     }
  //   } while (isNotInside);

  //   const enemy1 = this.physics.add
  //     .sprite(x, y, "ghost_enemy_1", 0)
  //     .setSize(22, 23)
  //     .setOffset(-0.5)
  //     .setVelocity(Phaser.Math.Between(10, 20), Phaser.Math.Between(10, 20))
  //     .setCollideWorldBounds(true)
  //     .setBounce(1, 1);

  //   this.ghost_enemies.push(enemy1);
  //   this.AnimationEnemy_1();
  //   // console.log(`Spawned ghost #${this.minGhostPerMin + 1}:`, { x, y });
  //   return enemy1;
  // }

  // AnimationEnemy_1() {
  //   ["ghost_enemy_1", "ghost_enemy_2"].forEach((key) => {
  //     if (!this.anims.exists(`${key}_anim`)) {
  //       this.anims.create({
  //         key: `${key}_anim`,
  //         frames: this.anims.generateFrameNumbers(key, { start: 0, end: 12 }),
  //         repeat: -1,
  //         frameRate: 10,
  //       });
  //     }
  //   });
  // }

  // // Handle collision with ghost_enemy
  // handleCollision(ghost_enemy: Phaser.Physics.Arcade.Sprite) {
  //   const { x, y } = ghost_enemy;
  //   const poof_1 = this.add.sprite(x, y, "poof_1").play("poof_1_anim", true);

  //   this.stealLamps();

  //   if (!this.anims.exists("poof_1_anim")) {
  //     this.anims.create({
  //       key: "poof_1_anim",
  //       frames: this.anims.generateFrameNumbers("poof_1", {
  //         start: 0,
  //         end: 11,
  //       }),
  //       repeat: 0,
  //       frameRate: 10,
  //     });
  //   }

  //   poof_1.play("poof_1_anim", true);
  //   this.ghostDeathSound = this.sound.add("ghostDeathSound", {
  //     loop: false,
  //     volume: 0.4,
  //   });
  //   this.ghostDeathSound.play();
  //   this.ghostDeathSound.on("complete", () => this.ghostDeathSound.destroy());

  //   poof_1.on("animationcomplete", () => poof_1.destroy());
  //   ghost_enemy.destroy();
  //   this.ghost_enemies = this.ghost_enemies.filter(
  //     (sprite) => sprite !== ghost_enemy,
  //   );
  //   this.currentPlayer && this.handleDimEffect();
  // }

  // handleDimEffect() {
  //   const darknessPipeline = this.cameras.main.getPostPipeline(
  //     "DarknessPipeline",
  //   ) as DarknessPipeline;
  //   darknessPipeline.lightRadius[0] = 0; // Dim the light immediately
  // }

  // // Animation Direction of Enemy_1
  // faceDirectionEnemy_1() {
  //   this.ghost_enemies.forEach((ghost_enemy) => {
  //     if (ghost_enemy.body) {
  //       const animKey =
  //         ghost_enemy.body.velocity.x > 0
  //           ? "ghost_enemy_1_anim"
  //           : "ghost_enemy_2_anim";
  //       ghost_enemy.play(animKey, true);
  //     }
  //   });
  // }

  // // Enemy_2 (zombie_enemy)
  // enemy_2() {
  //   const currentTime = this.time.now;

  //   if (currentTime - this.lastAttempt > this.dalaySpawnTime) {
  //     if (currentTime - this.lastSpawnTimeZombie > this.updateInterval) {
  //       // console.log(
  //       //   `Enemy count has been reset. Total enemies spawned: ${this.minZombiePerMin}`,
  //       // );
  //       this.minZombiePerMin = 0;
  //       this.lastSpawnTimeZombie = currentTime;
  //     }

  //     while (this.minZombiePerMin < this.maxZombiePerMin) {
  //       const zombie_enemy =
  //         this.createEnemy_2() as Phaser.Physics.Arcade.Sprite;

  //       if (this.currentPlayer) {
  //         this.physics.add.collider(zombie_enemy, this.currentPlayer, () =>
  //           this.handleCollisionZombie(zombie_enemy),
  //         );
  //       }

  //       this.minZombiePerMin++;
  //     }
  //   }
  // }

  // createEnemy_2() {
  //   if (!this.currentPlayer) return;
  //   let x: number, y: number;
  //   let isInsidePolygon = true;
  //   const size = 400;
  //   const offsetMap = 20;
  //   do {
  //     x = Phaser.Math.Between(
  //       Math.floor(this.currentPlayer.x - size),
  //       Math.floor(this.currentPlayer.x + size),
  //     );
  //     y = Phaser.Math.Between(
  //       Math.floor(this.currentPlayer.y - size),
  //       Math.floor(this.currentPlayer.y + size),
  //     );
  //     if (
  //       x > offsetMap &&
  //       y > offsetMap &&
  //       x < this.map.width * this.map.tileWidth - offsetMap &&
  //       y < this.map.height * this.map.tileHeight - offsetMap
  //     ) {
  //       isInsidePolygon = this.polygonShapes.some((shape) =>
  //         Phaser.Geom.Polygon.Contains(shape, x, y),
  //       );
  //     }
  //   } while (isInsidePolygon);

  //   const enemy2 = this.physics.add
  //     .sprite(x, y, "zombie_enemy_1", 0)
  //     .setSize(15.8, 17)
  //     .setOffset(-0.5)
  //     .setVelocity(Phaser.Math.Between(10, 15))
  //     .setCollideWorldBounds(true)
  //     .setBounce(1, 1);

  //   this.zombie_enemies.push(enemy2);
  //   this.AnimationEnemy_2();
  //   this.handleZombieCollisions(enemy2);
  //   // console.log(`Spawned Zombie #${this.minZombiePerMin + 1}:`, { x, y });
  //   return enemy2;
  // }

  // handleZombieCollisions(newZombie: Phaser.Physics.Arcade.Sprite) {
  //   this.zombie_enemies.forEach((existingZombie) => {
  //     if (existingZombie !== newZombie) {
  //       this.physics.add.collider(newZombie, existingZombie);
  //     }
  //   });
  // }

  // AnimationEnemy_2() {
  //   ["zombie_enemy_1", "zombie_enemy_2"].forEach((key) => {
  //     if (!this.anims.exists(`${key}_anim`)) {
  //       this.anims.create({
  //         key: `${key}_anim`,
  //         frames: this.anims.generateFrameNumbers(key, { start: 0, end: 7 }),
  //         repeat: -1,
  //         frameRate: 10,
  //       });
  //     }
  //   });
  // }

  // handleCollisionZombie(zombie_enemy: Phaser.Physics.Arcade.Sprite) {
  //   const { x, y } = zombie_enemy;
  //   const zombie_death = this.add
  //     .sprite(x, y, "zombie_death")
  //     .play("zombie_death_anim", true);

  //   this.stealLamps();

  //   if (!this.anims.exists("zombie_death_anim")) {
  //     this.anims.create({
  //       key: "zombie_death_anim",
  //       frames: this.anims.generateFrameNumbers("zombie_death", {
  //         start: 0,
  //         end: 12,
  //       }),
  //       repeat: 0,
  //       frameRate: 10,
  //     });
  //   }

  //   zombie_death.play("zombie_death_anim", true);
  //   this.zombieDeathSound = this.sound.add("ghostDeathSound", {
  //     loop: false,
  //     volume: 0.7,
  //   });
  //   this.zombieDeathSound.play();
  //   this.zombieDeathSound.on("complete", () => this.zombieDeathSound.destroy());
  //   zombie_death.on("animationcomplete", () => zombie_death.destroy());
  //   zombie_enemy.destroy();
  //   this.zombie_enemies = this.zombie_enemies.filter(
  //     (sprite) => sprite !== zombie_enemy,
  //   );
  //   this.handlePlayerEnemyCollision();
  // }

  // handlePlayerEnemyCollision() {
  //   if (this.currentPlayer && this.currentPlayer.body) {
  //     const originalVelocity = WALKING_SPEED;
  //     this.velocity *= this.SetSlowDown;

  //     this.accumulatedSlowdown += this.setSlowdownDuration;

  //     if (this.slowdownTimeout) {
  //       clearTimeout(this.slowdownTimeout);
  //     }

  //     this.slowdownTimeout = setTimeout(() => {
  //       if (this.currentPlayer) {
  //         this.velocity = originalVelocity;
  //         this.accumulatedSlowdown = 0;
  //       }
  //     }, this.accumulatedSlowdown);
  //   }
  // }

  // handleZombieSound() {
  //   let z_e: number | Physics.Arcade.Sprite | null = null;
  //   let zDis = 10000;
  //   let distance;

  //   this.zombie_enemies.forEach((zombie_enemy) => {
  //     if (this.currentPlayer && zombie_enemy) {
  //       distance = Phaser.Math.Distance.Between(
  //         this.currentPlayer.x,
  //         this.currentPlayer.y,
  //         zombie_enemy.x,
  //         zombie_enemy.y,
  //       );
  //       if (distance < zDis) {
  //         z_e = zombie_enemy;
  //         zDis = distance;
  //       }
  //     }
  //   });

  //   const canHearDistance = 150;
  //   const maxVolume = 1;
  //   const minVolume = 0.0;

  //   let volume = minVolume;
  //   if (zDis < canHearDistance) {
  //     volume = Phaser.Math.Linear(maxVolume, minVolume, zDis / canHearDistance);
  //   } else {
  //     volume = 0.0;
  //   }

  //   (this.zombieSound as any).setVolume(volume);
  //   // console.log(zDis);
  // }

  // handleGhostSound() {
  //   let z_e: number | Physics.Arcade.Sprite | null = null;
  //   let zDis = 10000;
  //   let distance;

  //   this.ghost_enemies.forEach((ghost_enemy) => {
  //     if (this.currentPlayer && ghost_enemy) {
  //       distance = Phaser.Math.Distance.Between(
  //         this.currentPlayer.x,
  //         this.currentPlayer.y,
  //         ghost_enemy.x,
  //         ghost_enemy.y,
  //       );
  //       if (distance < zDis) {
  //         z_e = ghost_enemy;
  //         zDis = distance;
  //       }
  //     }
  //   });

  //   const canHearDistance = 150;
  //   const maxVolume = 0.5;
  //   const minVolume = 0.0;

  //   let volume = minVolume;
  //   if (zDis < canHearDistance) {
  //     volume = Phaser.Math.Linear(maxVolume, minVolume, zDis / canHearDistance);
  //   } else {
  //     volume = 0.0;
  //   }

  //   (this.ghostSound as any).setVolume(volume);
  //   //console.log(zDis)
  // }

  // faceDirectionEnemy_2() {
  //   const visionRange = this.setVisionRange;
  //   this.zombie_enemies.forEach((zombie) => {
  //     if (this.currentPlayer && zombie.body) {
  //       const distanceToPlayer = Phaser.Math.Distance.Between(
  //         zombie.x,
  //         zombie.y,
  //         this.currentPlayer.x,
  //         this.currentPlayer.y,
  //       );

  //       if (distanceToPlayer <= visionRange) {
  //         this.physics.moveToObject(zombie, this.currentPlayer, 15);
  //         if (zombie.body.velocity.x > 0) {
  //           zombie.play("zombie_enemy_1_anim", true);
  //         } else if (zombie.body.velocity.x < 0) {
  //           zombie.play("zombie_enemy_2_anim", true);
  //         }
  //       } else {
  //         zombie.setVelocity(0, 0);
  //       }
  //     }
  //   });
  // }

  // checkZombiesInsideWalls() {
  //   this.zombie_enemies.forEach((zombie) => {
  //     if (zombie.body && this.currentPlayer) {
  //       const isInsidePolygon = this.polygonShapes.some((shape) =>
  //         Phaser.Geom.Polygon.Contains(shape, zombie.x, zombie.y),
  //       );

  //       if (isInsidePolygon) {
  //         zombie.setVelocity(-zombie.body.velocity.x, -zombie.body.velocity.y);
  //         zombie.x += zombie.body.velocity.x * 0.1;
  //         zombie.y += zombie.body.velocity.y * 0.1;
  //       }
  //     }
  //   });
  // }

  // private setDefaultStates() {
  //   this.lightedItems = Array(MAX_LAMPS_IN_MAP + 2).fill(null);
  //   this.polygons = [];
  //   this.polygonShapes = [];
  //   this.playerPosition = { x: 0, y: 0 };
  //   this.visibilityPolygon = new VisibilityPolygon();
  //   this.lampSpawnTime = LAMP_SPAWN_BASE_INTERVAL;
  //   this.numLampsInMap = LAMPS_CONFIGURATION.length;
  //   this.deathDate = null;
  //   this.amountLamps = 3;
  //   this.lastAttempt = 0;
  //   this.gameOverNoMove = 0;

  //   // Enemies
  //   this.ghost_enemies = [];
  //   this.zombie_enemies = [];
  //   this.lastSpawnTimeGhost = LAST_SPAWN_TIME_GHOST;
  //   this.lastSpawnTimeZombie = LAST_SPAWN_TIME_ZOMBIE;
  //   this.dalaySpawnTime = DELAY_SPAWN_TIME;
  //   this.updateInterval = UPDATE_INTERVAL;
  //   this.minGhostPerMin = MIN_GHOST_PER_MIN;
  //   this.maxGhostPerMin = MAX_GHOST_PER_MIN;
  //   this.minZombiePerMin = MIN_ZOMBIE_PER_MIN;
  //   this.maxZombiePerMin = MAX_ZOMBIE_PER_MIN;
  //   this.SetSlowDown = SET_SLOW_DOWN;
  //   this.setSlowdownDuration = SET_SLOW_DOWN_DURATION;
  //   this.accumulatedSlowdown = ACCUMULATED_SLOWDOWN;
  //   this.slowdownTimeout = null;
  //   this.setVisionRange = SET_VISION_RANGE;
  // }

  // private reset() {
  //   this.currentPlayer?.setPosition(
  //     SPAWNS()[this.sceneId].default.x,
  //     SPAWNS()[this.sceneId].default.y,
  //   );
  //   this.resetAllLamps();
  //   this.resetAllenemies();
  //   this.lightedItems = Array(MAX_LAMPS_IN_MAP + 2).fill(null);
  //   this.currentPlayer && (this.lightedItems[0] = this.currentPlayer);
  //   this.lightedItems[1] = { x: 0, y: 0 };
  //   // this.createAllLamps();
  //   this.lampSpawnTime = LAMP_SPAWN_BASE_INTERVAL;
  //   this.deathDate = null;
  //   this.amountLamps = 3;
  //   this.lastAttempt = this.time.now;
  //   this.gameOverNoMove = 0;

  //   // Enemies
  //   this.ghost_enemies = [];
  //   this.zombie_enemies = [];
  //   this.lastSpawnTimeGhost = LAST_SPAWN_TIME_GHOST;
  //   this.lastSpawnTimeZombie = LAST_SPAWN_TIME_ZOMBIE;
  //   this.minGhostPerMin = MIN_GHOST_PER_MIN;
  //   this.minZombiePerMin = MIN_ZOMBIE_PER_MIN;
  //   this.accumulatedSlowdown = ACCUMULATED_SLOWDOWN;
  //   this.slowdownTimeout = null;
  // }

  // private initShaders() {
  //   if (!this.currentPlayer) return;

  //   (
  //     this.renderer as Phaser.Renderer.WebGL.WebGLRenderer
  //   ).pipelines?.addPostPipeline("DarkModePipeline", DarknessPipeline);
  //   this.cameras.main.setPostPipeline(DarknessPipeline);

  //   const darknessPipeline = this.cameras.main.getPostPipeline(
  //     "DarknessPipeline",
  //   ) as DarknessPipeline;

  //   // Set initial values in the shader
  //   // First position: current player
  //   const playerLightRadius = [MIN_PLAYER_LIGHT_RADIUS];
  //   const joystickLightRadius = [JOYSTICK_LIGHT_RADIUS];
  //   const lampsLightRadius = new Array(MAX_LAMPS_IN_MAP).fill(
  //     INITIAL_LAMPS_LIGHT_RADIUS,
  //   );
  //   darknessPipeline.lightRadius = [
  //     ...playerLightRadius,
  //     ...joystickLightRadius,
  //     ...lampsLightRadius,
  //   ];
  // }

  private loadBumpkinAnimations() {
    if (!this.currentPlayer) return;
    if (!this.cursorKeys) return;

    const selectedTool = this.portalService?.state?.context
      ?.selectedTool as Tools;
    const itemBumpkinX = this.currentPlayer.directionFacing === "left" ? -1 : 1;
    let animation!: AnimationKeys;

    if (
      !this.currentPlayer.isHurting &&
      !this.currentPlayer.isAttacking &&
      !this.currentPlayer.isMining
    ) {
      animation = this.isMoving
        ? selectedTool === "lamp"
          ? "carry"
          : "walk"
        : selectedTool === "lamp"
          ? "carryIdle"
          : "idle";
    }

    if (
      (Phaser.Input.Keyboard.JustDown(this.cursorKeys.space) ||
        this.mobileKeys.useTool) &&
      !this.currentPlayer.isHurting &&
      !this.currentPlayer.isAttacking &&
      !this.currentPlayer.isMining &&
      !this.currentPlayer.isBurning
    ) {
      animation = TOOL_ACTION_MAP[selectedTool] as ToolActions;
    }

    if (
      (Phaser.Input.Keyboard.JustDown(
        this.cursorKeys.q as Phaser.Input.Keyboard.Key,
      ) ||
        this.mobileKeys.changeTool) &&
      !this.currentPlayer.isHurting
    ) {
      this.portalService?.send("CHANGE_TOOL");
      const lampVisibility =
        this.portalService?.state?.context?.selectedTool === "lamp"
          ? true
          : false;
      this.currentPlayer.lampVisibility(lampVisibility);
    }

    this.currentPlayer.lamp?.setX(itemBumpkinX);
    this.currentPlayer?.[animation]?.();
  }

  // private setLampSpawnTime() {
  //   const score = Math.floor(this.portalService?.state.context.score || 0);
  //   if (score >= this.lampSpawnTime) {
  //     const increase = Math.floor(
  //       LAMP_SPAWN_BASE_INTERVAL *
  //         (1 +
  //           LAMP_SPAWN_INCREASE_PERCENTAGE *
  //             Math.floor(score / LAMP_SPAWN_BASE_INTERVAL)),
  //     );
  //     this.lampSpawnTime += increase;

  //     this.numLampsInMap = this.lightedItems.filter((item, i) => {
  //       if (i === 0 || i === 1) return false;
  //       return item !== null && item?.x !== -9999 && item?.y !== -9999;
  //     }).length;

  //     if (this.numLampsInMap < MAX_LAMPS_IN_MAP) {
  //       // console.log("Goal: ", this.lampSpawnTime, "Increase: ", increase);
  //       // console.log("Lamps in the map", this.numLampsInMap);
  //       this.createLamp();
  //     }
  //   }
  // }

  // private stealLamps() {
  //   if (!this.portalService) return;

  //   let stolenLamps =
  //     Math.floor(
  //       this.portalService.state.context.score / LAMP_USAGE_MULTIPLIER_INTERVAL,
  //     ) + 1;

  //   if (stolenLamps > this.portalService.state.context.lamps) {
  //     stolenLamps = this.portalService.state.context.lamps;
  //   }

  //   this.portalService?.send("DEAD_LAMP", { lamps: stolenLamps });
  // }

  // private updateAmountLamps() {
  //   if (!this.portalService) return;

  //   const amountLamps = this.portalService.state.context.lamps;

  //   if (amountLamps > 0 && amountLamps !== this.amountLamps) {
  //     const amount = this.portalService.state.context.lamps - this.amountLamps;
  //     this.currentPlayer?.addLabel(amount);
  //     this.amountLamps = this.portalService?.state.context.lamps;
  //   }
  // }

  // private playWarningSound() {
  //   if (this.shadows) return;
  //   if (this.tension) return;

  //   this.shadows = this.sound.add("shadows", {
  //     loop: false,
  //     volume: 0.15,
  //   });
  //   this.shadows.play();
  //   this.shadows.on("complete", () => {
  //     this.shadows?.destroy();
  //     this.shadows = null;
  //   });

  //   this.tension = this.sound.add("tension", {
  //     loop: false,
  //     volume: 0.5,
  //   });
  //   this.tension.play();
  //   this.tension.on("complete", () => {
  //     this.tension?.destroy();
  //     this.tension = null;
  //   });
  // }

  // private stopWarningSound() {
  //   if (!this.shadows) return;
  //   if (!this.tension) return;

  //   this.shadows.stop();
  //   this.shadows.destroy();
  //   this.shadows = null;

  //   this.tension.stop();
  //   this.tension.destroy();
  //   this.tension = null;
  // }

  // private getNormalizedCoords(x: number, y: number) {
  //   const xPos =
  //     ((x - this.cameras.main.worldView.x) / this.cameras.main.width) *
  //     this.cameras.main.zoom;
  //   const yPos =
  //     ((y - this.cameras.main.worldView.y) / this.cameras.main.height) *
  //     this.cameras.main.zoom;

  //   return [xPos, yPos];
  // }

  // private adjustShaders = () => {
  //   const darknessPipeline = this.cameras.main.getPostPipeline(
  //     "DarknessPipeline",
  //   ) as DarknessPipeline;

  //   this.lightedItems.forEach((light, i) => {
  //     const coordinates = light
  //       ? { x: light.x, y: light.y }
  //       : { x: -9999, y: -9999 };
  //     const [x, y] = this.getNormalizedCoords(coordinates.x, coordinates.y);
  //     darknessPipeline.lightSources[i] = { x: x, y: y };
  //   });
  // };

  // private setJoystickPosition() {
  //   const camera = this.cameras.main;
  //   // const centerX = camera.worldView.x + camera.width / (camera.zoom * 2);
  //   // const centerY = camera.worldView.y + camera.height / (camera.zoom * 2);
  //   const centerX = camera.worldView.x + camera.width / camera.zoom / 2;
  //   const centerY = camera.worldView.y + camera.height / camera.zoom;
  //   this.lightedItems[1] = { x: centerX, y: centerY - 35 };
  // }

  // private resetAllenemies() {
  //   this.ghost_enemies.forEach((item) => {
  //     item.destroy();
  //   });

  //   this.zombie_enemies.forEach((item) => {
  //     item.destroy();
  //   });
  // }

  // private resetAllLamps() {
  //   this.lightedItems.forEach((item, i) => {
  //     if (i > 1) {
  //       (item as LampContainer)?.destroyLamp();
  //     }
  //   });
  // }

  // private createLamp() {
  //   if (!this.currentPlayer) return;
  //   let x: number, y: number;
  //   let isInsidePolygon = true;
  //   const size = 500;
  //   const offsetMap = 20;
  //   do {
  //     x = Phaser.Math.Between(
  //       Math.floor(this.currentPlayer.x - size),
  //       Math.floor(this.currentPlayer.x + size),
  //     );
  //     y = Phaser.Math.Between(
  //       Math.floor(this.currentPlayer.y - size),
  //       Math.floor(this.currentPlayer.y + size),
  //     );
  //     if (
  //       x > offsetMap &&
  //       y > offsetMap &&
  //       x < this.map.width * this.map.tileWidth - offsetMap &&
  //       y < this.map.height * this.map.tileHeight - offsetMap
  //     ) {
  //       isInsidePolygon = this.polygonShapes.some((shape) =>
  //         Phaser.Geom.Polygon.Contains(shape, x, y),
  //       );
  //     }
  //   } while (isInsidePolygon);

  //   const index = this.lightedItems.findIndex(
  //     (item) => item === null || (item?.x === -9999 && item?.y === -9999),
  //   );

  //   const lamp = new LampContainer({
  //     x: x,
  //     y: y,
  //     id: index,
  //     scene: this as BaseScene,
  //     player: this.currentPlayer,
  //     visibilityPolygon: this.visibilityPolygon,
  //     polygonWalls: this.polygons,
  //   });

  //   this.lightedItems[index] = lamp;

  //   // console.log("x: ", x, "y: ", y);
  //   // console.log(this.lightedItems);
  // }

  // private createAllLamps() {
  //   if (!this.currentPlayer) return;

  //   const lamps = LAMPS_CONFIGURATION.map(
  //     (lamp, i) =>
  //       new LampContainer({
  //         x: lamp.x,
  //         y: lamp.y,
  //         id: i,
  //         scene: this as BaseScene,
  //         player: this.currentPlayer,
  //         visibilityPolygon: this.visibilityPolygon,
  //         polygonWalls: this.polygons,
  //       }),
  //   );

  //   const position = 2;
  //   if (lamps.length + position <= this.lightedItems.length) {
  //     this.lightedItems.splice(position, lamps.length, ...lamps);
  //   }
  // }

  // private createWalls() {
  //   if (!this.currentPlayer) return;

  //   // Create walls with polygon points collision
  //   const collisions = mapJson.layers.find(
  //     (layer) => layer.name === "Collision",
  //   )?.objects;

  //   collisions?.forEach((collision) => {
  //     if (collision?.polygon) {
  //       const polygon: [number, number][] = [];
  //       const polygonPoints: Phaser.Geom.Point[] = [];
  //       collision.polygon.forEach((position) => {
  //         polygon.push([collision.x + position.x, collision.y + position.y]);
  //         polygonPoints.push(
  //           new Phaser.Geom.Point(
  //             collision.x + position.x,
  //             collision.y + position.y,
  //           ),
  //         );
  //       });
  //       this.polygons.push(polygon);
  //       this.polygonShapes.push(new Phaser.Geom.Polygon(polygonPoints));
  //     }
  //   });

  //   // walls around game perimeter
  //   this.polygons.push([
  //     [-1, -1],
  //     [this.map.width * this.map.tileWidth + 1, -1],
  //     [
  //       this.map.width * this.map.tileWidth + 1,
  //       this.map.height * this.map.tileHeight + 1,
  //     ],
  //     [-1, this.map.height * this.map.tileHeight + 1],
  //   ]);
  // }

  // private createMask() {
  //   // Shadows
  //   // const background = this.add.rectangle(
  //   //   this.cameras.main.centerX,
  //   //   this.cameras.main.centerY,
  //   //   this.cameras.main.width,
  //   //   this.cameras.main.height,
  //   //   0x000,
  //   // );
  //   // background.setDepth(0);
  //   // this.lightGraphics = this.add.graphics();
  //   // this.mask = this.lightGraphics.createGeometryMask();

  //   // Set up the Z layers to draw in correct order
  //   this.map.layers.forEach((layerData) => {
  //     const layer = this.map.createLayer(
  //       layerData.name,
  //       [this.map.getTileset("Sunnyside V3") as Phaser.Tilemaps.Tileset],
  //       0,
  //       0,
  //     );

  //     // Shadows
  //     // if (layerData.name === "Ground") {
  //     //   layer?.setMask(this.mask as Phaser.Display.Masks.GeometryMask);
  //     // }

  //     this.layers[layerData.name] = layer as Phaser.Tilemaps.TilemapLayer;
  //   });
  // }

  // private renderAllLights() {
  //   if (!this.lightGraphics) return;

  //   this.lightGraphics.clear();
  //   this.lightedItems.forEach((item) => {
  //     if (!this.currentPlayer) return;
  //     if (!item) return;

  //     const normalizedX =
  //       ((item.x - this.cameras.main.worldView.x) / this.cameras.main.width) *
  //       this.cameras.main.zoom;
  //     const normalizedY =
  //       ((item.y - this.cameras.main.worldView.y) / this.cameras.main.height) *
  //       this.cameras.main.zoom;

  //     // Position deleted x: -9999 and y: -9999
  //     if (
  //       item.x !== -9999 &&
  //       item.y !== -9999 &&
  //       normalizedX >= -0.5 &&
  //       normalizedX <= 1.5 &&
  //       normalizedY >= -0.5 &&
  //       normalizedY <= 1.5 &&
  //       item instanceof Phaser.GameObjects.Container
  //     ) {
  //       this.renderLight(item);
  //     }
  //   });
  // }

  // private renderLight(item: Phaser.GameObjects.Container) {
  //   if (!this.lightGraphics) return;

  //   const visibility =
  //     item instanceof LampContainer
  //       ? item.polygonLight
  //       : createLightPolygon(
  //           item.x,
  //           item.y,
  //           this.visibilityPolygon,
  //           this.polygons,
  //         );

  //   // begin a drawing path
  //   this.lightGraphics.beginPath();

  //   if (visibility) {
  //     // move the graphic pen to first vertex of light polygon
  //     this.lightGraphics.moveTo(visibility[0][0], visibility[0][1]);

  //     // loop through all light polygon vertices
  //     for (let i = 1; i <= visibility.length; i++) {
  //       // draw a line to i-th light polygon vertex
  //       this.lightGraphics.lineTo(
  //         visibility[i % visibility.length][0],
  //         visibility[i % visibility.length][1],
  //       );
  //     }
  //   }

  //   // close, stroke and fill light polygon
  //   this.lightGraphics.closePath();
  //   this.lightGraphics.fillPath();
  //   this.lightGraphics.strokePath();
  // }

  private endGame() {
    // if (!this.isGameOver) {
    //   this.isCameraFading = true;
    //   this.velocity = 0;
    //   this.currentPlayer?.dead();
    //   this.isGameOver = true;
    // }
    // if (!this.deathDate) {
    //   this.deathDate = new Date(new Date().getTime() + 1200);
    // } else if (new Date().getTime() >= this.deathDate.getTime()) {
    //   this.portalService?.send("GAME_OVER");
    // }
  }
}
