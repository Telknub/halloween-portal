import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { BaseRoom } from "../BaseRoom";
import { createRandomRoom } from "../../Utils";
import { HalloweenScene } from "features/portal/halloween/HalloweenScene";
import { MUMMY_ENEMY_CONFIGURATION } from "features/portal/halloween/HalloweenConstants";
import { MummyContainer } from "features/portal/halloween/containers/MummyContainer";

interface Props {
  scene: HalloweenScene;
  hasEntry?: boolean;
  hasExit?: boolean;
  matrix?: number[][];
  player?: BumpkinContainer;
}

export class EnemyRoom extends BaseRoom {
  constructor({ scene, hasEntry = true, hasExit = true, player }: Props) {
    const matrix = createRandomRoom();
    super({ scene, hasEntry, hasExit, matrix, type: "enemy", player });
  }

  createObjects() {
    this.createDecorationRandomly();
    this.createEnemies();
    this.spawnObjectRandomly((x, y) => this.createStatues(x, y));
    this.spawnObjectRandomly((x, y) => this.createBones(x, y));
    this.id === 2 && this.spawnObjectRandomly((x, y) => this.createLamp(x, y));
    this.id === 3 &&
      this.spawnObjectRandomly((x, y) => this.createPickaxe(x, y));
    this.createMummyEnemy();
    this.createGate();

    this.spawnObjectRandomly((x, y) => this.createRelic(x, y));
  }

  private createEnemies() {
    // for (let i = 0; i < AMOUNT_ENEMIES; i++) {
    //   this.spawnObjectRandomly((x, y) => this.createEnemy(x, y));
    // }
  }

  private createEnemy(x: number, y: number) {
    // Create logic to add your enemy
    // new EnemyContainer({
    //   x,
    //   y,
    //   ...
    // })
  }

  private createMummyEnemy() {
    const { x, y } = this.getRelativePosition(
      MUMMY_ENEMY_CONFIGURATION.x,
      MUMMY_ENEMY_CONFIGURATION.y,
    );
    new MummyContainer({
      x,
      y,
      scene: this.scene,
      player: this.player,
    });
  }
}
