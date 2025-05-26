import mapJson from "assets/map/halloween.json";
import tilesetConfig from "assets/map/halloween-tileset.json";
import { SceneId } from "features/world/mmoMachine";
import { BaseScene, WALKING_SPEED } from "features/world/scenes/BaseScene";
import { MachineInterpreter } from "./lib/halloweenMachine";
import { DarknessPipeline } from "./shaders/DarknessShader";
import { VisibilityPolygon } from "./lib/visibilityPolygon";
import {
  INITIAL_LAMPS_LIGHT_RADIUS,
  MIN_PLAYER_LIGHT_RADIUS,
  JOYSTICK_LIGHT_RADIUS,
  LAMPS_CONFIGURATION,
  LAMP_SPAWN_BASE_INTERVAL,
  MAX_LAMPS_IN_MAP,
  LAMP_SPAWN_INCREASE_PERCENTAGE,
  LAST_SPAWN_TIME_GHOST,
  LAST_SPAWN_TIME_ZOMBIE,
  DELAY_SPAWN_TIME,
  UPDATE_INTERVAL,
  MIN_GHOST_PER_MIN,
  MAX_GHOST_PER_MIN,
  MIN_ZOMBIE_PER_MIN,
  MAX_ZOMBIE_PER_MIN,
  ACCUMULATED_SLOWDOWN,
  SET_SLOW_DOWN,
  SET_SLOW_DOWN_DURATION,
  SET_VISION_RANGE,
  LAMP_USAGE_MULTIPLIER_INTERVAL,
} from "./HalloweenConstants";
import { LampContainer } from "./containers/LampContainer";
import { EventObject } from "xstate";
import { createLightPolygon } from "./lib/createLightPolygon";
import { Ghost } from "./containers/Ghost";
import { Zombie } from "./containers/Zombie";
import { Collectable } from "./containers/Collectable";
import { SUNFLOWER_LAND_BUMPKIN_GIF } from "lib/constants";
import { getTime } from "features/game/lib/blockTime";
import { BlockBucks } from "features/game/types/game";
import { getBumpkinAnimation } from "features/world/lib/utils";
import { HUD } from "features/world/ui/HUD";
import VirtualJoystickPlugin from "phaser3-rex-plugins/plugins/virtualjoystick-plugin.js";

export class HalloweenScene extends BaseScene {
  private mask?: Phaser.Display.Masks.GeometryMask;
  private ghosts?: Phaser.Physics.Arcade.Group;
  private zombies?: Phaser.Physics.Arcade.Group;
  private collectables?: Phaser.Physics.Arcade.Group;
  private currentLightRadius: number = INITIAL_LAMPS_LIGHT_RADIUS;
  private ghostSpawnTimer: number = 0;
  private zombieSpawnTimer: number = 0;
  private spawnCountdown: number = 0;
  private lastLightUpdateTime: number = 0;
  private lastSlowDownTime: number = 0;
  private slowDowns: { appliedAt: number; duration: number }[] = [];
  private ghostSounds: Record<string, Phaser.Sound.BaseSound> = {};
  private zombieSounds: Record<string, Phaser.Sound.BaseSound> = {};
  private lightGraphics?: Phaser.GameObjects.Graphics;
  private lightMask?: Phaser.GameObjects.Graphics;
  private visibilityPolygon?: VisibilityPolygon;
  private polygons: number[][] = [];
  private isCameraFading: boolean = false;
  private portalService?: MachineInterpreter;
  private hud?: HUD;
  private joystick?: VirtualJoystickPlugin.Plugin;
  private lastMovedAt: number = 0;
  private isMoving: boolean = false;
  private sceneId: SceneId = "halloween";
  private collisionLayer?: Phaser.Tilemaps.TilemapLayer;

  // >> NOVAS VARIÁVEIS PARA COMBATE <<
  private isAttacking: boolean = false;
  private attackCooldown: number = 500; // Tempo em milissegundos entre ataques (0.5 segundos)
  private lastAttackTime: number = 0;
  private attackHitbox?: Phaser.Physics.Arcade.Sprite; // Sprite invisível para a hitbox de ataque

