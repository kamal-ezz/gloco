import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEmergencyContacts,
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact
} from '../supabase/contacts';
import type { EmergencyContact, EmergencyContactInsert, EmergencyContactUpdate } from '../../types/contact';

export function contactsQuery(userId: string) {
  return queryOptions({
    queryKey: ['contacts', userId],
    queryFn: () => getEmergencyContacts(userId),
    enabled: !!userId
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: EmergencyContactInsert) => createEmergencyContact(payload),
    onMutate: async (newContact) => {
      await qc.cancelQueries({ queryKey: ['contacts', newContact.user_id] });
      const previous = qc.getQueryData<EmergencyContact[]>(['contacts', newContact.user_id]);

      const optimistic: EmergencyContact = {
        id: `temp_${Date.now()}`,
        user_id: newContact.user_id,
        name: newContact.name,
        phone: newContact.phone,
        created_at: new Date().toISOString()
      };

      qc.setQueryData<EmergencyContact[]>(
        ['contacts', newContact.user_id],
        (old) => [...(old ?? []), optimistic]
      );

      return { previous };
    },
    onError: (_err, variables, context) => {
      if (context?.previous) {
        qc.setQueryData(['contacts', variables.user_id], context.previous);
      }
    },
    onSettled: (_data, _error, variables) => {
      void qc.invalidateQueries({ queryKey: ['contacts', variables.user_id] });
    }
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; userId: string; payload: EmergencyContactUpdate }) =>
      updateEmergencyContact(args.id, args.userId, args.payload),
    onMutate: async ({ id, userId, payload }) => {
      await qc.cancelQueries({ queryKey: ['contacts', userId] });
      const previous = qc.getQueryData<EmergencyContact[]>(['contacts', userId]);

      qc.setQueryData<EmergencyContact[]>(
        ['contacts', userId],
        (old) => (old ?? []).map((c) => (c.id === id ? { ...c, ...payload } : c))
      );

      return { previous };
    },
    onError: (_err, { userId }, context) => {
      if (context?.previous) {
        qc.setQueryData(['contacts', userId], context.previous);
      }
    },
    onSettled: (_data, _error, { userId }) => {
      void qc.invalidateQueries({ queryKey: ['contacts', userId] });
    }
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; userId: string }) =>
      deleteEmergencyContact(args.id, args.userId),
    onMutate: async ({ id, userId }) => {
      await qc.cancelQueries({ queryKey: ['contacts', userId] });
      const previous = qc.getQueryData<EmergencyContact[]>(['contacts', userId]);

      qc.setQueryData<EmergencyContact[]>(
        ['contacts', userId],
        (old) => (old ?? []).filter((c) => c.id !== id)
      );

      return { previous };
    },
    onError: (_err, { userId }, context) => {
      if (context?.previous) {
        qc.setQueryData(['contacts', userId], context.previous);
      }
    },
    onSettled: (_data, _error, { userId }) => {
      void qc.invalidateQueries({ queryKey: ['contacts', userId] });
    }
  });
}
