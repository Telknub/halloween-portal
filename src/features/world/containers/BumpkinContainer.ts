import { SQUARE_WIDTH } from "features/game/lib/constants";
import { SpeechBubble } from "./SpeechBubble";
import { buildNPCSheets } from "features/bumpkins/actions/buildNPCSheets";
import { tokenUriBuilder } from "lib/utils/tokenUriBuilder";
import { Label } from "./Label";
import debounce from "lodash.debounce";
import { Player } from "../types/Room";
import { NPCName, acknowledgedNPCs } from "lib/npcs";
import { ReactionName } from "features/pumpkinPlaza/components/Reactions";
import { getAnimationUrl } from "../lib/animations";
import { FactionName, InventoryItemName } from "features/game/types/game";
import { ITEM_DETAILS } from "features/game/types/images";
import { ITEM_IDS } from "features/game/types/bumpkin";
import { CONFIG } from "lib/config";
import { formatNumber } from "lib/utils/formatNumber";
import { LampContainer } from "features/portal/halloween/containers/LampContainer";
import {
  Enemies,
  ITEM_BUMPKIN,
  PLAYER_DAMAGE,
  Tools,
} from "features/portal/halloween/HalloweenConstants";
import { BaseScene } from "../scenes/BaseScene";
import { onAnimationComplete } from "features/portal/halloween/lib/HalloweenUtils";
import { EventBus } from "features/portal/halloween/lib/EventBus";
import { FireContainer } from "features/portal/halloween/containers/FireContainer";

const NAME_ALIASES: Partial<Record<NPCName, string>> = {
  "pumpkin' pete": "pete",
  "hammerin harry": "auctioneer",
};
export const NPCS_WITH_ALERTS: Partial<Record<NPCName, boolean>> = {
  "pumpkin' pete": true,
  hank: true,
  santa: true,
};

export class BumpkinContainer extends Phaser.GameObjects.Container {
  public sprite: Phaser.GameObjects.Sprite | undefined;
  public shadow: Phaser.GameObjects.Sprite | undefined;
  public alert: Phaser.GameObjects.Sprite | undefined;
  public silhouette: Phaser.GameObjects.Sprite | undefined;
  public skull: Phaser.GameObjects.Sprite | undefined;

  public speech: SpeechBubble | undefined;
  public reaction: Phaser.GameObjects.Group;
  public invincible = false;

  public icon: Phaser.GameObjects.Sprite | undefined;
  public fx: Phaser.GameObjects.Sprite | undefined;
  public label: Label | undefined;
  public backfx: Phaser.GameObjects.Sprite | undefined;
  public frontfx: Phaser.GameObjects.Sprite | undefined;

  public clothing: Player["clothing"];
  public faction: FactionName | undefined;
  private ready = false;

  // Animation Keys
  private idleSpriteKey: string | undefined;
  private walkingSpriteKey: string | undefined;
  private idleAnimationKey: string | undefined;
  private walkingAnimationKey: string | undefined;
  private digAnimationKey: string | undefined;
  private drillAnimationKey: string | undefined;
  private backAuraKey: string | undefined;
  private frontAuraKey: string | undefined;
  private frontAuraAnimationKey: string | undefined;
  private backAuraAnimationKey: string | undefined;
  private direction: "left" | "right" = "right";

  // Halloween
  private carryingSpriteKey: string | undefined;
  private carryingIdleSpriteKey: string | undefined;
  private deathSpriteKey: string | undefined;
  private attackSpriteKey: string | undefined;
  private miningSpriteKey: string | undefined;
  private hurtSpriteKey: string | undefined;
  private carryingAnimationKey: string | undefined;
  private carryingIdleAnimationKey: string | undefined;
  private deathAnimationKey: string | undefined;
  private attackAnimationKey: string | undefined;
  private miningAnimationKey: string | undefined;
  private hurtAnimationKey: string | undefined;
  private damage = PLAYER_DAMAGE;
  private doubleDamageChange = 0;
  private frameRateAttack!: number;
  isHurting = false;
  isAttacking = false;
  isMining = false;
  isBurning = false;
  lamp!: LampContainer;
  fire!: FireContainer;
  pickaxe!: Phaser.GameObjects.Zone;
  sword!: Phaser.GameObjects.Zone;

