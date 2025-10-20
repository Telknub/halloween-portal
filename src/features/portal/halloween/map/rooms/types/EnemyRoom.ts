import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { BaseRoom } from "../BaseRoom";
import { createRandomRoom } from "../../Utils";
import { HalloweenScene } from "features/portal/halloween/HalloweenScene";
import {
  AMOUNT_ENEMIES,
  GOLEM_STATS,
  MUMMY_STATS,
} from "features/portal/halloween/HalloweenConstants";
import { MummyContainer } from "features/portal/halloween/containers/MummyContainer";
import { EnemyContainer } from "features/portal/halloween/containers/EnemyContainer";
import { GolemContainer } from "features/portal/halloween/containers/GolemConatiner";
import { EventBus } from "features/portal/halloween/lib/EventBus";
import { RelicContainer } from "features/portal/halloween/containers/RelicContainer";

interface Props {
  scene: HalloweenScene;
  wallsLayer?: Phaser.Tilemaps.TilemapLayer;
  hasEntry?: boolean;
  hasExit?: boolean;
  matrix?: number[][];
  player?: BumpkinContainer;
}

export class EnemyRoom extends BaseRoom {
  private enemyIds: number[] = [];
  private wallsLayer?: Phaser.Tilemaps.TilemapLayer;

  constructor({
    scene,
    hasEntry = true,
    hasExit = true,
    wallsLayer,
    player,
  }: Props) {
    const matrix = createRandomRoom();
    super({ scene, hasEntry, hasExit, matrix, type: "enemy", player });

    this.wallsLayer = wallsLayer;
    this.createEvents();
  }

  private createEvents() {
    EventBus.on("create-enemies", (data: Record<string, number>) => {
      if (data.id + 1 === this.id) this.createEnemies();
    });
  }

  createObjects() {
    this.createDecorationRandomly();
    this.spawnObjectRandomly((x, y) => this.createStatues(x, y));
    this.spawnObjectRandomly((x, y) => this.createBones(x, y));
    this.id === 2 && this.spawnObjectRandomly((x, y) => this.createLamp(x, y));
    this.id === 3 &&
      this.spawnObjectRandomly((x, y) => this.createPickaxe(x, y));
    this.createGate();
  }

  private defeatEnemy(id: number) {
    this.enemyIds = this.enemyIds.filter((enemyId) => enemyId !== id);

    if (!this.enemyIds.length) {
      Math.random() <= 0.5 ? this.createGolemEnemy() : this.createMummyEnemy();
    }
  }

  private defeatMiniBoss(x: number, y: number) {
    new RelicContainer({
      x,
      y,
      scene: this.scene,
      player: this.player,
    });
  }

  private createEnemies() {
    for (let i = 0; i < AMOUNT_ENEMIES; i++) {
      this.spawnObjectRandomly((x, y) => this.createEnemy(x, y, i));
    }
  }

  private createEnemy(x: number, y: number, id: number) {
    this.enemyIds.push(id);
    new EnemyContainer({
      x,
      y,
      scene: this.scene,
      id,
      defeat: (id: number) => this.defeatEnemy(id),
      player: this.player,
    });
  }

  private createMummyEnemy() {
    const { x, y } = this.getRelativePosition(
      MUMMY_STATS.config.x,
      MUMMY_STATS.config.y,
    );
    new MummyContainer({
      x,
      y,
      scene: this.scene,
      defeat: (x: number, y: number) => this.defeatMiniBoss(x, y),
      player: this.player,
    });
  }

  private createGolemEnemy() {
    const { x, y } = this.getRelativePosition(
      GOLEM_STATS.config.x,
      GOLEM_STATS.config.y,
    );
    new GolemContainer({
      x,
      y,
      scene: this.scene,
      defeat: (x: number, y: number) => this.defeatMiniBoss(x, y),
      player: this.player,
    });
  }
}
