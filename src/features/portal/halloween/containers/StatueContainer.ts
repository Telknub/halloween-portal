import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { BaseScene } from "features/world/scenes/BaseScene";
import { LifeBar } from "./LifeBar";

interface Props {
  x: number;
  y: number;
  id: number;
  scene: BaseScene;
  player?: BumpkinContainer;
}

export class StatueContainer extends Phaser.GameObjects.Container {
  private id: number;
  private player?: BumpkinContainer;
  private spriteName: string;
  private sprite: Phaser.GameObjects.Sprite;
  private lifeBar: LifeBar;
  scene: BaseScene;

  constructor({ x, y, id, scene, player }: Props) {
    super(scene, x, y);
    this.id = id;
    this.scene = scene;
    this.player = player;

    this.lifeBar = new LifeBar({
      x: 0,
      y: 12,
      scene: this.scene,
      width: 10,
      maxHealth: 10,
    });

    // Sprite
    const statues = ["statue1", "statue2", "statue3", "statue4"];
    this.spriteName = statues[Math.floor(Math.random() * statues.length)];
    this.sprite = scene.add.sprite(0, 0, this.spriteName);

    // Animation
    this.createAnimation();

    // Overlaps
    this.createOverlaps();

    scene.physics.add.existing(this);
    (this.body as Phaser.Physics.Arcade.Body)
      .setSize(this.sprite.width, this.sprite.height)
      .setOffset(-4, 0)
      .setImmovable(true)
      .setCollideWorldBounds(true);

    this.setSize(10, this.sprite.height);
    this.add([this.sprite, this.lifeBar]);

    scene.add.existing(this);
  }

  private createAnimation() {
    this.scene.anims.create({
      key: `${this.spriteName}_${this.id}_hit`,
      frames: this.scene.anims.generateFrameNumbers(`${this.spriteName}_hit`, {
        start: 0,
        end: 4,
      }),
      repeat: 0,
      frameRate: 10,
    });
    this.scene.anims.create({
      key: `${this.spriteName}_${this.id}_break`,
      frames: this.scene.anims.generateFrameNumbers(
        `${this.spriteName}_break`,
        {
          start: 0,
          end: 7,
        },
      ),
      repeat: 0,
      frameRate: 10,
    });
  }

  private createOverlaps() {
    if (!this.player) return;
    this.scene.physics.add.overlap(this, this.player, () => this.hit());
  }

  private hit() {
    if (this.lifeBar.currentHealth > 0) {
      const newHealth = this.lifeBar.currentHealth - this.lifeBar.maxHealth / 2;
      this.lifeBar.setHealth(newHealth);
      this.sprite.play(`${this.spriteName}_${this.id}_hit`, true);
    } else {
      this.break();
    }
  }

  private break() {
    this.sprite.play(`${this.spriteName}_${this.id}_break`, true);
    this.sprite?.once(
      Phaser.Animations.Events.ANIMATION_COMPLETE,
      (anim: Phaser.Animations.Animation) => {
        if (anim.key === `${this.spriteName}_${this.id}_break`) {
          this.destroy();
        }
      },
    );
  }
}
