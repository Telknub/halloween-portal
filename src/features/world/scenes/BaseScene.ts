import Phaser, { Physics } from "phaser";
import VirtualJoystick from "phaser3-rex-plugins/plugins/virtualjoystick.js";
import { BumpkinContainer } from "../containers/BumpkinContainer";
import { interactableModalManager } from "../ui/InteractableModals";
import { NPCName, NPC_WEARABLES } from "lib/npcs";
import { npcModalManager } from "../ui/NPCModals";
import { BumpkinParts } from "lib/utils/tokenUriBuilder";
import { EventObject } from "xstate";
import { isTouchDevice } from "../lib/device";
import { SPAWNS } from "../lib/spawn";
import { AudioController, WalkAudioController } from "../lib/AudioController";
import { createErrorLogger } from "lib/errorLogger";
import { Coordinates } from "features/game/expansion/components/MapPlacement";
import { Footsteps } from "assets/sound-effects/soundEffects";
import {
  MachineInterpreter as MMOMachineInterpreter,
  SceneId,
} from "../mmoMachine";
import { Player, PlazaRoomState } from "../types/Room";
import { playerModalManager } from "../ui/PlayerModals";
import { FactionName, GameState } from "features/game/types/game";
import { translate } from "lib/i18n/translate";
import { Room } from "colyseus.js";
import defaultTilesetConfig from "assets/map/tileset.json";
import { MachineInterpreter } from "features/game/lib/gameMachine";
import { MachineInterpreter as AuthMachineInterpreter } from "features/auth/lib/authMachine";
import { PhaserNavMesh } from "phaser-navmesh";
import {
  AUDIO_MUTED_EVENT,
  getAudioMutedSetting,
} from "lib/utils/hooks/useIsAudioMuted";
import {
  PLAZA_SHADER_EVENT,
  PlazaShader,
  PlazaShaders,
  getPlazaShaderSetting,
} from "lib/utils/hooks/usePlazaShader";
import { NightShaderPipeline } from "../shaders/nightShader";

export type NPCBumpkin = {
  x: number;
  y: number;
  npc: NPCName;
  direction?: "left" | "right";
  clothing?: BumpkinParts;
  onClick?: () => void;
};

const SEND_PACKET_RATE = 10;
const NAME_TAG_OFFSET_PX = 12;

export const HALLOWEEN_SQUARE_WIDTH = 32;
export const WALKING_SPEED = 50;

type BaseSceneOptions = {
  name: SceneId;
  map: {
    tilesetUrl?: string;
    json?: any;
    padding?: [number, number];
    imageKey?: string;
    defaultTilesetConfig?: any;
  };
  mmo?: {
    enabled: boolean;
    url?: string;
    serverId?: string;
    sceneId?: string;
  };
  controls?: {
    enabled: boolean;
  };
  audio?: {
    fx: {
      walk_key: Footsteps;
    };
  };
  player?: {
    spawn: Coordinates;
  };
};

export const FACTION_NAME_COLORS: Record<FactionName, string> = {
  sunflorians: "#fee761",
  bumpkins: "#528ec9",
  goblins: "#669c82",
  nightshades: "#a878ac",
};

export abstract class BaseScene extends Phaser.Scene {
  abstract sceneId: SceneId;
  eventListener?: (event: EventObject) => void;

  public joystick?: VirtualJoystick;
  private switchToScene?: SceneId;
  public isCameraFading = false;
  public isSlowedDown = false;
  private options: Required<BaseSceneOptions>;

  public map: Phaser.Tilemaps.Tilemap = {} as Phaser.Tilemaps.Tilemap;

  npcs: Partial<Record<NPCName, BumpkinContainer>> = {};

  currentPlayer: BumpkinContainer | undefined;
  isFacingLeft = false;
  movementAngle: number | undefined;
  serverPosition: { x: number; y: number } = { x: 0, y: 0 };
  packetSentAt = 0;

