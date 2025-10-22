import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { MachineInterpreter } from "../lib/halloweenMachine";
import { TILE_SIZE } from "../HalloweenConstants";
import { HalloweenScene } from "../HalloweenScene";

interface Props {
  x: number;
  y: number;
  id: number;
  scene: HalloweenScene;
  player?: BumpkinContainer;
}

export class LampContainer extends Phaser.GameObjects.Container {
  private id: number;
  private player?: BumpkinContainer;
  private spriteName: string;
  private sprite: Phaser.GameObjects.Sprite;
  scene: HalloweenScene;

  constructor({ x, y, id, scene, player }: Props) {
    super(scene, x, y);
    this.scene = scene;
    this.id = id;
    this.player = player;

    // Sprite Lamp
    this.spriteName = "lamp";
    this.sprite = scene.add.sprite(0, 0, this.spriteName).setOrigin(0);

    // Animation
    this.createAnimation();

    if (id >= 0) {
      // Overlaps
      this.createOverlaps(x, y);

      scene.physics.add.existing(this);
      (this.body as Phaser.Physics.Arcade.Body)
        .setSize(this.sprite.width, this.sprite.height)
        .setOffset(this.sprite.width / 2, this.sprite.height / 2)
        .setImmovable(true)
        .setCollideWorldBounds(true);
    }

    this.setSize(this.sprite.width, this.sprite.height);
    this.setPosition(
      this.x + TILE_SIZE / 2 - this.sprite.width / 2,
      this.y + TILE_SIZE / 2 - this.sprite.height / 2,
    );
    this.add(this.sprite);

    if (this.id < 0) {
      this.sprite.setOrigin(0.5);
      this.setPosition(x, y);
    }

    scene.add.existing(this);
  }

  private get portalService() {
    return this.scene.registry.get("portalService") as
      | MachineInterpreter
      | undefined;
  }

  private createAnimation() {
    this.scene.anims.create({
      key: `${this.spriteName}_${this.id}_action`,
      frames: this.scene.anims.generateFrameNumbers(this.spriteName, {
        start: 0,
        end: 3,
      }),
      repeat: -1,
      frameRate: 10,
    });
    this.sprite.play(`${this.spriteName}_${this.id}_action`, true);
  }

  private createOverlaps(x: number, y: number) {
    if (!this.player) return;
    this.scene.objectsWithCollider.push({ x, y });
    this.scene.physics.add.overlap(this.player, this, () => this.collect());
  }

  private collect() {
    this.portalService?.send("COLLECT_TOOL", { tool: "lamp" });
    this.player?.lampVisibility(true);
    this.destroy();
  }
}
