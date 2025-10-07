import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { BaseRoom } from "../BaseRoom";
import { createRandomRoom } from "../../Utils";
import { BaseScene } from "features/world/scenes/BaseScene";
import { TILES } from "../RoomTileMap";
import {
  AMOUNT_ENEMIES,
  TILE_SIZE,
} from "features/portal/halloween/HalloweenConstants";
import { BlacksmithContainer } from "features/portal/halloween/containers/BlacksmithContainer";

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
  }

  private createEnemies() {
    for (let i = 0; i < AMOUNT_ENEMIES; i++) {
      this.spawnObjectRandomly((x, y) => this.createEnemy(x, y));
    }
  }

  private createEnemy(x: number, y: number) {
    // Create logic to add your enemy
    // new EnemyContainer({
    //   x,
    //   y,
    //   ...
    // })
  }
}
