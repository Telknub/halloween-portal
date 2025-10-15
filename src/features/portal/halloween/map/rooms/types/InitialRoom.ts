import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { BaseRoom } from "../BaseRoom";
import { basicRoom } from "../RoomTileMap";
import { HalloweenScene } from "features/portal/halloween/HalloweenScene";
import {
  INITIAL_SKELETON_KEY,
  INITIAL_SKELETON_NPC_NAME,
  SKELETON_INITIAL_ROOM_CONFIG,
} from "features/portal/halloween/HalloweenConstants";
import { SkeletonContainer } from "features/portal/halloween/containers/SkeletonContainer";

interface Props {
  scene: HalloweenScene;
  hasEntry?: boolean;
  hasExit?: boolean;
  matrix?: number[][];
  player?: BumpkinContainer;
}

export class InitialRoom extends BaseRoom {
  constructor({ scene, hasEntry = true, hasExit = true, player }: Props) {
    super({
      scene,
      hasEntry,
      hasExit,
      matrix: basicRoom,
      type: "initial",
      player,
    });
  }

  createObjects() {
    this.createSkeleton();
  }

  private createSkeleton() {
    if (!this.exit) return;

    const { x, y } = this.getRelativePosition(
      SKELETON_INITIAL_ROOM_CONFIG[this.exit].x,
      SKELETON_INITIAL_ROOM_CONFIG[this.exit].y,
    );
    new SkeletonContainer({
      x,
      y,
      scene: this.scene,
      id: this.id,
      direction: SKELETON_INITIAL_ROOM_CONFIG[this.exit].direction,
      flowCompleteKey: INITIAL_SKELETON_KEY,
      npcName: INITIAL_SKELETON_NPC_NAME,
      player: this.player,
    });
  }
}
