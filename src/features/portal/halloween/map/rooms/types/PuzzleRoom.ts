import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { BaseRoom } from "../BaseRoom";
import { createCenterRoom } from "../../Utils";
import { HalloweenScene } from "features/portal/halloween/HalloweenScene";

interface Props {
  scene: HalloweenScene;
  hasEntry?: boolean;
  hasExit?: boolean;
  matrix?: number[][];
  player?: BumpkinContainer;
}

export class PuzzleRoom extends BaseRoom {
  constructor({ scene, hasEntry = true, hasExit = true, player }: Props) {
    const matrix = createCenterRoom();
    super({ scene, hasEntry, hasExit, matrix, type: "puzzle", player });
  }

  createObjects() {
    this.createDecorationRandomly({ excludeSmallRoom: true });
    this.spawnObjectRandomly((x, y) => this.createStatues(x, y), true);
    this.spawnObjectRandomly((x, y) => this.createBones(x, y), true);
    this.id === 2 && this.spawnObjectRandomly((x, y) => this.createLamp(x, y));
    this.id === 3 &&
      this.spawnObjectRandomly((x, y) => this.createPickaxe(x, y));
    this.createGate();

    this.spawnObjectRandomly((x, y) => this.createRelic(x, y));
  }
}
