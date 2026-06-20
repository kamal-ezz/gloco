import { estimateA1C, getA1CCategory } from '../a1c';

describe('estimateA1C', () => {
  it('returns expected A1C for 100 mg/dL average', () => {
    expect(estimateA1C(100)).toBeCloseTo(5.1, 1);
  });

  it('returns expected A1C for 154 mg/dL average (≈7.0%)', () => {
    expect(estimateA1C(154)).toBeCloseTo(7.0, 1);
  });

  it('returns expected A1C for 183 mg/dL average (≈8.0%)', () => {
    expect(estimateA1C(183)).toBeCloseTo(8.0, 1);
  });

  it('returns expected A1C for 126 mg/dL average', () => {
    expect(estimateA1C(126)).toBeCloseTo(6.0, 1);
  });
});

describe('getA1CCategory', () => {
  it('returns normal for A1C < 5.7', () => {
    expect(getA1CCategory(5.0)).toBe('normal');
    expect(getA1CCategory(5.6)).toBe('normal');
  });

  it('returns prediabetic for A1C 5.7-6.4', () => {
    expect(getA1CCategory(5.7)).toBe('prediabetic');
    expect(getA1CCategory(6.0)).toBe('prediabetic');
    expect(getA1CCategory(6.4)).toBe('prediabetic');
  });

  it('returns diabetic for A1C >= 6.5', () => {
    expect(getA1CCategory(6.5)).toBe('diabetic');
    expect(getA1CCategory(8.0)).toBe('diabetic');
  });
});
