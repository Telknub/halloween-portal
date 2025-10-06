import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { BaseScene } from "features/world/scenes/BaseScene";

interface Props {
  x: number;
  y: number;
  scene: BaseScene;
  player?: BumpkinContainer;
}

export class BlacksmithContainer extends Phaser.GameObjects.Container {
  private player?: BumpkinContainer;
  private spriteName: string;
  private sprite: Phaser.GameObjects.Sprite;

  constructor({ x, y, scene, player }: Props) {
    super(scene, x, y);
    this.scene = scene;
    this.player = player;

    // Sprite
    this.spriteName = "blacksmith";
    this.sprite = scene.add.sprite(0, 0, this.spriteName);

    // Animation
    this.createAnimation();

    scene.physics.add.existing(this);
    this.setSize(this.sprite.width, this.sprite.height);
    this.add(this.sprite);

    scene.add.existing(this);
  }

  private createAnimation() {
    this.scene.anims.create({
      key: `${this.spriteName}_action`,
      frames: this.scene.anims.generateFrameNumbers(this.spriteName, {
        start: 0,
        end: 11,
      }),
      repeat: -1,
      frameRate: 10,
    });
    this.sprite.play(`${this.spriteName}_action`, true);
  }
}
