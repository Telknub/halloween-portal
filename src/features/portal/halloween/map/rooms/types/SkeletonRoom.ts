import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { BaseRoom } from "../BaseRoom";
import { createCenterRoom } from "../../Utils";
import { HalloweenScene } from "features/portal/halloween/HalloweenScene";
import {
  FINAL_SKELETON_KEY,
  FINAL_SKELETON_NPC_NAME,
  SKELETON_FINAL_ROOM_CONFIG,
} from "features/portal/halloween/HalloweenConstants";
import { SkeletonContainer } from "features/portal/halloween/containers/SkeletonContainer";

interface Props {
  scene: HalloweenScene;
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

  createObjects() {
    this.createSkeleton();
  }

  private createSkeleton() {
    const { x, y } = this.getRelativePosition(
      SKELETON_FINAL_ROOM_CONFIG.x,
      SKELETON_FINAL_ROOM_CONFIG.y,
    );
    new SkeletonContainer({
      x,
      y,
      scene: this.scene,
      id: this.id,
      direction: SKELETON_FINAL_ROOM_CONFIG.direction,
      flowCompleteKey: FINAL_SKELETON_KEY,
      npcName: FINAL_SKELETON_NPC_NAME,
      player: this.player,
    });
  }
}
