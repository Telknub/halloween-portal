import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { BaseRoom } from "../BaseRoom";
import { createSmallRoom } from "../../Utils";
import {
  BLACKSMITH_CONFIGURATION,
  BLACKSMITH_GATE_CONFIG,
} from "features/portal/halloween/HalloweenConstants";
import { HalloweenScene } from "features/portal/halloween/HalloweenScene";
import { BlacksmithContainer } from "features/portal/halloween/containers/BlacksmithContainer";

interface Props {
  scene: HalloweenScene;
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
    this.createDecorationRandomly({ excludeSmallRoom: true });
    this.createBlacksmith();
    this.spawnObjectRandomly((x, y) => this.createStatues(x, y), true);
    this.spawnObjectRandomly((x, y) => this.createBones(x, y), true);
    this.createGate();
    this.createGate("blacksmith");

    this.spawnObjectRandomly((x, y) => this.createRelic(x, y));
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
