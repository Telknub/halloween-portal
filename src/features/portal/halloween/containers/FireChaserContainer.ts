import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { MachineInterpreter } from "../lib/halloweenMachine";
import { HalloweenScene } from "../HalloweenScene";

interface Props {
  x: number;
  y: number;
  scene: HalloweenScene;
  wallsGroup?: Phaser.Physics.Arcade.StaticGroup;
  player?: BumpkinContainer;
}

export class FireChaserContainer extends Phaser.GameObjects.Container {
  private player?: BumpkinContainer;
  scene: HalloweenScene;
  private spriteName: string;
  private spriteBody: Phaser.GameObjects.Sprite;
  private fireGlow: Phaser.GameObjects.Sprite;
  private followEvent?: Phaser.Time.TimerEvent;
  private hasDealtDamage = false;
  private wallsGroup?: Phaser.Physics.Arcade.StaticGroup;
  private initialPosition: Phaser.Math.Vector2;
  private fireParticles:
    | Phaser.GameObjects.Particles.ParticleEmitter
    | undefined;

  private lastAttackTime = 0;
  private attackCooldown = 2000;

  constructor({ x, y, scene, wallsGroup, player }: Props) {
    super(scene, x, y);
    this.scene = scene;
    this.player = player;
    // this.wallsGroup = wallsGroup;

    this.spriteName = "fire";

    this.initialPosition = new Phaser.Math.Vector2(x, y);

    this.spriteBody = this.scene.add
      .sprite(0, 0, `${this.spriteName}`)
      .setScale(1);

    this.add(this.spriteBody);

    this.fireGlow = this.scene.add
      .sprite(x, y, `${this.spriteName}`)
      .setScale(1.2);

    this.createAnimation(this.fireGlow, this.spriteName, 0, 4, -1);

    // Create particle emitter for spriteBody
    this.createFireParticles();

    this.scene.physics.add.existing(this);
    (this.body as Phaser.Physics.Arcade.Body)
      .setSize(this.spriteBody.width, this.spriteBody.height)
      .setOffset(-5, -5);

    // Periodically check distance to player and follow/attack
    this.followEvent = this.scene.time.addEvent({
      delay: 10,
      loop: true,
      callback: () => this.checkAndFollowPlayer(),
    });

    this.setDepth(this.y);

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
    start: number,
    end: number,
    repeat: number,
  ) {
    const animationKey = `${spriteName}_anim`;

    if (!this.scene?.anims?.exists(animationKey)) {
      this.scene?.anims?.create({
        key: animationKey,
        frames: this.scene.anims.generateFrameNumbers(spriteName, {
          start,
          end,
        }),
        frameRate: 10,
        repeat,
      });
    }

    if (sprite && sprite?.anims?.getName() !== animationKey) {
      sprite?.play(animationKey, true);
    }
  }

  private createFireParticles() {
    this.fireParticles = this.scene.add.particles(0, 0, `${this.spriteName}`, {
      lifespan: 600,
      alpha: { start: 1, end: 0.5 },
      scale: { start: 1, end: 0.5 },
      speed: { min: 10, max: 90 },
      angle: { min: -90, max: -85 },
      frequency: 500,
      blendMode: "ADD",
      follow: this.spriteBody,
      emitting: true,
    });
    this.add(this.fireParticles);
  }

  private checkAndFollowPlayer() {
    if (!this.player) return;

    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      this.player.x,
      this.player.y,
    );

    const attackDistance = 30;
    const followDistance = 70;

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
    this.spriteBody.setVisible(true);

    const body = this.body as Phaser.Physics.Arcade.Body;

    const angle = Phaser.Math.Angle.Between(
      this.x,
      this.y,
      this.player.x,
      this.player.y,
    );

    const speed = 60;

    body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    this.createAnimation(this.spriteBody, `${this.spriteName}`, 0, 4, -1);
  }

  private attackPlayer() {
    const now = this.scene?.time.now;
    if (now - this.lastAttackTime < this.attackCooldown) {
      return;
    }

    this.lastAttackTime = now;
    this.hasDealtDamage = false;

    this.createDamage();
  }

  private createDamage() {
    if (!this.player) return;

    this.scene.physics.add.overlap(
      this.player,
      this,
      () => {
        if (this.hasDealtDamage) return;
        this.hasDealtDamage = true;
        this.player?.takeDamage("ghoul");
        this.stopMovement();
      },
      undefined,
      this,
    );
  }

  private stopMovement() {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    this.spriteBody.setVisible(false);
    this.setPosition(this.initialPosition.x, this.initialPosition.y);
  }
}
