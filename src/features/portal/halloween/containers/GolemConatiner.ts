import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { MachineInterpreter } from "../lib/halloweenMachine";
import { LifeBar } from "./LifeBar";
import { EventBus } from "../lib/EventBus";
import { Tools } from "../HalloweenConstants";
import { HalloweenScene } from "../HalloweenScene";

interface Props {
  x: number;
  y: number;
  scene: HalloweenScene;
  wallsLayer?: Phaser.Tilemaps.TilemapLayer;
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
  private wallsLayer?: Phaser.Tilemaps.TilemapLayer;

  private lastAttackTime = 0;
  private attackCooldown = 2000;
  private chanceToAttack = 2000;

  constructor({ x, y, scene, wallsLayer, defeat, player }: Props) {
    super(scene, x, y);
    this.scene = scene;
    this.player = player;
    this.defeat = defeat;
    this.wallsLayer = wallsLayer;

    this.spriteName = "dungeonGolem";

    this.lifeBar = new LifeBar({
      x: 0,
      y: -30,
      scene: this.scene,
      width: 50,
      maxHealth: 10,
    });

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

    // Overlap
    this.createOverlaps();
    // Event
    this.createEvents();

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

    const attackDistance = 50;
    const followDistance = 100;

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

    const speed = 50;

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
        .setDepth(1000000000)
        .setScale(1.5);

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
      body.setSize(this.spriteSmash.width, this.spriteSmash.height);
      body.setAllowGravity(false);
      body.setImmovable(true);
    }

    // Reactivate and play effect
    this.spriteSmash.setVisible(true);
    this.spriteSmash.play(`${this.spriteName}_smash_anim`, true);

    const body = this.spriteSmash.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.setOffset(this.spriteSmash.width - 60, this.spriteSmash.height / 6);
  }

  private disableSmash() {
    if (this.spriteSmash && this.spriteSmash.body) {
      const body = this.spriteSmash.body as Phaser.Physics.Arcade.Body;
      body.enable = false;
      this.spriteSmash.setVisible(false);
    }
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
  }

  private createOverlaps() {
    if (!this.player) return;
    this.scene.physics.add.collider(this.player, this);
    this.scene.physics.add.collider(
      this.wallsLayer as Phaser.Tilemaps.TilemapLayer,
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

    this.spriteBody.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.defeat(this.x, this.y);
      this.destroy();
    });
  }
}
