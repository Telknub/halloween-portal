import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { BaseRoom } from "../BaseRoom";
import { createCenterRoom, createSmallRoom2 } from "../../Utils";
import { HalloweenScene } from "features/portal/halloween/HalloweenScene";
import { OwlContainer } from "features/portal/halloween/containers/OwlContainer";
import { OWL_CONFIG } from "features/portal/halloween/HalloweenConstants";

interface Props {
  scene: HalloweenScene;
  hasEntry?: boolean;
  hasExit?: boolean;
  matrix?: number[][];
  player?: BumpkinContainer;
}

export class PuzzleRoom extends BaseRoom {
  constructor({ scene, hasEntry = true, hasExit = true, player }: Props) {
    const matrixCenterRoom = createCenterRoom();
    const matrix = createSmallRoom2(matrixCenterRoom);
    super({ scene, hasEntry, hasExit, matrix, type: "puzzle", player });
  }

  createObjects() {
    this.createDecorationRandomly({ excludeSmallRoom: true });
    this.createOwl();
    this.spawnObjectRandomly((x, y) => this.createStatues(x, y), true);
    this.spawnObjectRandomly((x, y) => this.createBones(x, y), true);
    this.id === 2 &&
      this.spawnObjectRandomly((x, y) => this.createLamp(x, y), true);
    this.id === 3 &&
      this.spawnObjectRandomly((x, y) => this.createPickaxe(x, y), true);
    this.spawnObjectRandomly((x, y) => this.createHole(x, y, 0.5, true), true);
    this.createGate();
  }

  private createOwl() {
    const { x, y } = this.getRelativePosition(OWL_CONFIG.x, OWL_CONFIG.y);
    new OwlContainer({
      x,
      y,
      scene: this.scene,
      player: this.player,
    });
  }
}