  playerEntities: {
    [sessionId: string]: BumpkinContainer;
  } = {};

  colliders?: Phaser.GameObjects.Group;
  triggerColliders?: Phaser.GameObjects.Group;
  hiddenColliders?: Phaser.GameObjects.Group;
  decorationColliders?: Phaser.GameObjects.Group;

  soundEffects: AudioController[] = [];
  walkAudioController?: WalkAudioController;

  cursorKeys:
    | {
        up: Phaser.Input.Keyboard.Key;
        down: Phaser.Input.Keyboard.Key;
        left: Phaser.Input.Keyboard.Key;
        right: Phaser.Input.Keyboard.Key;
        w?: Phaser.Input.Keyboard.Key;
        s?: Phaser.Input.Keyboard.Key;
        a?: Phaser.Input.Keyboard.Key;
        d?: Phaser.Input.Keyboard.Key;
      }
    | undefined;

  elapsedTime = 0;
  fixedTimeStep = 1000 / 60;

  currentTick = 0;

  zoom = window.innerWidth < 500 ? 3 : 4;

  velocity = WALKING_SPEED;

  layers: Record<string, Phaser.Tilemaps.TilemapLayer> = {};

  onCollision: Record<
    string,
    Phaser.Types.Physics.Arcade.ArcadePhysicsCallback
  > = {};
  otherDiggers: Map<string, { x: number; y: number }> = new Map();
  navMesh: PhaserNavMesh | undefined;

  get isMoving() {
    return this.movementAngle !== undefined && this.walkingSpeed !== 0;
  }

  constructor(options: BaseSceneOptions) {
    if (!options.name) {
      throw new Error("Missing name in config");
    }

    const defaultedOptions: Required<BaseSceneOptions> = {
      ...options,
      name: options.name,
      audio: options.audio ?? { fx: { walk_key: "wood_footstep" } },
      controls: options.controls ?? { enabled: true },
      mmo: options.mmo ?? { enabled: true },
      player: options.player ?? { spawn: { x: 0, y: 0 } },
    };

    super(defaultedOptions.name);

    this.options = defaultedOptions;
  }

  private onAudioMuted = (event: CustomEvent) => {
    this.sound.mute = event.detail;
  };

  private onSetPlazaShader = (event: CustomEvent) => {
    if (!this.cameras.main) return;

    const plazaShader = event.detail as PlazaShader;

    if (plazaShader === "none" && this.cameras.main.hasPostPipeline) {
      this.cameras.main.resetPostPipeline();
      return;
    }

    const existingPipelines = this.cameras.main.postPipelines;
    const existingSamePipelines = existingPipelines.filter(
      (pipeline) => pipeline.name === plazaShader,
    );
    const existingOtherPipelines = existingPipelines.filter(
      (pipeline) => pipeline.name !== plazaShader,
    );

    if (existingSamePipelines.length === 0) {
      this.cameras.main.setPostPipeline(plazaShader);
    }

    if (existingOtherPipelines.length > 0) {
      existingOtherPipelines.forEach((pipeline) =>
        this.cameras.main.removePostPipeline(pipeline),
      );
    }
  };

  private initializeShaders = () => {
    const rendererPipelines = (
      this.renderer as Phaser.Renderer.WebGL.WebGLRenderer
    ).pipelines;

    const shaderActions: Record<PlazaShader, () => void> = {
      none: () => undefined,
      night: () =>
        rendererPipelines?.addPostPipeline("night", NightShaderPipeline),
    };

    const plazaShaders = Object.keys(PlazaShaders) as PlazaShader[];
    plazaShaders.forEach((shader) => {
      shaderActions[shader]?.();
    });

    window.addEventListener(PLAZA_SHADER_EVENT as any, this.onSetPlazaShader);
    this.onSetPlazaShader({ detail: getPlazaShaderSetting() } as CustomEvent);
  };

