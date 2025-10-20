import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { HalloweenScene } from "../HalloweenScene";
import { EventBus } from "../lib/EventBus";
import { onAnimationComplete } from "../lib/HalloweenUtils";
import { MachineInterpreter } from "../lib/halloweenMachine";
import { ROOM_ID_REQUIRED_RELICS, RoomType } from "../HalloweenConstants";
import { npcModalManager } from "features/world/ui/NPCModals";

interface Props {
  x: number;
  y: number;
  scene: HalloweenScene;
  id: number;
  direction: string;
  roomName?: RoomType;
  player?: BumpkinContainer;
}

export class GateContainer extends Phaser.GameObjects.Container {
  private id: number;
  private roomName?: RoomType;
  private player?: BumpkinContainer;
  private spriteName: string;
  private sprite: Phaser.GameObjects.Sprite;
  scene: HalloweenScene;

  constructor({ x, y, scene, id, direction, roomName, player }: Props) {
    super(scene, x, y);
    this.scene = scene;
    this.id = id;
    this.roomName = roomName;
    this.player = player;

    // Sprite
    this.spriteName = `gate_${direction}`;
    if (id === 8) this.spriteName = "red_" + this.spriteName;
    this.sprite = scene.add.sprite(0, 0, `${this.spriteName}_close`);

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
    this.setScale(0.665);
    this.add(this.sprite);

    scene.add.existing(this);
  }

  private get portalService() {
    return this.scene.registry.get("portalService") as
      | MachineInterpreter
      | undefined;
  }

  private createAnimation() {
    const roomNameOrId = this.roomName || this.id;
    this.scene.anims.create({
      key: `${this.spriteName}_${roomNameOrId}_open_action`,
      frames: this.scene.anims.generateFrameNumbers(
        `${this.spriteName}_open_animation`,
        {
          start: 0,
          end: 8,
        },
      ),
      repeat: 0,
      frameRate: 10,
    });
    this.scene.anims.create({
      key: `${this.spriteName}_${roomNameOrId}_close_action`,
      frames: this.scene.anims.generateFrameNumbers(
        `${this.spriteName}_close_animation`,
        {
          start: 0,
          end: 8,
        },
      ),
      repeat: 0,
      frameRate: 10,
    });
  }

  private createOverlaps() {
    if (!this.player) return;
    this.scene.physics.add.collider(this.player, this);
    this.scene.physics.add.overlap(this.player.fire, this, () => {
      const amountRelics = this.portalService?.state.context.score;
      const roomNameOrId = this.roomName || this.id;
      const requiredRelics = ROOM_ID_REQUIRED_RELICS[roomNameOrId];
      if (amountRelics === requiredRelics) {
        this.open();
        this.player?.healWithGate();
      } else {
        npcModalManager.open("player", {
          requiredRelics,
          bumpkinParts: this.player?.clothing,
        });
      }
    });
  }

  private createEvents() {
    EventBus.on("open-gate", () => this.id === 1 && this.open());
  }

  private open() {
    const roomNameOrId = this.roomName || this.id;
    const animationKey = `${this.spriteName}_${roomNameOrId}_open_action`;
    this.sprite.play(animationKey, true);
    onAnimationComplete(this.sprite, animationKey, () =>
      this.sprite.setTexture(`${this.spriteName}_open`),
    );
    (this.body as Phaser.Physics.Arcade.Body).setEnable(false);
    EventBus.emit("create-enemies", { id: this.id });
  }

  close() {
    const roomNameOrId = this.roomName || this.id;
    const animationKey = `${this.spriteName}_${roomNameOrId}_close_action`;
    this.sprite.play(animationKey, true);
    onAnimationComplete(this.sprite, animationKey, () =>
      this.sprite.setTexture(`${this.spriteName}_close`),
    );
    (this.body as Phaser.Physics.Arcade.Body).setEnable(true);
  }
}
