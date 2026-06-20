import {
  displayToMgdl,
  mgdlToDisplay,
  formatGlucoseValue,
  toInputString,
  roundMgdlForStorage
} from '../conversion';

describe('displayToMgdl', () => {
  it('returns value unchanged for mg/dL', () => {
    expect(displayToMgdl(120, 'mg/dL')).toBe(120);
  });

  it('converts g/L to mg/dL', () => {
    expect(displayToMgdl(1.2, 'g/L')).toBe(120);
  });

  it('converts mmol/L to mg/dL', () => {
    expect(displayToMgdl(6.67, 'mmol/L')).toBeCloseTo(120.06, 1);
  });
});

describe('mgdlToDisplay', () => {
  it('returns value unchanged for mg/dL', () => {
    expect(mgdlToDisplay(120, 'mg/dL')).toBe(120);
  });

  it('converts mg/dL to g/L', () => {
    expect(mgdlToDisplay(120, 'g/L')).toBe(1.2);
  });

  it('converts mg/dL to mmol/L', () => {
    expect(mgdlToDisplay(180, 'mmol/L')).toBe(10);
  });
});

describe('formatGlucoseValue', () => {
  it('formats mg/dL as integer', () => {
    expect(formatGlucoseValue(120, 'mg/dL')).toBe('120 mg/dL');
  });

  it('formats g/L with 2 decimals', () => {
    expect(formatGlucoseValue(120, 'g/L')).toBe('1.2 g/L');
  });

  it('formats mmol/L with 2 decimals', () => {
    expect(formatGlucoseValue(180, 'mmol/L')).toBe('10 mmol/L');
  });
});

describe('toInputString', () => {
  it('returns integer string for mg/dL', () => {
    expect(toInputString(120, 'mg/dL')).toBe('120');
  });

  it('returns decimal string for g/L', () => {
    expect(toInputString(120, 'g/L')).toBe('1.2');
  });

  it('returns decimal string for mmol/L', () => {
    expect(toInputString(90, 'mmol/L')).toBe('5');
  });
});

describe('roundMgdlForStorage', () => {
  it('rounds to nearest integer', () => {
    expect(roundMgdlForStorage(120.4)).toBe(120);
    expect(roundMgdlForStorage(120.5)).toBe(121);
  });
});
