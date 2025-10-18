import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { HalloweenScene } from "../HalloweenScene";
import { MachineInterpreter } from "../lib/halloweenMachine";
import {
  BASICROOM_X_GUIDE,
  ACTIVATE_FLAMETHROWER,
  BOSS_STATS,
  BOSS_ENEMY_SPAWN_Y_DISTANCE,
} from "../HalloweenConstants";
import { LifeBar } from "./LifeBar";
import { BaseRoom } from "../map/rooms/BaseRoom";
import { EventBus } from "../lib/EventBus";

interface Props {
  x: number;
  y: number;
  scene: HalloweenScene;
  player?: BumpkinContainer;
  room: BaseRoom;
}

export class BossContainer extends Phaser.GameObjects.Container {
  private player?: BumpkinContainer;
  scene: HalloweenScene;
  private spriteName: string;
  private overlapHandler?: Phaser.Physics.Arcade.Collider;
  private spriteBody: Phaser.GameObjects.Sprite;
  private spritePower!: Phaser.GameObjects.Sprite;
  private fireParticles:
    | Phaser.GameObjects.Particles.ParticleEmitter
    | undefined;
  private lifeBar: LifeBar;
  private room: BaseRoom;
  private xGuide: number;
  private isHurting = false;
  private posY: number;

  constructor({ x, y, scene, player, room }: Props) {
    super(scene, x, y - BOSS_ENEMY_SPAWN_Y_DISTANCE);
    this.scene = scene;
    this.player = player;
    this.room = room;
    this.posY = y;

    this.lifeBar = new LifeBar({
      x: 0,
      y: -50,
      scene: this.scene,
      width: 100,
      maxHealth: 10,
    });

    this.xGuide = room.getmapOffsetMultiplierX();

    this.spriteName = "dungeonBoss";
    this.spriteBody = this.scene.add
      .sprite(0, 0, `${this.spriteName}_walk`)
      .setDepth(1000000);

    scene.physics.add.existing(this);
    (this.body as Phaser.Physics.Arcade.Body)
      .setSize(this.spriteBody.width / 2, this.spriteBody.height / 3)
      .setOffset(0, 55)
      .setImmovable(true);

    this.setSize(this.spriteBody.width / 2, this.spriteBody.height / 2);
    this.setDepth(10000000);
    this.add([this.spriteBody, this.lifeBar]);

    this.createOverlaps();
    this.createEvents();
    this.spawn();

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
    animType: string,
    start: number,
    end: number,
    frameRate: number,
    repeat: number,
  ) {
    const animationKey = `${spriteName}_${animType}_anim`;

    if (!this.scene.anims.exists(animationKey)) {
      this.scene.anims.create({
        key: animationKey,
        frames: this.scene.anims.generateFrameNumbers(spriteName, {
          start,
          end,
        }),
        frameRate,
        repeat,
      });
    }
    sprite.play(animationKey, true);
  }

  private spawn() {
    this.createAnimation(
      this.spriteBody,
      `${this.spriteName}_walk`,
      "walk",
      0,
      7,
      10,
      -1,
    );

    this.scene.tweens.add({
      targets: this,
      y: this.posY,
      duration: 1000,
      ease: "Linear",
      onComplete: () => {
        this.scene.cameras.main.shake(400, 0.001);
        this.startMove();
      },
    });
  }

  private startMove() {
    if (!this.player) return;

    const xPositions = BASICROOM_X_GUIDE.map(
      (x) => x - ACTIVATE_FLAMETHROWER.position_1,
    );
    const targetX = xPositions[this.xGuide];

    this.scene.tweens.add({
      targets: this,
      x: targetX,
      duration: 1000,
      ease: "Linear",
      onComplete: () => {
        const ranNum = Math.floor(Math.random() * 2);
        if (ranNum === 0) {
          this.createAttack();
          this.scene.time.delayedCall(BOSS_STATS.attackRemove, () => {
            this.removeAttack();
            this.secondMove();
          });
        } else {
          this.secondMove();
        }
      },
    });
  }

