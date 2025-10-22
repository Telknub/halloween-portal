import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { HalloweenScene } from "../HalloweenScene";
import { MachineInterpreter } from "../lib/halloweenMachine";
import { Relics, TILE_SIZE } from "../HalloweenConstants";
import { interactableModalManager } from "features/world/ui/InteractableModals";

interface Props {
  x: number;
  y: number;
  scene: HalloweenScene;
  isCentered?: boolean;
  player?: BumpkinContainer;
}

export class RelicContainer extends Phaser.GameObjects.Container {
  private player?: BumpkinContainer;
  private spriteName: string;
  private sprite: Phaser.GameObjects.Sprite;
  scene: HalloweenScene;

  constructor({ x, y, scene, isCentered = false, player }: Props) {
    super(scene, x, y);
    this.scene = scene;
    this.player = player;

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
      .setSize(this.sprite.width * scale, this.sprite.height * scale)
      .setImmovable(true)
      .setCollideWorldBounds(true);

    this.setSize(this.sprite.width * scale, this.sprite.height * scale);
    this.add(this.sprite);

    if (isCentered) {
      this.sprite.setOrigin(0);
      (this.body as Phaser.Physics.Arcade.Body).setOffset(
        (this.sprite.width * scale) / 2,
        (this.sprite.height * scale) / 2,
      );
      this.setPosition(
        this.x + TILE_SIZE / 2 - (this.sprite.width * scale) / 2,
        this.y + TILE_SIZE / 2 - (this.sprite.height * scale) / 2,
      );
    }

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
    this.portalService?.send("GAIN_POINTS");
    this.scene?.applyRelicBuff(this.spriteName as Relics);
    interactableModalManager?.open("relic", { relicName: this.spriteName });
    this.destroy();
  }
}
