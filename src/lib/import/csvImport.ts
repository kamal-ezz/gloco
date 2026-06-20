import * as DocumentPicker from 'expo-document-picker';
import Papa from 'papaparse';
import * as FileSystem from 'expo-file-system';
import { z } from 'zod/v4';
import { createGlucoseLog } from '../supabase/glucoseLogs';
import type { MealTag } from '../../types/database';

const csvRowSchema = z.object({
  glucose_mgdl: z.coerce.number().positive().max(1000),
  logged_at: z.string().refine((val) => !Number.isNaN(new Date(val).getTime()), 'Invalid date'),
  meal_tag: z.string().optional().default(''),
  insulin_units: z.coerce.number().optional(),
  carbs_grams: z.coerce.number().optional(),
  notes: z.string().optional().default('')
});

export type CsvImportResult = {
  total: number;
  imported: number;
  skipped: number;
  errors: string[];
};

export async function pickAndParseCsv(): Promise<Papa.ParseResult<Record<string, string>> | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['text/csv', 'text/comma-separated-values', 'application/csv'],
    copyToCacheDirectory: true
  });

  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];
  const content = await FileSystem.readAsStringAsync(asset.uri);

  return Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_')
  });
}

export async function importCsvRows(
  rows: Record<string, string>[],
  userId: string
): Promise<CsvImportResult> {
  const result: CsvImportResult = { total: rows.length, imported: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const parsed = csvRowSchema.safeParse(row);

    if (!parsed.success) {
      result.skipped++;
      result.errors.push(`Row ${i + 1}: ${parsed.error.issues.map((e) => e.message).join(', ')}`);
      continue;
    }

    const data = parsed.data;
    try {
      await createGlucoseLog({
        user_id: userId,
        glucose_mgdl: Math.round(data.glucose_mgdl),
        logged_at: new Date(data.logged_at).toISOString(),
        meal_tag: (data.meal_tag as MealTag) || null,
        insulin_units: data.insulin_units ?? null,
        carbs_grams: data.carbs_grams ?? null,
        notes: data.notes || null
      });
      result.imported++;
    } catch (err) {
      result.skipped++;
      result.errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : 'Insert failed'}`);
    }
  }

  return result;
}
