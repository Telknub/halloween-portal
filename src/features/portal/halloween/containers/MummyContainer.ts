import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { BaseScene } from "features/world/scenes/BaseScene";
import { MachineInterpreter } from "../lib/halloweenMachine";
import { LifeBar } from "./LifeBar";
import { EventBus } from "../lib/EventBus";
import { MUMMY_STATS } from "../HalloweenConstants";

interface Props {
  x: number;
  y: number;
  scene: BaseScene;
  player?: BumpkinContainer;
}

export class MummyContainer extends Phaser.GameObjects.Container {
  private player?: BumpkinContainer;
  scene: BaseScene;
  private spriteName: string;
  private lifeBar: LifeBar;
  private spriteBody: Phaser.GameObjects.Sprite;
  private spriteDefeat!: Phaser.GameObjects.Sprite;
  private overlapHandler?: Phaser.Physics.Arcade.Collider;
  private followEvent?: Phaser.Time.TimerEvent;
  private isHurting = false;
  private nextActionTime = 0;
  private actionCooldown = 2000; // 2 seconds between decisions

  constructor({ x, y, scene, player }: Props) {
    super(scene, x, y);
    this.scene = scene;
    this.player = player;

    this.lifeBar = new LifeBar({
      x: 0,
      y: -30,
      scene: this.scene,
      width: 50,
      maxHealth: 10,
    });

    this.spriteName = "dungeonMummy";
    this.spriteBody = this.scene.add
      .sprite(0, 0, `${this.spriteName}_idle`)
      .setDepth(1000000);

    scene.physics.add.existing(this);
    (this.body as Phaser.Physics.Arcade.Body)
      .setSize(this.spriteBody.width / 2, this.spriteBody.height)
      .setOffset(16, 0)
      .setImmovable(true);

    this.setSize(this.spriteBody.width, this.spriteBody.height);
    this.add([this.spriteBody, this.lifeBar]);

    this.createOverlaps();
    this.createEvents();
    this.createDamage();

    // Periodically check distance to player and follow if close
    this.followEvent = this.scene.time.addEvent({
      delay: 10,
      loop: true,
      callback: () => this.checkAndFollowPlayer(),
    });

    scene.add.existing(this);
  }

  public get portalService() {
    return this.scene.registry.get("portalService") as
      | MachineInterpreter
      | undefined;
  }

  private createAnimation(
    sprite: Phaser.GameObjects.Sprite,
    spriteName: string,
    start: number,
    end: number,
    repeat: number,
  ) {
    this.scene.anims.create({
      key: `${spriteName}_anim`,
      frames: this.scene.anims.generateFrameNumbers(spriteName, {
        start,
        end,
      }),
      frameRate: 10,
      repeat,
    });
    sprite.play(`${spriteName}_anim`, true);
  }

  private attackPlayer() {
    if (this.spriteBody.anims.currentAnim?.key === `${this.spriteName}_attack`)
      return;

    this.createAnimation(
      this.spriteBody,
      `${this.spriteName}_attack`,
      0,
      4,
      -1,
    );
  }

  private createDamage() {
    if (!this.player) return;
    this.scene.physics.add.collider(this.player, this);
    // this.scene.physics.add.overlap(this, this.player, () => console.log("-1 Health"));
  }

  private checkAndFollowPlayer() {
    if (!this.player) return;

    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      this.player.x,
      this.player.y,
    );

    const attackDistance = 50;
    const followDistance = 200;

    if (distance < attackDistance) {
      this.scene.time.delayedCall(1000, () => {
        this.attackPlayer();
      });
    } else if (distance < followDistance) {
      this.followPlayer();
    }
  }

  private followPlayer() {
    if (!this.player) return;

    // Prevent stacking tweens
    if (this.scene.tweens.isTweening(this)) return;

    this.scene.tweens.add({
      targets: this,
      x: this.player.x,
      y: this.player.y,
      ease: "Linear",
      duration: 2000, // Adjust speed here
      onStart: () => {
        this.createAnimation(
          this.spriteBody,
          `${this.spriteName}_walk`,
          0,
          7,
          -1,
        );
      },
      onComplete: () => {
        this.createAnimation(
          this.spriteBody,
          `${this.spriteName}_idle`,
          0,
          8,
          -1,
        );
      },
    });
  }

  private createOverlaps() {
    if (!this.player) return;
    this.scene.physics.add.collider(this.player, this);
    this.scene.physics.add.overlap(this, this.player.pickaxe, () => this.hit());
  }

  private createEvents() {
    EventBus.on("animation-mining-completed", () => {
      this.isHurting = false;
    });
  }

  private hit() {
    if (!this.isHurting) {
      this.isHurting = true;
      const newHealth =
        this.lifeBar.currentHealth -
        this.lifeBar.maxHealth / MUMMY_STATS.health;
      if (newHealth > 0) {
        this.lifeBar.setHealth(newHealth);
      } else {
        this.createDefeat();
      }
    }
  }

  private createDefeat() {
    this.scene.tweens.killTweensOf(this);

    if (this.overlapHandler) {
      this.scene.physics.world.removeCollider(this.overlapHandler);
      this.overlapHandler = undefined;
    }

    // Remove the timer event
    if (this.followEvent) {
      this.followEvent.remove();
      this.followEvent = undefined;
    }

    this.createAnimation(this.spriteBody, `${this.spriteName}_defeat`, 0, 6, 0);

    this.spriteBody.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.destroy();
      // this.openPortal()
    });
  }

  // private openPortal() {}
}
