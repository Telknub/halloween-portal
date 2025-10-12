import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { BaseScene } from "features/world/scenes/BaseScene";
import { MachineInterpreter } from "../lib/halloweenMachine";
import {
  REMOVE_ATTACK,
  BASICROOM_X_GUIDE,
  ACTIVATE_FLAMETHROWER,
} from "../HalloweenConstants";
import { LifeBar } from "./LifeBar";
import { BaseRoom } from "../map/rooms/BaseRoom";

interface Props {
  x: number;
  y: number;
  scene: BaseScene;
  player?: BumpkinContainer;
  room: BaseRoom;
}

export class BossContainer extends Phaser.GameObjects.Container {
  private player?: BumpkinContainer;
  scene: BaseScene;
  private spriteName: string;
  private overlapHandler?: Phaser.Physics.Arcade.Collider;
  private spriteBody: Phaser.GameObjects.Sprite;
  private spritePower!: Phaser.GameObjects.Sprite;
  private spriteAttackBody!: Phaser.GameObjects.Sprite;
  private fireParticles:
    | Phaser.GameObjects.Particles.ParticleEmitter
    | undefined;
  private lifeBar: LifeBar;
  private room: BaseRoom;
  private xGuide: number;
  private spritesPositionX: number;

  constructor({ x, y, scene, player, room }: Props) {
    super(scene, x, y);
    this.scene = scene;
    this.player = player;
    this.room = room;

    this.lifeBar = new LifeBar({
      x: 0,
      y: -50,
      scene: this.scene,
      width: 100,
      maxHealth: 10,
    });

    this.xGuide = room.getmapOffsetMultiplierX();
    this.spritesPositionX = 30;

    this.spriteName = "dungeonBoss";
    this.spriteBody = this.scene.add
      .sprite(0, this.spritesPositionX, `${this.spriteName}_walk`)
      .setDepth(1000000);

    scene.physics.add.existing(this);
    (this.body as Phaser.Physics.Arcade.Body)
      .setSize(this.spriteBody.width / 2, this.spriteBody.height / 3)
      .setOffset(0, 80)
      .setImmovable(true);

    this.setSize(this.spriteBody.width / 2, this.spriteBody.height / 2);
    this.add([this.spriteBody, this.lifeBar]);

    this.createWalking();
    this.createOverlaps();

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

  private createWalking() {
    if (!this.player) return;
    this.createAnimation(this.spriteBody, `${this.spriteName}_walk`, 0, 8, -1);

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
          this.scene.time.delayedCall(REMOVE_ATTACK, () => {
            this.removeAttack();
            this.createWalking2();
          });
        } else {
          this.createWalking2();
        }
      },
    });
  }

  private createWalking2() {
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

          this.scene.time.delayedCall(REMOVE_ATTACK, () => {
            this.removeAttack();
            this.createWalking3();
          });
        } else {
          this.createWalking3();
        }
      },
    });
  }

  private createWalking3() {
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

          this.scene.time.delayedCall(REMOVE_ATTACK, () => {
            this.removeAttack();
            this.createWalking4();
          });
        } else {
          this.createWalking4();
        }
      },
    });
  }

  private createWalking4() {
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
      onComplete: () => this.createWalking(),
    });
  }

  private createAttack() {
    this.createAttackBody();
    this.createPower();
  }

  private removeAttack() {
    if (this.spriteAttackBody) {
      this.spriteAttackBody.setVisible(false);
    }

    if (this.spriteBody) {
      this.spriteBody.setVisible(true);
    }

    if (this.spritePower) {
      this.spritePower.setVisible(false);

      if (this.spritePower.body) {
        this.scene.physics.world.disable(this.spritePower);
      }
    }
  }

  private createAttackBody() {
    this.spriteBody.setVisible(false);
    this.spriteAttackBody = this.scene.add
      .sprite(0, this.spritesPositionX, `${this.spriteName}_attack`)
      .setDepth(1000000)
      .setScale(1);
    this.createAnimation(
      this.spriteAttackBody,
      `${this.spriteName}_attack`,
      0,
      8,
      -1,
    );

    this.add(this.spriteAttackBody);
  }

  private createPower() {
    this.spritePower = this.scene.add
      .sprite(0, 0, `${this.spriteName}_fire`)
      .setOrigin(0, 0)
      .setDepth(1000000000)
      .setScale(1.2)
      .setPosition(this.spriteBody.x - 20, this.spriteBody.y + 70);
    this.createAnimation(this.spritePower, `${this.spriteName}_fire`, 0, 8, -1);
    this.scene.physics.world.enable(this.spritePower);

    this.add(this.spritePower);
  }

  private createOverlaps() {
    if (!this.player) return;
    this.scene.physics.add.overlap(this, this.player, () => this.hit());
  }

  private hit() {
    if (this.lifeBar.currentHealth > 0) {
      const newHealth = this.lifeBar.currentHealth - this.lifeBar.maxHealth / 2;
      this.lifeBar.setHealth(newHealth);
    } else {
      this.createDefeat();
    }
  }

  private createDefeat() {
    this.scene.tweens.killTweensOf(this);

    if (this.overlapHandler) {
      this.scene.physics.world.removeCollider(this.overlapHandler);
      this.overlapHandler = undefined;
    }

    this.spriteAttackBody?.destroy();
    this.spritePower?.destroy();

    this.createAnimation(this.spriteBody, `${this.spriteName}_defeat`, 0, 7, 0);

    this.spriteBody.on("animationcomplete", () => {
      this.destroy();
      // e.g., openPortal(), this.room.onBossDefeated(), etc.
    });
  }
}
