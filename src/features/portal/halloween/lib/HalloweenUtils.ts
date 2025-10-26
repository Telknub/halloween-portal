import { Minigame } from "features/game/types/game";
import {
  UNLIMITED_ATTEMPTS_SFL,
  FREE_DAILY_ATTEMPTS,
  RESTOCK_ATTEMPTS,
  BETA_TESTERS,
  INITIAL_DATE,
  ATTEMPTS_BETA_TESTERS,
  TIME_SCORE_BASE,
} from "../HalloweenConstants";

/**
 * Gets the number of attempts left for the minigame.
 * @param minigame The minigame.
 * @returns The number of attempts left.
 */
export const getAttemptsLeft = (minigame?: Minigame, farmId = 0) => {
  const dateKey = new Date().toISOString().slice(0, 10);

  const history = minigame?.history ?? {};
  const purchases = minigame?.purchases ?? [];

  // const now = new Date();
  // const startOfTodayUTC = getStartOfUTCDay(now);
  // const endOfTodayUTC = startOfTodayUTC + 24 * 60 * 60 * 1000; // 24 hours later

  // Unlimited attempts
  const hasUnlimitedAttempts = hasRecentUnlimitedAttempts(purchases);
  if (hasUnlimitedAttempts) return Infinity;

  // Restock attempts
  const restockAttempts = hasRecentRestockAttempts(purchases);

  // Total attempts used
  const totalAttemptsUsed = getTotalAttemptsInSurroundingMonths(history);

  // Free daily attempts
  const freeTotalAttempts =
    getDaysPassedSince(INITIAL_DATE) * FREE_DAILY_ATTEMPTS;

  // Total attempts
  let attemptsLeft = freeTotalAttempts - totalAttemptsUsed + restockAttempts;

  // +Beta attemtps
  if (BETA_TESTERS.includes(farmId) && dateKey < INITIAL_DATE) {
    attemptsLeft += ATTEMPTS_BETA_TESTERS;
  }

  return attemptsLeft;
};

/**
 * Checks if there are any recent purchases of unlimited attempts.
 * @param purchases The list of purchases made in the minigame.
 * @returns True if there are recent purchases of unlimited attempts, false otherwise.
 */
const hasRecentUnlimitedAttempts = (
  purchases: { purchasedAt: number; sfl: number }[],
): boolean => {
  return purchases.some((purchase) => {
    const isPurchaseWithinRange = isWithinRange(purchase.purchasedAt);
    return isPurchaseWithinRange && purchase.sfl === UNLIMITED_ATTEMPTS_SFL;
  });
};

/**
 * Calculates the number of restock attempts made recently.
 * @param purchases The list of purchases made in the minigame.
 * @returns The total number of restock attempts made.
 */
const hasRecentRestockAttempts = (
  purchases: { purchasedAt: number; sfl: number }[],
): number => {
  let restockAttempts = 0;
  RESTOCK_ATTEMPTS.forEach((option) => {
    const restockedCount = purchases.filter(
      (purchase) =>
        purchase.sfl === option.sfl && isWithinRange(purchase.purchasedAt),
    ).length;

    restockAttempts += option.attempts * restockedCount;
  });
  return restockAttempts;
};

/**
 * Calculates the total number of attempts used in the current month, previous month, and next month.
 * @param history The history of attempts, where keys are date strings and values are objects with an `attempts` property.
 * @returns The total number of attempts used in the surrounding months.
 */
const getTotalAttemptsInSurroundingMonths = (
  history: Record<string, { attempts: number }>,
) => {
  return Object.entries(history).reduce((sum, [dateString, entry]) => {
    return isWithinRange(dateString) ? sum + entry.attempts : sum;
  }, 0);
};

/**
 * Checks if a given date is within the range of the current month, the previous month, or the next month.
 * @param date The date to check, can be a string or a number (timestamp).
 * @returns True if the date is within the range, false otherwise.
 */
export const isWithinRange = (date: string | number) => {
  const now = new Date();
  const entryDate = new Date(date);
  const dateKey = now.toISOString().slice(0, 10);
  let lowerLimit;

  if (dateKey >= INITIAL_DATE) {
    lowerLimit = new Date(INITIAL_DATE);
  } else {
    lowerLimit = new Date(now);
    lowerLimit.setMonth(lowerLimit.getMonth() - 1);
  }

  const upperLimit = new Date(now);
  upperLimit.setMonth(upperLimit.getMonth() + 1);

  return entryDate >= lowerLimit && entryDate <= upperLimit;
};

/**
 * Calculates the number of days passed since a given UTC start date.s
 * @param utcStartDate The UTC start date in the format "YYYY-MM-DD".
 * @returns The number of days passed since the start date, including today as day 1.
 */
function getDaysPassedSince(utcStartDate: string): number {
  const start = new Date(utcStartDate); // ej: "2025-04-21"
  const now = new Date();

  const startUTC = Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate(),
  );
  const nowUTC = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );

  const msPerDay = 1000 * 60 * 60 * 24;

  const diffInDays = Math.floor((nowUTC - startUTC) / msPerDay);

  return Math.max(0, diffInDays + 1);
}

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

export const getScoreTime = (milliseconds: number) => {
  return TIME_SCORE_BASE - milliseconds;
};
