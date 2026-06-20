import { supabase } from './supabase/client';
import { withTimeout } from './withTimeout';

function normalizeEmail(input: string) {
  return input
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, '')
    .replace(/^['"`]+|['"`]+$/g, '')
    .toLowerCase();
}

function validateEmail(input: string) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(input)) {
    throw new Error('Please enter a valid email address.');
  }
  return input;
}

export async function signInWithEmail(email: string, password: string) {
  const normalizedEmail = validateEmail(normalizeEmail(email));
  const { error } = await withTimeout(
    supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password
    }),
    15000,
    'Sign in timed out. Please check your internet connection and try again.'
  );
  if (error) throw error;
}

export async function signUpWithEmail(email: string, password: string) {
  const normalizedEmail = validateEmail(normalizeEmail(email));
  const { error } = await withTimeout(
    supabase.auth.signUp({
      email: normalizedEmail,
      password
    }),
    15000,
    'Sign up timed out. Please check your internet connection and try again.'
  );
  if (error) throw error;
}

export async function signOut() {
  const { error } = await withTimeout(
    supabase.auth.signOut(),
    10000,
    'Sign out timed out. Please try again.'
  );
  if (error) throw error;
}