  constructor({
    scene,
    x,
    y,
    clothing,
    onClick,
    name,
    direction,
    faction,
  }: {
    scene: Phaser.Scene;
    x: number;
    y: number;
    clothing: Player["clothing"];
    onClick?: () => void;
    onCollide?: () => void;
    name?: string;
    direction?: "left" | "right";
    faction?: FactionName;
  }) {
    super(scene, x, y);
    this.scene = scene;
    this.clothing = clothing;
    this.direction = direction ?? "right";
    scene.physics.add.existing(this);

    this.silhouette = scene.add.sprite(0, 0, "silhouette");
    this.add(this.silhouette);
    this.sprite = this.silhouette;

    this.shadow = this.scene.add
      .sprite(0.5, 8, "shadow")
      .setSize(SQUARE_WIDTH, SQUARE_WIDTH);
    this.add(this.shadow).moveTo(this.shadow, 0);

    this.loadSprites(scene);

    // Halloween
    this.createSword();
    this.createPickaxe();
    this.createFire();
    this.createLamp();

    this.setSize(SQUARE_WIDTH, SQUARE_WIDTH + 15);

    this.reaction = this.scene.add.group();

    this.faction = faction;

    if (name) {
      const text = NAME_ALIASES[name as NPCName] ?? name;
      const label = new Label(this.scene, text.toUpperCase());
      this.add(label);
      label.setPosition(label.width / 2, -16);
      if (
        !!NPCS_WITH_ALERTS[name as NPCName] &&
        !acknowledgedNPCs()[name as NPCName] &&
        this.scene.textures.exists("alert")
      ) {
        this.alert = this.scene.add.sprite(1, -23, "alert").setSize(4, 10);
        this.add(this.alert);
      }

      this.label = label;
    }

    this.scene.add.existing(this);

    if (onClick) {
      this.setInteractive({ cursor: "pointer" }).on(
        "pointerdown",
        (p: Phaser.Input.Pointer) => {
          if (p.downElement.nodeName === "CANVAS") {
            onClick();

            if (name && this.alert?.active) {
              this.alert?.destroy();
            }
          }
        },
      );
    }

    if (clothing.shirt === "Gift Giver") {
      this.showGift();
    }
    this.showAura();
  }

  public teleport(x: number, y: number) {
    this.setPosition(x, y);
  }

  get directionFacing() {
    return this.direction;
  }

