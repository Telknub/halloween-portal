import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { BaseRoom } from "../BaseRoom";
import { createRandomRoom } from "../../Utils";
import { BaseScene } from "features/world/scenes/BaseScene";
import { MUMMY_ENEMY_CONFIGURATION } from "features/portal/halloween/HalloweenConstants";
import { MummyContainer } from "features/portal/halloween/containers/MummyContainer";

interface Props {
  scene: BaseScene;
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
    this.createEnemies();
    const statuePos = this.spawnObjectRandomly((x, y) =>
      this.createStatues(x, y),
    );
    this.spawnObjectRandomly(
      (x, y) => this.createBones(x, y),
      false,
      statuePos,
    );
    this.id === 2 &&
      this.spawnObjectRandomly(
        (x, y) => this.createLamp(x, y),
        false,
        statuePos,
      );
    this.id === 3 &&
      this.spawnObjectRandomly(
        (x, y) => this.createPickaxe(x, y),
        false,
        statuePos,
      );
    this.createMummyEnemy();
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
