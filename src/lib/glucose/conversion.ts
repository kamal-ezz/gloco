import type { GlucoseUnit } from '../../types/glucose';

const MGDL_PER_G_L = 100;
const MGDL_PER_MMOL_L = 18;

function round(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function displayToMgdl(value: number, unit: GlucoseUnit): number {
  if (unit === 'mg/dL') return value;
  if (unit === 'g/L') return value * MGDL_PER_G_L;
  return value * MGDL_PER_MMOL_L;
}

export function mgdlToDisplay(valueMgdl: number, unit: GlucoseUnit): number {
  if (unit === 'mg/dL') return valueMgdl;
  if (unit === 'g/L') return valueMgdl / MGDL_PER_G_L;
  return valueMgdl / MGDL_PER_MMOL_L;
}

export function formatGlucoseValue(valueMgdl: number, unit: GlucoseUnit): string {
  const display = mgdlToDisplay(valueMgdl, unit);
  if (unit === 'mg/dL') {
    return `${Math.round(display)} ${unit}`;
  }
  return `${round(display, 2)} ${unit}`;
}

export function toInputString(valueMgdl: number, unit: GlucoseUnit): string {
  const display = mgdlToDisplay(valueMgdl, unit);
  if (unit === 'mg/dL') {
    return String(Math.round(display));
  }
  return String(round(display, 2));
}

export function roundMgdlForStorage(valueMgdl: number): number {
  return Math.round(valueMgdl);
}