  private async loadSprites(scene: Phaser.Scene) {
    const keyName = tokenUriBuilder(this.clothing);
    this.idleSpriteKey = `${keyName}-bumpkin-idle-sheet`;
    this.walkingSpriteKey = `${keyName}-bumpkin-walking-sheet`;
    this.idleAnimationKey = `${keyName}-bumpkin-idle`;
    this.walkingAnimationKey = `${keyName}-bumpkin-walking`;
    this.digAnimationKey = `${keyName}-bumpkin-dig`;
    this.drillAnimationKey = `${keyName}-bumpkin-drilling`;

    // Halloween
    this.carryingSpriteKey = `${keyName}-bumpkin-carrying-sheet`;
    this.carryingIdleSpriteKey = `${keyName}-bumpkin-carrying-idle-sheet`;
    this.deathSpriteKey = `${keyName}-bumpkin-death-sheet`;
    this.attackSpriteKey = `${keyName}-bumpkin-attack-sheet`;
    this.miningSpriteKey = `${keyName}-bumpkin-mining-sheet`;
    this.hurtSpriteKey = `${keyName}-bumpkin-hurt-sheet`;
    this.carryingAnimationKey = `${keyName}-bumpkin-carrying`;
    this.carryingIdleAnimationKey = `${keyName}-bumpkin-carrying-idle`;
    this.deathAnimationKey = `${keyName}-bumpkin-death`;
    this.attackAnimationKey = `${keyName}-bumpkin-attack`;
    this.miningAnimationKey = `${keyName}-bumpkin-mining`;
    this.hurtAnimationKey = `${keyName}-bumpkin-hurt`;

    await buildNPCSheets({
      parts: this.clothing,
    }); //Removing this causes Aura to not show onload

    if (scene.textures.exists(this.idleSpriteKey)) {
      // If we have idle sheet then we can create the idle animation and set the sprite up straight away
      const idle = scene.add.sprite(0, 0, this.idleSpriteKey).setOrigin(0.5);
      this.add(idle);
      if (this.clothing.aura !== undefined) {
        this.moveTo(idle, 2);
      } else if (this.clothing.aura === undefined && this.shadow?.active) {
        this.moveTo(idle, 1);
      }
      this.sprite = idle;

      if (this.direction === "left") {
        this.faceLeft();
      }

      this.sprite.play(this.idleAnimationKey, true);

      if (this.silhouette?.active) {
        this.silhouette?.destroy();
      }

      this.ready = true;
    } else {
      const url = getAnimationUrl(this.clothing, "idle");
      const idleLoader = scene.load.spritesheet(this.idleSpriteKey, url, {
        frameWidth: 96,
        frameHeight: 64,
      });

      idleLoader.once(Phaser.Loader.Events.COMPLETE, () => {
        if (
          !scene.textures.exists(this.idleSpriteKey as string) ||
          this.ready
        ) {
          return;
        }

        const idle = scene.add
          .sprite(0, 0, this.idleSpriteKey as string)
          .setOrigin(0.5);
        this.add(idle);
        if (this.clothing.aura !== undefined) {
          this.moveTo(idle, 2);
        } else if (this.clothing.aura === undefined && this.shadow?.active) {
          this.moveTo(idle, 1);
        }

        this.sprite = idle;

        if (this.direction === "left") {
          this.faceLeft();
        }

        this.createIdleAnimation();
        this.sprite.play(this.idleAnimationKey as string, true);

        this.ready = true;
        if (this.silhouette?.active) {
          this.silhouette?.destroy();
        }

        idleLoader.removeAllListeners();
      });
    }

    if (scene.textures.exists(this.walkingSpriteKey)) {
      this.createWalkingAnimation();
    } else {
      const url = getAnimationUrl(this.clothing, "walking");
      const walkingLoader = scene.load.spritesheet(this.walkingSpriteKey, url, {
        frameWidth: 96,
        frameHeight: 64,
      });

      walkingLoader.on(Phaser.Loader.Events.COMPLETE, () => {
        this.createWalkingAnimation();
        walkingLoader.removeAllListeners();
      });
    }

    // If the texture already exists, we can use it immediately
    if (scene.textures.exists(this.digAnimationKey)) {
      this.createDigAnimation();
    } else {
      const url = getAnimationUrl(this.clothing, "dig");
      const digLoader = scene.load.spritesheet(this.digAnimationKey, url, {
        frameWidth: 96,
        frameHeight: 64,
      });

      digLoader.once(Phaser.Loader.Events.COMPLETE, () => {
        this.createDigAnimation();
        digLoader.removeAllListeners();
      });
    }

    if (scene.textures.exists(this.drillAnimationKey)) {
      this.createDrillAnimation();
    } else {
      const url = getAnimationUrl(this.clothing, "drilling");
      const drillLoader = scene.load.spritesheet(this.drillAnimationKey, url, {
        frameWidth: 96,
        frameHeight: 64,
      });

      drillLoader.once(Phaser.Loader.Events.COMPLETE, () => {
        this.createDrillAnimation();
        drillLoader.removeAllListeners();
      });
    }

    // Halloween
    // Carry
    if (scene.textures.exists(this.carryingSpriteKey)) {
      this.createCarryingAnimation();
    } else {
      const url = getAnimationUrl(this.clothing, "carry_none");
      const carryingLoader = scene.load.spritesheet(
        this.carryingSpriteKey,
        url,
        {
          frameWidth: 96,
          frameHeight: 64,
        },
      );

      carryingLoader.on(Phaser.Loader.Events.COMPLETE, () => {
        this.createCarryingAnimation();
        carryingLoader.removeAllListeners();
      });
    }

    // Carry idle
    if (scene.textures.exists(this.carryingIdleSpriteKey)) {
      this.createCarryingIdleAnimation();
    } else {
      const url = getAnimationUrl(this.clothing, "carry_none_idle");
      const carryingIdleLoader = scene.load.spritesheet(
        this.carryingIdleSpriteKey,
        url,
        {
          frameWidth: 96,
          frameHeight: 64,
        },
      );

      carryingIdleLoader.on(Phaser.Loader.Events.COMPLETE, () => {
        this.createCarryingIdleAnimation();
        carryingIdleLoader.removeAllListeners();
      });
    }

    // Death
    if (scene.textures.exists(this.deathSpriteKey)) {
      this.createDeathAnimation();
    } else {
      const url = getAnimationUrl(this.clothing, "death");
      const deathLoader = scene.load.spritesheet(this.deathSpriteKey, url, {
        frameWidth: 96,
        frameHeight: 64,
      });

      deathLoader.on(Phaser.Loader.Events.COMPLETE, () => {
        this.createDeathAnimation();
        deathLoader.removeAllListeners();
      });
    }

    // Attack
    if (scene.textures.exists(this.attackSpriteKey)) {
      this.createAttackAnimation();
    } else {
      const url = getAnimationUrl(this.clothing, "attack");
      const attackLoader = scene.load.spritesheet(this.attackSpriteKey, url, {
        frameWidth: 96,
        frameHeight: 64,
      });

      attackLoader.on(Phaser.Loader.Events.COMPLETE, () => {
        this.createAttackAnimation();
        attackLoader.removeAllListeners();
      });
    }

    // Mining
    if (scene.textures.exists(this.miningSpriteKey)) {
      this.createMiningAnimation();
    } else {
      const url = getAnimationUrl(this.clothing, "mining");
      const miningLoader = scene.load.spritesheet(this.miningSpriteKey, url, {
        frameWidth: 96,
        frameHeight: 64,
      });

      miningLoader.on(Phaser.Loader.Events.COMPLETE, () => {
        this.createMiningAnimation();
        miningLoader.removeAllListeners();
      });
    }

    // Hurt
    if (scene.textures.exists(this.hurtSpriteKey)) {
      this.createHurtAnimation();
    } else {
      const url = getAnimationUrl(this.clothing, "hurt");
      const hurtLoader = scene.load.spritesheet(this.hurtSpriteKey, url, {
        frameWidth: 96,
        frameHeight: 64,
      });

      hurtLoader.on(Phaser.Loader.Events.COMPLETE, () => {
        this.createHurtAnimation();
        hurtLoader.removeAllListeners();
      });
    }

    scene.load.start();
  }

  private createDrillAnimation() {
    if (!this.scene || !this.scene.anims) return;

    this.scene.anims.create({
      key: this.drillAnimationKey,
      frames: this.scene.anims.generateFrameNumbers(
        this.drillAnimationKey as string,
      ),
      frameRate: 10,
      repeat: -1,
    });
  }

  private createDigAnimation() {
    if (!this.scene || !this.scene.anims) return;

    this.scene.anims.create({
      key: this.digAnimationKey,
      frames: this.scene.anims.generateFrameNumbers(
        this.digAnimationKey as string,
      ),
      frameRate: 10,
      repeat: -1,
    });
  }

  private createIdleAnimation() {
    if (!this.scene || !this.scene.anims) return;

    this.scene.anims.create({
      key: this.idleAnimationKey,
      frames: this.scene.anims.generateFrameNumbers(
        this.idleSpriteKey as string,
        {
          start: 0,
          end: 8,
        },
      ),
      repeat: -1,
      frameRate: 10,
    });
  }

