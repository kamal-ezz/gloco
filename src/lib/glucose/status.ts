import type { MealTag } from '../../types/database';
import type { GlucoseStatus } from '../../types/glucose';

export type GlucoseStatusResult = {
  status: GlucoseStatus;
  message: string;
};

export function isFastingMealTag(mealTag: MealTag | null) {
  return mealTag === 'fasting' || mealTag === 'before_breakfast';
}

export function evaluateGlucoseStatus(
  latestMgdl: number | null,
  mealTag: MealTag | null
): GlucoseStatusResult {
  if (latestMgdl == null) {
    return {
      status: 'unknown',
      message: 'No recent reading to evaluate yet.'
    };
  }

  const fasting = isFastingMealTag(mealTag);
  const lower = fasting ? 80 : 100;
  const upper = fasting ? 126 : 140;

  if (latestMgdl < lower) {
    return {
      status: 'low',
      message: fasting
        ? 'Latest fasting glucose is below target.'
        : 'Latest glucose is below the expected post-meal range.'
    };
  }

  if (latestMgdl > upper) {
    return {
      status: 'high',
      message: fasting
        ? 'Latest fasting glucose is above target.'
        : 'Latest glucose is above the expected post-meal range.'
    };
  }

  return {
    status: 'normal',
    message: fasting
      ? 'Latest fasting glucose is in the target range.'
      : 'Latest glucose is in the expected range.'
  };
}