  updateShaders = () => {
    const nightShaderPipeline = this.cameras.main.getPostPipeline(
      "night",
    ) as NightShaderPipeline;
    if (!nightShaderPipeline || !this.currentPlayer) return;

    const mapWidth = this.map.widthInPixels;
    const mapHeight = this.map.heightInPixels;
    const screenWidth = this.cameras.main.worldView.width;
    const screenHeight = this.cameras.main.worldView.height;
    const worldViewX = this.cameras.main.worldView.x;
    const worldViewY = this.cameras.main.worldView.y;
    const offsetX = Math.max(0, (screenWidth - mapWidth) / 2);
    const offsetY = Math.max(0, (screenHeight - mapHeight) / 2);

    const relativeX =
      (this.currentPlayer.x - worldViewX + offsetX) / screenWidth;
    const relativeY =
      (this.currentPlayer.y - worldViewY + offsetY) / screenHeight;

    nightShaderPipeline.lightSources = [{ x: relativeX, y: relativeY }];
  };

  preload() {
    if (this.options.map?.json) {
      const json = {
        ...this.options.map.json,
        tilesets:
          this.options.map.defaultTilesetConfig ??
          defaultTilesetConfig.tilesets,
      };
      this.load.tilemapTiledJSON(this.options.name, json);
    }
  }

  create() {
    const errorLogger = createErrorLogger("phaser_base_scene", Number(this.id));

    try {
      this.initialiseMap();
      this.initialiseSounds();

      this.initializeShaders();

      this.sound.mute = getAudioMutedSetting();
      window.addEventListener(AUDIO_MUTED_EVENT as any, this.onAudioMuted);

      if (this.options.mmo.enabled) {
        this.initialiseMMO();
      }

      if (this.options.controls.enabled) {
        this.initialiseControls();
      }

      const from = this.mmoService?.state.context.previousSceneId as SceneId;

      let spawn = this.options.player.spawn;

      if (SPAWNS()[this.sceneId]) {
        spawn = SPAWNS()[this.sceneId][from] ?? SPAWNS()[this.sceneId].default;
      }

      this.createPlayer({
        x: spawn.x ?? 0,
        y: spawn.y ?? 0,
        farmId: Number(this.id),
        faction: this.gameState.faction?.name,
        username: this.username,
        isCurrentPlayer: true,
        clothing: {
          ...(this.gameState.bumpkin?.equipped as BumpkinParts),
          updatedAt: 0,
        },
        experience: 0,
        sessionId: this.mmoServer?.sessionId ?? "",
      });

      this.initialiseCamera();
    } catch (error) {
      errorLogger(JSON.stringify(error));
    }

    this.setUpNavMesh();
  }

  public setUpNavMesh = () => {
    const meshLayer = this.map.getObjectLayer("NavMesh");
    if (!meshLayer) return;

    this.navMesh = this.navMeshPlugin.buildMeshFromTiled(
      "NavMesh",
      meshLayer,
      16,
    );
  };