  private createFrontAuraAnimation() {
    if (!this.scene || !this.scene.anims) return;

    this.scene.anims.create({
      key: this.frontAuraAnimationKey,
      frames: this.scene.anims.generateFrameNumbers(
        this.frontAuraKey as string,
        {
          start: 0,
          end: 7,
        },
      ),
      repeat: -1,
      frameRate: 10,
    });
  }

  private createBackAuraAnimation() {
    if (!this.scene || !this.scene.anims) return;

    this.scene.anims.create({
      key: this.backAuraAnimationKey,
      frames: this.scene.anims.generateFrameNumbers(
        this.backAuraKey as string,
        {
          start: 0,
          end: 7,
        },
      ),
      repeat: -1,
      frameRate: 10,
    });
  }

  private createWalkingAnimation() {
    if (!this.scene || !this.scene.anims) return;

    this.scene.anims.create({
      key: this.walkingAnimationKey,
      frames: this.scene.anims.generateFrameNumbers(
        this.walkingSpriteKey as string,
        {
          start: 0,
          end: 7,
        },
      ),
      repeat: -1,
      frameRate: 10,
    });
  }

  private createCarryingAnimation() {
    if (!this.scene || !this.scene.anims) return;

    this.scene.anims.create({
      key: this.carryingAnimationKey,
      frames: this.scene.anims.generateFrameNumbers(
        this.carryingSpriteKey as string,
        {
          start: 0,
          end: 7,
        },
      ),
      repeat: -1,
      frameRate: 10,
    });
  }

  private createCarryingIdleAnimation() {
    if (!this.scene || !this.scene.anims) return;

    this.scene.anims.create({
      key: this.carryingIdleAnimationKey,
      frames: this.scene.anims.generateFrameNumbers(
        this.carryingIdleSpriteKey as string,
        {
          start: 0,
          end: 7,
        },
      ),
      repeat: -1,
      frameRate: 10,
    });
  }

  private createDeathAnimation() {
    if (!this.scene || !this.scene.anims) return;

    this.scene.anims.create({
      key: this.deathAnimationKey,
      frames: this.scene.anims.generateFrameNumbers(
        this.deathSpriteKey as string,
        {
          start: 0,
          end: 12,
        },
      ),
      repeat: 0,
      frameRate: 10,
    });
  }

  private createAttackAnimation(frameRate = 12) {
    if (!this.scene || !this.scene.anims) return;
    this.frameRateAttack = frameRate;

    this.scene.anims.create({
      key: this.attackAnimationKey,
      frames: this.scene.anims.generateFrameNumbers(
        this.attackSpriteKey as string,
        {
          start: 0,
          end: 7,
        },
      ),
      repeat: 0,
      frameRate: frameRate,
    });
  }

  private createMiningAnimation() {
    if (!this.scene || !this.scene.anims) return;

    this.scene.anims.create({
      key: this.miningAnimationKey,
      frames: this.scene.anims.generateFrameNumbers(
        this.miningSpriteKey as string,
        {
          start: 0,
          end: 7,
        },
      ),
      repeat: 0,
      frameRate: 12,
    });
  }

  private createHurtAnimation() {
    if (!this.scene || !this.scene.anims) return;

    this.scene.anims.create({
      key: this.hurtAnimationKey,
      frames: this.scene.anims.generateFrameNumbers(
        this.hurtSpriteKey as string,
        {
          start: 0,
          end: 7,
        },
      ),
      repeat: 0,
      frameRate: 10,
    });
  }

  public changeClothing(clothing: Player["clothing"]) {
    if (!this.ready) return;
    if (this.clothing.updatedAt === clothing.updatedAt) return;
    this.clothing.updatedAt = clothing.updatedAt;

    if (tokenUriBuilder(clothing) === tokenUriBuilder(this.clothing)) return;
    this.ready = false;
    if (this.sprite?.active) {
      this.sprite?.destroy();
    }

    if (
      this.clothing.shirt !== "Gift Giver" &&
      clothing.shirt === "Gift Giver"
    ) {
      this.showGift();
    }

    if (
      this.clothing.shirt === "Gift Giver" &&
      clothing.shirt !== "Gift Giver"
    ) {
      this.removeGift();
    }
    if (this.clothing.aura === clothing.aura || clothing.aura === undefined) {
      this.removeAura();
    }

    this.clothing = clothing;

    this.loadSprites(this.scene);
    if (clothing.aura !== undefined) {
      this.showAura();
    }

    this.showSmoke();
  }

  public showGift() {
    if (this.icon) {
      this.removeGift();
    }

    this.icon = this.scene.add.sprite(0, -12, "gift_icon").setOrigin(0.5);
    this.add(this.icon);

    if (this.scene.textures.exists("sparkle")) {
      this.fx = this.scene.add.sprite(0, -8, "sparkle").setOrigin(0.5).setZ(10);
      this.add(this.fx);

      this.scene.anims.create({
        key: `sparkel_anim`,
        frames: this.scene.anims.generateFrameNumbers("sparkle", {
          start: 0,
          end: 6,
        }),
        repeat: -1,
        frameRate: 10,
      });

      this.fx.play(`sparkel_anim`, true);
    }
  }

