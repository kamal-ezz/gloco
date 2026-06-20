import { glucoseLogSchema } from '../glucoseLogSchema';
import { safeParse } from 'zod/v4';

function parse(overrides: Record<string, unknown> = {}) {
  return safeParse(glucoseLogSchema, {
    glucose: '120',
    loggedAt: new Date('2024-01-01T12:00:00Z'),
    mealTag: '',
    insulin: '',
    carbs: '',
    notes: '',
    ...overrides
  });
}

describe('glucoseLogSchema', () => {
  it('accepts valid data', () => {
    const result = parse();
    expect(result.success).toBe(true);
  });

  it('rejects empty glucose', () => {
    const result = parse({ glucose: '' });
    expect(result.success).toBe(false);
  });

  it('rejects non-numeric glucose', () => {
    const result = parse({ glucose: 'abc' });
    expect(result.success).toBe(false);
  });

  it('rejects zero glucose', () => {
    const result = parse({ glucose: '0' });
    expect(result.success).toBe(false);
  });

  it('rejects negative glucose', () => {
    const result = parse({ glucose: '-5' });
    expect(result.success).toBe(false);
  });

  it('accepts decimal glucose', () => {
    const result = parse({ glucose: '6.5' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid date', () => {
    const result = parse({ loggedAt: 'not-a-date' });
    expect(result.success).toBe(false);
  });

  it('accepts valid meal tag', () => {
    const result = parse({ mealTag: 'fasting' });
    expect(result.success).toBe(true);
  });

  it('accepts optional insulin when empty', () => {
    const result = parse({ insulin: '' });
    expect(result.success).toBe(true);
  });

  it('rejects negative insulin', () => {
    const result = parse({ insulin: '-1' });
    expect(result.success).toBe(false);
  });

  it('accepts optional carbs when empty', () => {
    const result = parse({ carbs: '' });
    expect(result.success).toBe(true);
  });

  it('rejects negative carbs', () => {
    const result = parse({ carbs: '-5' });
    expect(result.success).toBe(false);
  });
});
