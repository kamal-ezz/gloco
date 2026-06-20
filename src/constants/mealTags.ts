import type { MealTag } from '../types/database';

export const MEAL_TAGS: MealTag[] = [
  'fasting',
  'before_breakfast',
  'after_breakfast',
  'before_lunch',
  'after_lunch',
  'before_dinner',
  'after_dinner',
  'before_meal',
  'after_meal',
  'bedtime',
  'other'
];

export const MEAL_TAG_LABELS: Record<MealTag, string> = {
  fasting: 'Fasting',
  before_breakfast: 'Before breakfast',
  after_breakfast: 'After breakfast',
  before_lunch: 'Before lunch',
  after_lunch: 'After lunch',
  before_dinner: 'Before dinner',
  after_dinner: 'After dinner',
  before_meal: 'Before meal',
  after_meal: 'After meal',
  bedtime: 'Bedtime',
  other: 'Other'
};

export function formatMealTag(tag: MealTag | null) {
  if (!tag) return null;
  return MEAL_TAG_LABELS[tag] ?? tag;
}