  private removeGift() {
    if (this.icon?.active) {
      this.icon.destroy();
    }

    this.icon = undefined;

    if (this.fx?.active) {
      this.fx.destroy();
    }

    this.fx = undefined;
  }

  public showAura() {
    //If Bumpkin has an Aura equipped
    if (this.frontfx && this.backfx) {
      this.removeAura();
    }
    if (this.clothing.aura !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const container = this;
      const auraName = this.clothing.aura;
      const auraID = ITEM_IDS[auraName];

      this.frontAuraKey = `${auraID}-bumpkin-aura-front-sheet`;
      this.frontAuraAnimationKey = `${auraID}-bumpkin-aura-front`;
      this.backAuraKey = `${auraID}-bumpkin-aura-back-sheet`;
      this.backAuraAnimationKey = `${auraID}-bumpkin-aura-back`;

      //Back-Aura
      if (container.scene.textures.exists(this.backAuraKey)) {
        const backaura = container.scene.add
          .sprite(0, -3, this.backAuraKey)
          .setOrigin(0.5);
        this.add(backaura);
        this.moveTo(backaura, 1);
        this.backfx = backaura;

        this.createBackAuraAnimation();
        this.backfx.play(this.backAuraAnimationKey as string, true);
      } else {
        const backauraLoader = container.scene.load.spritesheet(
          this.backAuraKey,
          `${CONFIG.PROTECTED_IMAGE_URL}/aura/back/${ITEM_IDS[auraName]}.png`,
          {
            frameWidth: 20,
            frameHeight: 19,
          },
        );

        backauraLoader.once(Phaser.Loader.Events.COMPLETE, () => {
          if (
            !container.scene.textures.exists(this.backAuraKey as string) ||
            this.ready
          ) {
            return;
          }
          const backaura = container.scene.add
            .sprite(0, -3, this.backAuraKey as string)
            .setOrigin(0.5);
          this.add(backaura);
          this.moveTo(backaura, 1);
          this.backfx = backaura;

          this.createBackAuraAnimation();
          this.backfx.play(this.backAuraAnimationKey as string, true);
          backauraLoader.removeAllListeners();
        });
      }
      //Front-Aura
      if (container.scene.textures.exists(this.frontAuraKey)) {
        const frontaura = container.scene.add
          .sprite(0, 2, this.frontAuraKey)
          .setOrigin(0.5);
        this.add(frontaura);
        this.moveTo(frontaura, 3);
        this.frontfx = frontaura;

        this.createFrontAuraAnimation();
        this.frontfx.play(this.frontAuraAnimationKey as string, true);
      } else {
        const frontauraLoader = container.scene.load.spritesheet(
          this.frontAuraKey,
          `${CONFIG.PROTECTED_IMAGE_URL}/aura/front/${ITEM_IDS[auraName]}.png`,
          {
            frameWidth: 20,
            frameHeight: 19,
          },
        );

        frontauraLoader.once(Phaser.Loader.Events.COMPLETE, () => {
          if (
            !container.scene.textures.exists(this.frontAuraKey as string) ||
            this.ready
          ) {
            return;
          }
          const frontaura = container.scene.add
            .sprite(0, 2, this.frontAuraKey as string)
            .setOrigin(0.5);
          this.add(frontaura);
          this.moveTo(frontaura, 3);
          this.frontfx = frontaura;

          this.createFrontAuraAnimation();
          this.frontfx.play(this.frontAuraAnimationKey as string, true);
          frontauraLoader.removeAllListeners();
        });
      }
    }
  }

  private removeAura() {
    //Removes the Aura before loading sprite
    if (this.frontfx?.active) {
      this.frontfx.destroy();
    }

    this.frontfx = undefined;

    if (this.backfx?.active) {
      this.backfx.destroy();
    }

    this.backfx = undefined;
  }

  public faceRight() {
    if (this.sprite?.scaleX === 1) return;

    this.direction = "right";
    this.sprite?.setScale(1, 1);

    if (this.speech) {
      this.speech.setScale(1, 1);
      this.speech.changeDirection("right");
    }
  }

  public faceLeft() {
    if (this.sprite?.scaleX === -1) return;

    this.direction = "left";
    this.sprite?.setScale(-1, 1);

    if (this.speech) {
      this.speech.changeDirection("left");
    }
  }

  /**
   * Use a debouncer to allow players new messages not to be destroyed by old timeouts
   */
  destroySpeechBubble = debounce(() => {
    this.stopSpeaking();
  }, 5000);

  /**
   * Use a debouncer to allow players new messages not to be destroyed by old timeouts
   */
  destroyReaction = debounce(() => {
    this.stopReaction();
  }, 5000);

  public stopReaction() {
    this.reaction.clear(true, true);
    this.destroyReaction.cancel();
  }

  public stopSpeaking() {
    if (this.speech?.active) {
      this.speech?.destroy();
    }
    this.speech = undefined;

    this.destroySpeechBubble.cancel();
    this.label?.setVisible(true);
  }

  public speak(text: string) {
    this.stopReaction();
    this.label?.setVisible(false);

    if (this.speech?.active) {
      this.speech.destroy();
    }

    this.speech = new SpeechBubble(
      this.scene,
      text,
      this.sprite?.scaleX === 1 ? "right" : "left",
    );
    this.add(this.speech);

    this.destroySpeechBubble();
  }

