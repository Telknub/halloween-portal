import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { BaseRoom } from "../BaseRoom";
import { createCenterRoom } from "../../Utils";
import { HalloweenScene } from "features/portal/halloween/HalloweenScene";
import {
  DECORATION_SKELETON_CONFIG,
  FINAL_SKELETON_NPC_NAME,
  SKELETON_FINAL_ROOM_CONFIG,
  TILE_SIZE,
} from "features/portal/halloween/HalloweenConstants";
import { SkeletonContainer } from "features/portal/halloween/containers/SkeletonContainer";
import { ROOM_INNER_HEIGHT, ROOM_INNER_WIDTH } from "../RoomTileMap";
import { DecorationContainer } from "features/portal/halloween/containers/DecorationContainer";

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

  createObjects(wallsGroup: Phaser.Physics.Arcade.StaticGroup) {
    super.createObjects(wallsGroup);
    this.createDecorationRandomly({ excludeSmallRoom: true });
    this.createStaticDecoration();
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
      npcName: FINAL_SKELETON_NPC_NAME,
      player: this.player,
    });
  }

  private createStaticDecoration() {
    const offset = 16;
    const centerX = (TILE_SIZE * ROOM_INNER_WIDTH) / 2 - offset;
    const centerY = (TILE_SIZE * ROOM_INNER_HEIGHT) / 2 - offset;
    const radius = 50;
    const numDecorations = 5;

    for (let i = 0; i < numDecorations; i++) {
      const angle = (i / numDecorations) * Phaser.Math.PI2 + 0.3;
      const posX = centerX + Math.cos(angle) * radius;
      const posY = centerY + Math.sin(angle) * radius;

      const { x, y } = this.getRelativePosition(posX, posY);
      new DecorationContainer({
        x,
        y,
        scene: this.scene,
        id: i,
        decorationConfig: DECORATION_SKELETON_CONFIG,
        player: this.player,
      });
    }
  }
}
