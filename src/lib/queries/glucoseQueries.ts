import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRecentGlucoseLogs,
  getGlucoseLogById,
  getTodayStats,
  get90DayGlucoseLogs,
  get90DayAverage,
  getFilteredGlucoseLogs,
  createGlucoseLog,
  updateGlucoseLog,
  deleteGlucoseLog
} from '../supabase/glucoseLogs';
import type { GlucoseLogFilters } from '../supabase/glucoseLogs';
import type { GlucoseLog, GlucoseLogInsert, GlucoseLogUpdate } from '../../types/database';

export function glucoseLogsQuery(userId: string) {
  return queryOptions({
    queryKey: ['glucoseLogs', userId],
    queryFn: () => getRecentGlucoseLogs(userId),
    enabled: !!userId
  });
}

export function glucoseLogDetailQuery(userId: string, id: string) {
  return queryOptions({
    queryKey: ['glucoseLogs', userId, id],
    queryFn: () => getGlucoseLogById(id, userId),
    enabled: !!userId && !!id
  });
}

export function todayStatsQuery(userId: string) {
  return queryOptions({
    queryKey: ['glucoseLogs', userId, 'todayStats'],
    queryFn: () => getTodayStats(userId),
    enabled: !!userId
  });
}

export function filteredGlucoseLogsQuery(userId: string, filters: GlucoseLogFilters) {
  return queryOptions({
    queryKey: ['glucoseLogs', userId, 'filtered', filters],
    queryFn: () => getFilteredGlucoseLogs(userId, filters),
    enabled: !!userId
  });
}

export function glucoseChartQuery(userId: string) {
  return queryOptions({
    queryKey: ['glucoseLogs', userId, 'chart90d'],
    queryFn: () => get90DayGlucoseLogs(userId),
    enabled: !!userId
  });
}

export function a1cEstimateQuery(userId: string) {
  return queryOptions({
    queryKey: ['glucoseLogs', userId, 'a1c'],
    queryFn: () => get90DayAverage(userId),
    enabled: !!userId
  });
}

export function useCreateGlucoseLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: GlucoseLogInsert) => createGlucoseLog(payload),
    onMutate: async (newLog) => {
      await qc.cancelQueries({ queryKey: ['glucoseLogs', newLog.user_id] });
      const previousLogs = qc.getQueryData<GlucoseLog[]>(['glucoseLogs', newLog.user_id]);

      const optimisticLog: GlucoseLog = {
        id: `temp_${Date.now()}`,
        user_id: newLog.user_id,
        glucose_mgdl: newLog.glucose_mgdl,
        logged_at: newLog.logged_at ?? new Date().toISOString(),
        meal_tag: newLog.meal_tag ?? null,
        insulin_units: newLog.insulin_units ?? null,
        carbs_grams: newLog.carbs_grams ?? null,
        notes: newLog.notes ?? null,
        created_at: new Date().toISOString()
      };

      qc.setQueryData<GlucoseLog[]>(
        ['glucoseLogs', newLog.user_id],
        (old) => [optimisticLog, ...(old ?? [])]
      );

      return { previousLogs };
    },
    onError: (_err, variables, context) => {
      if (context?.previousLogs) {
        qc.setQueryData(['glucoseLogs', variables.user_id], context.previousLogs);
      }
    },
    onSettled: (_data, _error, variables) => {
      void qc.invalidateQueries({ queryKey: ['glucoseLogs', variables.user_id] });
    }
  });
}

export function useUpdateGlucoseLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; userId: string; payload: GlucoseLogUpdate }) =>
      updateGlucoseLog(args.id, args.userId, args.payload),
    onMutate: async ({ id, userId, payload }) => {
      await qc.cancelQueries({ queryKey: ['glucoseLogs', userId] });
      const previousLogs = qc.getQueryData<GlucoseLog[]>(['glucoseLogs', userId]);
      const previousDetail = qc.getQueryData<GlucoseLog | null>(['glucoseLogs', userId, id]);

      qc.setQueryData<GlucoseLog[]>(
        ['glucoseLogs', userId],
        (old) => (old ?? []).map((log) => (log.id === id ? { ...log, ...payload } : log))
      );

      if (previousDetail) {
        qc.setQueryData<GlucoseLog>(['glucoseLogs', userId, id], { ...previousDetail, ...payload });
      }

      return { previousLogs, previousDetail };
    },
    onError: (_err, { userId, id }, context) => {
      if (context?.previousLogs) {
        qc.setQueryData(['glucoseLogs', userId], context.previousLogs);
      }
      if (context?.previousDetail) {
        qc.setQueryData(['glucoseLogs', userId, id], context.previousDetail);
      }
    },
    onSettled: (_data, _error, { userId }) => {
      void qc.invalidateQueries({ queryKey: ['glucoseLogs', userId] });
    }
  });
}

export function useDeleteGlucoseLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; userId: string }) =>
      deleteGlucoseLog(args.id, args.userId),
    onMutate: async ({ id, userId }) => {
      await qc.cancelQueries({ queryKey: ['glucoseLogs', userId] });
      const previousLogs = qc.getQueryData<GlucoseLog[]>(['glucoseLogs', userId]);

      qc.setQueryData<GlucoseLog[]>(
        ['glucoseLogs', userId],
        (old) => (old ?? []).filter((log) => log.id !== id)
      );

      return { previousLogs };
    },
    onError: (_err, { userId }, context) => {
      if (context?.previousLogs) {
        qc.setQueryData(['glucoseLogs', userId], context.previousLogs);
      }
    },
    onSettled: (_data, _error, { userId }) => {
      void qc.invalidateQueries({ queryKey: ['glucoseLogs', userId] });
    }
  });
}