  get isSpeaking() {
    return !!this.speech;
  }

  /**
   * Load texture from URL or Data API. Returns immediately if texture already exists.
   * @param key - Texture key
   * @param url - URL or Data API
   * @param onLoad - Callback when texture is loaded. Fired instantly if texture already exists.
   * @returns
   */
  private loadTexture(key: string, url: string, onLoad: () => void) {
    if (this.scene.textures.exists(key)) {
      onLoad();
    } else if (url.startsWith("data:")) {
      this.scene.textures.addBase64(key, url);
      this.scene.textures.once("addtexture", () => onLoad());
    } else {
      this.scene.load.image(key, url);
      this.scene.load.once(Phaser.Loader.Events.COMPLETE, () => onLoad());
      this.scene.load.start();
    }
  }

  private _react(react: ReactionName | InventoryItemName, quantity?: number) {
    this.stopSpeaking();

    this.reaction.clear(true, true);

    if (!this.scene.textures.exists(react)) {
      return;
    }

    let offsetReaction = false;
    if (quantity) {
      const label = this.scene.add.bitmapText(
        0,
        -16,
        "Teeny Tiny Pixls",
        `+${formatNumber(quantity)}`,
        5,
        1,
      );
      label.setX(-label.width);
      offsetReaction = true;

      this.add(label);
      this.reaction.add(label);
    }

    const reaction = this.scene.add.sprite(0, -14, react);
    if (reaction.displayWidth > reaction.displayHeight) {
      reaction.displayWidth = 10;
      reaction.scaleY = reaction.scaleX;
    } else {
      reaction.displayHeight = 10;
      reaction.scaleX = reaction.scaleY;
    }

    if (offsetReaction) {
      reaction.setX(reaction.displayWidth / 2);
    }
    this.add(reaction);
    this.reaction.add(reaction);

    this.destroyReaction();
  }

  public react(reaction: ReactionName | InventoryItemName, quantity?: number) {
    if (this.scene.textures.exists(reaction)) {
      return this._react(reaction, quantity);
    }

    if (reaction in ITEM_DETAILS) {
      const image = ITEM_DETAILS[reaction as InventoryItemName].image;

      this.loadTexture(reaction, image, () => {
        this._react(reaction, quantity);
      });
    }
  }

  public dig() {
    if (
      this.sprite?.anims &&
      this.scene?.anims.exists(this.digAnimationKey as string) &&
      this.sprite?.anims.getName() !== this.digAnimationKey
    ) {
      try {
        this.sprite.anims.play(this.digAnimationKey as string, true);
        this.scene.sound.play("dig", { volume: 0.1 });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log("Bumpkin Container: Error playing dig animation: ", e);
      }
    }
  }

  public drill() {
    if (
      this.sprite?.anims &&
      this.scene?.anims.exists(this.drillAnimationKey as string) &&
      this.sprite?.anims.getName() !== this.drillAnimationKey
    ) {
      try {
        this.sprite.anims.play(this.drillAnimationKey as string, true);
        this.scene.sound.play("drill", { volume: 0.1 });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log("Bumpkin Container: Error playing drill animation: ", e);
      }
    }
  }

  public walk() {
    if (
      this.sprite?.anims &&
      this.scene?.anims.exists(this.walkingAnimationKey as string) &&
      this.sprite?.anims.getName() !== this.walkingAnimationKey
    ) {
      try {
        this.sprite.anims.play(this.walkingAnimationKey as string, true);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log("Bumpkin Container: Error playing walk animation: ", e);
      }
    }
  }

  public idle() {
    if (
      this.sprite?.anims &&
      this.scene?.anims.exists(this.idleAnimationKey as string) &&
      this.sprite?.anims.getName() !== this.idleAnimationKey
    ) {
      try {
        this.sprite.anims.play(this.idleAnimationKey as string, true);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log("Bumpkin Container: Error playing idle animation: ", e);
      }
    }
  }