  public initialiseMap() {
    if (!this.cache.tilemap.has(this.options.name) && !this.options.map.json) {
      return;
    }
    
    this.map = this.make.tilemap({
      key: this.options.name,
    });

    const tileset = this.map.addTilesetImage(
      "Sunnyside V3",
      this.options.map.imageKey ?? "tileset",
    ) as Phaser.Tilemaps.Tileset;

    this.colliders = this.add.group();

    if (this.map.getObjectLayer("Collision")) {
      const collisionPolygons = this.map.createFromObjects("Collision", {
        scene: this,
        classType: Phaser.GameObjects.Sprite,
      });
      collisionPolygons.forEach((polygon) => {
        (polygon as Phaser.GameObjects.Sprite).setTint(0x000);
        this.colliders?.add(polygon);
        this.physics.world.enable(polygon);
        (polygon.body as Physics.Arcade.Body).setImmovable(true);
      });
    }

    if (this.map.getObjectLayer("Interactable")) {
      const interactablesPolygons = this.map.createFromObjects(
        "Interactable",
        {},
      );
      interactablesPolygons.forEach((polygon) => {
        polygon
          .setInteractive({ cursor: "pointer" })
          .on("pointerdown", (p: Phaser.Input.Pointer) => {
            if (p.downElement.nodeName === "CANVAS") {
              const id = polygon.data.list.id;

              const distance = Phaser.Math.Distance.BetweenPoints(
                this.currentPlayer as BumpkinContainer,
                polygon as Phaser.GameObjects.Polygon,
              );

              if (distance > 50) {
                this.currentPlayer?.speak(translate("base.iam.far.away"));
                return;
              }

              interactableModalManager.open(id);
            }
          });
      });
    }

    this.triggerColliders = this.add.group();

    if (this.map.getObjectLayer("Trigger")) {
      const triggerPolygons = this.map.createFromObjects("Trigger", {
        scene: this,
      });

      triggerPolygons.forEach((polygon) => {
        this.triggerColliders?.add(polygon);
        this.physics.world.enable(polygon);
        (polygon.body as Physics.Arcade.Body).setImmovable(true);
      });
    }

    this.hiddenColliders = this.add.group();

    if (this.map.getObjectLayer("Hidden")) {
      const hiddenPolygons = this.map.createFromObjects("Hidden", {
        scene: this,
      });

      hiddenPolygons.forEach((polygon) => {
        this.hiddenColliders?.add(polygon);
        this.physics.world.enable(polygon);
        (polygon.body as Physics.Arcade.Body).setImmovable(true);
      });
    }

    this.physics.world.drawDebug = false;

    this.physics.world.setBounds(
      0,
      0,
      this.map.width * HALLOWEEN_SQUARE_WIDTH,
      this.map.height * HALLOWEEN_SQUARE_WIDTH,
    );
  }

  public initialiseCamera() {
    const camera = this.cameras.main;
    camera.setBounds(
      0,
      0,
      this.map.width * HALLOWEEN_SQUARE_WIDTH,
      this.map.height * HALLOWEEN_SQUARE_WIDTH,
    );
    camera.setZoom(this.zoom);
    const offsetX = (window.innerWidth - this.map.width * 4 * HALLOWEEN_SQUARE_WIDTH) / 2;
    const offsetY = (window.innerHeight - this.map.height * 4 * HALLOWEEN_SQUARE_WIDTH) / 2;
    camera.setPosition(Math.max(offsetX, 0), Math.max(offsetY, 0));
    camera.fadeIn(500);
    camera.on("camerafadeincomplete", () => { this.isCameraFading = false; }, this);
  }

  public initialiseMMO() {
    if (this.options.mmo.url && this.options.mmo.serverId) {
      this.mmoService?.send("CONNECT", {
        url: this.options.mmo.url,
        serverId: this.options.mmo.serverId,
      });
    }

    const server = this.mmoServer;
    if (!server) return;

    const removeMessageListener = server.state.messages.onAdd((message) => {
      if (message.sentAt < Date.now() - 5000) {
        return;
      }

      if (message.sceneId !== this.options.name) {
        return;
      }

      if (!this.scene?.isActive()) {
        return;
      }

      if (this.playerEntities[message.sessionId]) {
        this.playerEntities[message.sessionId].speak(message.text);
      } else if (message.sessionId === server.sessionId) {
        this.currentPlayer?.speak(message.text);
      }
    });

    const removeReactionListener = server.state.reactions.onAdd((reaction) => {
      if (reaction.sentAt < Date.now() - 5000) {
        return;
      }

      if (reaction.sceneId !== this.options.name) {
        return;
      }

      if (!this.scene?.isActive()) {
        return;
      }

      if (this.playerEntities[reaction.sessionId]) {
        this.playerEntities[reaction.sessionId].react(
          reaction.reaction,
          reaction.quantity,
        );
      } else if (reaction.sessionId === server.sessionId) {
        this.currentPlayer?.react(reaction.reaction, reaction.quantity);
      }
    });

    this.events.on("shutdown", () => {
      removeMessageListener();
      removeReactionListener();

      window.removeEventListener(AUDIO_MUTED_EVENT as any, this.onAudioMuted);
    });
  }

