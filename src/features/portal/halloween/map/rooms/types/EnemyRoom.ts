import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { BaseRoom } from "../BaseRoom";
import { createRandomRoom } from "../../Utils";
import { HalloweenScene } from "features/portal/halloween/HalloweenScene";
import { AMOUNT_ENEMIES, GOLEM_STATS, MUMMY_STATS } from "features/portal/halloween/HalloweenConstants";
import { MummyContainer } from "features/portal/halloween/containers/MummyContainer";
import { EnemyContainer } from "features/portal/halloween/containers/EnemyContainer";
import { GolemContainer } from "features/portal/halloween/containers/GolemConatiner";

interface Props {
  scene: HalloweenScene;
  hasEntry?: boolean;
  hasExit?: boolean;
  matrix?: number[][];
  player?: BumpkinContainer;
}

export class EnemyRoom extends BaseRoom {
  // private mummyEnemy!: MummyContainer;
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
      this.spawnObjectRandomly((x, y) => this.createRelic(x, y));
      // this.createMummyEnemy();
      this.createGolemEnemy();
  }

  private createEnemies() {
    for (let i = 0; i < AMOUNT_ENEMIES; i++) {
      this.spawnObjectRandomly((x, y) => this.createEnemy(x, y));
    }
  }

  private createEnemy(x: number, y: number) {
    // Create logic to add your enemy
    const newEnemy = new EnemyContainer({
      x,
      y,
      scene: this.scene,
      player: this.player
    })
  }

  private createMummyEnemy() {
    const { x, y } = this.getRelativePosition(
      MUMMY_STATS.config.x,
      MUMMY_STATS.config.y
    );
    const mummyEnemy = new MummyContainer({
      x,
      y,
      scene: this.scene,
      player: this.player,
    });
  }

  private createGolemEnemy() {
    const { x, y } = this.getRelativePosition(
      GOLEM_STATS.config.x,
      GOLEM_STATS.config.y
    );
    new GolemContainer({
      x,
      y,
      scene: this.scene,
      player: this.player,
    });
  }

  // update() {
  //   this.mummyEnemy.update()
  // }
}
