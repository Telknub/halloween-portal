import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { BaseScene } from "features/world/scenes/BaseScene";
import { LifeBar } from "./LifeBar";
import { onAnimationComplete } from "../lib/HalloweenUtils";
import { EventBus } from "../lib/EventBus";

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
  private isHurting = false;
  scene: BaseScene;

  constructor({ x, y, id, scene, player }: Props) {
    super(scene, x, y);
    this.id = id;
    this.scene = scene;
    this.player = player;

    // Sprite
    const statues = ["statue1", "statue2", "statue3", "statue4"];
    this.spriteName = statues[Math.floor(Math.random() * statues.length)];
    this.sprite = scene.add.sprite(0, 0, this.spriteName);

    // Animation
    this.createAnimation();

    // Overlaps
    this.createOverlaps();

    // Events
    this.createEvents();

    this.lifeBar = new LifeBar({
      x: 0,
      y: 12,
      scene: this.scene,
      width: 10,
      maxHealth: 10,
    });

    scene.physics.add.existing(this);
    (this.body as Phaser.Physics.Arcade.Body)
      .setSize(this.sprite.width, this.sprite.height)
      .setImmovable(true)
      .setCollideWorldBounds(true);

    this.setSize(this.sprite.width, this.sprite.height);
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
    this.scene.physics.add.collider(this.player, this);
    this.scene.physics.add.overlap(this.player.pickaxe, this, () =>
      this.hurt(),
    );
  }

  private createEvents() {
    EventBus.on("animation-mining-completed", () => {
      this.isHurting = false;
    });
  }

  private hurt() {
    if (!this.isHurting) {
      this.isHurting = true;
      const newHealth = this.lifeBar.currentHealth - this.lifeBar.maxHealth / 2;
      if (newHealth > 0) {
        this.lifeBar.setHealth(newHealth);
        this.sprite.play(`${this.spriteName}_${this.id}_hit`, true);
      } else {
        this.break();
      }
    }
  }

  private break() {
    const animationKey = `${this.spriteName}_${this.id}_break`;
    this.sprite.play(animationKey, true);
    onAnimationComplete(this.sprite, animationKey, () => this.destroy());
  }
}
