import { contactSchema } from '../contactSchema';
import { safeParse } from 'zod/v4';

function parse(overrides: Record<string, unknown> = {}) {
  return safeParse(contactSchema, {
    name: 'Dr. Smith',
    phone: '+15551234567',
    ...overrides
  });
}

describe('contactSchema', () => {
  it('accepts valid data', () => {
    const result = parse();
    expect(result.success).toBe(true);
  });

  it('trims name', () => {
    const result = parse({ name: '  Dr. Smith  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Dr. Smith');
    }
  });

  it('rejects empty name', () => {
    const result = parse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects whitespace-only name', () => {
    const result = parse({ name: '   ' });
    expect(result.success).toBe(false);
  });

  it('rejects empty phone', () => {
    const result = parse({ phone: '' });
    expect(result.success).toBe(false);
  });

  it('rejects too-short phone', () => {
    const result = parse({ phone: '123456' });
    expect(result.success).toBe(false);
  });

  it('accepts 7-digit phone', () => {
    const result = parse({ phone: '1234567' });
    expect(result.success).toBe(true);
  });

  it('accepts 15-digit phone', () => {
    const result = parse({ phone: '123456789012345' });
    expect(result.success).toBe(true);
  });

  it('accepts phone with formatting', () => {
    const result = parse({ phone: '+1 (555) 123-4567' });
    expect(result.success).toBe(true);
  });
});
