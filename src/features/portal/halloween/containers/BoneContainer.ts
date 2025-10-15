import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { MachineInterpreter } from "../lib/halloweenMachine";
import { HalloweenScene } from "../HalloweenScene";

interface Props {
  x: number;
  y: number;
  scene: HalloweenScene;
  player?: BumpkinContainer;
}

export class BoneContainer extends Phaser.GameObjects.Container {
  private player?: BumpkinContainer;
  private spriteName: string;
  private sprite: Phaser.GameObjects.Sprite;
  scene: HalloweenScene;

  constructor({ x, y, scene, player }: Props) {
    super(scene, x, y);
    this.scene = scene;
    this.player = player;

    // Sprite
    this.spriteName =
      scene.bones[Math.floor(Math.random() * scene.bones.length)];
    scene.bones = scene.bones.filter((bone) => bone !== this.spriteName);
    this.sprite = scene.add.sprite(0, 0, this.spriteName);

    // Overlaps
    this.createOverlaps();

    scene.physics.add.existing(this);
    (this.body as Phaser.Physics.Arcade.Body)
      .setSize(this.sprite.width, this.sprite.height)
      .setImmovable(true)
      .setCollideWorldBounds(true);

    this.setSize(this.sprite.width, this.sprite.height);
    this.add(this.sprite);

    scene.add.existing(this);
  }

  private get portalService() {
    return this.scene.registry.get("portalService") as
      | MachineInterpreter
      | undefined;
  }

  private createOverlaps() {
    if (!this.player) return;
    this.scene.physics.add.overlap(this.player, this, () => this.collect());
  }

  private collect() {
    this.portalService?.send("COLLECT_BONE", { boneName: this.spriteName });
    this.destroy();
  }
}
