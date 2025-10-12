import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { BaseRoom } from "../BaseRoom";
import { basicRoom } from "../RoomTileMap";
import { BaseScene } from "features/world/scenes/BaseScene";
import { BOSS_ENEMY_CONFIGURATION } from "features/portal/halloween/HalloweenConstants";
import { BossContainer } from "features/portal/halloween/containers/BossContainer";

interface Props {
  scene: BaseScene;
  hasEntry?: boolean;
  hasExit?: boolean;
  matrix?: number[][];
  player?: BumpkinContainer;
}

export class BossRoom extends BaseRoom {
  constructor({ scene, hasEntry = true, hasExit = true, player }: Props) {
    super({
      scene,
      hasEntry,
      hasExit,
      matrix: basicRoom,
      type: "boss",
      player,
    });
  }

  createObjects() {
    this.createBossEnemy();
  }

  private createBossEnemy() {
    const { x, y } = this.getRelativePosition(
      BOSS_ENEMY_CONFIGURATION.x,
      BOSS_ENEMY_CONFIGURATION.y,
    );
    new BossContainer({
      x,
      y,
      scene: this.scene,
      player: this.player,
      room: this,
    });
  }
}
