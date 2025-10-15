import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { HalloweenScene } from "../HalloweenScene";
import { MachineInterpreter } from "../lib/halloweenMachine";
import { npcModalManager } from "features/world/ui/NPCModals";
import { translate } from "lib/i18n/translate";
import {
  FINAL_SKELETON_NPC_NAME,
  HalloweenNpcNames,
} from "../HalloweenConstants";

interface Props {
  x: number;
  y: number;
  scene: HalloweenScene;
  id: number;
  direction: string;
  flowCompleteKey: string;
  npcName: HalloweenNpcNames;
  player?: BumpkinContainer;
}

export class SkeletonContainer extends Phaser.GameObjects.Container {
  private id: number;
  private npcName: HalloweenNpcNames;
  private player?: BumpkinContainer;
  private spriteName: string;
  private sprite: Phaser.GameObjects.Sprite;
  private alert: Phaser.GameObjects.Sprite;
  scene: HalloweenScene;

  constructor({
    x,
    y,
    scene,
    id,
    direction,
    flowCompleteKey,
    npcName,
    player,
  }: Props) {
    super(scene, x, y);
    this.scene = scene;
    this.id = id;
    this.npcName = npcName;
    this.player = player;
    localStorage.setItem(flowCompleteKey, "false");

    // Sprite
    this.spriteName = "skeleton";
    this.sprite = scene.add
      .sprite(0, 0, this.spriteName)
      .setFlipX(direction === "left");
    this.alert = this.scene.add.sprite(0, -16, "alert").setSize(4, 10);

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
    this.add([this.sprite, this.alert]);

    scene.add.existing(this);
  }

  private createAnimation() {
    const animationKey = `${this.spriteName}_${this.id}_action`;
    this.scene.anims.create({
      key: animationKey,
      frames: this.scene.anims.generateFrameNumbers(this.spriteName, {
        start: 0,
        end: 8,
      }),
      repeat: -1,
      frameRate: 10,
    });
    this.sprite.play(animationKey, true);
  }

  private createOverlaps() {
    if (!this.player) return;
    this.scene.physics.add.collider(this.player, this);
  }

  private createEvents() {
    let relicName = "";
    if (this.npcName === FINAL_SKELETON_NPC_NAME) {
      relicName =
        this.scene.relics[Math.floor(Math.random() * this.scene.relics.length)];
      this.scene.relics = this.scene.relics.filter(
        (relic) => relic !== relicName,
      );
    }

    this.sprite.setInteractive({ cursor: "pointer" }).on("pointerdown", () => {
      const distance = Phaser.Math.Distance.BetweenPoints(
        this.player as BumpkinContainer,
        this,
      );
      if (distance > 50) {
        this.player?.speak(translate("base.iam.far.away"));
        return;
      }

      npcModalManager.open(this.npcName, { relicName });

      if (this.alert?.active) {
        this.alert?.destroy();
      }
    });
  }
}