  public initialiseSounds() {
    this.walkAudioController = new WalkAudioController(
      this.sound.add(this.options.audio.fx.walk_key),
    );
  }

  public initialiseControls() {
    if (isTouchDevice()) {
      const { centerX, centerY, height } = this.cameras.main;
      this.joystick = new VirtualJoystick(this, {
        x: centerX,
        y: centerY - 35 + height / this.zoom / 2,
        radius: 15,
        base: this.add.circle(0, 0, 15, 0x333333, 0.8).setDepth(1000000000),
        thumb: this.add.circle(0, 0, 7, 0xcccccc, 0.8).setDepth(1000000000),
        forceMin: 2,
      });
    }

    this.cursorKeys = this.input.keyboard?.createCursorKeys();
    if (this.cursorKeys) {
      const mmoLocalSettings = JSON.parse(
        localStorage.getItem("mmo_settings") ?? "{}",
      );
      const layout = mmoLocalSettings.layout ?? "QWERTY";

      this.cursorKeys.w = this.input.keyboard?.addKey(
        layout === "QWERTY" ? "W" : "Z",
        false,
      );
      this.cursorKeys.a = this.input.keyboard?.addKey(
        layout === "QWERTY" ? "A" : "Q",
        false,
      );
      this.cursorKeys.s = this.input.keyboard?.addKey("S", false);
      this.cursorKeys.d = this.input.keyboard?.addKey("D", false);

      this.input.keyboard?.removeCapture("SPACE");
    }

    this.input.setTopOnly(true);
  }

  public get mmoService() { return this.registry.get("mmoService") as MMOMachineInterpreter | undefined; }
  public get mmoServer() { return this.registry.get("mmoServer") as Room<PlazaRoomState>; }
  public get gameState() { return this.registry.get("gameState") as GameState; }
  public get id() { return this.registry.get("id") as number; }
  public get gameService() { return this.registry.get("gameService") as MachineInterpreter; }
  public get authService() { return this.registry.get("authService") as AuthMachineInterpreter; }
  public get username() { return this.gameState.username; }
  public get selectedItem() { return this.registry.get("selectedItem"); }
  public get shortcutItem() { return this.registry.get("shortcutItem"); }

  public createPlayer(args: any): BumpkinContainer {
    const defaultClick = () => {
      const distance = Phaser.Math.Distance.BetweenPoints(
        entity,
        this.currentPlayer as BumpkinContainer,
      );
      if (distance > 50) {
        entity.speak(translate("base.far.away"));
        return;
      }
      if (args.npc) {
        npcModalManager.open(args.npc);
      } else {
        if (args.farmId !== this.id) {
          playerModalManager.open({
            id: args.farmId,
            clothing: this.playerEntities[args.sessionId]?.clothing ?? args.clothing,
            experience: args.experience,
          });
        }
      }
    };
    
    const entity = new BumpkinContainer({
      scene: this,
      x: args.x,
      y: args.y,
      clothing: args.clothing,
      name: args.npc,
      faction: args.faction,
      onClick: defaultClick,
      noLamp: args.noLamp,
    });
    
    entity.setDepth(1);

    if (!args.npc) {
      const color = args.faction ? FACTION_NAME_COLORS[args.faction as FactionName] : "#fff";
      const nameTag = this.createPlayerText({ x: 0, y: 0, text: args.username ? args.username : `#${args.farmId}`, color });
      nameTag.setShadow(1, 1, "#161424", 0, false, true);
      nameTag.name = "nameTag";
      entity.add(nameTag);
    }

    if (args.isCurrentPlayer) {
      this.currentPlayer = entity;
      (this.currentPlayer.body as Phaser.Physics.Arcade.Body).setOffset(3, 10).setSize(10, 8).setCollideWorldBounds(true).setAllowRotation(false);
      this.cameras.main.startFollow(this.currentPlayer);
      this.physics.add.collider(this.currentPlayer, this.colliders as Phaser.GameObjects.Group, async (obj1, obj2) => {
          const id = (obj2 as any).data?.list?.id;
          const cb = this.onCollision[id];
          if (cb) cb(obj1, obj2);
          const warpTo = (obj2 as any).data?.list?.warp;
          if (warpTo && !this.isCameraFading) this.changeScene(warpTo);
          const interactable = (obj2 as any).data?.list?.open;
          if (interactable) interactableModalManager.open(interactable);
      });
      this.physics.add.overlap(this.currentPlayer, this.triggerColliders as Phaser.GameObjects.Group, (obj1, obj2) => {
        const id = (obj2 as any).data?.list?.id;
        const cb = this.onCollision[id];
        if (cb) cb(obj1, obj2);
      });
    } else {
      (entity.body as Phaser.Physics.Arcade.Body).setSize(16, 20).setOffset(0, 0);
    }

    return entity;
  }

