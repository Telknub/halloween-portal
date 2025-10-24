import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { HalloweenScene } from "../HalloweenScene";
import { MachineInterpreter } from "../lib/halloweenMachine";
import {
  BASICROOM_X_GUIDE,
  ACTIVATE_FLAMETHROWER,
  BOSS_STATS,
  BOSS_ENEMY_SPAWN_Y_DISTANCE,
  Tools,
} from "../HalloweenConstants";
import { LifeBar } from "./LifeBar";
import { BaseRoom } from "../map/rooms/BaseRoom";
import { EventBus } from "../lib/EventBus";

interface Props {
  x: number;
  y: number;
  scene: HalloweenScene;
  defeat: (x: number, y: number) => void;
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
  private defeat: (x: number, y: number) => void;

  constructor({ x, y, scene, defeat, player, room }: Props) {
    super(scene, x, y - BOSS_ENEMY_SPAWN_Y_DISTANCE);
    this.scene = scene;
    this.player = player;
    this.room = room;
    this.posY = y;
    this.defeat = defeat;

    this.lifeBar = new LifeBar({
      x: 0,
      y: 70,
      scene: this.scene,
      width: 100,
      maxHealth: BOSS_STATS.health,
    });
    this.lifeBar.setDepth(1);

    this.xGuide = room.getmapOffsetMultiplierX();

    this.spriteName = "dungeonBoss";
    this.spriteBody = this.scene.add.sprite(0, 0, `${this.spriteName}_walk`);

    scene.physics.add.existing(this);
    (this.body as Phaser.Physics.Arcade.Body)
      .setSize(this.spriteBody.width / 2, this.spriteBody.height / 3)
      .setOffset(0, 55)
      .setImmovable(true);

    this.setSize(this.spriteBody.width / 2, this.spriteBody.height / 2);
    this.add([this.spriteBody, this.lifeBar]);

    this.createOverlaps();
    this.createEvents();
    this.spawn();
    this.scene.addToUpdate("boss", () => this.addBossUpdate());

    scene.add.existing(this);
  }

  public get portalService() {
    return this.scene.registry.get("portalService") as
      | MachineInterpreter
      | undefined;
  }

  private addSound(
    key: string,
    loop = false,
    volume = 0.2,
  ): Phaser.Sound.BaseSound {
    return this.scene.sound.add(key, { loop, volume });
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

  private addBossUpdate() {
    this.setDepth(Math.floor(this.y));
    this.spritePower?.setDepth?.(Math.floor(this.y));
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
        this.addSound("boss_spawn").play();
        this.scene.cameras.main.shake(400, 0.001);
        this.startMove();
      },
    });
  }

  private startMove() {
    if (!this.player) return;
    this.addSound("boss_walk").play();
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
          this.addSound("boss_walk").play();
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
          this.addSound("boss_walk").play();
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
      onComplete: () => {
        this.addSound("boss_walk").play();
        this.startMove();
      },
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
    this.createFlamethrower();
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

  private createFlamethrower() {
    this.spritePower = this.scene.add
      .sprite(
        this.spriteBody.x - 18,
        this.spriteBody.y + 50,
        `${this.spriteName}_fire`,
      )
      .setOrigin(0, 0)
      .setDepth(2)
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

  private flashSprite() {
    this.scene.tweens.add({
      targets: this.spriteBody,
      alpha: { from: 1, to: 0.5 },
      duration: 200,
      yoyo: true,
      repeat: 2,
      onStart: () => this.spriteBody.setTintFill(0xffffff),
      onYoyo: () => this.spriteBody.clearTint(),
      onComplete: () => this.spriteBody.clearTint(),
    });
  }

  private createDamage() {
    if (!this.player || !this.spritePower) return;
    let hasDealtDamage = false;
    this.addSound("flamethrower").play();

    this.scene.physics.add.overlap(
      this.player,
      this.spritePower,
      () => {
        if (!hasDealtDamage) {
          hasDealtDamage = true;
          this.player?.takeDamage("finalBoss");
        }
      },
      undefined,
      this,
    );

    // this.scene.physics.add.overlap(
    //   this.player,
    //   this,
    //   () => {
    //     if (this.player?.isHurting) return;
    //     this.player?.takeDamage("finalBoss");
    //   },
    //   undefined,
    //   this,
    // );
  }

  private createOverlaps() {
    if (!this.player) return;
    this.scene.physics.add.collider(this.player, this);
    this.scene.physics.add.overlap(this, this.player.sword, () =>
      this.hit("sword"),
    );
    this.scene.physics.add.overlap(this, this.player.pickaxe, () =>
      this.hit("pickaxe"),
    );
    this.scene.physics.add.overlap(this, this.player.fire, () =>
      this.hit("lamp"),
    );
  }

  private createEvents() {
    EventBus.on("animation-attack-completed", () => (this.isHurting = false));
    EventBus.on("animation-mining-completed", () => (this.isHurting = false));
    EventBus.on("animation-fire-completed", () => (this.isHurting = false));
  }

  private hit(tool: Tools) {
    if (!this.isHurting) {
      this.isHurting = true;

      const playerDamage = this.player?.getDamage(tool, "finalBoss") as number;

      const newHealth = this.lifeBar.currentHealth - playerDamage;

      if (newHealth > 0) {
        this.lifeBar.setHealth(newHealth);
        this.flashSprite();
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
      20,
      8,
      0,
    );

    this.scene.removeFromUpdate("boss");

    this.spriteBody.on("animationcomplete", () => {
      this.defeat(this.x, this.y);
      this.destroy();
    });
  }
}
