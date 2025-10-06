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
      this.createEnemy();
    }
  }

  private createEnemy() {
    let isGround = false;

    while (!isGround) {
      const tileX = Math.floor(Math.random() * this.getContentMatrix[0].length);
      const tileY = Math.floor(Math.random() * this.getContentMatrix.length);

      if (this.getContentMatrix[tileY][tileX] === TILES.GROUND) {
        const posX = tileX * TILE_SIZE;
        const posY = tileY * TILE_SIZE;
        const { x, y } = this.getRelativePosition(posX, posY);
        // Add logic to add enemy
        // new EnemyContainer({
        //   x,
        //   y,
        //   ...
        // })
        isGround = true;
      }
    }
  }
}
