import { useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import {
    downloadGlucosePdf,
    generateGlucoseLogsPdf,
    shareGlucosePdf
} from '../../lib/export/glucosePdf';
import type { GlucoseLog } from '../../types/database';
import type { GlucoseUnit } from '../../types/glucose';

type ExportCardProps = {
    logs: GlucoseLog[];
    unit: GlucoseUnit;
};

export function ExportCard({ logs, unit }: ExportCardProps) {
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleExport() {
        Alert.alert('Export Glucose PDF', 'Choose an action', [
            {
                text: 'Download PDF',
                onPress: () => {
                    void runExportAction('download');
                }
            },
            {
                text: 'Share PDF',
                onPress: () => {
                    void runExportAction('share');
                }
            },
            { text: 'Cancel', style: 'cancel' }
        ]);
    }

    async function runExportAction(action: 'share' | 'download') {
        setError(null);
        setExporting(true);

        try {
            const generated = await generateGlucoseLogsPdf(logs, unit);

            if (action === 'share') {
                await shareGlucosePdf(generated);
            } else {
                const result = await downloadGlucosePdf(generated);
                Alert.alert(
                    'PDF Downloaded',
                    Platform.OS === 'android' ? result.message : `${result.message}\n${result.uri}`
                );
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to export PDF.');
        } finally {
            setExporting(false);
        }
    }

    return (
        <View className="mb-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <Text className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">Export</Text>
            <Pressable
                onPress={handleExport}
                disabled={exporting}
                className="items-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 disabled:opacity-60"
            >
                <Text className="font-semibold text-slate-700 dark:text-slate-300">
                    {exporting ? 'Exporting PDF...' : 'Export Glucose PDF'}
                </Text>
            </Pressable>
            {error ? <Text className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</Text> : null}
        </View>
    );
}