  private isDashing: boolean = false;
  private dashDuration: number = 150; // Duração do dash em milissegundos
  private dashCooldown: number = 1000; // Tempo em milissegundos entre dashes (1 segundo)
  private lastDashTime: number = 0;
  private dashVelocity: number = WALKING_SPEED * 3; // Velocidade do dash (3x a velocidade de caminhada)
  private dashDirection: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0); // Direção do dash
  // << FIM DAS NOVAS VARIÁVEIS >>

  constructor() {
    super("halloween");
  }

  preload() {
    super.preload();

    this.load.tilemapTiledJSON("halloween", mapJson);
    this.load.image("halloween_tileset", tilesetConfig.image);

    this.load.image("lamp", "world/lamp.png");
    this.load.spritesheet("ghost", "world/ghost.png", {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet("zombie", "world/zombie.png", {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.image("bread", "world/bread.png");

    // Load in our character spritesheet
    this.load.spritesheet(
      "bumpkin_idle_animation",
      SUNFLOWER_LAND_BUMPKIN_GIF,
      {
        frameWidth: 24,
        frameHeight: 24,
      },
    );
  }

  async create() {
    this.map = this.make.tilemap({
      key: "halloween",
    });
    super.create();

    this.initializeControls();
    this.setupCombatInputs(); // <-- ADICIONADO AQUI
    this.initShaders();

    this.collisionLayer = this.map.createLayer(
      "Collision",
      this.tileset!,
      0,
      0,
    );

    this.collisionLayer.setCollisionByProperty({ collides: true });

    // Set a custom property on the tilemap layer to indicate it's the collision layer
    (this.collisionLayer as any).properties = [{ name: "collision", value: true }];

    // Spawn the character in the first tile
    const spawnPoint = this.map.findObject(
      "Spawns",
      (obj) => obj.name === "Player Spawn",
    );

    if (!spawnPoint) {
      throw new Error("Player spawn point not found in map");
    }

    this.currentPlayer = this.physics.add.sprite(
      spawnPoint.x!,
      spawnPoint.y!,
      "bumpkin_idle_animation",
    );

    this.currentPlayer.setDepth(1);

    this.physics.add.collider(this.currentPlayer, this.collisionLayer);

    this.set= this.physics.world.setBounds(
      0,
      0,
      this.map.widthInPixels,
      this.map.heightInPixels,
    );

    this.physics.world.setBoundsCollision(true, true, true, true);

    this.cameras.main.setBounds(
      0,
      0,
      this.map.widthInPixels,
      this.map.heightInPixels,
    );
    this.cameras.main.startFollow(this.currentPlayer, true, 0.5, 0.5);

    this.anims.create(
      getBumpkinAnimation({
        key: "idle",
        startFrame: 0,
        endFrame: 1,
        frameRate: 2,
      }),
    );
    this.anims.create(
      getBumpkinAnimation({
        key: "walk_down",
        startFrame: 0,
        endFrame: 5,
        frameRate: 8,
      }),
    );
    this.anims.create(
      getBumpkinAnimation({
        key: "walk_up",
        startFrame: 6,
        endFrame: 11,
        frameRate: 8,
      }),
    );
    this.anims.create(
      getBumpkinAnimation({
        key: "walk_right",
        startFrame: 12,
        endFrame: 17,
        frameRate: 8,
      }),
    );
    this.anims.create(
      getBumpkinAnimation({
        key: "walk_left",
        startFrame: 18,
        endFrame: 23,
        frameRate: 8,
      }),
    );
    this.anims.create({
      key: "ghost_anim",
      frames: this.anims.generateFrameNumbers("ghost", { start: 0, end: 1 }),
      frameRate: 5,
      repeat: -1,
    });
    this.anims.create({
      key: "zombie_anim",
      frames: this.anims.generateFrameNumbers("zombie", { start: 0, end: 1 }),
      frameRate: 5,
      repeat: -1,
    });

    this.currentPlayer.play("idle");

    this.ghosts = this.physics.add.group({
      classType: Ghost,
      runChildUpdate: true,
    });
    this.zombies = this.physics.add.group({
      classType: Zombie,
      runChildUpdate: true,
    });
    this.collectables = this.physics.add.group({
      classType: Collectable,
      runChildUpdate: true,
    });

    // Add lamps
    LAMPS_CONFIGURATION.forEach((lamp) => {
      new LampContainer(
        this,
        this.map.widthInPixels / 2 + lamp.x,
        this.map.heightInPixels / 2 + lamp.y,
        lamp.width,
        lamp.height,
        this.map.widthInPixels / 2 + lamp.x,
        this.map.heightInPixels / 2 + lamp.y,
      );
    });

    this.physics.add.collider(this.ghosts, this.collisionLayer);
    this.physics.add.collider(this.zombies, this.collisionLayer);
    this.physics.add.collider(this.ghosts, this.zombies);
    this.physics.add.collider(this.ghosts, this.ghosts);
    this.physics.add.collider(this.zombies, this.zombies);

    // Initialise portals
    this.portalService = this.registry.get("portalService");
    this.portalService.send({
      type: "START",
    });

    this.physics.add.overlap(
      this.currentPlayer,
      this.ghosts,
      this.handleGhostCollision,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.currentPlayer,
      this.zombies,
      this.handleZombieCollision,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.currentPlayer,
      this.collectables,
      this.handleCollectables,
      undefined,
      this,
    );

    this.scene.launch("hud", {
      portalService: this.portalService,
      scene: this.sceneId,
    });

    this.hud = this.scene.get("hud") as HUD;

    this.sound.add("ghost_sound_1");
    this.sound.add("ghost_sound_2");
    this.sound.add("zombie_sound");

    this.ghostSounds = {
      sound1: this.sound.add("ghost_sound_1"),
      sound2: this.sound.add("ghost_sound_2"),
    };
    this.zombieSounds = {
      sound1: this.sound.add("zombie_sound"),
    };

    this.registry.events.on(
      "state:change",
      (state: any, event: EventObject) => {
        this.portalService?.send(event);
      },
    );

    this.time.addEvent({
      delay: UPDATE_INTERVAL,
      loop: true,
      callback: () => {
        this.portalService?.send("GAIN_POINTS");
        this.portalService?.send("COLLECT_LAMP");
      },
    });

    this.time.addEvent({
      delay: LAMP_USAGE_MULTIPLIER_INTERVAL,
      loop: true,
      callback: () => {
        const lamps = this.portalService?.state.context.lamps;
        if (lamps === 0) {
          this.portalService?.send({ type: "DEAD_LAMP", lamps: 1 });
        }
      },
    });
  }

  private handleGhostSound() {
    const minDistance = 200; // Minimum distance to trigger sound
    this.ghosts?.getChildren().forEach((ghost: any) => {
      const distance = Phaser.Math.Distance.Between(
        this.currentPlayer!.x,
        this.currentPlayer!.y,
        ghost.x,
        ghost.y,
      );

      if (distance