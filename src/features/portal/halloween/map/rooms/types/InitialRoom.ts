import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { BaseRoom } from "../BaseRoom";
import { basicRoom } from "../RoomTileMap";
import { BaseScene } from "features/world/scenes/BaseScene";

interface Props {
  scene: BaseScene;
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

  createObjects() {}
}
