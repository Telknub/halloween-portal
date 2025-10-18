import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { BaseRoom } from "../BaseRoom";
import { basicRoom } from "../RoomTileMap";
import { BOSS_STATS } from "features/portal/halloween/HalloweenConstants";
import { HalloweenScene } from "features/portal/halloween/HalloweenScene";
import { BossContainer } from "features/portal/halloween/containers/BossContainer";

interface Props {
  scene: HalloweenScene;
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
      BOSS_STATS.config.x,
      BOSS_STATS.config.y
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