  createPlayerText({ x, y, text, color }: { x: number; y: number; text: string; color?: string; }) {
    const textObject = this.add.text(x, y + NAME_TAG_OFFSET_PX, text, {
      fontSize: "4px",
      fontFamily: "monospace",
      resolution: 4,
      padding: { x: 2, y: 2 },
      color: color ?? "#ffffff",
    });
    textObject.setOrigin(0.5);
    this.physics.add.existing(textObject);
    (textObject.body as Phaser.Physics.Arcade.Body).checkCollision.none = true;
    return textObject;
  }

  destroyPlayer(sessionId: string) {
    const entity = this.playerEntities[sessionId];
    if (entity) {
      entity.disappear();
      delete this.playerEntities[sessionId];
    }
  }

  update(time: number, delta: number): void {
    this.currentTick++;
    this.switchScene();
    this.updatePlayer();
    this.updateOtherPlayers();
    this.updateShaders();
    this.updateUsernames();
    this.updateFactions();
  }

  keysToAngle(left: boolean, right: boolean, up: boolean, down: boolean): number | undefined {
    const x = (right ? 1 : 0) - (left ? 1 : 0);
    const y = (down ? 1 : 0) - (up ? 1 : 0);
    if (x === 0 && y === 0) return undefined;
    return (Math.atan2(y, x) * 180) / Math.PI;
  }

  get walkingSpeed() {
    return this.velocity;
  }

  updatePlayer() {
    if (!this.currentPlayer?.body) return;
    const faction = this.gameState.faction?.name;
    if (this.currentPlayer.faction !== faction) {
      this.currentPlayer.faction = faction;
      this.mmoServer?.send(0, { faction });
      this.checkAndUpdateNameColor(this.currentPlayer, faction ? FACTION_NAME_COLORS[faction] : "white");
    }
    this.movementAngle = this.joystick?.force ? this.joystick?.angle : undefined;
    if (this.movementAngle === undefined) {
      if (document.activeElement?.tagName === "INPUT") return;
      const left = (this.cursorKeys?.left.isDown || this.cursorKeys?.a?.isDown) ?? false;
      const right = (this.cursorKeys?.right.isDown || this.cursorKeys?.d?.isDown) ?? false;
      const up = (this.cursorKeys?.up.isDown || this.cursorKeys?.w?.isDown) ?? false;
      const down = (this.cursorKeys?.down.isDown || this.cursorKeys?.s?.isDown) ?? false;
      this.movementAngle = this.keysToAngle(left, right, up, down);
    }
    if (this.movementAngle !== undefined && Math.abs(this.movementAngle) !== 90) {
      this.isFacingLeft = Math.abs(this.movementAngle) > 90;
      this.isFacingLeft ? this.currentPlayer.faceLeft() : this.currentPlayer.faceRight();
    }
    const currentPlayerBody = this.currentPlayer.body as Phaser.Physics.Arcade.Body;
    if (this.movementAngle !== undefined) {
      currentPlayerBody.setVelocity(
        this.walkingSpeed * Math.cos((this.movementAngle * Math.PI) / 180),
        this.walkingSpeed * Math.sin((this.movementAngle * Math.PI) / 180),
      );
    } else {
      currentPlayerBody.setVelocity(0, 0);
    }
    this.sendPositionToServer();
    if (this.soundEffects) {
      this.soundEffects.forEach((audio) => audio.setVolumeAndPan(this.currentPlayer?.x ?? 0, this.currentPlayer?.y ?? 0));
    } else {
      console.error("audioController is undefined");
    }
    if (this.walkAudioController) {
      this.walkAudioController.handleWalkSound(this.isMoving);
    } else {
      console.error("walkAudioController is undefined");
    }
    this.currentPlayer.setDepth(Math.floor(this.currentPlayer.y));
  }

