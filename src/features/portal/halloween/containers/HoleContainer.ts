import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { HalloweenScene } from "../HalloweenScene";
import { translate } from "lib/i18n/translate";
import { travelModalManager } from "../components/hud/HalloweenTravel";

interface Props {
  x: number;
  y: number;
  scene: HalloweenScene;
  id: number;
  player?: BumpkinContainer;
}

export class HoleContainer extends Phaser.GameObjects.Container {
  private id: number;
  private player?: BumpkinContainer;
  private spriteName: string;
  private sprite: Phaser.GameObjects.Sprite;
  scene: HalloweenScene;

  constructor({ x, y, scene, id, player }: Props) {
    super(scene, x, y);
    this.scene = scene;
    this.player = player;
    this.id = id;

    // Sprite
    this.spriteName = "hole";
    this.sprite = scene.add.sprite(0, 0, this.spriteName);

    // Animation
    this.createAnimation();

    // Overlaps
    this.createOverlaps();

    // Events
    this.createEvents();

    scene.physics.add.existing(this);
    (this.body as Phaser.Physics.Arcade.Body)
      .setSize(this.sprite.width, this.sprite.height)
      .setImmovable(true)
      .setCollideWorldBounds(true);

    this.setSize(this.sprite.width, this.sprite.height);
    this.add(this.sprite);

    scene.add.existing(this);
  }

  private createAnimation() {
    this.scene.anims.create({
      key: `${this.spriteName}_${this.id}_action`,
      frames: this.scene.anims.generateFrameNumbers(this.spriteName, {
        start: 0,
        end: 40,
      }),
      repeat: -1,
      frameRate: 10,
    });
    this.sprite.play(`${this.spriteName}_${this.id}_action`, true);
  }

  private createOverlaps() {
    if (!this.player) return;
    this.scene.physics.add.collider(this.player, this);
  }

  private createEvents() {
    this.sprite.setInteractive({ cursor: "pointer" }).on("pointerdown", () => {
      const distance = Phaser.Math.Distance.BetweenPoints(
        this.player as BumpkinContainer,
        this,
      );
      if (distance > 50) {
        this.player?.speak(translate("base.iam.far.away"));
        return;
      }

      travelModalManager.open(true);
    });
  }
}
