import tilesetConfig from "assets/map/halloween-tileset.json";
import { SceneId } from "features/world/mmoMachine";
import { BaseScene } from "features/world/scenes/BaseScene";
import { MachineInterpreter } from "./lib/halloweenMachine";
import { EventObject } from "xstate";
import { BumpkinParts } from "lib/utils/tokenUriBuilder";

// Type definitions for different door types in the dungeon
type DoorType = 'standard' | 'vine' | 'key' | 'sacrifice';

// Interface defining the structure of a Room object
interface Room {
    rect: Phaser.Geom.Rectangle;
    centerX: number;
    centerY: number;
    parent: Room | null;
    enemies: Phaser.Physics.Arcade.Group;
    isCleared: boolean;
    isActive: boolean;
    doors: Phaser.Physics.Arcade.Sprite[];
    doorType: DoorType;
}

// Constants for game mechanics
const TILE_SIZE = 32;
const GHOST_AGGRO_RADIUS = 160; // Vision radius for ghosts to start pursuing the player
const GHOST_WANDER_SPEED = 20;  // Speed when wandering
const GHOST_PURSUE_SPEED = 55;  // Speed when pursuing the player
const ZOMBIE_PURSUE_SPEED = 35; // Speed for zombies
const PLAYER_ATTACK_DAMAGE = 5; // Damage dealt by the player's attack

// Asset keys for doors
const DOOR_ASSETS = {
    STANDARD: 'red_door',
    VINE: 'box_blockade',
    KEY: 'red_door',
    SACRIFICE: 'blue_door',
};

// Asset keys for items
const ITEM_ASSETS = {
    KEY: 'luxury_key',
    INTERACT_OBJECT: 'fish_label',
};

// Asset keys for destructible objects
const DESTRUCTIBLE_ASSETS = {
    GIFT: 'gift',
    LOCKED_DISC: 'locked_disc',
    KEY_DISC: 'key_disc',
    TIMER_ICON: 'timer_icon',
};

// Tile IDs for obstacles and decorations from the tileset
const OBSTACLE_TILES = { PILLAR: 6, STATUE: 21, CRATE: 28, BARREL: 29, POT: 26, BONES: 27, BOOKSHELF: 20, WEAPON_RACK: 22 };
const DECORATION_TILES = { WALL_TORCH: 17, WALL_BANNER: 18 };
const TILE_TYPE = { EMPTY: 0, PILLAR: OBSTACLE_TILES.PILLAR, CRATE: OBSTACLE_TILES.CRATE, BARREL: OBSTACLE_TILES.BARREL, POT: OBSTACLE_TILES.POT, STATUE: OBSTACLE_TILES.STATUE, BONES: OBSTACLE_TILES.BONES };

// Arrays defining which tiles are indestructible or destructible
const INDESTRUCTIBLE_OBSTACLE_IDS = [TILE_TYPE.PILLAR, TILE_TYPE.STATUE, OBSTACLE_TILES.BOOKSHELF, OBSTACLE_TILES.WEAPON_RACK];
const DESTRUCTIBLE_TILE_TYPES = [TILE_TYPE.CRATE, TILE_TYPE.BARREL, TILE_TYPE.POT, TILE_TYPE.BONES];

// Mapping from destructible tile IDs to their corresponding asset keys
const TILE_TO_ASSET_MAP: { [key: number]: string } = {
    [TILE_TYPE.CRATE]: DESTRUCTIBLE_ASSETS.GIFT,
    [TILE_TYPE.BARREL]: DESTRUCTIBLE_ASSETS.LOCKED_DISC,
    [TILE_TYPE.POT]: DESTRUCTIBLE_ASSETS.KEY_DISC,
    [TILE_TYPE.BONES]: DESTRUCTIBLE_ASSETS.TIMER_ICON,
};

// Pre-defined patterns for procedural room decoration
const ROOM_PATTERNS = [
    [
        [0, 0, TILE_TYPE.PILLAR, 0, 0, 0, 0, TILE_TYPE.PILLAR, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [TILE_TYPE.PILLAR, 0, 0, 0, TILE_TYPE.CRATE, TILE_TYPE.CRATE, 0, 0, 0, TILE_TYPE.PILLAR],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, TILE_TYPE.CRATE, 0, 0, TILE_TYPE.CRATE, 0, 0, 0],
        [0, 0, 0, TILE_TYPE.CRATE, 0, 0, TILE_TYPE.CRATE, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [TILE_TYPE.PILLAR, 0, 0, 0, TILE_TYPE.CRATE, TILE_TYPE.CRATE, 0, 0, 0, TILE_TYPE.PILLAR],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, TILE_TYPE.PILLAR, 0, 0, 0, 0, TILE_TYPE.PILLAR, 0, 0],
    ],
    // ... [other patterns remain here]
];

export class HalloweenScene extends BaseScene {
  // Scene properties for dungeon generation and state
  private rooms: Room[] = [];
  private corridors: Phaser.Geom.Rectangle[] = [];
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private wallsLayer!: Phaser.Tilemaps.TilemapLayer;
  private obstaclesLayer!: Phaser.Tilemaps.TilemapLayer;
  private decorationsLayer!: Phaser.Tilemaps.TilemapLayer;
  private currentRoom: Room | null = null;
  private dungeonLevel = 1;
  
  // Game object groups
  private doorsGroup!: Phaser.Physics.Arcade.StaticGroup;
  private interactablesGroup!: Phaser.Physics.Arcade.StaticGroup;
  private keyItemGroup!: Phaser.Physics.Arcade.Group;
  private destructiblesGroup!: Phaser.Physics.Arcade.Group;
  private ghost_enemies!: Phaser.Physics.Arcade.Group;
  private zombie_enemies!: Phaser.Physics.Arcade.Group;

  // Player and combat state
  private attackKey!: Phaser.Input.Keyboard.Key;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private isAttacking = false;
  private lastDamageTime = 0;
  private playerHasKey = false;
  private keyHasDropped = false;
  private playerSpeed = 160;
  
