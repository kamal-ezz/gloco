import { useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '../components/ScreenContainer';
import { EmptyState } from '../components/EmptyState';
import { Input } from '../components/Input';
import { useAuthStore } from '../stores/authStore';
import {
  contactsQuery,
  useCreateContact,
  useUpdateContact,
  useDeleteContact
} from '../lib/queries/contactQueries';
import { contactSchema, type ContactFormData } from '../lib/schemas/contactSchema';

export function ContactsScreen() {
  const user = useAuthStore((s) => s.user);
  const contactsQ = useQuery(contactsQuery(user?.id ?? ''));
  const createMutation = useCreateContact();
  const updateMutation = useUpdateContact();
  const deleteMutation = useDeleteContact();

  const contacts = contactsQ.data ?? [];

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', phone: '' }
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isEditing = editingId != null;
  const saving = createMutation.isPending || updateMutation.isPending;

  function handlePhoneChange(nextValue: string) {
    return nextValue.replace(/[^0-9+()\-\s]/g, '');
  }

  async function onFormSubmit(data: ContactFormData) {
    if (!user) return;
    setError(null);

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          userId: user.id,
          payload: { name: data.name, phone: data.phone }
        });
      } else {
        await createMutation.mutateAsync({
          user_id: user.id,
          name: data.name,
          phone: data.phone
        });
      }
      reset({ name: '', phone: '' });
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save contact.');
    }
  }

  function handleEdit(id: string, currentName: string, currentPhone: string) {
    reset({ name: currentName, phone: currentPhone });
    setEditingId(id);
    setError(null);
  }

  async function handleDelete(id: string) {
    if (!user) return;
    Alert.alert('Delete contact', 'Remove this emergency contact?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync({ id, userId: user.id });
            if (editingId === id) {
              setEditingId(null);
              reset({ name: '', phone: '' });
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete contact.');
          }
        }
      }
    ]);
  }

  async function handleCall(phoneNumber: string) {
    const url = `tel:${phoneNumber}`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert('Call unavailable', 'This device cannot place phone calls.');
      return;
    }
    await Linking.openURL(url);
  }

  return (
    <ScreenContainer>
      <View className="py-3">
        <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100">Emergency Contacts</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
        <View className="mb-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
            {isEditing ? 'Edit Contact' : 'Add Contact'}
          </Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Name"
                value={value}
                onChangeText={onChange}
                placeholder="e.g. Family doctor"
                autoCapitalize="sentences"
                error={errors.name?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Phone"
                value={value}
                onChangeText={(text) => onChange(handlePhoneChange(text))}
                placeholder="e.g. +15551234567"
                keyboardType={Platform.OS === 'android' ? 'default' : 'phone-pad'}
                error={errors.phone?.message}
              />
            )}
          />

          {error ? <Text className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</Text> : null}

          <View className="flex-row gap-2">
            <Pressable
              onPress={handleSubmit(onFormSubmit)}
              disabled={saving}
              className="flex-1 items-center rounded-lg bg-brand-600 px-4 py-3 disabled:opacity-60"
            >
              <Text className="font-semibold text-white">
                {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Contact'}
              </Text>
            </Pressable>
            {isEditing ? (
              <Pressable
                onPress={() => {
                  setEditingId(null);
                  reset({ name: '', phone: '' });
                  setError(null);
                }}
                disabled={saving}
                className="items-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3"
              >
                <Text className="font-medium text-slate-700 dark:text-slate-300">Cancel</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">Saved Contacts</Text>

          {contacts.length === 0 ? (
            <EmptyState
              title="No contacts yet"
              message="Add an emergency contact above to get started."
            />
          ) : (
            contacts.map((contact) => (
              <View key={contact.id} className="mb-3 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">{contact.name}</Text>
                <Text className="mb-2 text-slate-600 dark:text-slate-400">{contact.phone}</Text>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => handleCall(contact.phone)}
                    className="rounded-lg bg-emerald-600 px-3 py-2"
                  >
                    <Text className="font-medium text-white">Call</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleEdit(contact.id, contact.name, contact.phone)}
                    className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2"
                  >
                    <Text className="font-medium text-slate-700 dark:text-slate-300">Edit</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleDelete(contact.id)}
                    className="rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30 px-3 py-2"
                  >
                    <Text className="font-medium text-red-700 dark:text-red-400">Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