  public hitPlayer() {
    this.invincible = true;

    // make sprite flash opacity
    const tween = this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.5,
      duration: 100,
      ease: "Linear",
      repeat: -1,
      yoyo: true,
    });

    setTimeout(() => {
      this.invincible = false;

      if (tween && tween.isPlaying()) {
        tween.remove();
      }
    }, 2000);
  }

  private destroyed = false;
  public disappear() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const container = this;

    if (container.destroyed || !container.scene || !container.active) {
      return;
    }

    this.destroyed = true;

    if (this.sprite?.active) {
      this.sprite?.destroy();
    }
    if (this.shadow?.active) {
      this.shadow?.destroy();
    }
    if (this.frontfx?.active) {
      this.frontfx?.destroy();
    }
    if (this.backfx?.active) {
      this.backfx?.destroy();
    }
    if (this.icon?.active) {
      this.icon?.destroy();
    }
    if (this.fx?.active) {
      this.fx?.destroy();
    }

    const poof = this.scene.add.sprite(0, 4, "poof").setOrigin(0.5);
    this.add(poof);

    this.scene.anims.create({
      key: `poof_anim`,
      frames: this.scene.anims.generateFrameNumbers("poof", {
        start: 0,
        end: 8,
      }),
      repeat: 0,
      frameRate: 10,
    });

    poof.play(`poof_anim`, true);

    // Listen for the animation complete event
    poof.on("animationcomplete", function (animation: { key: string }) {
      if (animation.key === "poof_anim" && container.active) {
        container.destroy();
      }
    });
  }

  public showSmoke() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const container = this;

    if (container.destroyed || !container.scene) {
      return;
    }

    if (container.scene.textures.exists("smoke")) {
      const poof = this.scene.add.sprite(0, 4, "smoke").setOrigin(0.5);
      this.add(poof);
      this.bringToTop(poof);

      this.scene.anims.create({
        key: `smoke_anim`,
        frames: this.scene.anims.generateFrameNumbers("smoke", {
          start: 0,
          end: 20,
        }),
        repeat: -1,
        frameRate: 10,
      });

      poof.play(`smoke_anim`, true);

      // Listen for the animation complete loop event
      poof.on("animationrepeat", function (animation: { key: string }) {
        if (animation.key === "smoke_anim" && container.ready && poof.active) {
          // This block will execute every time the animation loop completes
          poof.destroy();
        }
      });
    }
  }

  public addOnClick(onClick: () => void) {
    this.setInteractive({ cursor: "pointer" }).on(
      "pointerdown",
      (p: Phaser.Input.Pointer) => {
        if (p.downElement.nodeName === "CANVAS") {
          onClick();
        }
      },
    );
  }

  // Halloween
  public carry() {
    if (
      this.sprite?.anims &&
      this.scene?.anims.exists(this.carryingAnimationKey as string) &&
      this.sprite?.anims.getName() !== this.carryingAnimationKey
    ) {
      try {
        this.sprite.anims.play(this.carryingAnimationKey as string, true);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log("Bumpkin Container: Error playing carry animation: ", e);
      }
    }
  }

  public carryIdle() {
    if (
      this.sprite?.anims &&
      this.scene?.anims.exists(this.carryingIdleAnimationKey as string) &&
      this.sprite?.anims.getName() !== this.carryingIdleAnimationKey
    ) {
      try {
        this.sprite.anims.play(this.carryingIdleAnimationKey as string, true);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(
          "Bumpkin Container: Error playing carry idle animation: ",
          e,
        );
      }
    }
  }

  public dead() {
    if (
      this.sprite?.anims &&
      this.scene?.anims.exists(this.deathAnimationKey as string) &&
      this.sprite?.anims.getName() !== this.deathAnimationKey
    ) {
      try {
        this.sprite.anims.play(this.deathAnimationKey as string, true);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(
          "Bumpkin Container: Error playing carry idle animation: ",
          e,
        );
      }
    }
  }

  public attack() {
    if (
      this.sprite?.anims &&
      this.scene?.anims.exists(this.attackAnimationKey as string) &&
      this.sprite?.anims.getName() !== this.attackAnimationKey
    ) {
      try {
        this.isAttacking = true;
        this.enableSword(true);
        this.sprite.anims.play(this.attackAnimationKey as string, true);
        onAnimationComplete(
          this.sprite,
          this.attackAnimationKey as string,
          () => {
            this.isAttacking = false;
            this.enableSword(false);
          },
        );
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log("Bumpkin Container: Error playing attack animation: ", e);
      }
    }
  }

  public mining() {
    if (
      this.sprite?.anims &&
      this.scene?.anims.exists(this.miningAnimationKey as string) &&
      this.sprite?.anims.getName() !== this.miningAnimationKey
    ) {
      try {
        this.isMining = true;
        this.enablePickaxe(true);
        this.sprite.anims.play(this.miningAnimationKey as string, true);
        onAnimationComplete(
          this.sprite,
          this.miningAnimationKey as string,
          () => {
            this.isMining = false;
            this.enablePickaxe(false);
            EventBus.emit("animation-mining-completed");
          },
        );
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log("Bumpkin Container: Error playing mining animation: ", e);
      }
    }
  }

  public hurt() {
    if (
      this.sprite?.anims &&
      this.scene?.anims.exists(this.hurtAnimationKey as string) &&
      this.sprite?.anims.getName() !== this.hurtAnimationKey
    ) {
      try {
        this.isHurting = true;
        this.isAttacking = false;
        this.isMining = false;
        this.sprite.anims.play(this.hurtAnimationKey as string, true);
        onAnimationComplete(
          this.sprite,
          this.hurtAnimationKey as string,
          () => (this.isHurting = false),
        );
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log("Bumpkin Container: Error playing hurt animation: ", e);
      }
    }
  }

  public lampVisibility(value: boolean) {
    this.lamp?.setVisible(value);
  }

  private createLamp() {
    this.lamp = new LampContainer({
      x: ITEM_BUMPKIN.x,
      y: ITEM_BUMPKIN.y,
      id: -1,
      scene: this.scene as BaseScene,
    });
    this.lamp.setVisible(false);
    this.add(this.lamp);
  }

  public enableFire() {
    this.isBurning = true;
    const fireBody = this.fire.body as Phaser.Physics.Arcade.Body;
    fireBody.setEnable(true);
    this.fire.setVisible(true);
    this.fire.activate(() => {
      fireBody.setEnable(false);
      this.fire.setVisible(false);
      this.isBurning = false;
    });
  }

  private createFire() {
    this.fire = new FireContainer({
      x: 0,
      y: 0,
      scene: this.scene as BaseScene,
    });
    this.fire.setVisible(false);
    const fireBody = this.fire.body as Phaser.Physics.Arcade.Body;
    fireBody.setEnable(false);
    this.add(this.fire);
    this.moveTo(this.fire, 0);
  }

  // private get portalService() {
  //   return this.scene.registry.get("portalService") as
  //     | MachineInterpreter
  //     | undefined;
  // }

  // public updateLightRadius() {
  //   const darknessPipeline = this.scene.cameras.main.getPostPipeline(
  //     "DarknessPipeline",
  //   ) as DarknessPipeline;

  //   const finalStep =
  //     MIN_PLAYER_LIGHT_RADIUS +
  //     STEP_PLAYER_LIGHT_RADIUS * (this.portalService?.state.context.lamps || 0);

  //   if (finalStep != darknessPipeline.lightRadius[0]) {
  //     const step = (finalStep - darknessPipeline.lightRadius[0]) / 10;

  //     const animationRadius = setInterval(() => {
  //       darknessPipeline.lightRadius[0] += step;
  //       if (step >= 0) {
  //         if (darknessPipeline.lightRadius[0] >= finalStep) {
  //           darknessPipeline.lightRadius[0] = finalStep;
  //           clearInterval(animationRadius);
  //         }
  //       } else if (step < 0) {
  //         if (darknessPipeline.lightRadius[0] <= finalStep) {
  //           darknessPipeline.lightRadius[0] = finalStep;
  //           clearInterval(animationRadius);
  //         }
  //       }
  //     }, 100);
  //   }
  // }

  // public addLabel(value: number | string) {
  //   this.stopSpeaking();
  //   this.reaction.clear(true, true);

  //   if (typeof value === "number") {
  //     value = `${value > 0 ? "+" : "-"}${Math.abs(value)}`;
  //   }

  //   const label = this.scene.add
  //     .bitmapText(1, -23, "Teeny Tiny Pixls", value, 4, 1)
  //     .setOrigin(0.5);

  //   label.setTintFill(0xffffff);
  //   this.add(label);
  //   this.reaction.add(label);

  //   this.destroyReaction();
  // }

  createPickaxe() {
    this.pickaxe = this.scene.add.zone(0, 0, 0, 0);
    this.scene.physics.world.enable(this.pickaxe);
    const basketBody = this.pickaxe.body as Phaser.Physics.Arcade.Body;
    basketBody.setAllowGravity(false);
    basketBody.enable = false;
    this.add(this.pickaxe);
  }

  createSword() {
    this.sword = this.scene.add.zone(0, 0, 0, 0).setOrigin(0);
    this.scene.physics.world.enable(this.sword);
    const swordBody = this.sword.body as Phaser.Physics.Arcade.Body;
    swordBody.setAllowGravity(false);
    swordBody.enable = false;
    this.add(this.sword);
  }

  enablePickaxe(state: boolean) {
    const pickaxeBody = this.pickaxe?.body as Phaser.Physics.Arcade.Body;
    pickaxeBody.enable = state;
    if (!state) return;

    const x = 2;
    const y = -8;
    const width = 43;
    const height = 15;
    // this.scene.sound.play("pickaxe", { volume: PORTAL_VOLUME });
    if (this.direction === "right") {
      pickaxeBody?.setSize(width, height);
      this.pickaxe?.setPosition(x, y);
    } else if (this.direction === "left") {
      pickaxeBody?.setSize(width, height);
      this.pickaxe?.setPosition(x - 5, y);
    }
  }

  enableSword(state: boolean) {
    const swordBody = this.sword?.body as Phaser.Physics.Arcade.Body;
    swordBody.enable = state;
    if (!state) return;

    const x = 2;
    const y = -9;
    const width = 45;
    const height = 25;
    // this.scene.sound.play("sword", { volume: PORTAL_VOLUME });
    if (this.direction === "right") {
      swordBody?.setSize(width, height);
      this.sword?.setPosition(x, y);
    } else if (this.direction === "left") {
      swordBody?.setSize(width, height);
      this.sword?.setPosition(x - 5, y);
    }
  }

  setDamage(tool: Tools, value: number) {
    Object.keys(this.damage[tool]).map((enemy) => {
      this.damage[tool][enemy as Enemies] = value;
    });
  }

  getDamage(tool: Tools, enemy: Enemies) {
    const damage = this.damage?.[tool]?.[enemy] || this.damage?.[tool].all;
    if (Math.random() < this.doubleDamageChange && tool === "sword") {
      return damage * 2;
    }
    return damage;
  }

  setDoubleDamageChange(value: number) {
    this.doubleDamageChange = value;
  }

  setFireRadius(value: number) {
    const radius = this.fire.radius * (1 + value);
    const numFires = this.fire.numFires * (1 + value);
    this.fire.createSprites(radius, numFires);
  }

  setFrameRateAttack(value: number) {
    this.attackAnimationKey = this.attackAnimationKey + "-fast";
    const frameRateAttack = this.frameRateAttack * (1 + value);
    this.createAttackAnimation(frameRateAttack);
  }
}