  // Scene objects and helpers
  sceneId: SceneId = "halloween";
  private backgroundMusic!: Phaser.Sound.BaseSound;
  private hitboxGraphics!: Phaser.GameObjects.Graphics;
  private exitObject!: Phaser.Physics.Arcade.Sprite;
  private entranceObject!: Phaser.GameObjects.Sprite;
  private mapBoundsCollider!: Phaser.Physics.Arcade.StaticGroup;

  constructor() {
    super({ name: "halloween", map: { imageKey: "halloween-tileset", defaultTilesetConfig: tilesetConfig }, audio: { fx: { walk_key: "wood_footstep" } } });
  }

  // Getters for external services and game state
  public get portalService() { return this.registry.get("portalService") as MachineInterpreter | undefined; }
  private get isGamePlaying() { return this.portalService?.state.matches("playing") === true; }

  // Preload all necessary assets for the scene
  preload() {
    super.preload();
    this.load.audio("backgroundMusic", "/world/background-music.mp3");
    this.load.spritesheet("ghost_enemy_1", "/world/ghost_enemy_1.png", { frameWidth: 22, frameHeight: 23 });
    this.load.spritesheet("zombie_enemy_1", "/world/zombie_enemy_1.png", { frameWidth: 15.875, frameHeight: 17 });
    this.load.image("entrance_rug", "/world/gaucho_rug.png");
    this.load.image("exit_object", "/world/rabbit_1.png");
    this.load.spritesheet("poof", "/world/poof.png", { frameWidth: 20, frameHeight: 19 });

    // Load assets for doors, items, and destructibles
    this.load.image(ITEM_ASSETS.KEY, "/world/luxury_key.png");
    this.load.image(ITEM_ASSETS.INTERACT_OBJECT, "/world/fish_label.png");
    this.load.image(DOOR_ASSETS.KEY, "/world/red_door.png");
    this.load.image(DOOR_ASSETS.STANDARD, "/world/red_door.png");
    this.load.image(DOOR_ASSETS.SACRIFICE, "/world/blue_door.png");
    this.load.image(DOOR_ASSETS.VINE, "/world/box_blockade.png");
    this.load.image(DESTRUCTIBLE_ASSETS.GIFT, "/world/gift.png");
    this.load.image(DESTRUCTIBLE_ASSETS.LOCKED_DISC, "/world/locked_disc.png");
    this.load.image(DESTRUCTIBLE_ASSETS.KEY_DISC, "/world/key_disc.png");
    this.load.image(DESTRUCTIBLE_ASSETS.TIMER_ICON, "/world/timer_icon.png");
  }

  // Create all game objects and set up the scene
  create() {
    // Initialize input keys
    this.attackKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Initialize physics groups
    this.ghost_enemies = this.physics.add.group();
    this.zombie_enemies = this.physics.add.group();
    this.doorsGroup = this.physics.add.staticGroup();
    this.interactablesGroup = this.physics.add.staticGroup();
    this.keyItemGroup = this.physics.add.group();
    this.destructiblesGroup = this.physics.add.group({ immovable: true });
    this.mapBoundsCollider = this.physics.add.staticGroup();

    // Set up the map and player
    this.initialiseMap();
    this.initialiseSounds();
    this.initialiseControls();

    const spawn = { x: 0, y: 0 };
    if (this.rooms.length > 0) {
      const startRoom = this.rooms[0];
      spawn.x = startRoom.centerX * this.map.tileWidth;
      spawn.y = startRoom.centerY * this.map.tileHeight;
    }
    
    this.createPlayer({
      x: spawn.x, y: spawn.y, farmId: Number(this.id), username: this.username, isCurrentPlayer: true,
      clothing: { ...(this.gameState.bumpkin?.equipped as BumpkinParts), updatedAt: 0 },
      experience: 0, sessionId: this.mmoServer?.sessionId ?? "", noLamp: false,
    });
    
    // Finalize scene setup
    this.placeDoorsAndInteractables();
    this.setupExitOverlap();
    this.initialiseCamera();
    this.setupCollisions();
    
    // Start background music
    this.backgroundMusic = this.sound.add("backgroundMusic", { loop: true, volume: 0.02 });
    this.backgroundMusic.play();
    this.velocity = 0;

    // Graphics for debugging attack hitbox
    this.hitboxGraphics = this.add.graphics().setDepth(10);

    // Event listener for retry from the game over screen
    const onRetry = (event: EventObject) => { if (event.type === "RETRY") { this.scene.restart(); } };
    this.portalService?.onEvent(onRetry);

    // Create animations if they don't exist
    if (!this.anims.exists("poof_anim")) this.anims.create({ key: 'poof_anim', frames: this.anims.generateFrameNumbers("poof", {start: 0, end: 8}), frameRate: 10, repeat: 0 });
    if (!this.anims.exists("ghost_anim")) this.anims.create({ key: 'ghost_anim', frames: this.anims.generateFrameNumbers("ghost_enemy_1", {start: 0, end: 7}), frameRate: 10, repeat: -1 });
    if (!this.anims.exists("zombie_anim")) this.anims.create({ key: 'zombie_anim', frames: this.anims.generateFrameNumbers("zombie_enemy_1", {start: 0, end: 7}), frameRate: 10, repeat: -1 });
  }
  
