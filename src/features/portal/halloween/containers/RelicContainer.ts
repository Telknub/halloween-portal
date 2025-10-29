import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { HalloweenScene } from "../HalloweenScene";
import { MachineInterpreter } from "../lib/halloweenMachine";
import { Relics, TILE_SIZE } from "../HalloweenConstants";
import { interactableModalManager } from "features/world/ui/InteractableModals";

interface Props {
  x: number;
  y: number;
  scene: HalloweenScene;
  id?: number;
  isCentered?: boolean;
  player?: BumpkinContainer;
}

export class RelicContainer extends Phaser.GameObjects.Container {
  private player?: BumpkinContainer;
  private spriteName: string;
  private sprite: Phaser.GameObjects.Sprite;
  private id: number;
  scene: HalloweenScene;

  constructor({ x, y, scene, id = 0, isCentered = false, player }: Props) {
    super(scene, x, y);
    this.scene = scene;
    this.player = player;
    this.id = id;

    // Sprite
    this.spriteName =
      scene.relics[Math.floor(Math.random() * scene.relics.length)];
    scene.relics = scene.relics.filter((relic) => relic !== this.spriteName);
    const scale = 0.7;
    this.sprite = scene.add.sprite(0, 0, this.spriteName).setScale(scale);

    // Overlaps
    this.createOverlaps(x, y);

    scene.physics.add.existing(this);
    (this.body as Phaser.Physics.Arcade.Body)
      .setSize(this.sprite.width + 18, this.sprite.height + 18)
      .setOffset(
        -(this.sprite.width * (2 - scale)) / 2,
        -(this.sprite.height * (2 - scale)) / 2,
      )
      .setImmovable(true)
      .setCollideWorldBounds(true);

    this.setSize(this.sprite.width * scale, this.sprite.height * scale);
    this.add(this.sprite);

    if (isCentered) {
      this.sprite.setOrigin(0);
      (this.body as Phaser.Physics.Arcade.Body)
        .setOffset(
          (this.sprite.width * scale) / 2,
          (this.sprite.height * scale) / 2,
        )
        .setSize(this.sprite.width * scale, this.sprite.height * scale);
      this.setPosition(
        this.x + TILE_SIZE / 2 - (this.sprite.width * scale) / 2,
        this.y + TILE_SIZE / 2 - (this.sprite.height * scale) / 2,
      );
    }

    this.setDepth(this.y);

    scene.add.existing(this);
  }

  private get portalService() {
    return this.scene.registry.get("portalService") as
      | MachineInterpreter
      | undefined;
  }

  private createOverlaps(x: number, y: number) {
    if (!this.player) return;
    this.scene.objectsWithCollider.push({ x, y });
    this.scene.physics.add.overlap(this.player, this, () => this.collect());
  }

  private collect() {
    this.scene.sound.add("collect", { loop: false, volume: 0.2 }).play();
    this.portalService?.send("GAIN_POINTS");
    this.scene?.applyRelicBuff(this.spriteName as Relics);
    interactableModalManager?.open("relic", { relicName: this.spriteName });

    if (this.id === 8) {
      this.portalService?.send("SET_VALIDATIONS", {
        validation: "isRelicCollect",
      });
    }

    (this.body as Phaser.Physics.Arcade.Body).setEnable(false);
    this.scene.time.delayedCall(200, () => this.destroy());
  }
}
