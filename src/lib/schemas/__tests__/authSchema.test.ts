import { signInSchema, signUpSchema } from '../authSchema';
import { safeParse } from 'zod/v4';

describe('signInSchema', () => {
  it('accepts valid email and password', () => {
    const result = safeParse(signInSchema, {
      email: 'test@example.com',
      password: 'password123'
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = safeParse(signInSchema, {
      email: 'not-an-email',
      password: 'password123'
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = safeParse(signInSchema, {
      email: 'test@example.com',
      password: ''
    });
    expect(result.success).toBe(false);
  });
});

describe('signUpSchema', () => {
  it('accepts valid data with matching passwords', () => {
    const result = safeParse(signUpSchema, {
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });
    expect(result.success).toBe(true);
  });

  it('rejects password shorter than 6 characters', () => {
    const result = safeParse(signUpSchema, {
      email: 'test@example.com',
      password: '12345',
      confirmPassword: '12345'
    });
    expect(result.success).toBe(false);
  });

  it('rejects mismatched passwords', () => {
    const result = safeParse(signUpSchema, {
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password456'
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = safeParse(signUpSchema, {
      email: 'not-an-email',
      password: 'password123',
      confirmPassword: 'password123'
    });
    expect(result.success).toBe(false);
  });
});
