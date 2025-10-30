import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { MachineInterpreter } from "../lib/halloweenMachine";
import { LifeBar } from "./LifeBar";
import { EventBus } from "../lib/EventBus";
import { GOLEM_STATS, Tools } from "../HalloweenConstants";
import { HalloweenScene } from "../HalloweenScene";

interface Props {
  x: number;
  y: number;
  scene: HalloweenScene;
  wallsGroup?: Phaser.Physics.Arcade.StaticGroup;
  defeat: (x: number, y: number) => void;
  player?: BumpkinContainer;
}

export class GolemContainer extends Phaser.GameObjects.Container {
  private player?: BumpkinContainer;
  scene: HalloweenScene;
  private spriteName: string;
  private lifeBar: LifeBar;
  private spriteBody: Phaser.GameObjects.Sprite;
  private overlapHandler?: Phaser.Physics.Arcade.Collider;
  private followEvent?: Phaser.Time.TimerEvent;
  private isHurting = false;
  private spriteSmash!: Phaser.GameObjects.Sprite;
  private hasDealtDamage = false;
  private defeat: (x: number, y: number) => void;
  private wallsGroup?: Phaser.Physics.Arcade.StaticGroup;

  private lastAttackTime = 0;
  private attackCooldown = 2500;
  private chanceToAttack = 2000;

  constructor({ x, y, scene, wallsGroup, defeat, player }: Props) {
    super(scene, x, y);
    this.scene = scene;
    this.player = player;
    this.defeat = defeat;
    this.wallsGroup = wallsGroup;

    this.spriteName = "dungeonGolem";

    this.lifeBar = new LifeBar({
      x: 0,
      y: -30,
      scene: this.scene,
      width: 50,
      maxHealth: GOLEM_STATS.health,
    });

    this.spriteBody = this.scene.add
      .sprite(0, 0, `${this.spriteName}_idle`)
      .setScale(0.7);

    scene.physics.add.existing(this);
    (this.body as Phaser.Physics.Arcade.Body)
      .setSize(this.spriteBody.width / 2, this.spriteBody.height / 3)
      .setOffset(16, 16);

    this.setSize(this.spriteBody.width, this.spriteBody.height);
    this.add([this.spriteBody, this.lifeBar]);

    // Overlap
    this.createOverlaps();
    // Event
    this.createEvents();

    this.scene.addToUpdate("golem", () => this.addGolemUpdate());
    this.addSound("golem").play();

    // Periodically check distance to player and follow/attack
    this.followEvent = this.scene.time.addEvent({
      delay: 100,
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

  private addGolemUpdate() {
    this.setDepth(Math.floor(this.y));
    this.spriteSmash?.setDepth?.(Math.floor(this.y));
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
        frameRate: 10,
        repeat,
      });
    }

    if (sprite.anims.getName() !== animationKey) {
      sprite.play(animationKey, true);
    }

    return animationKey;
  }

  private checkAndFollowPlayer() {
    if (!this.player) return;

    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      this.player.x,
      this.player.y,
    );

    const attackDistance = 35;
    const followDistance = 200;

