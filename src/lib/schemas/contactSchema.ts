import { z } from 'zod/v4';

export const contactSchema = z.object({
  name: z.string().transform((val) => val.trim()).pipe(z.string().min(1, 'Please enter a name.')),
  phone: z
    .string()
    .min(1, 'Please enter a phone number.')
    .refine(
      (val) => {
        const normalized = val.replace(/[\s()-]/g, '');
        return /^\+?[0-9]{7,15}$/.test(normalized);
      },
      { message: 'Please enter a valid phone number (7-15 digits).' }
    )
    .transform((val) => val.trim())
});

export type ContactFormData = z.infer<typeof contactSchema>;
