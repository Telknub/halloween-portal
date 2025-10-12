import { Minigame } from "features/game/types/game";
import {
  RESTOCK_ATTEMPTS_SFL,
  UNLIMITED_ATTEMPTS_SFL,
  DAILY_ATTEMPTS,
  RESTOCK_ATTEMPTS,
} from "../HalloweenConstants";
import { VisibilityPolygon } from "./visibilityPolygon";

/**
 * Gets the number of attempts left for the minigame.
 * @param minigame The minigame.
 * @returns The number of attempts left.
 */
export const getAttemptsLeft = (minigame?: Minigame) => {
  const dateKey = new Date().toISOString().slice(0, 10);

  const history = minigame?.history ?? {};
  const purchases = minigame?.purchases ?? [];
  // const freeDay = "2024-11-04";

  const now = new Date();
  const startOfTodayUTC = getStartOfUTCDay(now);
  const endOfTodayUTC = startOfTodayUTC + 24 * 60 * 60 * 1000; // 24 hours later
  const hasUnlimitedAttempts = purchases.some(
    (purchase) =>
      purchase.sfl === UNLIMITED_ATTEMPTS_SFL &&
      purchase.purchasedAt >= startOfTodayUTC &&
      purchase.purchasedAt < endOfTodayUTC,
  );

  // Free day for those who paid on Oct. 31
  // if (now.toISOString().substring(0, 10) === freeDay) {
  //   const halloweenDay = new Date(Date.UTC(2024, 9, 31));
  //   const startOfHalloweenUTC = getStartOfUTCDay(halloweenDay);
  //   const endOfHalloweenUTC = startOfHalloweenUTC + 24 * 60 * 60 * 1000; // 24 hours later
  //   hasUnlimitedAttempts =
  //     hasUnlimitedAttempts ||
  //     purchases.some(
  //       (purchase) =>
  //         purchase.sfl === UNLIMITED_ATTEMPTS_SFL &&
  //         purchase.purchasedAt >= startOfHalloweenUTC &&
  //         purchase.purchasedAt < endOfHalloweenUTC,
  //     );
  // }

  if (hasUnlimitedAttempts) return Infinity;

  const restockedCount = purchases.filter(
    (purchase) =>
      purchase.sfl === RESTOCK_ATTEMPTS_SFL &&
      purchase.purchasedAt >= startOfTodayUTC &&
      purchase.purchasedAt < endOfTodayUTC,
  ).length;

  // Free day for those who paid on Oct. 31
  // if (now.toISOString().substring(0, 10) === freeDay) {
  //   const halloweenDay = new Date(Date.UTC(2024, 9, 31));
  //   const startOfHalloweenUTC = getStartOfUTCDay(halloweenDay);
  //   const endOfHalloweenUTC = startOfHalloweenUTC + 24 * 60 * 60 * 1000; // 24 hours later
  //   restockedCount =
  //     restockedCount +
  //     purchases.filter(
  //       (purchase) =>
  //         purchase.sfl === RESTOCK_ATTEMPTS_SFL &&
  //         purchase.purchasedAt >= startOfHalloweenUTC &&
  //         purchase.purchasedAt < endOfHalloweenUTC,
  //     ).length;
  // }

  const attemptsToday = history[dateKey]?.attempts ?? 0;
  const attemptsLeft =
    DAILY_ATTEMPTS - attemptsToday + RESTOCK_ATTEMPTS * restockedCount;

  return attemptsLeft;
};

/**
 * Gets the start of the UTC day for a given date.
 * @param date The date.
 * @returns The start of the UTC day for the given date.
 */
const getStartOfUTCDay = (date: Date) => {
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0); // set time to midnight UTC
  return startOfDay.getTime();
};

export const createLightPolygon = (
  x: number,
  y: number,
  visibilityPolygon: VisibilityPolygon,
  polygonWalls: [number, number][][],
) => {
  let segments = visibilityPolygon.convertToSegments(polygonWalls);
  segments = visibilityPolygon.breakIntersections(segments);
  const position = [x, y];
  if (
    visibilityPolygon.inPolygon(position, polygonWalls[polygonWalls.length - 1])
  ) {
    return visibilityPolygon.compute(position, segments);
  }
  return null;
};

export const onAnimationComplete = (
  object: Phaser.GameObjects.Sprite,
  animKey: string,
  callback: () => void,
) => {
  object?.once(
    Phaser.Animations.Events.ANIMATION_COMPLETE,
    (anim: Phaser.Animations.Animation) => {
      if (anim.key === animKey) {
        callback();
      }
    },
  );
};
