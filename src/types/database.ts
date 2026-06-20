export type MealTag =
  | 'fasting'
  | 'before_breakfast'
  | 'after_breakfast'
  | 'before_lunch'
  | 'after_lunch'
  | 'before_dinner'
  | 'after_dinner'
  | 'before_meal'
  | 'after_meal'
  | 'bedtime'
  | 'other';

export type GlucoseLog = {
  id: string;
  user_id: string;
  glucose_mgdl: number;
  logged_at: string;
  meal_tag: MealTag | null;
  insulin_units: number | null;
  carbs_grams: number | null;
  notes: string | null;
  created_at: string;
};

export type GlucoseLogInsert = {
  user_id: string;
  glucose_mgdl: number;
  logged_at?: string;
  meal_tag?: MealTag | null;
  insulin_units?: number | null;
  carbs_grams?: number | null;
  notes?: string | null;
};

export type GlucoseLogUpdate = Partial<Omit<GlucoseLogInsert, 'user_id'>>;