  sendPositionToServer() {
    if (!this.currentPlayer) return;
    if (Date.now() - this.packetSentAt > 1000 / SEND_PACKET_RATE && (this.serverPosition.x !== this.currentPlayer.x || this.serverPosition.y !== this.currentPlayer.y)) {
      this.serverPosition = { x: this.currentPlayer.x, y: this.currentPlayer.y };
      this.packetSentAt = Date.now();
      const server = this.mmoServer;
      if (server) server.send(0, this.serverPosition);
    }
  }

  syncPlayers() {
    const server = this.mmoServer;
    if (!server) return;
    Object.keys(this.playerEntities).forEach((sessionId) => {
      if (!server.state.players.get(sessionId) || server.state.players.get(sessionId)?.sceneId !== this.scene.key) this.destroyPlayer(sessionId);
      if (!this.playerEntities[sessionId]?.active) this.destroyPlayer(sessionId);
    });
    server.state.players.forEach((player, sessionId) => {
      if (sessionId === server.sessionId) return;
      if (player.sceneId !== this.scene.key) return;
      if (!this.playerEntities[sessionId]) {
        this.playerEntities[sessionId] = this.createPlayer({
          x: player.x,
          y: player.y,
          farmId: player.farmId,
          username: player.username,
          faction: player.faction,
          clothing: player.clothing,
          isCurrentPlayer: sessionId === server.sessionId,
          npc: player.npc,
          experience: player.experience,
          sessionId,
        });
      }
    });
  }

  updateClothing() {
    const server = this.mmoServer;
    if (!server) return;
    server.state.players.forEach((player, sessionId) => {
      if (this.playerEntities[sessionId]) {
        this.playerEntities[sessionId].changeClothing(player.clothing);
      } else if (sessionId === server.sessionId) {
        this.currentPlayer?.changeClothing(player.clothing);
      }
    });
  }

  updateUsernames() {
    const server = this.mmoServer;
    if (!server) return;
    server.state.players.forEach((player, sessionId) => {
      if (this.playerEntities[sessionId]) {
        const nameTag = this.playerEntities[sessionId].getByName("nameTag") as Phaser.GameObjects.Text | undefined;
        if (nameTag && player.username && nameTag.text !== player.username) nameTag.setText(player.username);
      } else if (sessionId === server.sessionId) {
        const nameTag = this.currentPlayer?.getByName("nameTag") as Phaser.GameObjects.Text | undefined;
        if (nameTag && player.username && nameTag.text !== player.username) nameTag.setText(player.username);
      }
    });
  }

  checkAndUpdateNameColor(entity: BumpkinContainer, color: string) {
    const nameTag = entity.getByName("nameTag") as Phaser.GameObjects.Text | undefined;
    if (nameTag && nameTag.style.color !== color) nameTag.setColor(color);
  }

