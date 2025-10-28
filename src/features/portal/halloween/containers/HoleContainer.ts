import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { HalloweenScene } from "../HalloweenScene";
import { translate } from "lib/i18n/translate";
import { travelModalManager } from "../components/hud/HalloweenTravel";
import { TILE_SIZE } from "../HalloweenConstants";
import { MachineInterpreter } from "../lib/halloweenMachine";

interface Props {
  x: number;
  y: number;
  scene: HalloweenScene;
  id: number;
  isCentered?: boolean;
  maxScale?: number;
  player?: BumpkinContainer;
}

export class HoleContainer extends Phaser.GameObjects.Container {
  private id: number;
  private player?: BumpkinContainer;
  private spriteName: string;
  private sprite: Phaser.GameObjects.Sprite;
  private maxScale?: number;
  scene: HalloweenScene;

  constructor({
    x,
    y,
    scene,
    id,
    isCentered = false,
    maxScale = 1,
    player,
  }: Props) {
    super(scene, x, y);
    this.scene = scene;
    this.player = player;
    this.id = id;
    this.maxScale = maxScale;

    // Sprite
    this.spriteName = "hole";
    this.sprite = scene.add.sprite(0, 0, this.spriteName).setScale(0);

    // Animation
    this.createAnimation();

    // Overlaps
    this.createOverlaps(x, y);

    // Events
    this.createEvents();

    scene.physics.add.existing(this);
    (this.body as Phaser.Physics.Arcade.Body)
      .setSize(this.sprite.width * maxScale, this.sprite.height * maxScale)
      .setImmovable(true)
      .setCollideWorldBounds(true);

    this.setSize(this.sprite.width * maxScale, this.sprite.height * maxScale);
    this.add(this.sprite);

    if (isCentered) {
      this.sprite.setOrigin(0);
      (this.body as Phaser.Physics.Arcade.Body).setOffset(
        (this.sprite.width * maxScale) / 2,
        (this.sprite.height * maxScale) / 2,
      );
      this.setPosition(
        this.x + TILE_SIZE / 2 - (this.sprite.width * maxScale) / 2,
        this.y + TILE_SIZE / 2 - (this.sprite.height * maxScale) / 2,
      );
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
        end: 40,
      }),
      repeat: -1,
      frameRate: 10,
    });
    this.sprite.play(`${this.spriteName}_${this.id}_action`, true);

    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: this.maxScale,
      scaleY: this.maxScale,
      ease: "Back.Out",
      duration: 300,
    });
  }

  private createOverlaps(x: number, y: number) {
    if (!this.player) return;
    this.scene.physics.add.collider(this.player, this);
    this.scene.objectsWithCollider.push({ x, y });
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

      if (this.id === 8) {
        this.portalService?.send("SET_VALIDATIONS", {
          validation: "isHoleOpen",
        });
      }

      travelModalManager.open(true);
    });
  }
}
