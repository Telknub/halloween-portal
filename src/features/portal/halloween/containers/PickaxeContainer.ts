import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { HalloweenScene } from "../HalloweenScene";
import { MachineInterpreter } from "../lib/halloweenMachine";
import { TILE_SIZE } from "../HalloweenConstants";

interface Props {
  x: number;
  y: number;
  scene: HalloweenScene;
  player?: BumpkinContainer;
}

export class PickaxeContainer extends Phaser.GameObjects.Container {
  private player?: BumpkinContainer;
  private spriteName: string;
  private sprite: Phaser.GameObjects.Sprite;
  scene: HalloweenScene;

  constructor({ x, y, scene, player }: Props) {
    super(scene, x, y);
    this.scene = scene;
    this.player = player;

    // Sprite
    this.spriteName = "pickaxe";
    this.sprite = scene.add.sprite(0, 0, this.spriteName).setOrigin(0);

    // Overlaps
    this.createOverlaps(x, y);

    scene.physics.add.existing(this);
    (this.body as Phaser.Physics.Arcade.Body)
      .setSize(this.sprite.width, this.sprite.height)
      .setOffset(this.sprite.width / 2, this.sprite.height / 2)
      .setImmovable(true)
      .setCollideWorldBounds(true);

    this.setSize(this.sprite.width, this.sprite.height);
    this.setPosition(
      this.x + TILE_SIZE / 2 - this.sprite.width / 2,
      this.y + TILE_SIZE / 2 - this.sprite.height / 2,
    );
    this.setDepth(this.y);
    this.add(this.sprite);

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
    this.portalService?.send("COLLECT_TOOL", { tool: "pickaxe" });
    this.player?.lampVisibility(false);
    this.destroy();
  }
}