    if (distance < attackDistance) {
      this.attackPlayer();
    } else if (distance < followDistance) {
      this.followPlayer();
    } else {
      this.stopMovement();
    }
  }

  private followPlayer() {
    if (!this.player) return;

    const body = this.body as Phaser.Physics.Arcade.Body;

    const angle = Phaser.Math.Angle.Between(
      this.x,
      this.y,
      this.player.x,
      this.player.y,
    );

    const speed = 40;

    if (body.velocity.x > 0) this.spriteBody.setFlipX(false);
    else if (body.velocity.x < 0) this.spriteBody.setFlipX(true);

    this.scene.physics.velocityFromRotation(angle, speed, body.velocity);

    this.disableSmash();

    this.createAnimation(
      this.spriteBody,
      `${this.spriteName}_walk`,
      "walk",
      0,
      7,
      -1,
    );
  }

  private attackPlayer() {
    const now = this.scene.time.now;
    if (now - this.lastAttackTime < this.attackCooldown) {
      return;
    }

    this.addSound("smash").play();

    this.createAnimation(
      this.spriteBody,
      `${this.spriteName}_attack`,
      "attack",
      0,
      4,
      -1,
    );

    this.lastAttackTime = now;
    this.hasDealtDamage = false;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);

    this.createSmash();
    this.createDamage();
  }

  private stopMovement() {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);

    this.createAnimation(
      this.spriteBody,
      `${this.spriteName}_idle`,
      "idle",
      0,
      8,
      -1,
    );
  }

  private createSmash() {
    if (!this.spriteSmash) {
      this.hasDealtDamage = false;

      this.spriteSmash = this.scene.add
        .sprite(0, 10, `${this.spriteName}_smash`)
        .setScale(1.4);

      this.add(this.spriteSmash);

      this.scene.anims.create({
        key: `${this.spriteName}_smash_anim`,
        frames: this.scene.anims.generateFrameNumbers(
          `${this.spriteName}_smash`,
          {
            start: 0,
            end: 3,
          },
        ),
        frameRate: 10,
        repeat: 0,
      });

      this.spriteSmash.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        this.disableSmash();
      });

      this.scene.physics.world.enable(this.spriteSmash);

      const body = this.spriteSmash.body as Phaser.Physics.Arcade.Body;
      body.setSize(this.spriteSmash.width, this.spriteSmash.height / 2);
      body.setAllowGravity(false);
      body.setImmovable(true);
    }

    // Reactivate and play effect
    this.spriteSmash.setVisible(true);
    this.spriteSmash.play(`${this.spriteName}_smash_anim`, true);

    const body = this.spriteSmash.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.setOffset(this.spriteSmash.width - 65, this.spriteSmash.height / 2);
  }

  private disableSmash() {
    if (this.spriteSmash && this.spriteSmash.body) {
      const body = this.spriteSmash.body as Phaser.Physics.Arcade.Body;
      body.enable = false;
      this.spriteSmash.setVisible(false);
    }
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
    if (!this.player || !this.spriteSmash || this.hasDealtDamage) return;

    this.scene.physics.add.overlap(
      this.player,
      this.spriteSmash,
      () => {
        if (this.hasDealtDamage) return;
        this.hasDealtDamage = true;
        this.player?.takeDamage("golem");
      },
      undefined,
      this,
    );

    this.scene.physics.add.overlap(
      this.player,
      this,
      () => {
        if (this.player?.isHurting) return;
        this.player?.takeDamage("golem");
      },
      undefined,
      this,
    );
  }

  private createOverlaps() {
    if (!this.player) return;
    this.scene.physics.add.collider(
      this.wallsGroup as Phaser.Physics.Arcade.StaticGroup,
      this,
    );
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

      const playerDamage = this.player?.getDamage(tool, "golem") as number;

      const newHealth = this.lifeBar.currentHealth - playerDamage;

      this.flashSprite();
      if (newHealth > 0) {
        this.lifeBar.setHealth(newHealth);
      } else {
        this.createDefeat();
      }
    }
  }

  private createDefeat() {
    this.scene.tweens.killTweensOf(this);
    this.addSound("death").play();

    if (this.overlapHandler) {
      this.scene.physics.world.removeCollider(this.overlapHandler);
      this.overlapHandler = undefined;
    }

    if (this.followEvent) {
      this.followEvent.remove();
      this.followEvent = undefined;
    }

    this.createAnimation(
      this.spriteBody,
      `${this.spriteName}_defeat`,
      "defeat",
      0,
      6,
      0,
    );

    this.scene.removeFromUpdate("golem");

    this.spriteBody.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.defeat(this.x, this.y);

      (this.body as Phaser.Physics.Arcade.Body).setEnable(false);
      this.scene.time.delayedCall(300, () => this.destroy());
    });
  }
}
