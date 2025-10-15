import { BaseScene } from "features/world/scenes/BaseScene";

interface Props {
  x: number;
  y: number;
  scene: BaseScene;
}

export class FireContainer extends Phaser.GameObjects.Container {
  private spriteName!: string;
  private sprites: Phaser.GameObjects.Sprite[] = [];
  radius!: number;
  numFires!: number;

  constructor({ x, y, scene }: Props) {
    super(scene, x, y);
    this.scene = scene;

    // Sprite
    this.createSprites();

    scene.add.existing(this);
  }

  createSprites(radius = 15, numFires = 10) {
    this.remove(this.sprites);
    this.sprites = [];

    const centerX = 0;
    const centerY = 6;
    this.radius = radius;
    this.numFires = numFires;

    for (let i = 0; i < numFires; i++) {
      const angle = (i / numFires) * Phaser.Math.PI2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      this.spriteName = "fire";
      const fire = this.scene.add.sprite(x, y, this.spriteName);
      fire.setOrigin(0.5, 1);
      fire.setScale(0.8);
      this.createAnimation(fire, i);
      this.sprites.push(fire);
    }

    this.add(this.sprites);
    const bounds = this.getBounds();

    this.scene.physics.add.existing(this);
    (this.body as Phaser.Physics.Arcade.Body)
      .setSize(bounds.width, bounds.height)
      .setImmovable(true)
      .setCollideWorldBounds(true);
    this.setSize(bounds.width, bounds.height);
  }

  private createAnimation(sprite: Phaser.GameObjects.Sprite, id: number) {
    this.scene.anims.create({
      key: `${this.spriteName}_${id}_action`,
      frames: this.scene.anims.generateFrameNumbers(this.spriteName, {
        start: 0,
        end: 7,
      }),
      repeat: -1,
      frameRate: 10,
    });
    sprite.play(`${this.spriteName}_${id}_action`, true);
  }

  activate(callback: () => void) {
    this.sprites.forEach((sprite) => {
      this.scene.tweens.add({
        targets: sprite,
        scaleY: { from: 0, to: 0.8 },
        scaleX: { from: 0, to: 0.8 },
        ease: "Sine.easeInOut",
        duration: 500,
        yoyo: true,
        repeat: 0,
        onComplete: () => callback(),
      });
    });
  }
}