  updateFactions() {
    const server = this.mmoServer;
    if (!server) return;
    server.state.players.forEach((player, sessionId) => {
      if (!player.faction) return;
      if (this.playerEntities[sessionId]) {
        const faction = player.faction;
        const color = faction ? FACTION_NAME_COLORS[faction as FactionName] : "#fff";
        this.checkAndUpdateNameColor(this.playerEntities[sessionId], color);
      }
    });
  }

  renderPlayers() {
    const server = this.mmoServer;
    if (!server) return;
    const playerInVIP = this.physics.world.overlap(this.hiddenColliders as Phaser.GameObjects.Group, this.currentPlayer);
    server.state.players.forEach((player, sessionId) => {
      if (sessionId === server.sessionId) return;
      if (this.otherDiggers.has(sessionId)) return;
      const entity = this.playerEntities[sessionId];
      if (!entity?.active) return;
      if (player.x > entity.x) entity.faceRight();
      else if (player.x < entity.x) entity.faceLeft();
      const distance = Phaser.Math.Distance.BetweenPoints(player, entity);
      if (distance < 2) entity.idle();
      else entity.walk();
      entity.x = Phaser.Math.Linear(entity.x, player.x, 0.05);
      entity.y = Phaser.Math.Linear(entity.y, player.y, 0.05);
      entity.setDepth(entity.y);
      const overlap = this.physics.world.overlap(this.hiddenColliders as Phaser.GameObjects.Group, entity);
      const hidden = !playerInVIP && overlap;
      if (hidden === entity.visible) entity.setVisible(!hidden);
    });
  }

  switchScene() {
    if (this.switchToScene) {
      const warpTo = this.switchToScene;
      this.switchToScene = undefined;
      this.mmoService?.send("SWITCH_SCENE", { sceneId: warpTo });
    }
  }

  updateOtherPlayers() {
    const server = this.mmoServer;
    if (!server) return;
    this.syncPlayers();
    this.updateClothing();
    this.renderPlayers();
  }

  checkDistanceToSprite(sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image, maxDistance: number) {
    const distance = Phaser.Math.Distance.BetweenPoints(sprite, this.currentPlayer as BumpkinContainer);
    if (distance > maxDistance) return false;
    return true;
  }

  initialiseNPCs(npcs: NPCBumpkin[]) {
    npcs.forEach((bumpkin) => {
      const defaultClick = () => {
        const distance = Phaser.Math.Distance.BetweenPoints(container, this.currentPlayer as BumpkinContainer);
        if (distance > 50) {
          container.speak(translate("base.far.away"));
          return;
        }
        npcModalManager.open(bumpkin.npc);
      };
      const container = new BumpkinContainer({
        scene: this,
        x: bumpkin.x,
        y: bumpkin.y,
        clothing: {
          ...(bumpkin.clothing ?? NPC_WEARABLES[bumpkin.npc]),
          updatedAt: 0,
        },
        onClick: bumpkin.onClick ?? defaultClick,
        name: bumpkin.npc,
        direction: bumpkin.direction ?? "right",
      });
      container.setDepth(bumpkin.y);
      (container.body as Phaser.Physics.Arcade.Body).setSize(16, 20).setOffset(0, 0).setImmovable(true).setCollideWorldBounds(true);
      this.physics.world.enable(container);
      this.colliders?.add(container);
      this.triggerColliders?.add(container);
      this.npcs[bumpkin.npc] = container;
    });
  }

  teleportModerator(x: number, y: number, sceneId: SceneId) {
    if (sceneId === this.sceneId) {
      this.currentPlayer?.setPosition(x, y);
    } else {
      this.switchToScene = sceneId;
    }
  }

  protected changeScene = (scene: SceneId) => {
    this.isCameraFading = true;
    this.currentPlayer?.stopSpeaking();
    this.cameras.main.fadeOut(500);
    this.cameras.main.on("camerafadeoutcomplete", () => {
      this.switchToScene = scene;
    }, this);
  };
}