import { Alert, Linking, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { contactsQuery } from '../../lib/queries/contactQueries';
import type { RootStackParamList } from '../../types/navigation';

export function ContactsCard() {
    const user = useAuthStore((s) => s.user);
    const contactsQ = useQuery(contactsQuery(user?.id ?? ''));
    const contacts = contactsQ.data ?? [];
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    async function handleCall(phone: string) {
        const url = `tel:${phone}`;
        const canOpen = await Linking.canOpenURL(url);
        if (!canOpen) {
            Alert.alert('Call unavailable', 'This device cannot place phone calls.');
            return;
        }
        await Linking.openURL(url);
    }

    return (
        <View className="mb-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">Emergency Contacts</Text>
                <Pressable onPress={() => navigation.navigate('Contacts')}>
                    <Text className="font-semibold text-brand-700">Manage</Text>
                </Pressable>
            </View>

            {contactsQ.isLoading ? (
                <Text className="text-slate-600 dark:text-slate-400">Loading contacts...</Text>
            ) : contacts.length === 0 ? (
                <Text className="text-slate-600 dark:text-slate-400">No contacts yet. Add one from Manage.</Text>
            ) : (
                contacts.slice(0, 3).map((contact) => (
                    <Pressable
                        key={contact.id}
                        onPress={() => handleCall(contact.phone)}
                        className="mb-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2"
                    >
                        <Text className="font-medium text-slate-900 dark:text-slate-100">{contact.name}</Text>
                        <Text className="text-slate-600 dark:text-slate-400">{contact.phone}</Text>
                    </Pressable>
                ))
            )}
        </View>
    );
}
