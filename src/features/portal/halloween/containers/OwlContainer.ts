import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { HalloweenScene } from "../HalloweenScene";
import { translate } from "lib/i18n/translate";
import { npcModalManager } from "features/world/ui/NPCModals";

interface Props {
  x: number;
  y: number;
  scene: HalloweenScene;
  id: number;
  player?: BumpkinContainer;
}

export class OwlContainer extends Phaser.GameObjects.Container {
  private player?: BumpkinContainer;
  private spriteName: string;
  private sprite: Phaser.GameObjects.Sprite;
  private alert: Phaser.GameObjects.Sprite;
  private id: number;
  scene: HalloweenScene;

  constructor({ x, y, scene, id, player }: Props) {
    super(scene, x, y);
    this.scene = scene;
    this.player = player;
    this.id = id;

    // Sprite
    this.spriteName = "owl";
    const scale = 0.7;
    this.sprite = scene.add.sprite(0, 0, this.spriteName).setScale(scale);
    this.alert = this.scene.add.sprite(-4, -31, "alert").setSize(4, 10);

    // Animation
    this.createAnimation();

    // Overlaps
    this.createOverlaps(x, y);

    // Events
    this.createEvents();

    scene.physics.add.existing(this);
    (this.body as Phaser.Physics.Arcade.Body)
      .setSize(this.sprite.width * scale, this.sprite.height * scale)
      .setImmovable(true)
      .setCollideWorldBounds(true);

    this.setSize(this.sprite.width * scale, this.sprite.height * scale);
    this.setDepth(this.y);
    this.add([this.sprite, this.alert]);

    scene.add.existing(this);
  }

  private createAnimation() {
    const animationKey = `${this.spriteName}_action`;
    if (!this.scene.anims.exists(animationKey)) {
      this.scene.anims.create({
        key: `${this.spriteName}_action`,
        frames: this.scene.anims.generateFrameNumbers(this.spriteName, {
          start: 0,
          end: 13,
        }),
        repeat: -1,
        frameRate: 10,
      });
    }
    this.sprite.play(`${this.spriteName}_action`, true);
  }

  private createOverlaps(x: number, y: number) {
    if (!this.player) return;
    this.scene.objectsWithCollider.push({ x, y });
    this.scene.physics.add.collider(this.player, this);
  }

  private createEvents() {
    const relicName =
      this.scene.relics[Math.floor(Math.random() * this.scene.relics.length)];
    this.scene.relics = this.scene.relics.filter(
      (relic) => relic !== relicName,
    );

    this.sprite.setInteractive({ cursor: "pointer" }).on("pointerdown", () => {
      const distance = Phaser.Math.Distance.BetweenPoints(
        this.player as BumpkinContainer,
        this,
      );
      if (distance > 50) {
        this.player?.speak(translate("base.iam.far.away"));
        return;
      }

      npcModalManager.open("owl", { relicName, npcName: `owl${this.id}` });

      if (this.alert?.active) {
        this.alert?.destroy();
      }
    });
  }
}
