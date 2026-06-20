import { z } from 'zod/v4';

const mealTags = [
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
] as const;

export const glucoseLogSchema = z.object({
  glucose: z
    .string()
    .min(1, 'Glucose value is required.')
    .refine(
      (val) => {
        const num = Number(val.replace(',', '.'));
        return !Number.isNaN(num) && num > 0;
      },
      { message: 'Glucose must be a positive number.' }
    ),
  loggedAt: z.date({ message: 'Enter a valid date and time.' }),
  mealTag: z.enum(mealTags).or(z.literal('')).optional(),
  insulin: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val?.trim()) return true;
        const num = Number(val);
        return !Number.isNaN(num) && num >= 0;
      },
      { message: 'Insulin must be 0 or greater.' }
    ),
  carbs: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val?.trim()) return true;
        const num = Number(val);
        return !Number.isNaN(num) && num >= 0;
      },
      { message: 'Carbs must be 0 or greater.' }
    ),
  notes: z.string().optional()
});

export type GlucoseLogFormData = z.infer<typeof glucoseLogSchema>;
