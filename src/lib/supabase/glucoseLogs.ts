import { supabase } from './client';
import type { GlucoseLog, GlucoseLogInsert, GlucoseLogUpdate } from '../../types/database';
import { getSupabaseErrorMessage } from './errorMessage';

const TABLE = 'glucose_logs';

export async function getRecentGlucoseLogs(userId: string): Promise<GlucoseLog[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false });

  if (error) throw new Error(getSupabaseErrorMessage(error, 'Failed to load glucose logs.'));
  return (data ?? []) as GlucoseLog[];
}

export async function getGlucoseLogById(id: string, userId: string): Promise<GlucoseLog | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load the selected log.'));
  }

  return data as GlucoseLog;
}

export async function createGlucoseLog(payload: GlucoseLogInsert): Promise<void> {
  const { error } = await supabase.from(TABLE).insert(payload);
  if (error) throw new Error(getSupabaseErrorMessage(error, 'Failed to create glucose log.'));
}

export async function updateGlucoseLog(id: string, userId: string, payload: GlucoseLogUpdate): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(getSupabaseErrorMessage(error, 'Failed to update glucose log.'));
}

export async function deleteGlucoseLog(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(getSupabaseErrorMessage(error, 'Failed to delete glucose log.'));
}

export type GlucoseLogFilters = {
  search?: string;
  mealTags?: string[];
  dateFrom?: string;
  dateTo?: string;
  sort?: 'newest' | 'oldest' | 'highest' | 'lowest';
};

export async function getFilteredGlucoseLogs(
  userId: string,
  filters: GlucoseLogFilters
): Promise<GlucoseLog[]> {
  let query = supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId);

  if (filters.search) {
    query = query.ilike('notes', `%${filters.search}%`);
  }

  if (filters.mealTags && filters.mealTags.length > 0) {
    query = query.in('meal_tag', filters.mealTags);
  }

  if (filters.dateFrom) {
    query = query.gte('logged_at', filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte('logged_at', filters.dateTo);
  }

  switch (filters.sort) {
    case 'oldest':
      query = query.order('logged_at', { ascending: true });
      break;
    case 'highest':
      query = query.order('glucose_mgdl', { ascending: false });
      break;
    case 'lowest':
      query = query.order('glucose_mgdl', { ascending: true });
      break;
    default:
      query = query.order('logged_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw new Error(getSupabaseErrorMessage(error, 'Failed to load filtered logs.'));
  return (data ?? []) as GlucoseLog[];
}

export async function get90DayGlucoseLogs(userId: string): Promise<GlucoseLog[]> {
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .gte('logged_at', since.toISOString())
    .order('logged_at', { ascending: true });

  if (error) throw new Error(getSupabaseErrorMessage(error, 'Failed to load glucose history.'));
  return (data ?? []) as GlucoseLog[];
}

export async function get90DayAverage(userId: string): Promise<{ average: number | null; count: number }> {
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const { data, error } = await supabase
    .from(TABLE)
    .select('glucose_mgdl')
    .eq('user_id', userId)
    .gte('logged_at', since.toISOString());

  if (error) throw new Error(getSupabaseErrorMessage(error, 'Failed to load 90-day average.'));

  const rows = data ?? [];
  if (rows.length === 0) return { average: null, count: 0 };

  const total = rows.reduce((sum, row) => sum + Number(row.glucose_mgdl), 0);
  return {
    average: Math.round((total / rows.length) * 10) / 10,
    count: rows.length
  };
}

export type TodayStats = {
  count: number;
  averageGlucose: number | null;
};

export async function getTodayStats(userId: string): Promise<TodayStats> {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from(TABLE)
    .select('glucose_mgdl')
    .eq('user_id', userId)
    .gte('logged_at', start.toISOString())
    .lte('logged_at', end.toISOString());

  if (error) throw new Error(getSupabaseErrorMessage(error, 'Failed to load today stats.'));

  const rows = data ?? [];
  const count = rows.length;

  if (!count) {
    return { count: 0, averageGlucose: null };
  }

  const total = rows.reduce((sum, row) => sum + Number(row.glucose_mgdl), 0);
  return {
    count,
    averageGlucose: Math.round((total / count) * 10) / 10
  };
}
