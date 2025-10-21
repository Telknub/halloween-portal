import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { MachineInterpreter } from "../lib/halloweenMachine";
import { LifeBar } from "./LifeBar";
import { EventBus } from "../lib/EventBus";
import { Enemies, ENEMY_STATS, Tools } from "../HalloweenConstants";
import { HalloweenScene } from "../HalloweenScene";

interface Props {
  x: number;
  y: number;
  scene: HalloweenScene;
  id: number;
  wallsLayer?: Phaser.Tilemaps.TilemapLayer;
  defeat: (id: number) => void;
  player?: BumpkinContainer;
}

export class EnemyContainer extends Phaser.GameObjects.Container {
  private player?: BumpkinContainer;
  scene: HalloweenScene;
  private spriteName: string;
  private wallsLayer?: Phaser.Tilemaps.TilemapLayer;
  private lifeBar: LifeBar;
  public spriteBody: Phaser.GameObjects.Sprite;
  private spriteAttack!: Phaser.GameObjects.Sprite;
  private overlapHandler?: Phaser.Physics.Arcade.Collider;
  private followEvent?: Phaser.Time.TimerEvent;
  private isHurting = false;
  private hasDealtDamage = false;
  private id: number;
  private defeat: (id: number) => void;

  private lastAttackTime = 0;
  private attackCooldown = 2000; // milliseconds

  constructor({ x, y, scene, id, wallsLayer, defeat, player }: Props) {
    super(scene, x, y);
    this.scene = scene;
    this.player = player;
    this.id = id;
    this.defeat = defeat;
    this.wallsLayer = wallsLayer;

    const enemyType = ["ghoul", "ghost"];
    const ranNum = Math.floor(Math.random() * enemyType.length);

    this.spriteName = enemyType[ranNum];

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
      .setSize(this.spriteBody.width, this.spriteBody.height)
      .setOffset(0, 0)
      .setImmovable(true);

    this.setSize(this.spriteBody.width, this.spriteBody.height);
    this.add([this.spriteBody, this.lifeBar]);

    this.createOverlaps();
    this.createEvents();
    this.attackBody();

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
    const animationKey = `${spriteName}_${animType}_${this.id}_anim`;

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
  }

  private checkAndFollowPlayer() {
    if (!this.player) return;

    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      this.player.x,
      this.player.y,
    );

    const attackDistance = 20;
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
    this.spriteAttack.setVisible(false);
    this.spriteBody.setVisible(true);

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

    this.createAnimation(
      this.spriteBody,
      `${this.spriteName}_walk`,
      "walk",
      0,
      7,
      -1,
    );
  }

  private attackBody() {
    this.spriteAttack = this.scene.add
      .sprite(0, 0, `${this.spriteName}_attack`)
      .setDepth(1000000000)
      .setScale(1)
      .setVisible(false);

    this.add(this.spriteAttack);

    this.scene.physics.add.existing(this.spriteAttack);
    const body = this.spriteAttack.body as Phaser.Physics.Arcade.Body;
    body.setSize(this.spriteBody.width / 2, this.spriteBody.height / 2);
    body.setOffset(9, 9);
    body.setVelocity(0, 0);
    body.enable = false;
  }

  private attackPlayer() {
    const now = this.scene.time.now;
    if (now - this.lastAttackTime < this.attackCooldown) {
      return;
    }

    this.spriteBody.setVisible(false);
    this.spriteAttack.setVisible(true);
    this.lastAttackTime = now;
    this.hasDealtDamage = false;

    this.createAnimation(
      this.spriteAttack,
      `${this.spriteName}_attack`,
      "attack",
      0,
      7,
      -1,
    );

    const body = this.spriteAttack.body as Phaser.Physics.Arcade.Body;
    body.enable = true;

    this.createDamage();
  }

  private stopMovement() {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);

    this.spriteAttack.setVisible(false);
    this.spriteBody.setVisible(true);
    this.createAnimation(
      this.spriteBody,
      `${this.spriteName}_idle`,
      "idle",
      0,
      8,
      -1,
    );
  }

  private createDamage() {
    if (!this.player) return;

    this.scene.physics.add.overlap(
      this.player,
      this.spriteAttack,
      () => {
        if (this.hasDealtDamage) return;
        this.hasDealtDamage = true;
        this.player?.takeDamage(this.spriteName as Enemies);
      },
      undefined,
      this,
    );
  }

  private createOverlaps() {
    if (!this.player) return;
    this.scene.physics.add.collider(this.player, this.spriteBody);
    if (this.spriteName === "ghoul") {
      this.scene.physics.add.collider(
        this.wallsLayer as Phaser.Tilemaps.TilemapLayer,
        this,
      );
    }
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

      const playerDamage = this.player?.getDamage(
        tool,
        this.spriteName as Enemies,
      ) as number;

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
      this.defeat(this.id);
      this.destroy();
    });
  }
}
