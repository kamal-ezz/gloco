import { supabase } from './client';
import { getSupabaseErrorMessage } from './errorMessage';
import type {
  EmergencyContact,
  EmergencyContactInsert,
  EmergencyContactUpdate
} from '../../types/contact';

const TABLE = 'emergency_contacts';

export async function getEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(getSupabaseErrorMessage(error, 'Failed to load emergency contacts.'));
  return (data ?? []) as EmergencyContact[];
}

export async function createEmergencyContact(
  payload: EmergencyContactInsert
): Promise<EmergencyContact> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select('*')
    .single();

  if (error) throw new Error(getSupabaseErrorMessage(error, 'Failed to create emergency contact.'));
  return data as EmergencyContact;
}

export async function updateEmergencyContact(
  id: string,
  userId: string,
  payload: EmergencyContactUpdate
): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(getSupabaseErrorMessage(error, 'Failed to update emergency contact.'));
}

export async function deleteEmergencyContact(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(getSupabaseErrorMessage(error, 'Failed to delete emergency contact.'));
}
