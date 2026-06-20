import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { formatMealTag } from '../../constants/mealTags';
import { formatGlucoseValue } from '../glucose/conversion';
import type { GlucoseLog } from '../../types/database';
import type { GlucoseUnit } from '../../types/glucose';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatLoggedAt(isoString: string) {
  return new Date(isoString).toLocaleString();
}

function renderRows(logs: GlucoseLog[], unit: GlucoseUnit) {
  return logs
    .map((log) => {
      const details: string[] = [];
      const mealLabel = formatMealTag(log.meal_tag) ?? '-';
      if (log.insulin_units != null) details.push(`Insulin: ${log.insulin_units}u`);
      if (log.carbs_grams != null) details.push(`Carbs: ${log.carbs_grams}g`);
      if (log.notes) details.push(`Notes: ${log.notes}`);

      return `
        <tr>
          <td>${escapeHtml(formatLoggedAt(log.logged_at))}</td>
          <td>${escapeHtml(formatGlucoseValue(log.glucose_mgdl, unit))}</td>
          <td>${escapeHtml(mealLabel)}</td>
          <td>${escapeHtml(details.join(' | ') || '-')}</td>
        </tr>
      `;
    })
    .join('');
}

function buildHtml(logs: GlucoseLog[], unit: GlucoseUnit) {
  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            padding: 20px;
            color: #0f172a;
          }
          h1 {
            margin-bottom: 4px;
            font-size: 24px;
          }
          p {
            margin-top: 0;
            color: #475569;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 18px;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #cbd5e1;
            text-align: left;
            padding: 8px;
            vertical-align: top;
          }
          th {
            background: #f1f5f9;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <h1>Glucose Log Report</h1>
        <p>Generated ${escapeHtml(new Date().toLocaleString())}</p>
        <p>Total entries: ${logs.length}</p>
        <table>
          <thead>
            <tr>
              <th>Logged At</th>
              <th>Glucose</th>
              <th>Meal Timing</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            ${renderRows(logs, unit)}
          </tbody>
        </table>
      </body>
    </html>
  `;
}

export type GeneratedGlucosePdf = {
  uri: string;
  fileName: string;
};

function buildPdfFileName() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const suffix = Math.random().toString(36).slice(2, 8);
  return `glucose-report-${stamp}-${suffix}.pdf`;
}

export async function generateGlucoseLogsPdf(
  logs: GlucoseLog[],
  unit: GlucoseUnit
): Promise<GeneratedGlucosePdf> {
  if (logs.length === 0) {
    throw new Error('No glucose logs to export yet.');
  }

  if (logs.length > 500) {
    throw new Error(
      `Too many logs to export (${logs.length}). Maximum is 500 logs to prevent UI freezes. Consider filtering by date range.`
    );
  }

  const html = buildHtml(logs, unit);
  const { uri } = await Print.printToFileAsync({ html });
  const fileName = buildPdfFileName();
  const writableDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;

  if (!writableDir) {
    return { uri, fileName };
  }

  const targetUri = `${writableDir}${fileName}`;
  await FileSystem.copyAsync({ from: uri, to: targetUri });
  return { uri: targetUri, fileName };
}

export async function shareGlucosePdf(pdf: GeneratedGlucosePdf): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(pdf.uri, {
    dialogTitle: 'Share glucose report',
    UTI: 'com.adobe.pdf',
    mimeType: 'application/pdf'
  });
}

export async function downloadGlucosePdf(
  pdf: GeneratedGlucosePdf
): Promise<{ uri: string; message: string }> {
  if (Platform.OS === 'android') {
    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permissions.granted) {
      throw new Error('Download cancelled.');
    }

    const base64 = await FileSystem.readAsStringAsync(pdf.uri, {
      encoding: FileSystem.EncodingType.Base64
    });

    const targetUri = await FileSystem.StorageAccessFramework.createFileAsync(
      permissions.directoryUri,
      pdf.fileName,
      'application/pdf'
    );

    await FileSystem.writeAsStringAsync(targetUri, base64, {
      encoding: FileSystem.EncodingType.Base64
    });

    return {
      uri: targetUri,
      message: 'PDF saved to selected folder.'
    };
  }

  if (!FileSystem.documentDirectory) {
    throw new Error('Cannot access local documents directory.');
  }

  const targetUri = `${FileSystem.documentDirectory}${pdf.fileName}`;
  await FileSystem.copyAsync({ from: pdf.uri, to: targetUri });
  return {
    uri: targetUri,
    message: 'PDF saved in app documents.'
  };
}