  private secondMove() {
    const xPositions = BASICROOM_X_GUIDE;
    const targetX = xPositions[this.xGuide];

    this.scene.tweens.add({
      targets: this,
      x: targetX,
      alpha: 1,
      duration: 1000,
      ease: "Linear",
      onComplete: () => {
        const ranNum = Math.floor(Math.random() * 2);
        if (ranNum === 0) {
          this.createAttack();

          this.scene.time.delayedCall(BOSS_STATS.attackRemove, () => {
            this.removeAttack();
            this.thirdMove();
          });
        } else {
          this.thirdMove();
        }
      },
    });
  }

  private thirdMove() {
    const xPositions = BASICROOM_X_GUIDE.map(
      (x) => x - ACTIVATE_FLAMETHROWER.position_2,
    );
    const targetX = xPositions[this.xGuide];

    this.scene.tweens.add({
      targets: this,
      x: targetX,
      alpha: 1,
      duration: 1000,
      ease: "Linear",
      onComplete: () => {
        const ranNum = Math.floor(Math.random() * 2);
        if (ranNum === 0) {
          this.createAttack();

          this.scene.time.delayedCall(BOSS_STATS.attackRemove, () => {
            this.removeAttack();
            this.endMove();
          });
        } else {
          this.endMove();
        }
      },
    });
  }

  private endMove() {
    const xPositions = BASICROOM_X_GUIDE.map(
      (x) => x - ACTIVATE_FLAMETHROWER.position_3,
    );
    const targetX = xPositions[this.xGuide];

    this.scene.tweens.add({
      targets: this,
      x: targetX,
      alpha: 1,
      duration: 1000,
      ease: "Linear",
      onComplete: () => this.startMove(),
    });
  }

  private createAttack() {
    this.createAnimation(
      this.spriteBody,
      `${this.spriteName}_attack`,
      "attack",
      0,
      7,
      10,
      -1,
    );
    this.createFire();
    this.createDamage();
    this.scene.physics.world.enable(this.spritePower);
  }

  private removeAttack() {
    if (this.spritePower) {
      this.createAnimation(
        this.spriteBody,
        `${this.spriteName}_walk`,
        "walk",
        0,
        7,
        10,
        -1,
      );
      this.spritePower.setVisible(false);
      this.scene.physics.world.disable(this.spritePower);
    }
  }

  private createFire() {
    this.spritePower = this.scene.add
      .sprite(
        this.spriteBody.x - 18,
        this.spriteBody.y + 50,
        `${this.spriteName}_fire`,
      )
      .setOrigin(0, 0)
      .setDepth(1000000000)
      .setScale(1.2);
    this.createAnimation(
      this.spritePower,
      `${this.spriteName}_fire`,
      "fire",
      0,
      8,
      20,
      -1,
    );

    this.add(this.spritePower);

    this.scene.physics.add.existing(this.spritePower);
    const body = this.spritePower.body as Phaser.Physics.Arcade.Body;
    body.setSize(this.spritePower.width, this.spritePower.height);
    body.setOffset(this.spriteBody.x, this.spriteBody.y);
    body.enable = false;
  }

  private createDamage() {
    if (!this.player || !this.spritePower) return;
    let hasDealtDamage = false;

    this.scene.physics.add.overlap(
      this.player,
      this.spritePower,
      () => {
        if (!hasDealtDamage) {
          hasDealtDamage = true;
          // console.log("-1 Health");
          // TODO: Actually subtract health from player here
        }
      },
      undefined,
      this,
    );
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
        this.lifeBar.currentHealth - this.lifeBar.maxHealth / BOSS_STATS.health;
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

    this.createAnimation(
      this.spriteBody,
      `${this.spriteName}_defeat`,
      "defeat",
      0,
      7,
      10,
      0,
    );

    this.spriteBody.on("animationcomplete", () => {
      this.destroy();
      // this.openPortal()
    });
  }

  // private openPortal() {}
}
