export type A1CCategory = 'normal' | 'prediabetic' | 'diabetic';

export function estimateA1C(avgMgdl: number): number {
  return Math.round(((avgMgdl + 46.7) / 28.7) * 10) / 10;
}

export function getA1CCategory(a1c: number): A1CCategory {
  if (a1c < 5.7) return 'normal';
  if (a1c < 6.5) return 'prediabetic';
  return 'diabetic';
}
