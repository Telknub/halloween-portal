import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { RoomList } from "./rooms/RoomList";
import {
  DEFAULT_GROUND_DECORATION_CHANCE,
  GROUND_DECORATION_CHANCE,
  RoomType,
  TILE_SIZE,
  WALL_DECORATION_CHANCE,
} from "../HalloweenConstants";
import { DECORATION_TILES, TILES } from "./rooms/RoomTileMap";
import { HalloweenScene } from "../HalloweenScene";

interface Props {
  scene: HalloweenScene;
  player?: BumpkinContainer;
}

export class Map {
  private scene!: HalloweenScene;
  private player?: BumpkinContainer;
  private map!: Phaser.Tilemaps.Tilemap;
  private tileset!: Phaser.Tilemaps.Tileset;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private wallsLayer!: Phaser.Tilemaps.TilemapLayer;
  private decorationGroundLayer!: Phaser.Tilemaps.TilemapLayer;
  private decorationWallsLayer!: Phaser.Tilemaps.TilemapLayer;
  private mapData!: number[][];
  private rooms!: RoomList;

  constructor({ scene, player }: Props) {
    this.scene = scene;
    this.player = player;
    this.createMap();
    this.initialiseCamera();
    this.initialiseLayers();
    // this.initialiseCollisions();
    this.initialiseObjects();
  }

  private createMap() {
    this.mapData = this.createRooms();

    const mapWidth = this.mapData[0].length;
    const mapHeight = this.mapData.length;

    // Create a tilemap from the array data
    this.map = this.scene.make.tilemap({
      key: "halloween",
      data: this.mapData,
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
      width: mapWidth,
      height: mapHeight,
    });

    this.tileset = this.map.addTilesetImage(
      "Sunnyside V3",
      "halloween-2025-tileset",
      TILE_SIZE,
      TILE_SIZE,
    ) as Phaser.Tilemaps.Tileset;

    this.scene.physics.world.setBounds(
      0,
      0,
      mapWidth * TILE_SIZE,
      mapHeight * TILE_SIZE,
    );
  }

  get getDimensions() {
    return {
      width: this.map.width * TILE_SIZE,
      height: this.map.height * TILE_SIZE,
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
      columns: this.map.width,
      rows: this.map.height,
    };
  }

  private initialiseCamera() {
    this.scene.cameras.main.setBounds(
      0,
      0,
      this.getDimensions.width,
      this.getDimensions.height,
    );
  }

  private initialiseLayers() {
    this.groundLayer = this.map.createBlankLayer(
      "ground",
      this.tileset,
      0,
      0,
    ) as Phaser.Tilemaps.TilemapLayer;
    this.decorationGroundLayer = this.map.createBlankLayer(
      "decoration ground",
      this.tileset,
      0,
      0,
    ) as Phaser.Tilemaps.TilemapLayer;
    this.wallsLayer = this.map.createBlankLayer(
      "walls",
      this.tileset,
      0,
      0,
    ) as Phaser.Tilemaps.TilemapLayer;
    this.decorationWallsLayer = this.map.createBlankLayer(
      "decoration walls",
      this.tileset,
      0,
      0,
    ) as Phaser.Tilemaps.TilemapLayer;

    for (let y = 0; y < this.getDimensions.rows; y++) {
      for (let x = 0; x < this.getDimensions.columns; x++) {
        const tileIndex = this.mapData[y][x];

        // Base ground tile
        this.groundLayer.putTileAt(TILES.GROUND, x, y);

        // Add random ground decoration
        const groundDecorations = DECORATION_TILES[TILES.GROUND];
        if (groundDecorations && Math.random() < GROUND_DECORATION_CHANCE) {
          let randomDecoration;
          if (Math.random() < DEFAULT_GROUND_DECORATION_CHANCE) {
            randomDecoration = groundDecorations[0];
          } else {
            const others = groundDecorations.slice(1);
            randomDecoration = Phaser.Utils.Array.GetRandom(others);
          }
          this.decorationGroundLayer.putTileAt(randomDecoration, x, y);
        }

        // Add walls and possible wall decorations
        if (tileIndex !== TILES.GROUND) {
          this.wallsLayer.putTileAt(tileIndex, x, y);

          const wallDecorations = DECORATION_TILES[tileIndex];
          if (wallDecorations && Math.random() < WALL_DECORATION_CHANCE) {
            const randomDecoration =
              wallDecorations[
                Math.floor(Math.random() * wallDecorations.length)
              ];
            this.decorationWallsLayer.putTileAt(randomDecoration, x, y);
          }
        }
      }
    }

    // Set display size for both layers
    this.groundLayer.setDisplaySize(
      this.getDimensions.width,
      this.getDimensions.height,
    );
    this.wallsLayer.setDisplaySize(
      this.getDimensions.width,
      this.getDimensions.height,
    );
    this.decorationGroundLayer.setDisplaySize(
      this.getDimensions.width,
      this.getDimensions.height,
    );
    this.decorationWallsLayer.setDisplaySize(
      this.getDimensions.width,
      this.getDimensions.height,
    );
  }

  private initialiseCollisions() {
    this.wallsLayer.setCollisionByExclusion([-1]);
    this.wallsLayer.setCollisionByProperty({ collides: true });
    this.scene.physics.add.collider(
      this.player as BumpkinContainer,
      this.wallsLayer,
    );
  }

  private initialiseObjects() {
    this.rooms.setupObjects();
  }

  private getRandomRoom(
    roomTypes: RoomType[],
    maxRepeats: number,
    counts: Partial<Record<RoomType, number>>,
    totalRooms: number,
  ) {
    let countRoom = 0;
    while (countRoom < totalRooms) {
      const random = roomTypes[Math.floor(Math.random() * roomTypes.length)];
      const currentCount = counts[random] ?? 0;
      if (currentCount < maxRepeats) {
        countRoom++;
        this.rooms.append(random);
        counts[random] = currentCount + 1;
      }
    }
  }

  private createRooms() {
    this.rooms = new RoomList(this.scene, this.player);
    const roomTypes: RoomType[] = ["enemy", "puzzle"];
    const maxRepeats = 2;
    const counts = {
      enemy: 0,
      puzzle: 0,
    };

    this.rooms.append("initial");
    this.getRandomRoom(roomTypes, maxRepeats, counts, 2);
    this.rooms.append("blacksmith");
    this.getRandomRoom(roomTypes, maxRepeats, counts, 2);
    this.rooms.append("skeleton");
    this.rooms.append("boss");
    this.rooms.setupRooms();
    const allRooms = this.rooms.concatenateRooms();
    return allRooms;
  }
}
