import { evaluateGlucoseStatus, isFastingMealTag } from '../status';

describe('isFastingMealTag', () => {
  it('returns true for fasting', () => {
    expect(isFastingMealTag('fasting')).toBe(true);
  });

  it('returns true for before_breakfast', () => {
    expect(isFastingMealTag('before_breakfast')).toBe(true);
  });

  it('returns false for after_breakfast', () => {
    expect(isFastingMealTag('after_breakfast')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isFastingMealTag(null)).toBe(false);
  });
});

describe('evaluateGlucoseStatus', () => {
  it('returns unknown when no reading', () => {
    const result = evaluateGlucoseStatus(null, null);
    expect(result.status).toBe('unknown');
  });

  describe('fasting thresholds (80-126)', () => {
    it('returns low below 80', () => {
      expect(evaluateGlucoseStatus(70, 'fasting').status).toBe('low');
    });

    it('returns normal at 80', () => {
      expect(evaluateGlucoseStatus(80, 'fasting').status).toBe('normal');
    });

    it('returns normal at 126', () => {
      expect(evaluateGlucoseStatus(126, 'fasting').status).toBe('normal');
    });

    it('returns high above 126', () => {
      expect(evaluateGlucoseStatus(127, 'fasting').status).toBe('high');
    });
  });

  describe('post-meal thresholds (100-140)', () => {
    it('returns low below 100', () => {
      expect(evaluateGlucoseStatus(90, 'after_lunch').status).toBe('low');
    });

    it('returns normal at 100', () => {
      expect(evaluateGlucoseStatus(100, 'after_lunch').status).toBe('normal');
    });

    it('returns normal at 140', () => {
      expect(evaluateGlucoseStatus(140, 'after_lunch').status).toBe('normal');
    });

    it('returns high above 140', () => {
      expect(evaluateGlucoseStatus(141, 'after_lunch').status).toBe('high');
    });
  });

  it('uses post-meal thresholds for null meal tag', () => {
    expect(evaluateGlucoseStatus(95, null).status).toBe('low');
  });
});
