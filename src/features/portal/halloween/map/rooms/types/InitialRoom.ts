import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { BaseRoom } from "../BaseRoom";
import { basicRoom } from "../RoomTileMap";
import { HalloweenScene } from "features/portal/halloween/HalloweenScene";
import {
  HOLE_CONFIG,
  INITIAL_SKELETON_KEY,
  INITIAL_SKELETON_NPC_NAME,
  SKELETON_INITIAL_ROOM_CONFIG,
} from "features/portal/halloween/HalloweenConstants";
import { SkeletonContainer } from "features/portal/halloween/containers/SkeletonContainer";
import { HoleContainer } from "features/portal/halloween/containers/HoleContainer";
import { LampContainer } from "features/portal/halloween/containers/LampContainer";

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
    this.createDecorationRandomly({ excludeSmallRoom: true });
    this.createSkeleton();
    this.createHole();
    this.createGate();
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

  private createHole() {
    const { x, y } = this.getRelativePosition(HOLE_CONFIG.x, HOLE_CONFIG.y);
    new HoleContainer({
      x,
      y,
      scene: this.scene,
      id: this.id,
      player: this.player,
    });

    const centerX = HOLE_CONFIG.x;
    const centerY = HOLE_CONFIG.y;
    const radius = 50;
    const numDecorations = 6;

    for (let i = 0; i < numDecorations; i++) {
      const angle = (i / numDecorations) * Phaser.Math.PI2 + 1.05;
      const posX = centerX + Math.cos(angle) * radius;
      const posY = centerY + Math.sin(angle) * radius;

      const { x, y } = this.getRelativePosition(posX, posY);
      new LampContainer({
        x,
        y,
        scene: this.scene,
        id: -2 - i,
        player: this.player,
      });
    }
  }
}
