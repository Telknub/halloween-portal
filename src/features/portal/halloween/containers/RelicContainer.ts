import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { HalloweenScene } from "../HalloweenScene";
import { MachineInterpreter } from "../lib/halloweenMachine";
import { Relics } from "../HalloweenConstants";
import { interactableModalManager } from "features/world/ui/InteractableModals";

interface Props {
  x: number;
  y: number;
  scene: HalloweenScene;
  player?: BumpkinContainer;
}

export class RelicContainer extends Phaser.GameObjects.Container {
  private player?: BumpkinContainer;
  private spriteName: string;
  private sprite: Phaser.GameObjects.Sprite;
  scene: HalloweenScene;

  constructor({ x, y, scene, player }: Props) {
    super(scene, x, y);
    this.scene = scene;
    this.player = player;

    // Sprite
    this.spriteName =
      scene.relics[Math.floor(Math.random() * scene.relics.length)];
    scene.relics = scene.relics.filter((relic) => relic !== this.spriteName);
    this.sprite = scene.add.sprite(0, 0, this.spriteName).setScale(0.7);

    // Overlaps
    this.createOverlaps();

    scene.physics.add.existing(this);
    (this.body as Phaser.Physics.Arcade.Body)
      .setSize(this.sprite.width, this.sprite.height)
      .setImmovable(true)
      .setCollideWorldBounds(true);

    this.setSize(this.sprite.width, this.sprite.height);
    this.add(this.sprite);

    scene.add.existing(this);
  }

  private get portalService() {
    return this.scene.registry.get("portalService") as
      | MachineInterpreter
      | undefined;
  }

  private createOverlaps() {
    if (!this.player) return;
    this.scene.physics.add.overlap(this.player, this, () => this.collect());
  }

  private collect() {
    this.portalService?.send("GAIN_POINTS");
    this.scene.applyRelicBuff(this.spriteName as Relics);
    interactableModalManager.open("relic", { relicName: this.spriteName });
    this.destroy();
  }
}
