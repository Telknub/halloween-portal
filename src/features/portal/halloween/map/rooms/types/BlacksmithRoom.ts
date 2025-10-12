import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { BaseRoom } from "../BaseRoom";
import { createSmallRoom } from "../../Utils";
import { BLACKSMITH_CONFIGURATION } from "features/portal/halloween/HalloweenConstants";
import { BaseScene } from "features/world/scenes/BaseScene";
import { BlacksmithContainer } from "features/portal/halloween/containers/BlacksmithContainer";
import { StatueContainer } from "features/portal/halloween/containers/StatueContainer";
import { BoneContainer } from "features/portal/halloween/containers/BoneContainer";

interface Props {
  scene: BaseScene;
  hasEntry?: boolean;
  hasExit?: boolean;
  matrix?: number[][];
  player?: BumpkinContainer;
}

export class BlacksmithRoom extends BaseRoom {
  constructor({ scene, hasEntry = true, hasExit = true, player }: Props) {
    const matrix = createSmallRoom();
    super({ scene, hasEntry, hasExit, matrix, type: "blacksmith", player });
  }

  createObjects() {
    this.createBlacksmith();
    const statuePos = this.spawnObjectRandomly(
      (x, y) => this.createStatues(x, y),
      true,
    );
    this.spawnObjectRandomly((x, y) => this.createBones(x, y), true, statuePos);
    this.createDecorationRandomly();
  }

  private createBlacksmith() {
    const { x, y } = this.getRelativePosition(
      BLACKSMITH_CONFIGURATION.x,
      BLACKSMITH_CONFIGURATION.y,
    );
    new BlacksmithContainer({
      x,
      y,
      scene: this.scene,
      player: this.player,
    });
  }
}
