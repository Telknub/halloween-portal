import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { HalloweenScene } from "../HalloweenScene";
import {
  DECORATION_BORDER_CONFIG,
  DECORATION_GROUND_CONFIG,
  TILE_SIZE,
  Decoration,
} from "../HalloweenConstants";

interface Props {
  x: number;
  y: number;
  scene: HalloweenScene;
  id?: number;
  tile?: number;
  decorationConfig?: Decoration[];
  player?: BumpkinContainer;
}

export class DecorationContainer extends Phaser.GameObjects.Container {
  private id: number;
  private player?: BumpkinContainer;
  private spriteName: string;
  private sprite: Phaser.GameObjects.Sprite;
  scene: HalloweenScene;

  constructor({ x, y, scene, id, tile, decorationConfig, player }: Props) {
    super(scene, x, y);
    this.scene = scene;
    this.player = player;
    this.id = id ?? 0;

    // Sprite
    const decorations = tile
      ? DECORATION_BORDER_CONFIG[tile]
      : decorationConfig ?? DECORATION_GROUND_CONFIG;
    const decoration =
      decorations[Math.floor(Math.random() * decorations.length)];
    const scale = decoration?.scale ?? 1;
    const posX = x + (decoration?.offsetX ?? 0);
    const posY = y + (decoration?.offsetY ?? 0);
    this.spriteName = decoration.name;
    this.sprite = scene.add
      .sprite(0, 0, this.spriteName)
      .setOrigin(0)
      .setScale(scale);

    // Animations
    if (decoration.hasAnimation) this.createAnimations();

    // Overlaps
    this.createOverlaps(x, y);

    scene.physics.add.existing(this);
    (this.body as Phaser.Physics.Arcade.Body)
      .setSize(this.sprite.width * scale, this.sprite.height * scale)
      .setOffset(
        this.sprite.width * (scale / 2),
        this.sprite.height * (scale / 2),
      )
      .setImmovable(true)
      .setCollideWorldBounds(true);

    this.setSize(this.sprite.width * scale, this.sprite.height * scale);
    this.setDepth(y);
    this.setPosition(posX, posY);
    this.add(this.sprite);

    if (!tile) {
      (this.body as Phaser.Physics.Arcade.Body).setOffset(
        this.sprite.width / 2,
        this.sprite.height / 2,
      );
      this.setPosition(
        this.x + TILE_SIZE / 2 - this.sprite.width / 2,
        this.y + TILE_SIZE / 2 - this.sprite.height / 2,
      );
    }

    scene.add.existing(this);
  }

  private createAnimations() {
    this.scene.anims.create({
      key: `${this.spriteName}_${this.id}_action`,
      frames: this.scene.anims.generateFrameNumbers(this.spriteName, {
        start: 0,
        end: 7,
      }),
      repeat: -1,
      frameRate: 10,
    });
    this.sprite.play(`${this.spriteName}_${this.id}_action`, true);
  }

  private createOverlaps(x: number, y: number) {
    if (!this.player) return;
    this.scene.physics.add.collider(this.player, this);
    this.scene.objectsWithCollider.push({ x, y });
  }
}
