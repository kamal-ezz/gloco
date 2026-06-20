import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useReminderStore } from '../../stores/reminderStore';
import { hapticMedium, hapticLight } from '../../lib/haptics';

function formatCountdown(ms: number) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
        seconds
    ).padStart(2, '0')}`;
}

export function ReminderCard() {
    const status = useReminderStore((s) => s.status);
    const remainingMs = useReminderStore((s) => s.remainingMs);
    const start = useReminderStore((s) => s.start);
    const pause = useReminderStore((s) => s.pause);
    const reset = useReminderStore((s) => s.reset);
    const tick = useReminderStore((s) => s.tick);

    useEffect(() => {
        if (status !== 'running') return;

        const intervalId = setInterval(() => {
            tick();
        }, 1000);

        return () => {
            clearInterval(intervalId);
        };
    }, [status, tick]);

    return (
        <View className="mb-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">Post-Meal Reminder</Text>
            <Text className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatCountdown(remainingMs)}
            </Text>
            <Text className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {status === 'running'
                    ? 'Timer is running.'
                    : status === 'paused'
                        ? 'Timer paused.'
                        : 'Ready to start.'}
            </Text>
            <View className="mt-3 flex-row gap-2">
                <Pressable
                    onPress={() => { hapticMedium(); (status === 'running' ? pause : start)(); }}
                    className="rounded-lg bg-brand-600 px-3 py-2"
                >
                    <Text className="font-semibold text-white">
                        {status === 'running'
                            ? 'Pause'
                            : status === 'paused'
                                ? 'Resume'
                                : 'Start'}
                    </Text>
                </Pressable>
                <Pressable
                    onPress={() => { hapticLight(); reset(); }}
                    className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2"
                >
                    <Text className="font-semibold text-slate-700 dark:text-slate-300">Reset</Text>
                </Pressable>
            </View>
        </View>
    );
}
