import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { BaseRoom } from "../BaseRoom";
import { createCenterRoom } from "../../Utils";
import { BaseScene } from "features/world/scenes/BaseScene";

interface Props {
  scene: BaseScene;
  hasEntry?: boolean;
  hasExit?: boolean;
  matrix?: number[][];
  player?: BumpkinContainer;
}

export class SkeletonRoom extends BaseRoom {
  constructor({ scene, hasEntry = true, hasExit = true, player }: Props) {
    const matrix = createCenterRoom();
    super({ scene, hasEntry, hasExit, matrix, type: "skeleton", player });
  }

  createObjects() {}
}
