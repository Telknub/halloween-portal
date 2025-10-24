import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { BaseRoom } from "../BaseRoom";
import { basicRoom, ROOM_INNER_HEIGHT, ROOM_INNER_WIDTH } from "../RoomTileMap";
import { HalloweenScene } from "features/portal/halloween/HalloweenScene";
import {
  DECORATION_BOSS_CONFIG,
  TILE_SIZE,
  BOSS_STATS,
  HOLE_CONFIG,
  FIRE_STATS,
} from "features/portal/halloween/HalloweenConstants";
import { BossContainer } from "features/portal/halloween/containers/BossContainer";
import { GateContainer } from "features/portal/halloween/containers/GateContainer";
import { DecorationContainer } from "features/portal/halloween/containers/DecorationContainer";
import { HoleContainer } from "features/portal/halloween/containers/HoleContainer";
import { FireChaserContainer } from "features/portal/halloween/containers/FireChaserContainer";

interface Props {
  scene: HalloweenScene;
  hasEntry?: boolean;
  hasExit?: boolean;
  matrix?: number[][];
  player?: BumpkinContainer;
}

export class BossRoom extends BaseRoom {
  private gate!: GateContainer;
  private fireChasers: FireChaserContainer[] = [];

  constructor({ scene, hasEntry = true, hasExit = true, player }: Props) {
    super({
      scene,
      hasEntry,
      hasExit,
      matrix: basicRoom,
      type: "boss",
      player,
    });
  }

  createObjects(wallsGroup: Phaser.Physics.Arcade.StaticGroup) {
    super.createObjects(wallsGroup);
    this.createDecorationRandomly({ hasDecorationGround: false });
    this.createStaticDecoration();
    this.createZone();
    this.gate = this.createGate();
  }

  private defeatBoss(x: number, y: number) {
    this.fireChasers.forEach((fireChaser) => {
      fireChaser.destroy();
    });
    this.createRelic(x, y);
    const { x: posX, y: posY } = this.getRelativePosition(
      HOLE_CONFIG.x,
      HOLE_CONFIG.y,
    );
    new HoleContainer({
      x: posX,
      y: posY,
      scene: this.scene,
      id: this.id,
      player: this.player,
    });
  }

  private createBossEnemy() {
    const { x, y } = this.getRelativePosition(
      BOSS_STATS.config.x,
      BOSS_STATS.config.y,
    );
    new BossContainer({
      x,
      y,
      scene: this.scene,
      defeat: (x, y) => this.defeatBoss(x, y),
      player: this.player,
      room: this,
    });
  }

  private createFireChasers() {
    Object.keys(FIRE_STATS).forEach((key) => {
      const config = FIRE_STATS[key as keyof typeof FIRE_STATS];
      const { x, y } = this.getRelativePosition(config.x, config.y);
      const fireChaser = new FireChaserContainer({
        x,
        y,
        scene: this.scene,
        player: this.player,
      });
      this.fireChasers.push(fireChaser);
    });
  }

  private createZone() {
    if (!this.player) return;

    const { x, y } = this.getRelativePosition(
      (TILE_SIZE * ROOM_INNER_WIDTH) / 2,
      (TILE_SIZE * ROOM_INNER_HEIGHT) / 2,
    );
    const zone = this.scene.add
      .zone(
        x,
        y,
        TILE_SIZE * (ROOM_INNER_WIDTH - 1),
        TILE_SIZE * (ROOM_INNER_HEIGHT - 1),
      )
      .setOrigin(0.5);
    this.scene.physics.world.enable(zone);
    const zoneBody = zone.body as Phaser.Physics.Arcade.Body;
    this.scene.add.existing(zone);

    this.scene.physics.add.overlap(this.player, zone, () => {
      zoneBody.setEnable(false);
      this.gate.close();
      this.createBossEnemy();
      this.createFireChasers();
    });
  }

  private createStaticDecoration() {
    DECORATION_BOSS_CONFIG.forEach((decoration) => {
      const { x, y } = this.getRelativePosition(decoration.x, decoration.y);
      new DecorationContainer({
        x,
        y,
        scene: this.scene,
        player: this.player,
      });
    });
  }
}