  // Set up the procedural map, layers, and boundaries
  public initialiseMap() {
    this.generateDungeon();
    const bounds = this.getMapBounds();
    const padding = 10;
    const mapWidth = Math.floor(bounds.width + padding * 2);
    const mapHeight = Math.floor(bounds.height + padding * 2);
    this.map = this.make.tilemap({ tileWidth: TILE_SIZE, tileHeight: TILE_SIZE, width: mapWidth, height: mapHeight });
    const tileset = this.map.addTilesetImage("Sunnyside V3", "halloween-tileset", TILE_SIZE, TILE_SIZE);
    this.groundLayer = this.map.createBlankLayer("Ground", tileset!, 0, 0);
    this.wallsLayer = this.map.createBlankLayer("Walls", tileset!, 0, 0);
    this.obstaclesLayer = this.map.createBlankLayer("Obstacles", tileset!, 0, 0);
    this.decorationsLayer = this.map.createBlankLayer("Decorations", tileset!, 0, 0);
    const offsetX = -bounds.x + padding;
    const offsetY = -bounds.y + padding;
    this.rooms.forEach(room => { room.rect.x += offsetX; room.rect.y += offsetY; room.centerX = Math.floor(room.rect.centerX); room.centerY = Math.floor(room.rect.centerY); });
    this.corridors.forEach(corridor => { corridor.x += offsetX; corridor.y += offsetY; });
    this.drawMapFromRooms();
    this.decorateRooms();
    this.groundLayer.setDepth(0);
    this.wallsLayer.setDepth(2);
    this.obstaclesLayer.setDepth(1);
    this.decorationsLayer.setDepth(3);
    this.placeEntranceAndExit();

    // Create invisible barriers around the map for ghosts
    const worldBounds = new Phaser.Geom.Rectangle(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.physics.world.setBounds(worldBounds.x, worldBounds.y, worldBounds.width, worldBounds.height);
    this.mapBoundsCollider.create(worldBounds.x, worldBounds.y).setOrigin(0,0).setSize(worldBounds.width, 1).setVisible(false).setImmovable(true);
    this.mapBoundsCollider.create(worldBounds.x, worldBounds.y).setOrigin(0,0).setSize(1, worldBounds.height).setVisible(false).setImmovable(true);
    this.mapBoundsCollider.create(worldBounds.right, worldBounds.y).setOrigin(1,0).setSize(1, worldBounds.height).setVisible(false).setImmovable(true);
    this.mapBoundsCollider.create(worldBounds.x, worldBounds.bottom).setOrigin(0,1).setSize(worldBounds.width, 1).setVisible(false).setImmovable(true);
  }

  // Set camera properties
  initialiseCamera() {
    super.initialiseCamera();
    this.cameras.main.setBackgroundColor(0x0a0a0a);
  }

  // Main game loop, called every frame
  update(time: number, delta: number) {
    if (!this.currentPlayer) return;

    this.velocity = this.isAttacking ? 0 : this.playerSpeed;
    super.update(time, delta);

    if (this.isGamePlaying) {
      this.handleAttack();
      this.handleInteraction();
      this.checkPlayerRoom();
      this.updateGhostAI();
      this.updateZombieAI();
      this.updateAllHealthBars();
      this.portalService?.send("GAIN_POINTS");
    }
    
    this.loadBumpkinAnimations();
    if (this.portalService?.state.matches("ready")) { this.portalService?.send("START"); }
  }

  // Procedurally generates the dungeon layout of rooms and corridors
  private generateDungeon() {
    this.rooms = []; this.corridors = [];
    const numRooms = Phaser.Math.Between(5, 8);
    const roomSize = 12; 
    const corridorLength = 8;
    const startRect = new Phaser.Geom.Rectangle(0, 0, roomSize, roomSize);
    this.rooms.push(this.createRoom(startRect, true, null));
    const roomCandidates = [this.rooms[0]];
    let attempts = 0;
    while (this.rooms.length < numRooms && attempts < 200) {
      const parentRoom = Phaser.Math.RND.pick(roomCandidates);
      const direction = Phaser.Math.RND.pick(['N', 'S', 'E', 'W']);
      const corridor = this.calculateCorridorRect(parentRoom.rect, direction, corridorLength);
      const newRoomRect = this.calculateNewRoomRect(corridor, direction, roomSize);
      if (this.isValidPlacement(newRoomRect, corridor, parentRoom)) {
        const newRoom = this.createRoom(newRoomRect, false, parentRoom);
        this.rooms.push(newRoom); this.corridors.push(corridor);
        if (!roomCandidates.includes(newRoom)) roomCandidates.push(newRoom);
        attempts = 0;
      } else { attempts++; }
    }
    this.assignSpecialDoors();
  }

  // Assigns special door types (key, vine, sacrifice) to dead-end rooms
  private assignSpecialDoors() {
    const deadEndRooms = this.rooms.filter(room => {
      if (room === this.rooms[0] || room === this.rooms[this.rooms.length - 1]) return false;
      const connections = this.corridors.filter(c => Phaser.Geom.Intersects.RectangleToRectangle(c, room.rect));
      return connections.length === 1;
    });
    let keyDoorAssigned = false;
    deadEndRooms.forEach(room => {
      if (Math.random() < 0.5) {
        const specialTypes: DoorType[] = ['vine', 'sacrifice'];
        if (!keyDoorAssigned) { specialTypes.push('key'); }
        const chosenType = Phaser.Math.RND.pick(specialTypes);
        if (chosenType === 'key') { keyDoorAssigned = true; }
        room.doorType = chosenType;
      }
    });
  }

  // Helper function to create a new room object
  private createRoom(rect: Phaser.Geom.Rectangle, isCleared: boolean, parent: Room | null): Room {
    return { rect, isCleared, parent, centerX: Math.floor(rect.centerX), centerY: Math.floor(rect.centerY), enemies: this.physics.add.group(), isActive: false, doors: [], doorType: 'standard' };
  }
  
  // Creates and places door sprites at the entrances of each room
  private placeDoorsAndInteractables() {
    const processedCorridors = new Set<Phaser.Geom.Rectangle>();

    this.corridors.forEach(corridor => {
        if (processedCorridors.has(corridor)) return;

        const connectedRooms = this.rooms.filter(room => {
            const inflatedRoom = Phaser.Geom.Rectangle.Clone(room.rect);
            Phaser.Geom.Rectangle.Inflate(inflatedRoom, 1, 1);
            return Phaser.Geom.Intersects.RectangleToRectangle(corridor, inflatedRoom);
        });

        if (connectedRooms.length === 2) {
            connectedRooms.forEach(room => {
                const intersection = Phaser.Geom.Rectangle.Intersection(corridor, room.rect);
                const doorX = (Math.floor(intersection.centerX) * this.map.tileWidth) + this.map.tileWidth / 2;
                const doorY = (Math.floor(intersection.centerY) * this.map.tileHeight) + this.map.tileHeight / 2;
                
                const doorType = room.doorType;
                const assetKey = this.getDoorAsset(doorType);
                const door = this.doorsGroup.create(doorX, doorY, assetKey).setDepth(2);

                door.setData('type', doorType);
                door.setData('rooms', [room]);

                if (doorType === 'standard') {
                    door.setVisible(false);
                    (door.body as Phaser.Physics.Arcade.StaticBody).enable = false;
                } else {
                    door.setVisible(true);
                    (door.body as Phaser.Physics.Arcade.StaticBody).enable = true;
                }

                room.doors.push(door);

                if (doorType === 'sacrifice') {
                    const gnome = this.interactablesGroup.create(doorX, doorY, ITEM_ASSETS.INTERACT_OBJECT).setDepth(4);
                    gnome.setData('door', door);
                    door.setVisible(false);
                }
            });
            processedCorridors.add(corridor);
        }
    });
  }
  
  // Returns the correct asset key for a given door type
  private getDoorAsset(type: DoorType): string {
      if (type === 'vine') return DOOR_ASSETS.VINE;
      if (type === 'key') return DOOR_ASSETS.KEY;
      if (type === 'sacrifice') return DOOR_ASSETS.SACRIFICE;
      return DOOR_ASSETS.STANDARD;
  }

  // Activates a room when the player enters: closes doors and spawns enemies
  private activateRoom(room: Room) {
    if (room.isActive || room.isCleared) return;
    room.isActive = true;
    if (room.doorType === 'standard') {
        room.doors.forEach(door => {
            door.setVisible(true);
            (door.body as Phaser.Physics.Arcade.StaticBody).enable = true;
        });
        this.physics.world.colliders.update();
    }
    this.spawnEnemiesForRoom(room);
  }

  // Makes a door invisible and non-collidable
  private openDoor(door: Phaser.Physics.Arcade.Sprite) {
    door.setVisible(false); (door.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    this.physics.world.colliders.update();
  }

  // Checks if all enemies in the current room are defeated, then opens doors
  private checkRoomCleared() {
    if (this.currentRoom && this.currentRoom.isActive) {
      if (this.currentRoom.enemies.countActive(true) === 0) {
        this.currentRoom.isCleared = true; this.currentRoom.isActive = false;
        this.currentRoom.doors.forEach(door => this.openDoor(door));
      }
    }
  }

  // Handles the chance of dropping a key when an enemy or object is destroyed
  private handleLootDrop(x: number, y: number) {
    if (this.rooms.some(r => r.doorType === 'key') && !this.keyHasDropped) {
        if (Math.random() < 0.15) { 
            this.keyHasDropped = true;
            const key = this.keyItemGroup.create(x, y, ITEM_ASSETS.KEY).setDepth(4);
        }
    }
  }

  // Handles player interaction with special doors (key, sacrifice)
  private handleInteraction() {
    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        if (!this.currentPlayer) return;
        const interactionZone = this.add.zone(this.currentPlayer.x, this.currentPlayer.y, TILE_SIZE * 1.5, TILE_SIZE * 1.5);
        this.physics.world.enable(interactionZone);
        this.physics.overlap(interactionZone, this.interactablesGroup, (zone, interactable) => {
            const door = interactable.getData('door') as Phaser.Physics.Arcade.Sprite;
            if (door && door.getData('type') === 'sacrifice') {
                this.portalService?.send("PLAYER_DAMAGED", { damage: 2 });
                this.openDoor(door); interactable.destroy();
            }
        });
        this.physics.overlap(interactionZone, this.doorsGroup, (zone, doorGameObject) => {
            const door = doorGameObject as Phaser.Physics.Arcade.Sprite;
            if (door.getData('type') === 'key' && this.playerHasKey) {
                this.playerHasKey = false; this.openDoor(door);
            }
        });
        this.time.delayedCall(100, () => interactionZone.destroy());
    }
  }

  // Sets up all physics colliders for the scene
  private setupCollisions() { 
    this.wallsLayer?.setCollisionByExclusion([-1, 4]);
    this.obstaclesLayer?.setCollision(INDESTRUCTIBLE_OBSTACLE_IDS);
    if (this.currentPlayer) {
      this.physics.add.collider(this.currentPlayer, this.wallsLayer); 
      this.physics.add.collider(this.currentPlayer, this.obstaclesLayer); 
      this.physics.add.collider(this.currentPlayer, this.doorsGroup);
      this.physics.add.collider(this.currentPlayer, this.destructiblesGroup);
      this.physics.add.overlap(this.currentPlayer, this.keyItemGroup, (player, key) => {
          this.playerHasKey = true;
          key.destroy();
      });
      // Specific collider for ghosts against the outer map boundaries
      this.physics.add.collider(this.ghost_enemies, this.mapBoundsCollider);
    }
  }

  // Handles what happens when the player collides with an enemy
  private handleCollision(enemyGameObject: Phaser.GameObjects.GameObject) {
    const enemy = enemyGameObject as Phaser.Physics.Arcade.Sprite;
    const healthBar = enemy.getData('healthBar') as Phaser.GameObjects.Graphics;

    if (!this.currentPlayer || this.isAttacking) return;
    if (this.time.now < this.lastDamageTime + 1000) return;
    this.lastDamageTime = this.time.now;
    this.portalService?.send("PLAYER_DAMAGED", { damage: 1 });
    this.cameras.main.shake(100, 0.01);
    this.currentPlayer?.setAlpha(0.5);
    this.time.delayedCall(500, () => this.currentPlayer?.setAlpha(1));
    if (this.currentRoom) {
        if (healthBar) healthBar.destroy();
        this.currentRoom.enemies.remove(enemy, true, true);
    } else {
        if (healthBar) healthBar.destroy();
        enemy.destroy(true);
    }
    this.time.delayedCall(100, () => this.checkRoomCleared());
  }

  // Handles player attack logic
  private handleAttack() {
    if (this.isAttacking || !this.currentPlayer) return;
    if (Phaser.Input.Keyboard.JustDown(this.attackKey) || this.input.activePointer.isDown) {
        const mouseWorldX = this.input.activePointer.worldX;
        const mouseWorldY = this.input.activePointer.worldY;
        
        const line = new Phaser.Geom.Line(this.currentPlayer.x, this.currentPlayer.y, mouseWorldX, mouseWorldY);
        
        const tilesInPathWalls = this.wallsLayer.getTilesWithinShape(line);
        const wallInPath = tilesInPathWalls.some(tile => tile.index !== -1 && tile.index !== 4);

        const tilesInPathObstacles = this.obstaclesLayer.getTilesWithinShape(line);
        const obstacleInPath = tilesInPathObstacles.some(tile => INDESTRUCTIBLE_OBSTACLE_IDS.includes(tile.index));
        
        if (wallInPath || obstacleInPath) {
            return;
        }

        this.isAttacking = true;
        
        if (this.currentPlayer.chopAnimationKey) {
            this.currentPlayer.play(this.currentPlayer.chopAnimationKey);
        }
        this.currentPlayer.sprite?.once('animationcomplete', (anim: Phaser.Animations.Animation) => {
            if (anim.key === this.currentPlayer?.chopAnimationKey) { this.isAttacking = false; }
        });
        this.time.delayedCall(250, () => { this.isAttacking = false; });

        const attackRange = 44;
        const swordLength = 64;
        const swordWidth = 24;
        const angle = Phaser.Math.Angle.Between(this.currentPlayer.x, this.currentPlayer.y, mouseWorldX, mouseWorldY);
        
        const hitboxX = this.currentPlayer.x + Math.cos(angle) * attackRange;
        const hitboxY = this.currentPlayer.y + Math.sin(angle) * attackRange;
        
        const attackHitbox = this.add.rectangle(hitboxX, hitboxY, swordLength, swordWidth) as any;
        this.physics.world.enable(attackHitbox);
        attackHitbox.rotation = angle;
        
        this.hitboxGraphics.clear();
        const matrix = new Phaser.GameObjects.Components.TransformMatrix();
        const parentMatrix = new Phaser.GameObjects.Components.TransformMatrix();
        attackHitbox.getWorldTransformMatrix(matrix, parentMatrix);
        const d = matrix.decomposeMatrix();
        this.hitboxGraphics.fillStyle(0xff0000, 0.5);
        this.hitboxGraphics.fillRect(d.translateX - swordLength / 2, d.translateY - swordWidth / 2, swordLength, swordWidth);
        this.hitboxGraphics.setRotation(d.rotation);
        this.time.delayedCall(100, () => this.hitboxGraphics.clear());
        
        this.physics.overlap(attackHitbox, this.destructiblesGroup, (box, destructibleGameObject) => {
            const destructible = destructibleGameObject as Phaser.Physics.Arcade.Sprite;
            const poof = this.add.sprite(destructible.x, destructible.y, "poof").play("poof_anim");
            poof.on("animationcomplete", () => poof.destroy());
            this.handleLootDrop(destructible.x, destructible.y);
            destructible.destroy();
        });

        this.physics.overlap(attackHitbox, this.doorsGroup, (box, doorGameObject) => {
            const door = doorGameObject as Phaser.Physics.Arcade.Sprite;
            if (door.getData('type') === 'vine' && door.visible) {
                let hits = door.getData('hits') || 0;
                hits++; door.setData('hits', hits);
                if (hits >= 3) { this.openDoor(door); }
            }
        });

        const hitEnemies = (enemiesGroup: Phaser.Physics.Arcade.Group) => {
            this.physics.overlap(attackHitbox, enemiesGroup, (box, enemyGameObject) => {
                const enemy = enemyGameObject as Phaser.Physics.Arcade.Sprite;
                // Cannot hit invisible ghosts
                if (!enemy.active || enemy.getData('isInvisible') === true) return;
                
                // Deal damage and update HP
                const currentHp = enemy.getData('hp') as number;
                const newHp = currentHp - PLAYER_ATTACK_DAMAGE;
                enemy.setData('hp', newHp);

                // Visual feedback for damage
                this.tweens.add({ targets: enemy, tint: 0xff0000, duration: 100, yoyo: true });

                // Update health bar
                const healthBar = enemy.getData('healthBar') as Phaser.GameObjects.Graphics;
                const maxHp = enemy.getData('maxHp') as number;
                this.updateHealthBar(healthBar, newHp, maxHp);

                // Check for death
                if (newHp <= 0) {
                    const enemyX = enemy.x;
                    const enemyY = enemy.y;
                    if (healthBar) {
                        healthBar.destroy();
                    }
                    if (this.currentRoom) {
                        this.currentRoom.enemies.remove(enemy, true, true);
                    } else {
                        enemy.destroy(true);
                    }
                    this.handleLootDrop(enemyX, enemyY);
                    this.time.delayedCall(100, () => this.checkRoomCleared());
                }
            });
        };
        hitEnemies(this.ghost_enemies);
        hitEnemies(this.zombie_enemies);
        this.time.delayedCall(100, () => { if (attackHitbox) attackHitbox.destroy(); });
    }
  }
  
  // Helper functions for map generation
  private calculateCorridorRect(parentRect: Phaser.Geom.Rectangle, direction: string, length: number): Phaser.Geom.Rectangle { const width = 3; const parentCenterX = Math.floor(parentRect.centerX); const parentCenterY = Math.floor(parentRect.centerY); let x, y, w, h; if (direction === 'N') { x = parentCenterX - 1; y = parentRect.y - length; w = width; h = length; } else if (direction === 'S') { x = parentCenterX - 1; y = parentRect.bottom; w = width; h = length; } else if (direction === 'W') { x = parentRect.x - length; y = parentCenterY - 1; w = length; h = width; } else { x = parentRect.right; y = parentCenterY - 1; w = length; h = width; } return new Phaser.Geom.Rectangle(x, y, w, h); }
  private calculateNewRoomRect(corridorRect: Phaser.Geom.Rectangle, direction: string, size: number): Phaser.Geom.Rectangle { let x, y; if (direction === 'N') { x = corridorRect.centerX - Math.floor(size/2); y = corridorRect.y - size; } else if (direction === 'S') { x = corridorRect.centerX - Math.floor(size/2); y = corridorRect.bottom; } else if (direction === 'W') { x = corridorRect.x - size; y = corridorRect.centerY - Math.floor(size/2); } else { x = corridorRect.right; y = corridorRect.centerY - Math.floor(size/2); } return new Phaser.Geom.Rectangle(x, y, size, size); }
  private isValidPlacement(newRoomRect: Phaser.Geom.Rectangle, newCorridorRect: Phaser.Geom.Rectangle, parentRoom: Room): boolean { const checkOverlap = (rect1: Phaser.Geom.Rectangle, rect2: Phaser.Geom.Rectangle) => { const inflatedRect2 = Phaser.Geom.Rectangle.Inflate(new Phaser.Geom.Rectangle(rect2.x, rect2.y, rect2.width, rect2.height), 1, 1); return Phaser.Geom.Intersects.RectangleToRectangle(rect1, inflatedRect2); }; for (const room of this.rooms) { if (room !== parentRoom && checkOverlap(newRoomRect, room.rect)) { return false; } } for (const corridor of this.corridors) { if (checkOverlap(newRoomRect, corridor)) { return false; } } for (const room of this.rooms) { if (room !== parentRoom && checkOverlap(newCorridorRect, room.rect)) { return false; } } for (const corridor of this.corridors) { if (newCorridorRect !== corridor && checkOverlap(newCorridorRect, corridor)) { return false; } } return true; }
  private getMapBounds(): Phaser.Geom.Rectangle { if (this.rooms.length === 0) return new Phaser.Geom.Rectangle(0,0,0,0); let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity; this.rooms.forEach(room => { minX = Math.min(minX, room.rect.x); minY = Math.min(minY, room.rect.y); maxX = Math.max(maxX, room.rect.right); maxY = Math.max(maxY, room.rect.bottom); }); this.corridors.forEach(corridor => { minX = Math.min(minX, corridor.x); minY = Math.min(minY, corridor.y); maxX = Math.max(maxX, corridor.right); maxY = Math.max(maxY, corridor.bottom); }); return new Phaser.Geom.Rectangle(minX, minY, maxX - minX, maxY - minY); }
  private drawMapFromRooms() { const layout = Array(this.map.height).fill(0).map(() => Array(this.map.width).fill(0)); const carveRect = (rect: Phaser.Geom.Rectangle) => { for (let y = Math.floor(rect.y); y < Math.floor(rect.bottom); y++) { for (let x = Math.floor(rect.x); x < Math.floor(rect.right); x++) { if(layout[y]?.[x] !== undefined) layout[y][x] = 1; } } }; this.rooms.forEach(room => carveRect(room.rect)); this.corridors.forEach(corridor => carveRect(corridor)); this.drawTiles(layout); }
  private drawTiles(layout: number[][]) { const TILE_IDS = { FLOOR: 4, WALL_TOP: 3, WALL_TOP_ALT: 15, WALL_TOP_LEFT_CORNER: 2, WALL_TOP_RIGHT_CORNER: 1, WALL_LEFT: 9, WALL_RIGHT: 6, WALL_BOTTOM: 11, WALL_BOTTOM_LEFT_CORNER: 8, WALL_BOTTOM_RIGHT_CORNER: 5, INNER_TOP_LEFT_CORNER: 7, INNER_TOP_RIGHT_CORNER: 10, INNER_BOTTOM_LEFT_CORNER: 12, INNER_BOTTOM_RIGHT_CORNER: 13, FILL: 14 }; for (let y = 0; y < this.map.height; y++) { for (let x = 0; x < this.map.width; x++) { if (layout[y]?.[x] === 1) { this.groundLayer.putTileAt(TILE_IDS.FLOOR, x, y); } else { this.groundLayer.putTileAt(TILE_IDS.FILL, x, y); } } } for (let y = 0; y < this.map.height; y++) { for (let x = 0; x < this.map.width; x++) { if (layout[y]?.[x] === 1) continue; const N = y > 0 && layout[y - 1]?.[x] === 1; const S = y < this.map.height - 1 && layout[y + 1]?.[x] === 1; const W = x > 0 && layout[y]?.[x - 1] === 1; const E = x < this.map.width - 1 && layout[y]?.[x + 1] === 1; const NW = y > 0 && x > 0 && layout[y - 1]?.[x - 1] === 1; const NE = y > 0 && x < this.map.width - 1 && layout[y - 1]?.[x + 1] === 1; const SW = y < this.map.height - 1 && x > 0 && layout[y + 1]?.[x - 1] === 1; const SE = y < this.map.height - 1 && x < this.map.width - 1 && layout[y + 1]?.[x + 1] === 1; let tileID: number | null = null; if (S && !N) { if (W && E) tileID = Math.random() < 0.1 ? TILE_IDS.WALL_TOP_ALT : TILE_IDS.WALL_TOP; else if (W) tileID = TILE_IDS.WALL_TOP_RIGHT_CORNER; else if (E) tileID = TILE_IDS.WALL_TOP_LEFT_CORNER; else tileID = TILE_IDS.WALL_TOP; } else if (N && !S) { if (W) tileID = TILE_IDS.WALL_BOTTOM_RIGHT_CORNER; else if (E) tileID = TILE_IDS.WALL_BOTTOM_LEFT_CORNER; else tileID = TILE_IDS.WALL_BOTTOM; } else if (W && !E) { tileID = TILE_IDS.WALL_RIGHT; } else if (E && !W) { tileID = TILE_IDS.WALL_LEFT; } if (S && E && !SE) tileID = TILE_IDS.INNER_TOP_LEFT_CORNER; if (S && W && !SW) tileID = TILE_IDS.INNER_TOP_RIGHT_CORNER; if (N && E && !NE) tileID = TILE_IDS.INNER_BOTTOM_LEFT_CORNER; if (N && W && !NW) tileID = TILE_IDS.INNER_BOTTOM_RIGHT_CORNER; if (tileID !== null) { this.wallsLayer.putTileAt(tileID, x, y); } } } }
  private decorateRooms() { const roomsToDecorate = this.rooms.slice(1); const exitRoom = this.rooms.length > 1 ? this.rooms[this.rooms.length - 1] : null; roomsToDecorate.forEach(room => { const randomPattern = Phaser.Math.RND.pick(ROOM_PATTERNS); const isExit = (room === exitRoom); this.applyRoomPattern(room, randomPattern, isExit); this.placeCornerDecorations(room); this.placeWallDecorations(room); }); }
  private applyRoomPattern(room: Room, pattern: number[][], isExitRoom: boolean) { const patternHeight = pattern.length; const patternWidth = pattern[0].length; const startX = Math.floor(room.centerX - patternWidth / 2); const startY = Math.floor(room.centerY - patternHeight / 2); const keepClearZones: Phaser.Geom.Rectangle[] = []; this.corridors.forEach(corridor => { if (Phaser.Geom.Intersects.RectangleToRectangle(room.rect, corridor)) { const intersection = Phaser.Geom.Rectangle.Intersection(room.rect, corridor); Phaser.Geom.Rectangle.Inflate(intersection, 1, 1); keepClearZones.push(intersection); } }); for (let py = 0; py < patternHeight; py++) { for (let px = 0; px < patternWidth; px++) { const tileId = pattern[py][px]; if (tileId === TILE_TYPE.EMPTY) continue; const tileX = startX + px; const tileY = startY + py; const isInKeepClearZone = keepClearZones.some(zone => zone.contains(tileX, tileY)); if (isInKeepClearZone && INDESTRUCTIBLE_OBSTACLE_IDS.includes(tileId)) { continue; } let canPlace = true; if (isExitRoom) { const clearRadius = 2; const isNearExit = Math.abs(tileX - room.centerX) <= clearRadius && Math.abs(tileY - room.centerY) <= clearRadius; const isIndestructible = INDESTRUCTIBLE_OBSTACLE_IDS.includes(tileId); if (isNearExit && isIndestructible) { canPlace = false; } } if (canPlace) { if (DESTRUCTIBLE_TILE_TYPES.includes(tileId)) { const worldX = tileX * this.map.tileWidth + this.map.tileWidth / 2; const worldY = tileY * this.map.tileHeight + this.map.tileHeight / 2; const assetKey = TILE_TO_ASSET_MAP[tileId] || DESTRUCTIBLE_ASSETS.GIFT; const destructible = this.destructiblesGroup.create(worldX, worldY, assetKey); destructible.setDepth(1); } else { this.obstaclesLayer.putTileAt(tileId, tileX, tileY); } } } } }
  private placeCornerDecorations(room: Room) { const { x, y, right, bottom } = room.rect; const cornerProps = [OBSTACLE_TILES.BOOKSHELF, OBSTACLE_TILES.WEAPON_RACK]; const corners = [ { x: Math.floor(x) + 1, y: Math.floor(y) + 1 }, { x: Math.floor(right) - 2, y: Math.floor(y) + 1 }, { x: Math.floor(x) + 1, y: Math.floor(bottom) - 2 }, { x: Math.floor(right) - 2, y: Math.floor(bottom) - 2 } ]; corners.forEach(corner => { if (Math.random() < 0.5) { if (!this.obstaclesLayer.hasTileAt(corner.x, corner.y)) { const prop = Phaser.Math.RND.pick(cornerProps); this.obstaclesLayer.putTileAt(prop, corner.x, corner.y); } } }); }
  private placeWallDecorations(room: Room) { const { x, y, width } = room.rect; const wallProps = [DECORATION_TILES.WALL_TORCH, DECORATION_TILES.WALL_BANNER]; for (let i = 2; i < width - 2; i++) { if (Math.random() < 0.2) { const tileX = Math.floor(x) + i; const prop = Phaser.Math.RND.pick(wallProps); this.decorationsLayer.putTileAt(prop, tileX, Math.floor(y)); i += 2; } } }
  
  // Checks which room the player is currently in to trigger events
  private checkPlayerRoom() {
    if (!this.currentPlayer || !this.rooms.length) return;
    const playerPoint = new Phaser.Geom.Point(this.currentPlayer.x / this.map.tileWidth, this.currentPlayer.y / this.map.tileHeight);
    
    for (const room of this.rooms) {
        if (Phaser.Geom.Rectangle.ContainsPoint(room.rect, playerPoint)) {
            if (room !== this.currentRoom) {
                this.currentRoom = room;
                this.activateRoom(this.currentRoom);
            }
            return;
        }
    }
    this.currentRoom = null;
  }

  // Spawns enemies in a given room, respecting puzzle room rules
  private spawnEnemiesForRoom(room: Room) {
    // Puzzle rooms do not spawn enemies
    if (room.doorType !== 'standard') {
        return; 
    }

    const numEnemies = Phaser.Math.Between(1, 2 + this.dungeonLevel);
    for (let i = 0; i < numEnemies; i++) {
        const x = Phaser.Math.Between((room.rect.x + 1) * this.map.tileWidth, (room.rect.right - 2) * this.map.tileWidth);
        const y = Phaser.Math.Between((room.rect.y + 1) * this.map.tileHeight, (room.rect.bottom - 2) * this.map.tileHeight);
        
        const enemyType = Math.random() > 0.5 ? 'ghost' : 'zombie';
        const animKey = `${enemyType}_anim`;
        const textureKey = `${enemyType}_enemy_1`;

        if (enemyType === 'ghost') {
            const enemy = this.ghost_enemies.create(x, y, textureKey).setSize(TILE_SIZE, TILE_SIZE).setAlpha(0.7);
            const maxHp = 6;
            enemy.setData({
                hp: maxHp,
                maxHp: maxHp,
                wanderTimer: 0,
                isInvisible: false,
                invisibilityCooldown: 0,
            });
            enemy.setBounce(1,1);
            this.physics.add.collider(enemy, this.mapBoundsCollider);
            room.enemies.add(enemy);
            enemy.play(animKey);
            this.physics.add.overlap(this.currentPlayer, enemy, (p,e) => this.handleCollision(e));
            this.createHealthBar(enemy);
        } else { // zombie
            const enemy = this.zombie_enemies.create(x, y, textureKey).setSize(TILE_SIZE, TILE_SIZE);
            const maxHp = 10;
            enemy.setData({
                hp: maxHp,
                maxHp: maxHp,
            });
            room.enemies.add(enemy);
            enemy.play(animKey);
            enemy.setCollideWorldBounds(true);
            this.physics.add.collider(enemy, this.wallsLayer!);
            this.physics.add.collider(enemy, this.obstaclesLayer);
            this.physics.add.collider(enemy, this.destructiblesGroup);
            this.physics.add.overlap(this.currentPlayer, enemy, (p,e) => this.handleCollision(e));
            this.createHealthBar(enemy);
        }
    }
  }

  // Manages the ghost's behavior (wandering, pursuing, and invisibility)
  private updateGhostAI() {
    this.ghost_enemies.children.each(enemy => {
        const ghost = enemy as Phaser.Physics.Arcade.Sprite;
        if (!ghost.active || !this.currentPlayer || !ghost.body) return;

        const distance = Phaser.Math.Distance.Between(ghost.x, ghost.y, this.currentPlayer.x, this.currentPlayer.y);
        const isInvisible = ghost.getData('isInvisible');
        const invisibilityCooldown = ghost.getData('invisibilityCooldown');

        if (distance < GHOST_AGGRO_RADIUS) {
            // Pursue player
            this.physics.moveToObject(ghost, this.currentPlayer, GHOST_PURSUE_SPEED);
            
            // Trigger invisibility skill if not on cooldown
            if (!isInvisible && this.time.now > invisibilityCooldown) {
                ghost.setData('isInvisible', true);
                ghost.setData('invisibilityCooldown', this.time.now + 7000); // 7s cooldown (2s invis + 5s wait)

                this.tweens.add({
                    targets: ghost,
                    alpha: 0.1,
                    duration: 300,
                    onComplete: () => {
                        this.time.delayedCall(2000, () => {
                            if (!ghost.active) return;
                            ghost.setData('isInvisible', false);
                            this.tweens.add({
                                targets: ghost,
                                alpha: 0.7,
                                duration: 300
                            });
                        });
                    }
                });
            }
        } else {
            // Wander randomly
            let wanderTimer = ghost.getData('wanderTimer') as number;
            if (this.time.now > wanderTimer) {
                const randomAngle = Phaser.Math.FloatBetween(0, 2 * Math.PI);
                const velocity = new Phaser.Math.Vector2(Math.cos(randomAngle), Math.sin(randomAngle)).scale(GHOST_WANDER_SPEED);
                ghost.setVelocity(velocity.x, velocity.y);
                ghost.setData('wanderTimer', this.time.now + Phaser.Math.Between(2000, 5000));
            }
        }
    });
  }

  // Manages the zombie's behavior (simple pursuit)
  private updateZombieAI() {
    this.zombie_enemies.children.each(enemy => {
        const zombie = enemy as Phaser.Physics.Arcade.Sprite;
        if (!zombie.active || !this.currentPlayer || !zombie.body) return;
        this.physics.moveToObject(zombie, this.currentPlayer, ZOMBIE_PURSUE_SPEED);
    });
  }
  
  // Creates a health bar for an enemy
  private createHealthBar(enemy: Phaser.Physics.Arcade.Sprite) {
    const healthBar = this.add.graphics();
    healthBar.setDepth(5);
    enemy.setData('healthBar', healthBar);
    this.updateHealthBar(healthBar, enemy.getData('hp'), enemy.getData('maxHp'));
    healthBar.setPosition(enemy.x, enemy.y);
  }

  // Updates the visual representation of a health bar based on current/max HP
  private updateHealthBar(healthBar: Phaser.GameObjects.Graphics, currentHp: number, maxHp: number) {
    healthBar.clear();
    const width = 24;
    const height = 4;
    const x = -width / 2;
    const y = - TILE_SIZE / 2 - 8;
    
    // Background of the bar
    healthBar.fillStyle(0x3d3d3d);
    healthBar.fillRect(x, y, width, height);

    // Current health fill
    const healthWidth = Math.max(0, (currentHp / maxHp) * width);
    healthBar.fillStyle(0x42f560);
    healthBar.fillRect(x, y, healthWidth, height);
  }

  // Updates the position of all active health bars every frame to follow their enemies
  private updateAllHealthBars() {
    const updateBars = (group: Phaser.Physics.Arcade.Group) => {
        group.children.each(enemy => {
            const sprite = enemy as Phaser.Physics.Arcade.Sprite;
            const healthBar = sprite.getData('healthBar') as Phaser.GameObjects.Graphics;
            if (healthBar && sprite.active) {
                healthBar.setPosition(sprite.x, sprite.y);
            }
        });
    }
    updateBars(this.ghost_enemies);
    updateBars(this.zombie_enemies);
  }
  
  // Resets the scene to start a new level or retry
  private reset() { this.scene.restart(); }
  private loadBumpkinAnimations() { if (!this.currentPlayer) return; const animation = this.isMoving ? "walk" : "idle"; if (this.currentPlayer[animation]) this.currentPlayer[animation](); }
  private placeEntranceAndExit() { if (this.rooms.length > 1) { const startRoom = this.rooms[0]; const entranceX = startRoom.centerX * this.map.tileWidth; const entranceY = startRoom.centerY * this.map.tileHeight; this.entranceObject = this.add.sprite(entranceX, entranceY, "entrance_rug").setDepth(1); const exitRoom = this.rooms[this.rooms.length - 1]; const exitX = exitRoom.centerX * this.map.tileWidth; const exitY = exitRoom.centerY * this.map.tileHeight; if (this.exitObject) this.exitObject.destroy(); this.exitObject = this.add.sprite(exitX, exitY, 'exit_object'); this.physics.world.enable(this.exitObject, Phaser.Physics.Arcade.STATIC_BODY); this.exitObject.setDepth(1); } }
  private setupExitOverlap() { if (this.currentPlayer && this.exitObject) { this.physics.add.overlap(this.currentPlayer, this.exitObject, this.nextLevel, undefined, this); } }
  private nextLevel() { if (this.isCameraFading) return; this.dungeonLevel++; this.playerHasKey = false; this.keyHasDropped = false; this.isCameraFading = true; this.cameras.main.fadeOut(500, 0, 0, 0, (_camera: any, progress: number) => { if (progress === 1) { this.reset(); this.cameras.main.fadeIn(500); this.isCameraFading = false; } }); }
}